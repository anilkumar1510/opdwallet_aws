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
    console.log('🚀 [APPOINTMENTS SERVICE] ========== APPOINTMENT CREATION START ==========');
    console.log('📥 [INPUT] Complete appointment DTO:', JSON.stringify(createAppointmentDto, null, 2));

    const appointmentId = await this.counterService.generateAppointmentId();
    console.log('🆔 [GENERATED] Appointment ID:', appointmentId);

    const consultationFee = createAppointmentDto.consultationFee || 0;
    const userId = createAppointmentDto.userId;
    const patientId = createAppointmentDto.patientId;

    console.log('👤 [USER INFO] userId:', userId);
    console.log('👤 [USER INFO] patientId:', patientId);
    console.log('💰 [FEE] Consultation fee:', consultationFee);

    // Validate userId is provided
    if (!userId) {
      console.error('❌ [VALIDATION ERROR] User ID is missing');
      throw new BadRequestException('User ID is required');
    }

    // Validate patientId is provided
    if (!patientId) {
      console.error('❌ [VALIDATION ERROR] Patient ID is missing');
      throw new BadRequestException('Patient ID is required');
    }

    console.log('💰 [APPOINTMENTS SERVICE] Starting appointment with copay/payment logic');
    console.log('💰 [APPOINTMENTS SERVICE] Consultation fee:', consultationFee);

    // Use patientId for wallet and policy operations
    const walletUserId = patientId;

    // Step 1: Get policy config and copay settings
    console.log('📋 [STEP 1] Fetching policy config and copay settings...');
    let copayCalculation = null;
    let policyId = null;

    try {
      console.log('🔍 [POLICY] Searching for assignment with memberId:', patientId);
      // Fetch user's assignment to get policyId
      const assignment = await (this.walletService as any)['assignmentModel']
        .findOne({ memberId: patientId })
        .populate('policyId')
        .lean()
        .exec();

      console.log('📄 [POLICY] Assignment found:', assignment ? 'YES' : 'NO');
      if (assignment) {
        console.log('📄 [POLICY] Assignment details:', JSON.stringify(assignment, null, 2));
      }

      if (assignment && assignment.policyId) {
        policyId = assignment.policyId._id || assignment.policyId;
        console.log('✅ [POLICY] Found policyId:', policyId);

        // Fetch plan config
        console.log('🔍 [POLICY] Fetching plan config for policyId:', policyId.toString());
        const planConfig = await this.planConfigService.getConfig(policyId.toString());
        console.log('📄 [POLICY] Plan config retrieved:', planConfig ? 'YES' : 'NO');

        if (planConfig && planConfig.benefits && (planConfig.benefits as any)['CAT001']) {
          const consultBenefit = (planConfig.benefits as any)['CAT001'];
          const copayConfig = consultBenefit.copay;

          console.log('📄 [COPAY] Consult benefit found:', JSON.stringify(consultBenefit, null, 2));
          console.log('📄 [COPAY] Copay config:', JSON.stringify(copayConfig, null, 2));

          if (copayConfig && consultBenefit.enabled) {
            console.log('💰 [COPAY] Calculating copay for fee:', consultationFee);
            copayCalculation = CopayCalculator.calculate(consultationFee, copayConfig);
            console.log('✅ [COPAY] Copay calculation result:', JSON.stringify(copayCalculation, null, 2));
          } else {
            console.log('⚠️ [COPAY] Copay not applicable - config missing or benefit disabled');
          }
        } else {
          console.log('⚠️ [POLICY] No consultation benefit (CAT001) found in plan config');
        }
      } else {
        console.log('⚠️ [POLICY] No assignment or policyId found for member');
      }
    } catch (error) {
      console.error('❌ [POLICY ERROR] Failed to fetch policy/copay config:', error);
      console.error('❌ [POLICY ERROR] Error stack:', error.stack);
      // Continue without copay if config fetch fails
    }

    // Step 2: Determine payment breakdown
    console.log('📋 [STEP 2] Determining payment breakdown...');
    const copayAmount = copayCalculation ? copayCalculation.copayAmount : 0;
    const walletDebitAmount = copayCalculation ? copayCalculation.walletDebitAmount : consultationFee;

    console.log('💰 [PAYMENT BREAKDOWN] ================');
    console.log('💰 [PAYMENT] Total consultation fee: ₹' + consultationFee);
    console.log('💰 [PAYMENT] Wallet debit amount: ₹' + walletDebitAmount);
    console.log('💰 [PAYMENT] Copay amount (member pays): ₹' + copayAmount);
    console.log('💰 [PAYMENT BREAKDOWN] ================');

    // Step 3: Check wallet balance
    console.log('📋 [STEP 3] Checking wallet balance...');
    let hasSufficientBalance = false;
    let availableBalance = 0;

    if (walletDebitAmount > 0) {
      try {
        console.log('🔍 [WALLET] Checking balance for userId:', walletUserId);
        console.log('🔍 [WALLET] Required amount:', walletDebitAmount);
        console.log('🔍 [WALLET] Category: CAT001');

        const balanceCheck = await this.walletService.checkSufficientBalance(
          walletUserId,
          walletDebitAmount,
          'CAT001'
        );

        hasSufficientBalance = balanceCheck.hasSufficient;
        availableBalance = balanceCheck.categoryBalance || 0;

        console.log('✅ [WALLET] Balance check result:', {
          required: walletDebitAmount,
          available: availableBalance,
          sufficient: hasSufficientBalance,
        });
      } catch (error) {
        console.error('❌ [WALLET ERROR] Balance check failed:', error);
        console.error('❌ [WALLET ERROR] Error stack:', error.stack);
      }
    } else {
      hasSufficientBalance = true; // No wallet debit needed
      console.log('✅ [WALLET] No wallet debit needed, marking as sufficient');
    }

    // Step 4: Determine appointment status and create appointment document
    console.log('📋 [STEP 4] Determining appointment status and scenario...');
    let appointmentStatus = AppointmentStatus.PENDING_CONFIRMATION;
    let paymentRequired = false;
    let paymentId = null;
    let paymentMongoId = null; // MongoDB _id of the payment document
    let transactionId = null;

    // Scenario A: Insufficient wallet balance - need to collect full/partial payment upfront
    if (!hasSufficientBalance && walletDebitAmount > 0) {
      console.log('🔴 [SCENARIO A] Insufficient balance - payment required before appointment');
      console.log('🔴 [SCENARIO A] Shortfall: ₹' + (walletDebitAmount - availableBalance));
      appointmentStatus = AppointmentStatus.PENDING_PAYMENT;
      paymentRequired = true;
    }

    // Scenario B: Sufficient wallet balance but has copay - debit wallet now, collect copay after
    else if (hasSufficientBalance && copayAmount > 0) {
      console.log('🟡 [SCENARIO B] Sufficient balance + copay - will debit wallet and create copay payment');
      paymentRequired = true; // For copay collection
    }

    // Scenario C: Sufficient balance, no copay - proceed normally
    else {
      console.log('🟢 [SCENARIO C] Sufficient balance, no copay - normal flow');
    }

    // Create appointment document FIRST (so we have the _id for payment)
    console.log('📝 [APPOINTMENT] Creating appointment document...');
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

    console.log('📝 [APPOINTMENT] Appointment data prepared:', JSON.stringify(appointmentData, null, 2));

    const appointment = new this.appointmentModel(appointmentData);
    const saved = await appointment.save();

    console.log('✅ [APPOINTMENT] Appointment document created successfully');
    console.log('🆔 [APPOINTMENT] MongoDB _id:', saved._id);
    console.log('🆔 [APPOINTMENT] MongoDB _id type:', typeof saved._id);
    console.log('🆔 [APPOINTMENT] MongoDB _id toString:', (saved._id as Types.ObjectId).toString());
    console.log('🆔 [APPOINTMENT] appointmentId:', appointmentId);

    // Now create payment if needed (using saved._id)
    if (!hasSufficientBalance && walletDebitAmount > 0) {
      console.log('💳 [PAYMENT] Creating payment request for insufficient balance scenario...');
      const shortfall = walletDebitAmount - availableBalance;
      const paymentAmount = shortfall + copayAmount;

      console.log('💳 [PAYMENT] Payment calculation:');
      console.log('  - Shortfall: ₹' + shortfall);
      console.log('  - Copay amount: ₹' + copayAmount);
      console.log('  - Total payment amount: ₹' + paymentAmount);

      console.log('🔍 [PAYMENT] Preparing payment request data:');
      console.log('  - userId (walletUserId):', walletUserId);
      console.log('  - amount:', paymentAmount);
      console.log('  - paymentType:', copayAmount > 0 ? 'COPAY' : 'OUT_OF_POCKET');
      console.log('  - serviceType:', PaymentServiceType.APPOINTMENT);
      console.log('  - serviceId (MongoDB _id):', (saved._id as Types.ObjectId).toString());
      console.log('  - serviceId type:', typeof (saved._id as Types.ObjectId).toString());
      console.log('  - serviceReferenceId (appointmentId):', appointmentId);

      try {
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
        paymentMongoId = (payment._id as Types.ObjectId).toString();
        saved.paymentId = paymentId;
        await saved.save();

        console.log('✅ [PAYMENT] Payment request created successfully');
        console.log('💳 [PAYMENT] Payment ID (string):', paymentId);
        console.log('💳 [PAYMENT] Payment MongoDB _id:', paymentMongoId);
        console.log('💳 [PAYMENT] Payment object:', JSON.stringify(payment, null, 2));
      } catch (error) {
        console.error('❌ [PAYMENT ERROR] Failed to create payment request:', error);
        console.error('❌ [PAYMENT ERROR] Error message:', error.message);
        console.error('❌ [PAYMENT ERROR] Error stack:', error.stack);
        throw error; // Re-throw to be caught by outer try-catch
      }
    }

    // Step 5: Handle wallet debit and payment/transaction creation based on scenario
    console.log('📋 [STEP 5] Handling wallet debit and transaction creation...');
    try {
      // Scenario A: Insufficient balance - USE available wallet, then ask for shortfall
      if (!hasSufficientBalance && walletDebitAmount > 0) {
        console.log('🔴 [SCENARIO A] Insufficient balance - using available wallet + requesting shortfall');

        const useWallet = createAppointmentDto.useWallet !== false; // Default true
        const walletAmountToUse = useWallet ? availableBalance : 0;
        const shortfall = walletDebitAmount - walletAmountToUse;

        console.log('💰 [SCENARIO A] Payment calculation:');
        console.log('  - Total required:', walletDebitAmount);
        console.log('  - Available in wallet:', availableBalance);
        console.log('  - Will use from wallet:', walletAmountToUse);
        console.log('  - Shortfall (user pays):', shortfall);
        console.log('  - Use wallet flag:', useWallet);

        // Step 1: Debit available wallet balance if user opted in
        if (useWallet && walletAmountToUse > 0) {
          console.log('💳 [SCENARIO A] Debiting ₹' + walletAmountToUse + ' from wallet...');

          await this.walletService.debitWallet(
            walletUserId,
            walletAmountToUse,
            'CAT001',
            (saved._id as Types.ObjectId).toString(),
            'CONSULTATION',
            createAppointmentDto.doctorName || 'Doctor',
            `Consultation fee (partial payment from wallet) - ${createAppointmentDto.doctorName || 'Doctor'}`
          );

          console.log('✅ [SCENARIO A] Wallet debited: ₹' + walletAmountToUse);
        }

        // Step 2: Create transaction with accurate breakdown
        console.log('📄 [SCENARIO A] Creating transaction summary...');
        console.log('🔍 [TRANSACTION] Using payment MongoDB _id:', paymentMongoId);

        const transactionData = {
          userId: walletUserId,
          serviceType: TransactionServiceType.APPOINTMENT,
          serviceId: (saved._id as Types.ObjectId).toString(),
          serviceReferenceId: appointmentId,
          serviceName: `Consultation - ${createAppointmentDto.doctorName || 'Doctor'}`,
          serviceDate: new Date(createAppointmentDto.appointmentDate),
          totalAmount: consultationFee,
          walletAmount: walletAmountToUse, // ✅ What was actually used
          selfPaidAmount: shortfall + copayAmount, // ✅ What user needs to pay
          copayAmount: copayAmount,
          paymentMethod: (shortfall + copayAmount) > 0
            ? (copayAmount > 0 ? PaymentMethod.COPAY : PaymentMethod.PARTIAL)
            : PaymentMethod.WALLET_ONLY,
          paymentId: paymentMongoId || undefined,
          status: (shortfall + copayAmount) > 0
            ? TransactionStatus.PENDING_PAYMENT
            : TransactionStatus.COMPLETED,
        };

        console.log('📄 [TRANSACTION] Transaction data:', JSON.stringify(transactionData, null, 2));

        const transaction = await this.transactionService.createTransaction(transactionData);

        transactionId = transaction.transactionId;
        saved.transactionId = transactionId;

        // Update appointment status if fully covered by wallet
        if ((shortfall + copayAmount) === 0) {
          saved.status = AppointmentStatus.CONFIRMED;
          saved.confirmedAt = new Date();
          console.log('✅ [SCENARIO A] Fully covered by wallet - appointment confirmed');
        }

        await saved.save();

        console.log('✅ [TRANSACTION] Transaction created:', transactionId);
        console.log('✅ [SCENARIO A] Completed - wallet used: ₹' + walletAmountToUse + ', user pays: ₹' + (shortfall + copayAmount));
      }

      // Scenario B: Sufficient balance + copay - debit wallet now, create copay payment
      else if (hasSufficientBalance && copayAmount > 0) {
        console.log('🟡 [SCENARIO B] Processing wallet debit + copay payment...');

        // Debit wallet
        console.log('💰 [WALLET DEBIT] Debiting wallet:', {
          userId: walletUserId,
          amount: walletDebitAmount,
          category: 'CAT001',
          referenceId: (saved._id as Types.ObjectId).toString(),
        });

        await this.walletService.debitWallet(
          walletUserId,
          walletDebitAmount,
          'CAT001',
          (saved._id as Types.ObjectId).toString(),
          'CONSULTATION',
          createAppointmentDto.doctorName || 'Doctor',
          `Consultation fee (wallet portion) - ${createAppointmentDto.doctorName || 'Doctor'}`
        );

        console.log('✅ [WALLET DEBIT] Wallet debited successfully: ₹' + walletDebitAmount);

        // Create copay payment request
        console.log('💳 [COPAY PAYMENT] Creating copay payment request...');
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
        paymentMongoId = (copayPayment._id as Types.ObjectId).toString();
        saved.paymentId = paymentId;
        await saved.save();

        console.log('✅ [COPAY PAYMENT] Copay payment created:', paymentId);
        console.log('💳 [COPAY PAYMENT] Payment MongoDB _id:', paymentMongoId);

        // Create transaction summary
        console.log('📄 [TRANSACTION] Creating transaction summary...');
        console.log('🔍 [TRANSACTION] Using payment MongoDB _id:', paymentMongoId);
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
          paymentId: paymentMongoId, // Use MongoDB _id, not string paymentId
          status: TransactionStatus.PENDING_PAYMENT,
        });

        transactionId = transaction.transactionId;
        saved.transactionId = transactionId;
        await saved.save();

        console.log('✅ [TRANSACTION] Transaction created:', transactionId);
        console.log('✅ [SCENARIO B] Copay scenario completed successfully');
      }

      // Scenario C: Sufficient balance, no copay - debit wallet OR ask for payment
      else if (walletDebitAmount > 0) {
        const useWallet = createAppointmentDto.useWallet !== false; // Default true

        if (useWallet) {
          console.log('🟢 [SCENARIO C] Processing wallet-only payment...');

          console.log('💰 [WALLET DEBIT] Debiting wallet:', {
            userId: walletUserId,
            amount: walletDebitAmount,
            category: 'CAT001',
            referenceId: (saved._id as Types.ObjectId).toString(),
          });

          await this.walletService.debitWallet(
            walletUserId,
            walletDebitAmount,
            'CAT001',
            (saved._id as Types.ObjectId).toString(),
            'CONSULTATION',
            createAppointmentDto.doctorName || 'Doctor',
            `Consultation fee - ${createAppointmentDto.doctorName || 'Doctor'}`
          );

          console.log('✅ [WALLET DEBIT] Wallet debited successfully: ₹' + walletDebitAmount);

          // Create completed transaction
          console.log('📄 [TRANSACTION] Creating completed transaction...');
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
          saved.status = AppointmentStatus.CONFIRMED;
          saved.confirmedAt = new Date();
          await saved.save();

          console.log('✅ [TRANSACTION] Transaction created:', transactionId);
          console.log('✅ [SCENARIO C] Wallet-only scenario completed successfully');
        } else {
          // Scenario D: User opted out of wallet - ask for full payment
          console.log('🔵 [SCENARIO D] User opted out of wallet - requesting full payment');

          // Create payment request for full amount
          const payment = await this.paymentService.createPaymentRequest({
            userId: walletUserId,
            amount: consultationFee,
            paymentType: PaymentType.OUT_OF_POCKET,
            serviceType: PaymentServiceType.APPOINTMENT,
            serviceId: (saved._id as Types.ObjectId).toString(),
            serviceReferenceId: appointmentId,
            description: `Payment for appointment with ${createAppointmentDto.doctorName || 'Doctor'} (wallet not used - user choice)`,
          });

          paymentId = payment.paymentId;
          paymentMongoId = (payment._id as Types.ObjectId).toString();
          saved.paymentId = paymentId;
          saved.status = AppointmentStatus.PENDING_PAYMENT;
          await saved.save();

          console.log('✅ [SCENARIO D] Payment request created:', paymentId);

          // Create transaction
          const transaction = await this.transactionService.createTransaction({
            userId: walletUserId,
            serviceType: TransactionServiceType.APPOINTMENT,
            serviceId: (saved._id as Types.ObjectId).toString(),
            serviceReferenceId: appointmentId,
            serviceName: `Consultation - ${createAppointmentDto.doctorName || 'Doctor'}`,
            serviceDate: new Date(createAppointmentDto.appointmentDate),
            totalAmount: consultationFee,
            walletAmount: 0, // User chose not to use wallet
            selfPaidAmount: consultationFee,
            copayAmount: 0,
            paymentMethod: PaymentMethod.OUT_OF_POCKET,
            paymentId: paymentMongoId,
            status: TransactionStatus.PENDING_PAYMENT,
          });

          transactionId = transaction.transactionId;
          saved.transactionId = transactionId;
          await saved.save();

          console.log('✅ [SCENARIO D] Full payment request created - wallet not used');
        }
      }
    } catch (error) {
      console.error('❌ [APPOINTMENTS SERVICE] ========== ERROR OCCURRED ==========');
      console.error('❌ [ERROR] Type:', error.constructor.name);
      console.error('❌ [ERROR] Message:', error.message);
      console.error('❌ [ERROR] Stack:', error.stack);
      console.error('❌ [ERROR] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('❌ [ROLLBACK] Deleting appointment document...');

      await this.appointmentModel.deleteOne({ _id: saved._id });

      console.error('❌ [ROLLBACK] Appointment deleted, throwing error to client');
      throw new BadRequestException('Failed to process payment: ' + error.message);
    }

    // Return appointment with payment info
    console.log('✅ [APPOINTMENTS SERVICE] ========== APPOINTMENT CREATION COMPLETE ==========');
    const response = {
      appointment: saved,
      paymentRequired,
      paymentId,
      transactionId,
      copayAmount,
      walletDebitAmount,
    };
    console.log('📤 [RESPONSE] Returning to client:', JSON.stringify(response, null, 2));
    return response;
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