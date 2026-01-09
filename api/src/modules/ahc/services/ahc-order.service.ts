import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AhcOrder, AhcOrderStatus, CancelledBy, PaymentStatus } from '../schemas/ahc-order.schema';
import { CreateAhcOrderDto } from '../dto/create-ahc-order.dto';
import { ValidateAhcOrderDto } from '../dto/validate-ahc-order.dto';
import { TransactionServiceType } from '../../transactions/schemas/transaction-summary.schema';

@Injectable()
export class AhcOrderService {
  constructor(
    @InjectModel(AhcOrder.name)
    private ahcOrderModel: Model<AhcOrder>,
  ) {}

  /**
   * Check eligibility for AHC booking (once-per-year validation)
   * Returns whether user can book AHC this policy year
   */
  async checkEligibility(
    userId: string,
    assignmentsService: any,
  ): Promise<{ isEligible: boolean; reason?: string; existingOrderId?: string }> {
    // Get user's active assignments
    const assignments = await assignmentsService.getUserAssignments(userId);

    if (!assignments || assignments.length === 0) {
      return {
        isEligible: false,
        reason: 'No active policy assignment found',
      };
    }

    const assignment = assignments[0];

    // Calculate policy year from assignment.effectiveFrom
    const policyYear = new Date(assignment.effectiveFrom).getFullYear();

    // Check for existing order in this policy year
    const existingOrder = await this.ahcOrderModel.findOne({
      userId: new Types.ObjectId(userId),
      policyYear: policyYear,
      status: { $ne: AhcOrderStatus.CANCELLED },
    });

    if (existingOrder) {
      return {
        isEligible: false,
        reason: 'Already booked AHC for this policy year',
        existingOrderId: existingOrder.orderId,
      };
    }

    return {
      isEligible: true,
    };
  }

