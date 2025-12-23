import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentType,
  PaymentStatus,
  ServiceType,
} from './schemas/payment.schema';
import { CounterService } from '../counters/counter.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { DentalBookingsService } from '../dental-bookings/dental-bookings.service';
import { VisionBookingsService } from '../vision-bookings/vision-bookings.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    private readonly counterService: CounterService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    @Inject(forwardRef(() => DentalBookingsService))
    private readonly dentalBookingsService: DentalBookingsService,
    @Inject(forwardRef(() => VisionBookingsService))
    private readonly visionBookingsService: VisionBookingsService,
  ) {}

  /**
   * Create a payment request
   */
  async createPaymentRequest(data: {
    userId: string;
    amount: number;
    paymentType: PaymentType;
    serviceType: ServiceType;
    serviceId: string;
    serviceReferenceId: string;
    description: string;
    notes?: string;
  }): Promise<PaymentDocument> {
    console.log('🟡 [PAYMENT SERVICE] Creating payment request:', data);

    const paymentId = await this.counterService.generatePaymentId();

    const payment = new this.paymentModel({
      paymentId,
      userId: new Types.ObjectId(data.userId),
      amount: data.amount,
      paymentType: data.paymentType,
      serviceType: data.serviceType,
      serviceId: new Types.ObjectId(data.serviceId),
      serviceReferenceId: data.serviceReferenceId,
      description: data.description,
      notes: data.notes,
      status: PaymentStatus.PENDING,
      paymentMethod: 'DUMMY_GATEWAY',
      isActive: true,
    });

    console.log('🔍 [PAYMENT SERVICE] Payment object before save:', {
      paymentId,
      status: payment.status,
      amount: payment.amount,
      paymentType: payment.paymentType,
    });

    const saved = await payment.save();

    console.log('✅ [PAYMENT SERVICE] Payment request created and saved:', {
      paymentId: saved.paymentId,
      status: saved.status,
      amount: saved.amount,
      type: saved.paymentType,
      _id: saved._id,
    });

    return saved;
  }

  /**
   * Mark payment as paid (dummy gateway)
   */
  async markAsPaid(
    paymentId: string,
    userId: string,
  ): Promise<PaymentDocument> {
    console.log('🟡 [PAYMENT SERVICE] Marking payment as paid:', {
      paymentId,
      userId,
    });

    const payment = await this.paymentModel.findOne({ paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify user owns this payment
    if (payment.userId.toString() !== userId) {
      throw new BadRequestException(
        'You are not authorized to complete this payment',
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('Payment was cancelled');
    }

    // Mark as completed
    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.markedAsPaidBy = new Types.ObjectId(userId);
    payment.transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const updated = await payment.save();

    console.log('✅ [PAYMENT SERVICE] Payment marked as paid:', {
      paymentId,
      transactionId: payment.transactionId,
      serviceType: payment.serviceType,
      serviceId: payment.serviceId,
    });

    // If this is an appointment payment, confirm the appointment
    if (payment.serviceType === ServiceType.APPOINTMENT && payment.serviceId) {
      console.log('🔔 [PAYMENT SERVICE] Triggering appointment confirmation for:', payment.serviceId.toString());
      try {
        await this.appointmentsService.confirmAppointmentAfterPayment(
          payment.serviceId.toString(),
          payment.transactionId,
        );
        console.log('✅ [PAYMENT SERVICE] Appointment confirmed successfully');
      } catch (error) {
        console.error('❌ [PAYMENT SERVICE] Failed to confirm appointment:', error);
        // Don't throw error - payment is already marked as paid
        // Log the error and continue
      }
    }

    // If this is a dental booking payment, confirm the booking
    if (payment.serviceType === ServiceType.DENTAL && payment._id) {
      console.log('🦷 [PAYMENT SERVICE] Triggering dental booking confirmation for payment:', payment._id.toString());
      try {
        await this.dentalBookingsService.handlePaymentComplete(payment._id.toString());
        console.log('✅ [PAYMENT SERVICE] Dental booking confirmed successfully');
      } catch (error) {
        console.error('❌ [PAYMENT SERVICE] Failed to confirm dental booking:', error);
        // Don't throw error - payment is already marked as paid
        // Log the error and continue
      }
    }

    // If this is a vision booking payment, confirm the booking
    if (payment.serviceType === ServiceType.VISION && payment._id) {
      console.log('👁️ [PAYMENT SERVICE] Triggering vision booking confirmation for payment:', payment._id.toString());
      try {
        await this.visionBookingsService.handlePaymentComplete(payment);
        console.log('✅ [PAYMENT SERVICE] Vision booking confirmed successfully');
      } catch (error) {
        console.error('❌ [PAYMENT SERVICE] Failed to confirm vision booking:', error);
        // Don't throw error - payment is already marked as paid
        // Log the error and continue
      }
    }

    return updated;
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(
    paymentId: string,
    userId: string,
    reason?: string,
  ): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId.toString() !== userId) {
      throw new BadRequestException(
        'You are not authorized to cancel this payment',
      );
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed payment');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('Payment already cancelled');
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.failureReason = reason || 'Cancelled by user';

    return payment.save();
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<PaymentDocument> {
    console.log('🔍 [PAYMENT SERVICE] Fetching payment:', paymentId);

    const payment = await this.paymentModel.findOne({ paymentId }).lean();

    if (!payment) {
      console.log('❌ [PAYMENT SERVICE] Payment not found:', paymentId);
      throw new NotFoundException('Payment not found');
    }

    console.log('✅ [PAYMENT SERVICE] Payment found:', {
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      paymentType: payment.paymentType,
      createdAt: (payment as any).createdAt,
      paidAt: (payment as any).paidAt,
    });

    return payment as PaymentDocument;
  }

  /**
   * Get payment by service (appointment or claim)
   */
  async getPaymentByService(
    serviceType: ServiceType,
    serviceId: string,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOne({
        serviceType,
        serviceId: new Types.ObjectId(serviceId),
      })
      .lean()
      .exec();
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(
    userId: string,
    filters?: {
      status?: PaymentStatus;
      serviceType?: ServiceType;
      limit?: number;
      skip?: number;
    },
  ): Promise<{ payments: PaymentDocument[]; total: number }> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.serviceType) {
      query.serviceType = filters.serviceType;
    }

    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return {
      payments: payments as PaymentDocument[],
      total,
    };
  }

  /**
   * Get payment summary for user
   */
  async getPaymentSummary(userId: string): Promise<{
    totalPaid: number;
    totalPending: number;
    completedCount: number;
    pendingCount: number;
  }> {
    const result = await this.paymentModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      totalPaid: 0,
      totalPending: 0,
      completedCount: 0,
      pendingCount: 0,
    };

    result.forEach((item) => {
      if (item._id === PaymentStatus.COMPLETED) {
        summary.totalPaid = item.total;
        summary.completedCount = item.count;
      } else if (item._id === PaymentStatus.PENDING) {
        summary.totalPending = item.total;
        summary.pendingCount = item.count;
      }
    });

    return summary;
  }
}
