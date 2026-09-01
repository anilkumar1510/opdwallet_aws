import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
  PharmacyOrderStatus,
  PharmacyPaymentStatus,
  PharmacyCancelledBy,
} from '../schemas/pharmacy-order.schema';
import { PharmacyCartService } from './pharmacy-cart.service';
import { PharmacyCartStatus } from '../schemas/pharmacy-cart.schema';
import { PharmacyInvoiceService } from './pharmacy-invoice.service';
import { AssignmentsService } from '../../assignments/assignments.service';
import { PlanConfigService } from '../../plan-config/plan-config.service';
import { WalletService } from '../../wallet/wallet.service';
import { PaymentService } from '../../payments/payment.service';
import { PaymentType, ServiceType as PaymentServiceType } from '../../payments/schemas/payment.schema';
import { CopayResolver } from '../../plan-config/utils/copay-resolver';
import { CopayCalculator } from '../../plan-config/utils/copay-calculator';
import { TransactionSummaryService } from '../../transactions/transaction-summary.service';
import { TransactionServiceType, PaymentMethod, TransactionStatus } from '../../transactions/schemas/transaction-summary.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/schemas/notification.schema';

const CATEGORY_CODE = 'CAT002';

@Injectable()
export class PharmacyOrderService {
  constructor(
    @InjectModel(PharmacyOrder.name) private orderModel: Model<PharmacyOrderDocument>,
    private cartService: PharmacyCartService,
    private invoiceService: PharmacyInvoiceService,
    private assignmentsService: AssignmentsService,
    private planConfigService: PlanConfigService,
    private walletService: WalletService,
    private paymentService: PaymentService,
    private transactionSummaryService: TransactionSummaryService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Steps 4-6 in one call: cart placed on hold, adjudicated, member notified.
   * No ops queue exists for this yet, so adjudication runs synchronously and
   * immediately — a lazier but honest stand-in for the sheet's manual review.
   *
   * Adjudication rule: an item needing a prescription is dropped unless the
   * cart carries one. Real rule, real cart data — no dummy random rejection.
   */
  async createOrder(
    userId: string,
    cartId: string,
    deliveryAddress: PharmacyOrder['deliveryAddress'],
  ): Promise<PharmacyOrderDocument> {
    const cart = await this.cartService.getCart(cartId, userId);
    if (cart.status !== PharmacyCartStatus.CREATED) {
      throw new BadRequestException('This cart has already been submitted');
    }
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    const items = cart.items.map((item) => {
      const needsRx = item.requiresPrescription && !cart.prescriptionFileName;
      return {
        medicineId: item.medicineId,
        name: item.name,
        requestedQuantity: item.quantity,
        price: item.price,
        retained: !needsRx,
        removedReason: needsRx ? 'Prescription required for this medicine' : undefined,
      };
    });

    const billAmount = items
      .filter((item) => item.retained)
      .reduce((sum, item) => sum + item.price * item.requestedQuantity, 0);

    let copayAmount = 0;
    let walletDebitAmount = 0;
    let excessAmount = 0;

    if (billAmount > 0) {
      const assignments = await this.assignmentsService.getUserAssignments(userId);
      const assignment = assignments?.[0];
      if (!assignment) throw new BadRequestException('No active policy assignment found for this user');

      const policyId =
        typeof assignment.policyId === 'object' && (assignment.policyId as any)._id
          ? (assignment.policyId as any)._id.toString()
          : assignment.policyId.toString();
      const planConfig = await this.planConfigService.getConfig(policyId);
      const copayConfig = CopayResolver.resolve(planConfig, assignment.relationshipId) || undefined;
      const copayCalc = CopayCalculator.calculate(billAmount, copayConfig);
      copayAmount = copayCalc.copayAmount;

      const wallet = await this.walletService.getUserWallet(userId);
      const categoryBalance =
        wallet?.categoryBalances?.find((c: any) => c.categoryCode === CATEGORY_CODE)?.current ?? 0;

      walletDebitAmount = Math.min(copayCalc.walletDebitAmount, categoryBalance);
      excessAmount = Math.max(0, copayCalc.walletDebitAmount - categoryBalance);
    }

    const totalMemberPayment = copayAmount + excessAmount;

    const order = await this.orderModel.create({
      orderId: `PHORD-${Date.now()}`,
      userId: new Types.ObjectId(userId),
      cartId: cart._id,
      patientId: cart.patientId,
      patientName: cart.patientName,
      items,
      deliveryAddress,
      status: PharmacyOrderStatus.ADJUDICATED,
      billAmount,
      copayAmount,
      walletDebitAmount,
      excessAmount,
      totalMemberPayment,
      paymentStatus: PharmacyPaymentStatus.PENDING,
      adjudicatedAt: new Date(),
    });

    cart.status = PharmacyCartStatus.ORDERED;
    cart.orderId = order._id as Types.ObjectId;
    await cart.save();

    const removedCount = items.filter((item) => !item.retained).length;
    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.CART_CREATED,
      title: 'Pharmacy Cart Ready',
      message: removedCount
        ? `Your pharmacy order is ready with ${removedCount} item(s) adjusted. Review and pay to confirm.`
        : 'Your pharmacy order is ready. Review and pay to confirm.',
      priority: NotificationPriority.MEDIUM,
      metadata: { orderId: order.orderId, removedCount },
      actionUrl: `/member/pharmacy/orders/${order.orderId}`,
    });

