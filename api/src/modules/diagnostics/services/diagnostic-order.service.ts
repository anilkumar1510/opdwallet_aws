import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DiagnosticOrder,
  OrderStatus,
  CollectionType,
  PaymentStatus,
  CancelledBy,
  OrderItem,
  CollectionAddress,
} from '../schemas/diagnostic-order.schema';
import { DiagnosticCart } from '../schemas/diagnostic-cart.schema';
import { DiagnosticVendor } from '../schemas/diagnostic-vendor.schema';
import { ValidateDiagnosticOrderDto } from '../dto/validate-diagnostic-order.dto';
import { DiagnosticVendorService } from './diagnostic-vendor.service';
import { DiagnosticCartService } from './diagnostic-cart.service';
import { AssignmentsService } from '../../assignments/assignments.service';
import { PlanConfigService } from '../../plan-config/plan-config.service';
import { WalletService } from '../../wallet/wallet.service';
import { PaymentService } from '../../payments/payment.service';
import { ServiceType as PaymentServiceType } from '../../payments/schemas/payment.schema';
import { TransactionSummaryService } from '../../transactions/transaction-summary.service';
import { TransactionServiceType, PaymentMethod, TransactionStatus } from '../../transactions/schemas/transaction-summary.schema';
import { BenefitResolver } from '../../plan-config/utils/benefit-resolver';
import { CopayResolver } from '../../plan-config/utils/copay-resolver';
import { CopayCalculator } from '../../plan-config/utils/copay-calculator';
import { ServiceTransactionLimitCalculator } from '../../plan-config/utils/service-transaction-limit-calculator';

export interface CreateDiagnosticOrderDto {
  userId: string;
  cartId: string;
  prescriptionId: string;
  vendorId: string;
  vendorName?: string;
  items?: OrderItem[];
  collectionType?: CollectionType;
  collectionAddress?: CollectionAddress;
  appointmentDate?: string;
  appointmentTime?: string;
  timeSlot?: string;
  slotId?: string;
  totalActualPrice?: number;
  totalDiscountedPrice?: number;
  homeCollectionCharges?: number;
  finalAmount?: number;
  paymentAlreadyProcessed?: boolean;
  paymentBreakdown?: {
    totalAmount: number;
    copay: number;
    serviceLimitDeduction: number;
    walletDeduction: number;
    finalPayable: number;
  };
  notes?: string;
}

@Injectable()
export class DiagnosticOrderService {
  constructor(
    @InjectModel(DiagnosticOrder.name)
    private diagnosticOrderModel: Model<DiagnosticOrder>,
    @InjectModel(DiagnosticCart.name)
    private diagnosticCartModel: Model<DiagnosticCart>,
    @InjectModel(DiagnosticVendor.name)
    private diagnosticVendorModel: Model<DiagnosticVendor>,
    private vendorService: DiagnosticVendorService,
    private cartService: DiagnosticCartService,
    private assignmentsService: AssignmentsService,
    private planConfigService: PlanConfigService,
    private walletService: WalletService,
    private transactionSummaryService: TransactionSummaryService,
    private paymentService: PaymentService,
  ) {}

