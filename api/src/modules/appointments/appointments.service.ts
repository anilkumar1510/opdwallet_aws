import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument, AppointmentStatus } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CounterService } from '../counters/counter.service';
import { WalletService } from '../wallet/wallet.service';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { PaymentService } from '../payments/payment.service';
import { TransactionSummaryService } from '../transactions/transaction-summary.service';
import { CopayCalculator } from '../plan-config/utils/copay-calculator';
import { PaymentType, ServiceType as PaymentServiceType } from '../payments/schemas/payment.schema';
import { TransactionServiceType, PaymentMethod, TransactionStatus } from '../transactions/schemas/transaction-summary.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private readonly counterService: CounterService,
    private readonly walletService: WalletService,
    private readonly planConfigService: PlanConfigService,
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionSummaryService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<any> {
    const appointmentId = await this.counterService.generateAppointmentId();
    const consultationFee = createAppointmentDto.consultationFee || 0;
    const userId = createAppointmentDto.userId;
    const patientId = createAppointmentDto.patientId;

    // Validate userId is provided
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Validate patientId is provided
    if (!patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    console.log('💰 [APPOINTMENTS SERVICE] Starting appointment with copay/payment logic');
    console.log('💰 [APPOINTMENTS SERVICE] Consultation fee:', consultationFee);

    // Use patientId for wallet and policy operations
    const walletUserId = patientId;

    // Step 1: Get policy config and copay settings
    let copayCalculation = null;
    let policyId = null;

    try {
      // Fetch user's assignment to get policyId
      const assignment = await (this.walletService as any)['assignmentModel']
        .findOne({ memberId: patientId })
        .populate('policyId')
        .lean()
        .exec();

      if (assignment && assignment.policyId) {
        policyId = assignment.policyId._id || assignment.policyId;
        console.log('💰 [APPOINTMENTS SERVICE] Found policyId:', policyId);

        // Fetch plan config
        const planConfig = await this.planConfigService.getConfig(policyId.toString());

        if (planConfig && planConfig.benefits && (planConfig.benefits as any)['CAT001']) {
          const consultBenefit = (planConfig.benefits as any)['CAT001'];
          const copayConfig = consultBenefit.copay;

          if (copayConfig && consultBenefit.enabled) {
            console.log('💰 [APPOINTMENTS SERVICE] Copay config found:', copayConfig);
            copayCalculation = CopayCalculator.calculate(consultationFee, copayConfig);
            console.log('💰 [APPOINTMENTS SERVICE] Copay calculation:', copayCalculation);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ [APPOINTMENTS SERVICE] Could not fetch policy/copay config:', error.message);
      // Continue without copay if config fetch fails
    }

    // Step 2: Determine payment breakdown
    const copayAmount = copayCalculation ? copayCalculation.copayAmount : 0;
    const walletDebitAmount = copayCalculation ? copayCalculation.walletDebitAmount : consultationFee;

    console.log('💰 [APPOINTMENTS SERVICE] Payment breakdown:');
    console.log('  - Total fee: ₹' + consultationFee);
    console.log('  - Wallet debit: ₹' + walletDebitAmount);
    console.log('  - Copay (member pays): ₹' + copayAmount);

    // Step 3: Check wallet balance
    let hasSufficientBalance = false;
    let availableBalance = 0;

    if (walletDebitAmount > 0) {
      try {
        const balanceCheck = await this.walletService.checkSufficientBalance(
          walletUserId,
          walletDebitAmount,
          'CAT001'
        );
        hasSufficientBalance = balanceCheck.hasSufficient;
        availableBalance = balanceCheck.categoryBalance || 0;
        console.log('💰 [APPOINTMENTS SERVICE] Balance check:', {
          required: walletDebitAmount,
          available: availableBalance,
          sufficient: hasSufficientBalance,
        });
      } catch (error) {
        console.error('❌ [APPOINTMENTS SERVICE] Balance check failed:', error.message);
      }
    } else {
      hasSufficientBalance = true; // No wallet debit needed
    }

    // Step 4: Determine appointment status and create appointment document
    let appointmentStatus = AppointmentStatus.PENDING_CONFIRMATION;
    let paymentRequired = false;
    let paymentId = null;
    let transactionId = null;

    // Scenario A: Insufficient wallet balance - need to collect full/partial payment upfront
    if (!hasSufficientBalance && walletDebitAmount > 0) {
      console.log('💰 [APPOINTMENTS SERVICE] Insufficient balance - payment required before appointment');
      appointmentStatus = AppointmentStatus.PENDING_PAYMENT;
      paymentRequired = true;
    }

    // Scenario B: Sufficient wallet balance but has copay - debit wallet now, collect copay after
    else if (hasSufficientBalance && copayAmount > 0) {
      console.log('💰 [APPOINTMENTS SERVICE] Sufficient balance + copay - will debit wallet and create copay payment');
      paymentRequired = true; // For copay collection
    }

    // Scenario C: Sufficient balance, no copay - proceed normally
    else {
      console.log('💰 [APPOINTMENTS SERVICE] Sufficient balance, no copay - normal flow');
    }

    // Create appointment document FIRST (so we have the _id for payment)
    const appointmentData = {
      ...createAppointmentDto,
      appointmentId,
      appointmentNumber: appointmentId.replace('APT', ''),
      userId: new Types.ObjectId(createAppointmentDto.userId),
      status: appointmentStatus,
      requestedAt: new Date(),
      slotId: createAppointmentDto.slotId,
      doctorName: createAppointmentDto.doctorName || '',
      specialty: createAppointmentDto.specialty || '',
      clinicId: createAppointmentDto.clinicId || '',
      clinicName: createAppointmentDto.clinicName || '',
      clinicAddress: createAppointmentDto.clinicAddress || '',
      consultationFee: consultationFee,
      copayAmount: copayAmount,
      walletDebitAmount: walletDebitAmount,
      paymentId: null, // Will be set after payment creation
    };

    const appointment = new this.appointmentModel(appointmentData);
    const saved = await appointment.save();

    // Now create payment if needed (using saved._id)
    if (!hasSufficientBalance && walletDebitAmount > 0) {
      const shortfall = walletDebitAmount - availableBalance;
      const paymentAmount = shortfall + copayAmount;

      // Create payment request using the saved appointment's MongoDB _id
      const payment = await this.paymentService.createPaymentRequest({
        userId: walletUserId,
        amount: paymentAmount,
        paymentType: copayAmount > 0 ? PaymentType.COPAY : PaymentType.OUT_OF_POCKET,
        serviceType: PaymentServiceType.APPOINTMENT,
        serviceId: (saved._id as Types.ObjectId).toString(),
        serviceReferenceId: appointmentId,
        description: `Payment for appointment with ${createAppointmentDto.doctorName || 'Doctor'}`,
      });

      paymentId = payment.paymentId;
      saved.paymentId = paymentId;
      await saved.save();
      console.log('💰 [APPOINTMENTS SERVICE] Payment request created:', paymentId);
    }

    // Step 5: Handle wallet debit and payment/transaction creation based on scenario
    try {
      // Scenario A: Insufficient balance - no wallet debit yet, transaction in PENDING status
      if (!hasSufficientBalance && walletDebitAmount > 0) {
        const transaction = await this.transactionService.createTransaction({
          userId: walletUserId,
          serviceType: TransactionServiceType.APPOINTMENT,
          serviceId: (saved._id as Types.ObjectId).toString(),
          serviceReferenceId: appointmentId,
          serviceName: `Consultation - ${createAppointmentDto.doctorName || 'Doctor'}`,
          serviceDate: new Date(createAppointmentDto.appointmentDate),
          totalAmount: consultationFee,
          walletAmount: 0, // Not debited yet
          selfPaidAmount: consultationFee,
          copayAmount: copayAmount,
          paymentMethod: copayAmount > 0 ? PaymentMethod.COPAY : PaymentMethod.OUT_OF_POCKET,
          paymentId: paymentId || undefined,
          status: TransactionStatus.PENDING_PAYMENT,
        });

        transactionId = transaction.transactionId;
        saved.transactionId = transactionId;
        await saved.save();

        console.log('✅ [APPOINTMENTS SERVICE] Appointment created with PENDING_PAYMENT status');
      }

      // Scenario B: Sufficient balance + copay - debit wallet now, create copay payment
      else if (hasSufficientBalance && copayAmount > 0) {
        // Debit wallet
        await this.walletService.debitWallet(
          walletUserId,
          walletDebitAmount,
          'CAT001',
          (saved._id as Types.ObjectId).toString(),
          'CONSULTATION',
          createAppointmentDto.doctorName || 'Doctor',
          `Consultation fee (wallet portion) - ${createAppointmentDto.doctorName || 'Doctor'}`
        );

        console.log('✅ [APPOINTMENTS SERVICE] Wallet debited: ₹' + walletDebitAmount);

        // Create copay payment request
        const copayPayment = await this.paymentService.createPaymentRequest({
          userId: walletUserId,
          amount: copayAmount,
          paymentType: PaymentType.COPAY,
          serviceType: PaymentServiceType.APPOINTMENT,
          serviceId: (saved._id as Types.ObjectId).toString(),
          serviceReferenceId: appointmentId,
          description: `Copay for appointment with ${createAppointmentDto.doctorName || 'Doctor'}`,
        });

        paymentId = copayPayment.paymentId;
        saved.paymentId = paymentId;
        await saved.save();

        // Create transaction summary
        const transaction = await this.transactionService.createTransaction({
          userId: walletUserId,
          serviceType: TransactionServiceType.APPOINTMENT,
          serviceId: (saved._id as Types.ObjectId).toString(),
          serviceReferenceId: appointmentId,
          serviceName: `Consultation - ${createAppointmentDto.doctorName || 'Doctor'}`,
          serviceDate: new Date(createAppointmentDto.appointmentDate),
          totalAmount: consultationFee,
          walletAmount: walletDebitAmount,
          selfPaidAmount: copayAmount,
          copayAmount: copayAmount,
          paymentMethod: PaymentMethod.COPAY,
          paymentId: paymentId,
          status: TransactionStatus.PENDING_PAYMENT,
        });

        transactionId = transaction.transactionId;
        saved.transactionId = transactionId;
        await saved.save();

        console.log('✅ [APPOINTMENTS SERVICE] Copay payment created:', paymentId);
      }

      // Scenario C: Sufficient balance, no copay - debit wallet, create completed transaction
      else if (walletDebitAmount > 0) {
        await this.walletService.debitWallet(
          walletUserId,
          walletDebitAmount,
          'CAT001',
          (saved._id as Types.ObjectId).toString(),
          'CONSULTATION',
          createAppointmentDto.doctorName || 'Doctor',
          `Consultation fee - ${createAppointmentDto.doctorName || 'Doctor'}`
        );

        console.log('✅ [APPOINTMENTS SERVICE] Wallet debited: ₹' + walletDebitAmount);

        // Create completed transaction
        const transaction = await this.transactionService.createTransaction({
          userId: walletUserId,
          serviceType: TransactionServiceType.APPOINTMENT,
          serviceId: (saved._id as Types.ObjectId).toString(),
          serviceReferenceId: appointmentId,
          serviceName: `Consultation - ${createAppointmentDto.doctorName || 'Doctor'}`,
          serviceDate: new Date(createAppointmentDto.appointmentDate),
          totalAmount: consultationFee,
          walletAmount: walletDebitAmount,
          selfPaidAmount: 0,
          copayAmount: 0,
          paymentMethod: PaymentMethod.WALLET_ONLY,
          status: TransactionStatus.COMPLETED,
        });

        transactionId = transaction.transactionId;
        saved.transactionId = transactionId;
        await saved.save();

        console.log('✅ [APPOINTMENTS SERVICE] Transaction completed');
      }
    } catch (error) {
      console.error('❌ [APPOINTMENTS SERVICE] Payment/transaction failed, rolling back:', error);
      await this.appointmentModel.deleteOne({ _id: saved._id });
      throw new BadRequestException('Failed to process payment: ' + error.message);
    }

    // Return appointment with payment info
    return {
      appointment: saved,
      paymentRequired,
      paymentId,
      transactionId,
      copayAmount,
      walletDebitAmount,
    };
  }

  async getUserAppointments(userId: string, appointmentType?: string): Promise<Appointment[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (appointmentType) {
      filter.appointmentType = appointmentType;
    }

    // PERFORMANCE: Add field projection for list views, include prescription fields
    return this.appointmentModel
      .find(filter)
      .select('appointmentId appointmentNumber doctorName specialty appointmentDate timeSlot status appointmentType consultationFee createdAt clinicName clinicAddress patientName patientId hasPrescription prescriptionId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getOngoingAppointments(userId: string): Promise<Appointment[]> {
    // PERFORMANCE: Return only the next active appointment for nudge/widget display
    // Logic: Show PENDING/CONFIRMED upcoming appointments OR recent COMPLETED with prescription
    const today = new Date().toISOString().split('T')[0];

    const appointment = await this.appointmentModel
      .findOne({
        userId: new Types.ObjectId(userId),
        $or: [
          // Upcoming appointments (not completed or cancelled)
          {
            status: { $in: [AppointmentStatus.PENDING_CONFIRMATION, AppointmentStatus.CONFIRMED] },
            appointmentDate: { $gte: today },
          },
          // Recent completed appointments with prescription (show "View Prescription" CTA)
          {
            status: AppointmentStatus.COMPLETED,
            hasPrescription: true,
            appointmentDate: { $gte: today },
          },
        ],
      })
      .select('appointmentId appointmentNumber doctorName specialty appointmentDate timeSlot status appointmentType clinicName hasPrescription prescriptionId')
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .lean()
      .exec();

    return appointment ? [appointment] : [];
  }

  async findOne(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentModel.findOne({ appointmentId }).lean().exec();
  }

  async findAll(query: any): Promise<{ data: Appointment[]; total: number; page: number; pages: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.doctorId) {
      filter.doctorId = query.doctorId;
    }

    if (query.specialtyId || query.specialty) {
      filter.specialty = query.specialtyId || query.specialty;
    }

    if (query.type) {
      filter.appointmentType = query.type;
    }

    const today = new Date().toISOString().split('T')[0];

    if (query.dateFrom) {
      filter.appointmentDate = { $gte: query.dateFrom };
    } else if (!query.includeOld) {
      filter.appointmentDate = { $gte: today };
    }

    if (query.dateTo) {
      filter.appointmentDate = filter.appointmentDate || {};
      filter.appointmentDate.$lte = query.dateTo;
    }

    const [appointments, total] = await Promise.all([
      this.appointmentModel
        .find(filter)
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.appointmentModel.countDocuments(filter),
    ]);

    return {
      data: appointments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException('Only pending appointments can be confirmed');
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();
    await appointment.save();

    return appointment;
  }

  async cancelAppointment(appointmentId: string, _reason?: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    // Check if appointment time has passed
    const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.timeSlot}`);
    const now = new Date();

    if (appointmentDateTime <= now) {
      throw new BadRequestException('Cannot cancel past appointments');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = 'OPS';
    await appointment.save();

    // Refund wallet if there was a consultation fee (same as user cancellation)
    // Use patientId for refund since that's whose wallet was debited
    if (appointment.consultationFee > 0) {
      try {
        console.log('🟡 [APPOINTMENTS SERVICE] OPS cancelling - Refunding wallet for cancelled appointment:', {
          appointmentId,
          amount: appointment.consultationFee,
          patientId: appointment.patientId
        });

        await this.walletService.creditWallet(
          appointment.patientId,
          appointment.consultationFee,
          'CAT001', // Consult category
          (appointment._id as any).toString(),
          'CONSULTATION_REFUND',
          appointment.doctorName || 'Doctor',
          `Refund for cancelled appointment - ${appointment.doctorName || 'Doctor'} - ${appointment.appointmentType || 'Appointment'}`
        );

        console.log('✅ [APPOINTMENTS SERVICE] Wallet refunded successfully');
      } catch (walletError) {
        console.error('❌ [APPOINTMENTS SERVICE] Failed to refund wallet:', walletError);
        // Continue even if refund fails, appointment is already cancelled
      }
    }

    return appointment;
  }

  async userCancelAppointment(appointmentId: string, userId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify the appointment belongs to this user
    if (appointment.userId.toString() !== userId) {
      throw new BadRequestException('You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    // Check if appointment time has passed
    const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.timeSlot}`);
    const now = new Date();

    if (appointmentDateTime <= now) {
      throw new BadRequestException('Cannot cancel past appointments. The appointment time has already passed.');
    }

    // Cancel the appointment
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = 'USER';
    await appointment.save();

    // Refund wallet if there was a consultation fee
    // Use patientId for refund since that's whose wallet was debited
    if (appointment.consultationFee > 0) {
      try {
        console.log('🟡 [APPOINTMENTS SERVICE] Refunding wallet for cancelled appointment:', {
          appointmentId,
          amount: appointment.consultationFee,
          patientId: appointment.patientId
        });

        await this.walletService.creditWallet(
          appointment.patientId,
          appointment.consultationFee,
          'CAT001', // Consult category
          (appointment._id as any).toString(),
          'CONSULTATION_REFUND',
          appointment.doctorName || 'Doctor',
          `Refund for cancelled appointment - ${appointment.doctorName || 'Doctor'} - ${appointment.appointmentType || 'Appointment'}`
        );

        console.log('✅ [APPOINTMENTS SERVICE] Wallet refunded successfully');
      } catch (walletError) {
        console.error('❌ [APPOINTMENTS SERVICE] Failed to refund wallet:', walletError);
        // Continue even if refund fails, appointment is already cancelled
      }
    }

    return appointment;
  }

  async confirmAppointmentAfterPayment(appointmentId: string, paymentId: string): Promise<Appointment> {
    console.log('💰 [APPOINTMENTS SERVICE] Confirming appointment after payment');
    console.log('  - appointmentId:', appointmentId);
    console.log('  - paymentId:', paymentId);

    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Only appointments with PENDING_PAYMENT status can be confirmed after payment');
    }

    // Verify payment is completed
    const payment = await this.paymentService.getPayment(paymentId);
    if (!payment || payment.status !== 'COMPLETED') {
      throw new BadRequestException('Payment is not completed');
    }

    // Update appointment status
    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();
    await appointment.save();

    // Update transaction status to COMPLETED
    if (appointment.transactionId) {
      try {
        await this.transactionService.updateTransactionStatus(
          appointment.transactionId,
          TransactionStatus.COMPLETED
        );
        console.log('✅ [APPOINTMENTS SERVICE] Transaction status updated to COMPLETED');
      } catch (error) {
        console.error('❌ [APPOINTMENTS SERVICE] Failed to update transaction status:', error);
      }
    }

    console.log('✅ [APPOINTMENTS SERVICE] Appointment confirmed after payment');
    return appointment;
  }
}