    return order;
  }

  async getOrder(orderId: string, userId: string): Promise<PharmacyOrderDocument> {
    const order = await this.orderModel.findOne({ orderId, userId: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getUserOrders(userId: string): Promise<PharmacyOrderDocument[]> {
    return this.orderModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  /** Step 8: settle payment against the breakdown adjudication already fixed. */
  async pay(orderId: string, userId: string): Promise<PharmacyOrderDocument> {
    const order = await this.getOrder(orderId, userId);
    if (order.status !== PharmacyOrderStatus.ADJUDICATED) {
      throw new BadRequestException('This order is not ready for payment');
    }

    if (order.walletDebitAmount > 0) {
      await this.walletService.debitWallet(
        userId,
        order.walletDebitAmount,
        CATEGORY_CODE,
        (order._id as Types.ObjectId).toString(),
        'PHARMACY',
        'Pharmacy',
        `Pharmacy order ${order.orderId}`,
      );
    }

    // Business reference (order.paymentId, PAY-...) for the member/portal to
    // navigate by; the Mongo _id (transactionPaymentId) is the only form
    // TransactionSummaryService's paymentId field accepts — passing the
    // business string there throws "Invalid paymentId" (ObjectId.isValid fails).
    let transactionPaymentId: string | undefined;
    if (order.totalMemberPayment > 0) {
      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: order.totalMemberPayment,
        paymentType: order.copayAmount > 0 ? PaymentType.COPAY : PaymentType.OUT_OF_POCKET,
        serviceType: PaymentServiceType.PHARMACY,
        serviceId: (order._id as Types.ObjectId).toString(),
        serviceReferenceId: order.orderId,
        description: `Pharmacy order ${order.orderId}`,
      });
      order.paymentId = payment.paymentId;
      transactionPaymentId = (payment._id as Types.ObjectId).toString();
    }

    order.paymentStatus =
      order.totalMemberPayment > 0 ? PharmacyPaymentStatus.PENDING : PharmacyPaymentStatus.COMPLETED;
    // Step 10: "order confirmed and sent to the partner" — there is no real
    // partner, so CONFIRMED is as far as this can honestly go.
    order.status = PharmacyOrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    await order.save();

    const transaction = await this.transactionSummaryService.createTransaction({
      userId,
      serviceType: TransactionServiceType.PHARMACY,
      serviceId: (order._id as Types.ObjectId).toString(),
      serviceReferenceId: order.orderId,
      serviceName: 'Pharmacy order',
      serviceDate: new Date(),
      totalAmount: order.billAmount,
      walletAmount: order.walletDebitAmount,
      selfPaidAmount: order.totalMemberPayment,
      copayAmount: order.copayAmount,
      paymentMethod:
        order.totalMemberPayment === 0
          ? PaymentMethod.WALLET_ONLY
          : order.copayAmount > 0
            ? PaymentMethod.COPAY
            : PaymentMethod.OUT_OF_POCKET,
      paymentId: transactionPaymentId,
      categoryCode: CATEGORY_CODE,
      categoryName: 'Pharmacy',
      description: `Pharmacy order ${order.orderId}`,
      status: order.totalMemberPayment > 0 ? TransactionStatus.PENDING_PAYMENT : TransactionStatus.COMPLETED,
    });
    order.transactionId = transaction._id as Types.ObjectId;
    return order.save();
  }

  /** Step 13: refund if the order fails after payment. */
  async cancel(orderId: string, userId: string, reason: string): Promise<PharmacyOrderDocument> {
    const order = await this.getOrder(orderId, userId);
    if (order.status === PharmacyOrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }
    if (order.status === PharmacyOrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered order');
    }

    if (order.walletDebitAmount > 0 && order.status !== PharmacyOrderStatus.ADJUDICATED) {
      await this.walletService.creditWallet(
        userId,
        order.walletDebitAmount,
        CATEGORY_CODE,
        (order._id as Types.ObjectId).toString(),
        'PHARMACY_REFUND',
        'Pharmacy',
        `Refund for cancelled order ${order.orderId}: ${reason}`,
      );
    }

    order.status = PharmacyOrderStatus.CANCELLED;
    order.paymentStatus =
      order.paymentStatus === PharmacyPaymentStatus.COMPLETED
        ? PharmacyPaymentStatus.REFUNDED
        : order.paymentStatus;
    order.cancelledAt = new Date();
    order.cancelledBy = PharmacyCancelledBy.MEMBER;
    order.cancellationReason = reason;
    return order.save();
  }

  /**
   * Step 11-12: the partner processing the order and delivering it. No real
   * partner exists, so this is the one manual ops action standing in for
   * both — see the ops controller. Generates a real invoice on completion.
   */
  async markDelivered(orderId: string): Promise<PharmacyOrderDocument> {
    const order = await this.orderModel.findOne({ orderId });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== PharmacyOrderStatus.CONFIRMED) {
      throw new BadRequestException('Only a confirmed (paid) order can be marked delivered');
    }

    const { filePath } = await this.invoiceService.generateInvoice(order);
    order.status = PharmacyOrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    order.invoiceGenerated = true;
    order.invoicePath = filePath;
    return order.save();
  }

  async getInvoicePath(orderId: string, userId: string): Promise<string> {
    const order = await this.getOrder(orderId, userId);
    if (!order.invoicePath) throw new NotFoundException('Invoice not available yet');
    return order.invoicePath;
  }
}