  /**
   * Validate AHC order and calculate payment breakdown
   * Uses global policy copay (NOT category copay)
   * NO service transaction limits for AHC
   */
  async validateOrder(
    userId: string,
    validateDto: ValidateAhcOrderDto,
    ahcPackageService: any,
    labVendorService: any,
    diagnosticVendorService: any,
    assignmentsService: any,
    planConfigService: any,
    copayCalculator: any,
  ): Promise<any> {
    // Check eligibility first
    const eligibility = await this.checkEligibility(userId, assignmentsService);

    if (!eligibility.isEligible) {
      throw new BadRequestException(eligibility.reason);
    }

    // Get AHC package
    const ahcPackage = await ahcPackageService.getPackageById(validateDto.packageId);

    if (!ahcPackage) {
      throw new NotFoundException('AHC package not found');
    }

    // Check if package has lab services
    const hasLabServices = ahcPackage.labServiceIds && ahcPackage.labServiceIds.length > 0;
    // Check if package has diagnostic services
    const hasDiagnosticServices = ahcPackage.diagnosticServiceIds && ahcPackage.diagnosticServiceIds.length > 0;

    // Validate that at least one service type is present
    if (!hasLabServices && !hasDiagnosticServices) {
      throw new BadRequestException('Package must have at least lab or diagnostic services');
    }

    // Initialize variables
    let labVendor = null;
    let labPricing = [];
    let labTotalActual = 0;
    let labTotalDiscounted = 0;
    let labHomeCollectionCharges = 0;

    // Get lab vendor and pricing ONLY if package has lab services
    if (hasLabServices) {
      if (!validateDto.labVendorId) {
        throw new BadRequestException('Lab vendor is required for this package');
      }

      labVendor = await labVendorService.getVendorById(validateDto.labVendorId);

      if (!labVendor) {
        throw new NotFoundException('Lab vendor not found');
      }

      const labServiceIds = ahcPackage.labServiceIds.map((id: any) => id.toString());
      labPricing = await labVendorService.getPricingForServices(
        validateDto.labVendorId,
        labServiceIds,
      );

      // Calculate lab total
      labTotalActual = labPricing.reduce((sum: number, p: any) => sum + p.actualPrice, 0);
      labTotalDiscounted = labPricing.reduce((sum: number, p: any) => sum + p.discountedPrice, 0);

      // Calculate home collection charges
      labHomeCollectionCharges =
        validateDto.labCollectionType === 'HOME_COLLECTION'
          ? labVendor.homeCollectionCharges || 0
          : 0;
    }

    // Initialize variables for diagnostic
    let diagnosticVendor = null;
    let diagnosticPricing = [];
    let diagnosticTotalActual = 0;
    let diagnosticTotalDiscounted = 0;
    let diagnosticHomeCollectionCharges = 0;

    // Get diagnostic vendor and pricing ONLY if package has diagnostic services
    if (hasDiagnosticServices) {
      if (!validateDto.diagnosticVendorId) {
        throw new BadRequestException('Diagnostic vendor is required for this package');
      }

      diagnosticVendor = await diagnosticVendorService.getVendorById(
        validateDto.diagnosticVendorId,
      );

      if (!diagnosticVendor) {
        throw new NotFoundException('Diagnostic vendor not found');
      }

      const diagnosticServiceIds = ahcPackage.diagnosticServiceIds.map((id: any) =>
        id.toString()
      );
      diagnosticPricing = await diagnosticVendorService.getPricingForServices(
        validateDto.diagnosticVendorId,
        diagnosticServiceIds,
      );

      // Calculate diagnostic total
      diagnosticTotalActual = diagnosticPricing.reduce(
        (sum: number, p: any) => sum + p.actualPrice,
        0,
      );
      diagnosticTotalDiscounted = diagnosticPricing.reduce(
        (sum: number, p: any) => sum + p.discountedPrice,
        0,
      );

      diagnosticHomeCollectionCharges = 0; // Diagnostics always center visit
    }

    const totalHomeCollectionCharges = labHomeCollectionCharges + diagnosticHomeCollectionCharges;

    // Calculate totals
    const totalActualPrice = labTotalActual + diagnosticTotalActual;
    const totalDiscountedPrice = labTotalDiscounted + diagnosticTotalDiscounted;
    const finalAmount = totalDiscountedPrice + totalHomeCollectionCharges;

    // Get user's assignment and plan config for copay calculation
    const assignments = await assignmentsService.getUserAssignments(userId);
    if (!assignments || assignments.length === 0) {
      throw new NotFoundException('No active policy assignment found for user');
    }
    const assignment = assignments[0];

    // Extract policyId (it may be populated as an object)
    const policyId = typeof assignment.policyId === 'object' && assignment.policyId._id
      ? assignment.policyId._id.toString()
      : assignment.policyId.toString();

    const planConfig = await planConfigService.getConfig(policyId);

    // Get global copay (NOT category-specific)
    const copayConfig = planConfig.wallet?.copay || { mode: 'PERCENT', value: 0 };

    // Calculate copay amount using global copay
    const copayCalculation = copayCalculator.calculate(finalAmount, copayConfig);

    // NO service transaction limits for AHC
    const copayAmount = copayCalculation.copayAmount;
    const walletDeduction = copayCalculation.walletDebitAmount;
    const finalPayable = copayCalculation.copayAmount;

    return {
      labVendor: labVendor ? {
        _id: labVendor._id, // MongoDB ObjectId for order creation
        vendorId: labVendor.vendorId, // String ID like "VEN-xxx"
        name: labVendor.name,
        totalActualPrice: labTotalActual,
        totalDiscountedPrice: labTotalDiscounted,
        homeCollectionCharges: labHomeCollectionCharges,
        pricing: labPricing,
      } : null,
      diagnosticVendor: diagnosticVendor ? {
        _id: diagnosticVendor._id, // MongoDB ObjectId for order creation
        vendorId: diagnosticVendor.vendorId, // String ID like "DIAG-VEN-xxx"
        name: diagnosticVendor.name,
        totalActualPrice: diagnosticTotalActual,
        totalDiscountedPrice: diagnosticTotalDiscounted,
        homeCollectionCharges: diagnosticHomeCollectionCharges,
        pricing: diagnosticPricing,
      } : null,
      paymentBreakdown: {
        totalActualPrice,
        totalDiscountedPrice,
        totalHomeCollectionCharges,
        finalAmount,
        copayAmount,
        walletDeduction,
        finalPayable,
      },
    };
  }