  async create(createDto: CreateDiagnosticOrderDto): Promise<DiagnosticOrder> {
    console.log('[DiagnosticOrder] Creating order:', createDto);

    // Get cart and validate
    const cart = await this.diagnosticCartModel.findOne({ cartId: createDto.cartId });
    if (!cart) {
      throw new NotFoundException(`Cart ${createDto.cartId} not found`);
    }

    // Get vendor by vendorId string field (not MongoDB _id)
    const vendor = await this.diagnosticVendorModel.findOne({
      vendorId: createDto.vendorId
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${createDto.vendorId} not found`);
    }

    // Generate order ID
    const orderId = `DIAG-ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get pricing for all items from vendor
    const orderItems = [];
    for (const cartItem of cart.items) {
      const vendorPricing = await this.vendorService.getVendorPricing(createDto.vendorId);
      const pricing = vendorPricing.find(p => p.serviceId.toString() === cartItem.serviceId.toString());

      if (!pricing) {
        throw new BadRequestException(
          `Pricing not found for service ${cartItem.serviceName}`,
        );
      }

      orderItems.push({
        serviceId: cartItem.serviceId,
        serviceName: cartItem.serviceName,
        serviceCode: cartItem.serviceCode,
        category: cartItem.category,
        actualPrice: pricing.actualPrice,
        discountedPrice: pricing.discountedPrice,
      });
    }

    // Get slot and book it if provided
    let slotObjectId: Types.ObjectId | undefined = undefined;
    if (createDto.slotId) {
      const slot = await this.vendorService.getSlotById(createDto.slotId);
      if (slot) {
        slotObjectId = slot._id as Types.ObjectId;
        await this.vendorService.bookSlot(createDto.slotId);
      }
    }

    // Calculate prices server-side for security
    const totalActualPrice = orderItems.reduce((sum, item) => sum + item.actualPrice, 0);
    const totalDiscountedPrice = orderItems.reduce((sum, item) => sum + item.discountedPrice, 0);
    // All diagnostic orders are center visits, no home collection charges
    const homeCollectionCharges = 0;
    const finalAmount = totalDiscountedPrice;

    // Get payment breakdown or use defaults
    let paymentBreakdown = createDto.paymentBreakdown || {
      totalAmount: finalAmount,
      copay: 0,
      serviceLimitDeduction: finalAmount,
      walletDeduction: 0,
      finalPayable: 0,
    };

    // Recalculate payment breakdown for security (following lab pattern)
    if (createDto.paymentAlreadyProcessed) {
      console.log('[DiagnosticOrder] Payment already processed, recalculating breakdown for wallet debit');

      const validation = await this.validateOrder(createDto.userId, {
        patientId: createDto.userId,
        vendorId: createDto.vendorId,
        cartId: createDto.cartId,
        slotId: createDto.slotId || '',
        totalAmount: finalAmount,
      });

      if (!validation.valid || !validation.breakdown) {
        throw new BadRequestException('Order validation failed: ' + (validation as any).error);
      }

      paymentBreakdown = {
        totalAmount: validation.breakdown.billAmount,
        copay: validation.breakdown.copayAmount,
        serviceLimitDeduction: validation.breakdown.insurancePayment,
        walletDeduction: validation.breakdown.walletDebitAmount,
        finalPayable: validation.breakdown.totalMemberPayment,
      };

      console.log('[DiagnosticOrder] Recalculated breakdown:', paymentBreakdown);
    }

    // Support both new and legacy field names
    const appointmentDate = createDto.appointmentDate;
    const appointmentTime = createDto.timeSlot || createDto.appointmentTime;

    // Determine payment status based on whether payment was already processed
    const paymentStatus = createDto.paymentAlreadyProcessed
      ? PaymentStatus.COMPLETED
      : PaymentStatus.PENDING;

    // Create order (all diagnostic orders are center visits by default)
    const order = new this.diagnosticOrderModel({
      orderId,
      userId: new Types.ObjectId(createDto.userId),
      cartId: cart._id,
      prescriptionId: cart.prescriptionId,
      vendorId: vendor._id,
      vendorName: vendor.name,
      items: orderItems,
      status: OrderStatus.PLACED,
      collectionType: CollectionType.CENTER_VISIT,
      appointmentDate,
      appointmentTime,
      slotId: slotObjectId,
      totalActualPrice,
      totalDiscountedPrice,
      homeCollectionCharges,
      finalAmount,
      copayAmount: paymentBreakdown.copay,
      serviceLimitDeduction: paymentBreakdown.serviceLimitDeduction,
      walletDeduction: paymentBreakdown.walletDeduction,
      finalPayable: paymentBreakdown.finalPayable,
      paymentStatus,
      paymentDate: createDto.paymentAlreadyProcessed ? new Date() : undefined,
      placedAt: new Date(),
      reports: [],
      notes: createDto.notes,
    });

    const savedOrder = await order.save();

    // If payment was already processed externally, debit wallet and create transaction
    if (createDto.paymentAlreadyProcessed && paymentBreakdown.walletDeduction > 0) {
      console.log('[DiagnosticOrder] Debiting wallet for insurance portion:', paymentBreakdown.walletDeduction);

      // Debit wallet for insurance portion
      await this.walletService.debitWallet(
        createDto.userId,
        paymentBreakdown.walletDeduction,
        'CAT003',  // Radiology/ Cardiology category code
        (savedOrder._id as Types.ObjectId).toString(),
        'DIAGNOSTIC',
        vendor.name,
        `Diagnostic order: ${orderItems.map(i => i.serviceName).join(', ')}`,
      );

      console.log('[DiagnosticOrder] Wallet debited successfully');

      // Create transaction summary
      const transaction = await this.transactionSummaryService.createTransaction({
        userId: createDto.userId,
        serviceType: TransactionServiceType.DIAGNOSTIC_ORDER,
        serviceId: (savedOrder._id as Types.ObjectId).toString(),
        serviceReferenceId: orderId,
        serviceName: orderItems.map(i => i.serviceName).join(', '),
        serviceDate: new Date(createDto.appointmentDate || new Date()),
        totalAmount: finalAmount,
        walletAmount: paymentBreakdown.walletDeduction,
        selfPaidAmount: paymentBreakdown.finalPayable,
        copayAmount: paymentBreakdown.copay,
        paymentMethod: PaymentMethod.COPAY,
        categoryCode: 'CAT003',
        categoryName: 'Radiology/ Cardiology',
        description: `Diagnostic order: ${orderItems.map(i => i.serviceName).join(', ')}`,
        status: TransactionStatus.COMPLETED,
      });

      // Store transaction ID in order
      savedOrder.transactionId = new Types.ObjectId((transaction as any)._id.toString());
      await savedOrder.save();

      console.log('[DiagnosticOrder] Transaction summary created:', (transaction as any)._id);

      // Update payment record with actual order ID if payment was processed
      console.log('[DiagnosticOrder] Attempting to update payment record with:', {
        cartId: createDto.cartId,
        serviceType: PaymentServiceType.DIAGNOSTIC_ORDER,
        orderId,
        orderMongoId: (savedOrder._id as Types.ObjectId).toString(),
      });

      try {
        const updatedPayment = await this.paymentService.updatePaymentByReference(
          createDto.cartId,
          PaymentServiceType.DIAGNOSTIC_ORDER,
          orderId,
          (savedOrder._id as Types.ObjectId).toString(),
        );

        if (updatedPayment) {
          console.log('[DiagnosticOrder] Payment record updated successfully:', updatedPayment.paymentId);
        } else {
          console.log('[DiagnosticOrder] Payment record not found - might need manual update');
        }
      } catch (error) {
        console.log('[DiagnosticOrder] Failed to update payment record (non-critical):', error.message);
      }
    }

    // Mark cart as ordered
    await this.cartService.markCartAsOrdered(createDto.cartId);

    console.log('[DiagnosticOrder] Order created successfully:', orderId);

    return savedOrder;
  }

  async findOne(orderId: string): Promise<DiagnosticOrder> {
    const order = await this.diagnosticOrderModel.findOne({ orderId });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async findByUserId(userId: string): Promise<DiagnosticOrder[]> {
    return this.diagnosticOrderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(filters?: { status?: OrderStatus }): Promise<DiagnosticOrder[]> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    return this.diagnosticOrderModel
      .find(query)
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(orderId: string, status: OrderStatus, confirmedBy?: string): Promise<DiagnosticOrder> {
    const order = await this.findOne(orderId);

    order.status = status;

    if (status === OrderStatus.CONFIRMED) {
      order.confirmedAt = new Date();
      order.confirmedBy = confirmedBy;
    }

    if (status === OrderStatus.SCHEDULED) {
      order.scheduledAt = new Date();
    }

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    return order.save();
  }

  async cancelOrder(orderId: string, reason: string, cancelledBy: CancelledBy): Promise<DiagnosticOrder> {
    const order = await this.findOne(orderId);

    // Credit wallet if payment was made from wallet
    if (order.paymentStatus === PaymentStatus.COMPLETED && order.walletDeduction && order.walletDeduction > 0) {
      console.log('[DiagnosticOrder] Crediting wallet for cancelled order:', {
        orderId,
        amount: order.walletDeduction,
        userId: order.userId,
      });

      await this.walletService.creditWallet(
        order.userId.toString(),
        order.walletDeduction,
        'CAT003', // Radiology/ Cardiology category code
        (order._id as Types.ObjectId).toString(),
        'DIAGNOSTIC',
        order.vendorName,
        `Refund for cancelled diagnostic order: ${reason}`,
      );
    }

    // Process payment refund for finalPayable amount
    if (order.paymentStatus === PaymentStatus.COMPLETED && order.finalPayable && order.finalPayable > 0) {
      console.log('[DiagnosticOrder] Processing payment refund for cancelled order:', {
        orderId,
        amount: order.finalPayable,
        userId: order.userId,
      });

      await this.paymentService.processRefundByService(
        PaymentServiceType.DIAGNOSTIC_ORDER,
        (order._id as Types.ObjectId).toString(),
        reason,
        order.orderId, // Pass orderId as fallback reference
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy;
    order.cancellationReason = reason;

    return order.save();
  }

  async uploadReport(
    orderId: string,
    fileName: string,
    originalName: string,
    filePath: string,
    uploadedBy: string,
  ): Promise<DiagnosticOrder> {
    const order = await this.findOne(orderId);

    // Convert file path to API URL path
    // filePath can be 'uploads/diagnostic-reports/filename.pdf' or './uploads/diagnostic-reports/filename.pdf'
    // Convert to '/api/uploads/diagnostic-reports/filename.pdf'
    const reportUrl = filePath.replace(/^(\.\/)?uploads\//, '/api/uploads/');

    order.reports.push({
      fileName,
      originalName,
      filePath: reportUrl,
      uploadedAt: new Date(),
      uploadedBy,
    });

    // Set reportUrl for easy access
    order.reportUrl = reportUrl;

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.SCHEDULED) {
      order.status = OrderStatus.COMPLETED;
      order.completedAt = new Date();
    }

    return order.save();
  }

  async findByVendorId(vendorId: string): Promise<DiagnosticOrder[]> {
    return this.diagnosticOrderModel
      .find({ vendorId: new Types.ObjectId(vendorId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async validateOrder(userId: string, validateDto: ValidateDiagnosticOrderDto) {
    console.log('[DiagnosticOrder] Validating order:', { userId, ...validateDto });

    try {
      // 1. Validate slot availability
      const slot = await this.vendorService.getSlotById(validateDto.slotId);
      if (!slot) {
        throw new BadRequestException('Slot not found');
      }

      // 2. Get cart to determine service categories
      const cart = await this.diagnosticCartModel.findOne({ cartId: validateDto.cartId });
      if (!cart) {
        throw new BadRequestException('Cart not found');
      }

      // Extract service categories from cart items
      const serviceCategories = cart.items.map(item => item.category);
      const primaryCategory = serviceCategories[0]; // Use first category, or most common one
      console.log('[DiagnosticOrder] Service categories in cart:', serviceCategories);
      console.log('[DiagnosticOrder] Using primary category:', primaryCategory);

      // 3. Get user's active assignment and plan config
      const assignments = await this.assignmentsService.getUserAssignments(userId);
      const assignment = assignments && assignments.length > 0 ? assignments[0] : null;

      if (!assignment) {
        throw new BadRequestException('No active policy assignment found');
      }

      const policyId = typeof assignment.policyId === 'object' && assignment.policyId._id
        ? assignment.policyId._id.toString()
        : assignment.policyId.toString();

      const planConfig = await this.planConfigService.getConfig(policyId);
      if (!planConfig) {
        throw new BadRequestException('Plan configuration not found');
      }

      // 4. Resolve diagnostic benefits (CAT003 = Radiology/ Cardiology)
      const diagnosticBenefit = BenefitResolver.resolve(
        planConfig,
        'CAT003',
        assignment.relationshipId,
      );

      if (!diagnosticBenefit) {
        throw new BadRequestException('Diagnostic benefits not available for this user');
      }

      // 5. Get copay config
      const copayConfig = CopayResolver.resolve(planConfig, assignment.relationshipId) || undefined;

      // 6. Calculate copay
      const copayCalc = CopayCalculator.calculate(validateDto.totalAmount, copayConfig);

      // 7. Get service transaction limit from benefit config based on service category
      // Diagnostic service transaction limits are organized by category (CT_SCAN, MRI, X_RAY, etc.)
      const serviceLimit = diagnosticBenefit?.serviceTransactionLimits?.[primaryCategory] || null;
      console.log('[DiagnosticOrder] Service transaction limits available:', diagnosticBenefit?.serviceTransactionLimits);
      console.log('[DiagnosticOrder] Service transaction limit for', primaryCategory, ':', serviceLimit);

      // 8. Apply service transaction limit
      const limitCalc = ServiceTransactionLimitCalculator.calculate(
        validateDto.totalAmount,
        copayCalc.copayAmount,
        serviceLimit,
      );

      // 9. Get wallet balance
      const wallet = await this.walletService.getUserWallet(userId);
      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      const walletBalance = wallet.totalBalance?.current || 0;

      // 10. Calculate payment breakdown
      const walletDebitAmount = limitCalc.insurancePayment;
      const memberPayment = limitCalc.totalMemberPayment;
      const insufficientBalance = walletBalance < walletDebitAmount;

      console.log('[DiagnosticOrder] Payment breakdown:', {
        billAmount: validateDto.totalAmount,
        copayAmount: limitCalc.copayAmount,
        serviceTransactionLimit: limitCalc.serviceTransactionLimit,
        insurancePayment: limitCalc.insurancePayment,
        excessAmount: limitCalc.excessAmount,
        totalMemberPayment: memberPayment,
        walletBalance,
        walletDebitAmount,
        insufficientBalance,
      });

      return {
        valid: true,
        breakdown: {
          billAmount: validateDto.totalAmount,
          copayAmount: limitCalc.copayAmount,
          insuranceEligibleAmount: limitCalc.insuranceEligibleAmount,
          serviceTransactionLimit: limitCalc.serviceTransactionLimit,
          insurancePayment: limitCalc.insurancePayment,
          excessAmount: limitCalc.excessAmount,
          totalMemberPayment: memberPayment,
          walletBalance,
          walletDebitAmount,
          insufficientBalance,
        },
        warnings: insufficientBalance ? ['Insufficient wallet balance'] : [],
      };
    } catch (error) {
      console.error('[DiagnosticOrder] Validation error:', error);
      return {
        valid: false,
        breakdown: null,
        error: error.message || 'Validation failed',
      };
    }
  }
}
