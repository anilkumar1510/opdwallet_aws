import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabOrder, OrderStatus, PaymentStatus } from '../schemas/lab-order.schema';
import { LabCart } from '../schemas/lab-cart.schema';
import { LabVendor } from '../schemas/lab-vendor.schema';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { ValidateLabOrderDto } from '../dto/validate-lab-order.dto';
import { LabCartService } from './lab-cart.service';
import { LabVendorService } from './lab-vendor.service';
import { AssignmentsService } from '../../assignments/assignments.service';
import { PlanConfigService } from '../../plan-config/plan-config.service';
import { WalletService } from '../../wallet/wallet.service';
import { PaymentService } from '../../payments/payment.service';
import { ServiceType as PaymentServiceType } from '../../payments/schemas/payment.schema';
import { BenefitResolver } from '../../plan-config/utils/benefit-resolver';
import { CopayResolver } from '../../plan-config/utils/copay-resolver';
import { CopayCalculator } from '../../plan-config/utils/copay-calculator';
import { ServiceTransactionLimitCalculator } from '../../plan-config/utils/service-transaction-limit-calculator';
import { TransactionSummaryService } from '../../transactions/transaction-summary.service';
import { TransactionServiceType, PaymentMethod, TransactionStatus } from '../../transactions/schemas/transaction-summary.schema';

@Injectable()
export class LabOrderService {
  constructor(
    @InjectModel(LabOrder.name)
    private orderModel: Model<LabOrder>,
    @InjectModel(LabCart.name)
    private cartModel: Model<LabCart>,
    @InjectModel(LabVendor.name)
    private vendorModel: Model<LabVendor>,
    private cartService: LabCartService,
    private vendorService: LabVendorService,
    private assignmentsService: AssignmentsService,
    private planConfigService: PlanConfigService,
    private walletService: WalletService,
    private transactionSummaryService: TransactionSummaryService,
    private paymentService: PaymentService,
  ) {}