  /**
   * Create AHC order
   * Called after payment success
   * Debits wallet and creates transaction summary
   */
  async createOrder(
    userId: string,
    createDto: CreateAhcOrderDto,
    ahcPackageService: any,
    labVendorService: any,
    diagnosticVendorService: any,
    labSlotService: any,
    diagnosticSlotService: any,
    assignmentsService: any,
    planConfigService: any,
    walletService: any,
    transactionService: any,
    copayCalculator: any,
  ): Promise<AhcOrder> {
    // Check eligibility
    const eligibility = await this.checkEligibility(userId, assignmentsService);

    if (!eligibility.isEligible) {
      throw new BadRequestException(eligibility.reason);
    }

    // Get assignment and calculate policy year
    const assignments = await assignmentsService.getUserAssignments(userId);
    if (!assignments || assignments.length === 0) {
      throw new NotFoundException('No active policy assignment found for user');
    }
    const assignment = assignments[0];
    const policyYear = new Date(assignment.effectiveFrom).getFullYear();

    // Validate order and get payment breakdown
    const validation = await this.validateOrder(
      userId,
      {
        packageId: createDto.packageId,
        labVendorId: createDto.labVendorId,
        labSlotId: createDto.labSlotId,
        labCollectionType: createDto.labCollectionType,
        labCollectionAddress: createDto.labCollectionAddress,
        labCollectionDate: createDto.labCollectionDate,
        labCollectionTime: createDto.labCollectionTime,
        diagnosticVendorId: createDto.diagnosticVendorId,
        diagnosticSlotId: createDto.diagnosticSlotId,
        diagnosticAppointmentDate: createDto.diagnosticAppointmentDate,
        diagnosticAppointmentTime: createDto.diagnosticAppointmentTime,
      } as ValidateAhcOrderDto,
      ahcPackageService,
      labVendorService,
      diagnosticVendorService,
      assignmentsService,
      planConfigService,
      copayCalculator,
    );

    // Get AHC package
    const ahcPackage = await ahcPackageService.getPackageById(createDto.packageId);

    // Book lab slot only if lab vendor exists
    if (validation.labVendor && createDto.labSlotId) {
      await labSlotService.bookSlot(createDto.labSlotId);
    }

    // Book diagnostic slot only if diagnostic vendor exists
    if (validation.diagnosticVendor && createDto.diagnosticSlotId) {
      await diagnosticSlotService.bookSlot(createDto.diagnosticSlotId);
    }

    // Generate order ID
    const orderId = `AHC-ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create lab order details (only if lab vendor exists)
    const labOrder = validation.labVendor ? {
      vendorId: validation.labVendor._id, // Use MongoDB ObjectId from vendor
      vendorName: validation.labVendor.name,
      items: validation.labVendor.pricing.map((p: any) => ({
        serviceId: p.serviceId, // Already ObjectId from getPricingForServices
        serviceName: p.serviceName,
        serviceCode: p.serviceCode,
        actualPrice: p.actualPrice,
        discountedPrice: p.discountedPrice,
      })),
      collectionType: createDto.labCollectionType,
      collectionAddress: createDto.labCollectionAddress,
      collectionDate: createDto.labCollectionDate,
      collectionTime: createDto.labCollectionTime,
      slotId: createDto.labSlotId, // Store slot string ID for now
      totalActualPrice: validation.labVendor.totalActualPrice,
      totalDiscountedPrice: validation.labVendor.totalDiscountedPrice,
      homeCollectionCharges: validation.labVendor.homeCollectionCharges,
      reports: [],
    } : {
      vendorId: null,
      vendorName: '',
      items: [],
      collectionType: null,
      collectionAddress: null,
      collectionDate: null,
      collectionTime: null,
      slotId: null,
      totalActualPrice: 0,
      totalDiscountedPrice: 0,
      homeCollectionCharges: 0,
      reports: [],
    };

    // Create diagnostic order details (only if diagnostic vendor exists)
    const diagnosticOrder = validation.diagnosticVendor ? {
      vendorId: validation.diagnosticVendor._id, // Use MongoDB ObjectId from vendor
      vendorName: validation.diagnosticVendor.name,
      items: validation.diagnosticVendor.pricing.map((p: any) => ({
        serviceId: p.serviceId, // Already ObjectId from getPricingForServices
        serviceName: p.serviceName,
        serviceCode: p.serviceCode,
        category: p.category,
        actualPrice: p.actualPrice,
        discountedPrice: p.discountedPrice,
      })),
      collectionType: 'CENTER_VISIT', // Diagnostics always center visit
      appointmentDate: createDto.diagnosticAppointmentDate,
      appointmentTime: createDto.diagnosticAppointmentTime,
      slotId: createDto.diagnosticSlotId, // Store slot string ID for now
      totalActualPrice: validation.diagnosticVendor.totalActualPrice,
      totalDiscountedPrice: validation.diagnosticVendor.totalDiscountedPrice,
      homeCollectionCharges: 0,
      reports: [],
    } : {
      vendorId: null,
      vendorName: '',
      items: [],
      collectionType: null,
      appointmentDate: null,
      appointmentTime: null,
      slotId: null,
      totalActualPrice: 0,
      totalDiscountedPrice: 0,
      homeCollectionCharges: 0,
      reports: [],
    };

    // Create AHC order
    const order = new this.ahcOrderModel({
      orderId,
      userId: new Types.ObjectId(userId),
      packageId: new Types.ObjectId(ahcPackage._id),
      packageName: ahcPackage.name,
      policyId: assignment.policyId,
      policyYear,
      labOrder,
      diagnosticOrder,
      status: AhcOrderStatus.PLACED,
      totalActualPrice: validation.paymentBreakdown.totalActualPrice,
      totalDiscountedPrice: validation.paymentBreakdown.totalDiscountedPrice,
      totalHomeCollectionCharges: validation.paymentBreakdown.totalHomeCollectionCharges,
      finalAmount: validation.paymentBreakdown.finalAmount,
      copayAmount: validation.paymentBreakdown.copayAmount,
      walletDeduction: validation.paymentBreakdown.walletDeduction,
      finalPayable: validation.paymentBreakdown.finalPayable,
      paymentStatus: createDto.paymentAlreadyProcessed
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PENDING,
      placedAt: new Date(),
    });

    const savedOrder = await order.save();

    // Debit wallet and create transaction if payment was already processed
    // (Payment page created payment record, but wallet debit happens here)
    if (createDto.paymentAlreadyProcessed && validation.paymentBreakdown.walletDeduction > 0) {
      await walletService.debitWallet(
        userId,
        validation.paymentBreakdown.walletDeduction,
        'CAT008', // Wellness category code
        (savedOrder._id as Types.ObjectId).toString(), // Pass MongoDB _id, not orderId
        'AHC',
        ahcPackage.name,
        `AHC Order: ${ahcPackage.name}`,
      );

      // Create transaction summary
      // Use lab date if available, otherwise diagnostic date
      const serviceDate = createDto.labCollectionDate
        ? new Date(createDto.labCollectionDate)
        : createDto.diagnosticAppointmentDate
        ? new Date(createDto.diagnosticAppointmentDate)
        : new Date();

      const transaction = await transactionService.createTransaction({
        userId: new Types.ObjectId(userId),
        serviceType: TransactionServiceType.AHC_ORDER,
        serviceId: savedOrder._id,
        serviceReferenceId: orderId,
        serviceName: `AHC Package: ${ahcPackage.name}`,
        serviceDate,
        totalAmount: validation.paymentBreakdown.finalAmount,
        walletAmount: validation.paymentBreakdown.walletDeduction,
        selfPaidAmount: validation.paymentBreakdown.finalPayable,
        copayAmount: validation.paymentBreakdown.copayAmount,
        paymentMethod: 'COPAY',
        categoryCode: 'CAT008', // Wellness category code
        categoryName: 'Wellness - AHC',
        status: 'COMPLETED',
      });

      savedOrder.transactionId = transaction._id;
      savedOrder.paymentStatus = PaymentStatus.COMPLETED;
      await savedOrder.save();
    }

    return savedOrder;
  }

  /**
   * Get user's AHC orders
   * Supports viewingUserId for family members
   */
  async getUserOrders(userId: string): Promise<AhcOrder[]> {
    return this.ahcOrderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('userId', 'name')  // Populate user to get patient name (name is nested object)
      .populate('packageId')
      .populate('labOrder.vendorId')
      .populate('diagnosticOrder.vendorId')
      .lean()  // Return plain JavaScript objects instead of Mongoose documents
      .exec() as any;
  }

  /**
   * Get all AHC orders (operations)
   * Optional status filter
   */
  async getAllOrders(filter?: { status?: AhcOrderStatus }): Promise<AhcOrder[]> {
    const query: any = {};

    if (filter?.status) {
      query.status = filter.status;
    }

    return this.ahcOrderModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name phone')
      .populate('packageId')
      .populate('labOrder.vendorId')
      .populate('diagnosticOrder.vendorId')
      .exec();
  }

  /**
   * Get specific order by orderId
   */
  async getOrderByOrderId(orderId: string): Promise<AhcOrder> {
    const order = await this.ahcOrderModel
      .findOne({ orderId })
      .populate('userId', 'name phone')
      .populate('packageId')
      .populate('labOrder.vendorId')
      .populate('diagnosticOrder.vendorId')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: AhcOrderStatus,
    confirmedBy?: string,
  ): Promise<AhcOrder> {
    const order = await this.getOrderByOrderId(orderId);

    order.status = status;

    if (status === AhcOrderStatus.CONFIRMED) {
      order.confirmedAt = new Date();
      if (confirmedBy) {
        order.confirmedBy = confirmedBy;
      }
    }

    if (status === AhcOrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    return order.save();
  }

  /**
   * Upload lab report
   */
  async uploadLabReport(
    orderId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<AhcOrder> {
    const order = await this.getOrderByOrderId(orderId);

    // Add to lab reports array
    order.labOrder.reports.push({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      uploadedAt: new Date(),
      uploadedBy,
    } as any);

    order.labOrder.completedAt = new Date();

    // Check if all reports uploaded
    await this.checkAndUpdateCompletionStatus(order);

    return order.save();
  }

  /**
   * Upload diagnostic report
   */
  async uploadDiagnosticReport(
    orderId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<AhcOrder> {
    const order = await this.getOrderByOrderId(orderId);

    // Add to diagnostic reports array
    order.diagnosticOrder.reports.push({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      uploadedAt: new Date(),
      uploadedBy,
    } as any);

    order.diagnosticOrder.completedAt = new Date();

    // Check if all reports uploaded
    await this.checkAndUpdateCompletionStatus(order);

    return order.save();
  }

  /**
   * Upload both lab and diagnostic reports in single request
   */
  async uploadBothReports(
    orderId: string,
    labFile: Express.Multer.File | undefined,
    diagnosticFile: Express.Multer.File | undefined,
    uploadedBy: string,
  ): Promise<AhcOrder> {
    const order = await this.getOrderByOrderId(orderId);

    // Upload lab report if provided
    if (labFile && order.labOrder.items.length > 0) {
      order.labOrder.reports.push({
        fileName: labFile.filename,
        originalName: labFile.originalname,
        filePath: labFile.path,
        uploadedAt: new Date(),
        uploadedBy,
      } as any);
      order.labOrder.completedAt = new Date();
    }

    // Upload diagnostic report if provided
    if (diagnosticFile && order.diagnosticOrder.items.length > 0) {
      order.diagnosticOrder.reports.push({
        fileName: diagnosticFile.filename,
        originalName: diagnosticFile.originalname,
        filePath: diagnosticFile.path,
        uploadedAt: new Date(),
        uploadedBy,
      } as any);
      order.diagnosticOrder.completedAt = new Date();
    }

    // Check if all reports uploaded
    await this.checkAndUpdateCompletionStatus(order);

    return order.save();
  }

  /**
   * Check if all required reports uploaded and update status to COMPLETED
   */
  private async checkAndUpdateCompletionStatus(order: AhcOrder): Promise<void> {
    const labComplete =
      order.labOrder.items.length === 0 || order.labOrder.reports.length > 0;
    const diagnosticComplete =
      order.diagnosticOrder.items.length === 0 || order.diagnosticOrder.reports.length > 0;

    if (labComplete && diagnosticComplete) {
      order.status = AhcOrderStatus.COMPLETED;
      order.completedAt = new Date();
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    reason: string,
    cancelledBy: CancelledBy,
  ): Promise<AhcOrder> {
    const order = await this.getOrderByOrderId(orderId);

    if (order.status === AhcOrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    if (order.status === AhcOrderStatus.CANCELLED) {
      throw new BadRequestException('Order already cancelled');
    }

    order.status = AhcOrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy;
    order.cancellationReason = reason;

    return order.save();
  }

  /**
   * Mark collection complete (operations)
   */
  async markCollectionComplete(orderId: string, confirmedBy: string): Promise<AhcOrder> {
    const order = await this.getOrderByOrderId(orderId);

    if (order.status !== AhcOrderStatus.PLACED) {
      throw new BadRequestException('Order must be in PLACED status');
    }

    order.status = AhcOrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    order.confirmedBy = confirmedBy;

    return order.save();
  }
}