  async validateOrder(userId: string, validateDto: ValidateLabOrderDto) {
    console.log('[LabOrder] Validating order:', { userId, ...validateDto });

    try {
      // 1. Validate slot availability
      const slot = await this.vendorService.getSlotById(validateDto.slotId);
      if (!slot) {
        throw new BadRequestException('Slot not found');
      }

      // 2. Get cart to determine service categories
      const cart = await this.cartModel.findOne({ cartId: validateDto.cartId });
      if (!cart) {
        throw new BadRequestException('Cart not found');
      }

      // Extract service categories from cart items
      const serviceCategories = cart.items.map(item => item.category);
      const primaryCategory = serviceCategories[0]; // Use first category, or most common one
      console.log('[LabOrder] Service categories in cart:', serviceCategories);
      console.log('[LabOrder] Using primary category:', primaryCategory);

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

      // 4. Resolve lab benefits (CAT004 = Laboratory Services)
      const labBenefit = BenefitResolver.resolve(
        planConfig,
        'CAT004',
        assignment.relationshipId,
      );

      if (!labBenefit) {
        throw new BadRequestException('Lab benefits not available for this user');
      }

      // 5. Get copay config
      const copayConfig = CopayResolver.resolve(planConfig, assignment.relationshipId) || undefined;

      // 6. Calculate copay
      const copayCalc = CopayCalculator.calculate(validateDto.totalAmount, copayConfig);

      // 7. Get service transaction limit from benefit config based on service category
      // Lab service transaction limits are organized by category (PATHOLOGY, RADIOLOGY, etc.)
      const serviceLimit = labBenefit?.serviceTransactionLimits?.[primaryCategory] || null;
      console.log('[LabOrder] Service transaction limits available:', labBenefit?.serviceTransactionLimits);
      console.log('[LabOrder] Service transaction limit for', primaryCategory, ':', serviceLimit);

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

      console.log('[LabOrder] Payment breakdown:', {
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
      console.error('[LabOrder] Validation error:', error);
      return {
        valid: false,
        breakdown: null,
        error: error.message || 'Validation failed',
      };
    }
  }

  async createOrder(
    userId: Types.ObjectId,
    createDto: CreateOrderDto,
  ): Promise<LabOrder> {
    // Get cart and validate
    const cart = await this.cartModel.findOne({ cartId: createDto.cartId });
    if (!cart) {
      throw new NotFoundException(`Cart ${createDto.cartId} not found`);
    }

    // Get vendor by vendorId string field (not MongoDB _id)
    const vendor = await this.vendorModel.findOne({
      vendorId: createDto.vendorId
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${createDto.vendorId} not found`);
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get pricing for all items
    const orderItems = [];
    for (const cartItem of cart.items) {
      const pricing = await this.vendorService.getPricingForService(
        createDto.vendorId,
        cartItem.serviceId.toString(),
      );

      if (!pricing) {
        throw new BadRequestException(
          `Pricing not found for service ${cartItem.serviceName}`,
        );
      }

      orderItems.push({
        serviceId: cartItem.serviceId,
        serviceName: cartItem.serviceName,
        serviceCode: cartItem.serviceCode,
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
    const homeCollectionCharges = createDto.collectionType === 'HOME_COLLECTION'
      ? (vendor.homeCollectionCharges || 100)
      : 0;
    const finalAmount = totalDiscountedPrice + homeCollectionCharges;

    // Get payment breakdown or use defaults
    let paymentBreakdown = createDto.paymentBreakdown || {
      totalAmount: finalAmount,
      copay: 0,
      serviceLimitDeduction: finalAmount,
      walletDeduction: 0,
      finalPayable: 0,
    };

    // Recalculate payment breakdown for security (following dental pattern)
    if (createDto.paymentAlreadyProcessed) {
      console.log('[LabOrder] Payment already processed, recalculating breakdown for wallet debit');

      const validation = await this.validateOrder(userId.toString(), {
        patientId: userId.toString(),
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

      console.log('[LabOrder] Recalculated breakdown:', paymentBreakdown);
    }

    // Support both new and legacy field names
    const appointmentDate = createDto.appointmentDate || createDto.collectionDate;
    const appointmentTime = createDto.timeSlot || createDto.collectionTime;

    // Determine payment status based on whether payment was already processed
    const paymentStatus = createDto.paymentAlreadyProcessed
      ? PaymentStatus.COMPLETED
      : PaymentStatus.PENDING;

    // Create order
    const order = new this.orderModel({
      orderId,
      userId,
      cartId: cart._id,
      prescriptionId: cart.prescriptionId,
      vendorId: vendor._id,  // Use vendor's MongoDB _id (already an ObjectId)
      vendorName: vendor.name,
      items: orderItems,
      status: OrderStatus.PLACED,
      collectionType: createDto.collectionType,
      collectionAddress: createDto.collectionAddress,
      collectionDate: appointmentDate,
      collectionTime: appointmentTime,
      slotId: slotObjectId,  // Use the MongoDB _id of the slot (already ObjectId)
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
      console.log('[LabOrder] Debiting wallet for insurance portion:', paymentBreakdown.walletDeduction);

      // Debit wallet for insurance portion
      await this.walletService.debitWallet(
        userId.toString(),
        paymentBreakdown.walletDeduction,
        'CAT004',  // Laboratory Services category code
        (savedOrder._id as Types.ObjectId).toString(),
        'LAB',
        vendor.name,
        `Lab order: ${orderItems.map(i => i.serviceName).join(', ')}`,
      );

      console.log('[LabOrder] Wallet debited successfully');

      // Create transaction summary
      const transaction = await this.transactionSummaryService.createTransaction({
        userId: userId.toString(),
        serviceType: TransactionServiceType.LAB_ORDER,
        serviceId: (savedOrder._id as Types.ObjectId).toString(),
        serviceReferenceId: orderId,
        serviceName: orderItems.map(i => i.serviceName).join(', '),
        serviceDate: new Date(createDto.appointmentDate || createDto.collectionDate || new Date()),
        totalAmount: finalAmount,
        walletAmount: paymentBreakdown.walletDeduction,
        selfPaidAmount: paymentBreakdown.finalPayable,
        copayAmount: paymentBreakdown.copay,
        paymentMethod: PaymentMethod.COPAY,
        categoryCode: 'CAT004',
        categoryName: 'Laboratory Services',
        description: `Lab order: ${orderItems.map(i => i.serviceName).join(', ')}`,
        status: TransactionStatus.COMPLETED,
      });

      // Store transaction ID in order
      savedOrder.transactionId = new Types.ObjectId((transaction as any)._id.toString());
      await savedOrder.save();

      console.log('[LabOrder] Transaction summary created:', (transaction as any)._id);

      // Update payment record with actual order ID if payment was processed
      try {
        await this.paymentService.updatePaymentByReference(
          createDto.cartId,
          PaymentServiceType.LAB_ORDER,
          orderId,
          (savedOrder._id as Types.ObjectId).toString(),
        );
        console.log('[LabOrder] Payment record updated with order ID');
      } catch (error) {
        console.log('[LabOrder] Failed to update payment record (non-critical):', error.message);
      }
    }

    // Mark cart as ordered
    await this.cartService.markCartAsOrdered(createDto.cartId);

    return savedOrder;
  }

  async getOrderById(orderId: string): Promise<LabOrder> {
    const order = await this.orderModel
      .findOne({ orderId })
      .populate('vendorId', 'name code contactInfo')
      .populate('items.serviceId', 'name code category')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async getUserOrders(userId: Types.ObjectId): Promise<LabOrder[]> {
    return this.orderModel
      .find({ userId })
      .populate('vendorId', 'name code contactInfo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllOrders(status?: OrderStatus): Promise<LabOrder[]> {
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    return this.orderModel
      .find(filter)
      .populate('vendorId', 'name code contactInfo')
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getVendorOrders(vendorId: string, status?: OrderStatus): Promise<LabOrder[]> {
    const filter: any = { vendorId: new Types.ObjectId(vendorId) };

    if (status) {
      filter.status = status;
    }

    return this.orderModel
      .find(filter)
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateOrderStatus(
    orderId: string,
    updateDto: UpdateOrderStatusDto,
    userId?: string,
  ): Promise<LabOrder> {
    const order = await this.getOrderById(orderId);

    order.status = updateDto.status;

    // Set timestamps based on status
    if (updateDto.status === OrderStatus.CONFIRMED) {
      order.confirmedAt = new Date();
      order.confirmedBy = userId;
    }

    if (updateDto.status === OrderStatus.SAMPLE_COLLECTED) {
      order.collectedAt = new Date();
    }

    if (updateDto.status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    if (updateDto.reportUrl) {
      order.reportUrl = updateDto.reportUrl;
      order.reportUploadedAt = new Date();
    }

    if (updateDto.status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      order.cancellationReason = updateDto.cancellationReason;
    }

    if (updateDto.notes) {
      order.notes = updateDto.notes;
    }

    return order.save();
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string,
    paymentMethod?: string,
  ): Promise<LabOrder> {
    const order = await this.getOrderById(orderId);

    order.paymentStatus = paymentStatus;

    if (transactionId && order.paymentInfo) {
      order.paymentInfo.transactionId = transactionId;
    }

    if (paymentMethod) {
      order.paymentMode = paymentMethod;
    }

    if (paymentStatus === PaymentStatus.COMPLETED) {
      order.paymentDate = new Date();
    }

    return order.save();
  }

  async cancelOrder(orderId: string, reason: string): Promise<LabOrder> {
    const order = await this.getOrderById(orderId);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    // Credit wallet if payment was made from wallet
    if (order.paymentStatus === PaymentStatus.COMPLETED && order.walletDeduction && order.walletDeduction > 0) {
      console.log('[LabOrder] Crediting wallet for cancelled order:', {
        orderId,
        amount: order.walletDeduction,
        userId: order.userId,
      });

      await this.walletService.creditWallet(
        order.userId.toString(),
        order.walletDeduction,
        'CAT004', // Laboratory Services category code
        (order._id as Types.ObjectId).toString(),
        'LAB',
        order.vendorName,
        `Refund for cancelled lab order: ${reason}`,
      );
    }

    // Process payment refund for finalPayable amount
    if (order.paymentStatus === PaymentStatus.COMPLETED && order.finalPayable && order.finalPayable > 0) {
      console.log('[LabOrder] Processing payment refund for cancelled order:', {
        orderId,
        amount: order.finalPayable,
        userId: order.userId,
      });

      await this.paymentService.processRefundByService(
        PaymentServiceType.LAB_ORDER,
        (order._id as Types.ObjectId).toString(),
        reason,
        order.orderId, // Pass orderId as fallback reference
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    return order.save();
  }
}
