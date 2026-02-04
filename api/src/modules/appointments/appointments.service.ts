import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument, AppointmentStatus } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CounterService } from '../counters/counter.service';
import { WalletService } from '../wallet/wallet.service';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { PaymentService } from '../payments/payment.service';
import { TransactionSummaryService } from '../transactions/transaction-summary.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CopayCalculator } from '../plan-config/utils/copay-calculator';
import { CopayResolver } from '../plan-config/utils/copay-resolver';
import { ServiceTransactionLimitCalculator } from '../plan-config/utils/service-transaction-limit-calculator';
import { PaymentType, ServiceType as PaymentServiceType } from '../payments/schemas/payment.schema';
import { TransactionServiceType, PaymentMethod, TransactionStatus } from '../transactions/schemas/transaction-summary.schema';
import { APPOINTMENT_TYPE_TO_CATEGORY } from '@/common/constants/coverage.constants';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private readonly counterService: CounterService,
    private readonly walletService: WalletService,
    private readonly planConfigService: PlanConfigService,
    private readonly paymentService: PaymentService,
    private readonly transactionService: TransactionSummaryService,
    @Inject(forwardRef(() => AssignmentsService))
    private readonly assignmentsService: AssignmentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<any> {
    console.log('🚀🚀🚀 DEPLOYMENT VERSION: 2025-10-25-V4-CIRCULAR-FIX 🚀🚀🚀');
    console.log('🔥 [DEPLOY_V4] This code includes forwardRef circular dependency fix');
    console.log('🔥 [DEPLOY_V4] Timestamp:', new Date().toISOString());
    console.log('🚀 [APPOINTMENTS SERVICE] ========== APPOINTMENT CREATION START ==========');
    console.log('📥 [INPUT] Complete appointment DTO:', JSON.stringify(createAppointmentDto, null, 2));

    const appointmentId = await this.counterService.generateAppointmentId();
    console.log('🆔 [GENERATED] Appointment ID:', appointmentId);

    const consultationFee = createAppointmentDto.consultationFee || 0;
    const userId = createAppointmentDto.userId;
    const patientId = createAppointmentDto.patientId;
    const appointmentType = createAppointmentDto.appointmentType;

    console.log('👤 [USER INFO] userId:', userId);
    console.log('👤 [USER INFO] patientId:', patientId);
    console.log('📅 [APPOINTMENT] Type:', appointmentType);
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
    let serviceTransactionLimitResult = null;
    let policyId = null;
    let userRelationship = null;
    let categoryCode = APPOINTMENT_TYPE_TO_CATEGORY[appointmentType] || 'CAT001';
    let mustUseVAS = false;

    try {
      console.log('🔍 [POLICY] Searching for assignments for userId:', patientId);
      console.log('🎯🎯🎯 [DEPLOY_V4] About to call assignmentsService.getUserAssignments()');
      console.log('🎯🎯🎯 [DEPLOY_V4] Using forwardRef - this should work now!');

      // Fetch user's assignment to get policyId using proper service
      const assignments = await this.assignmentsService.getUserAssignments(patientId);

      console.log('✅✅✅ [DEPLOY_V4] Successfully called assignmentsService - Circular dependency resolved!');
      console.log('📄 [POLICY] Assignments found:', assignments ? assignments.length : 0);

      const activeAssignment = assignments && assignments.length > 0 ? assignments[0] : null;

      if (activeAssignment) {
        console.log('📄 [POLICY] Active assignment details:', JSON.stringify(activeAssignment, null, 2));
      }

      if (activeAssignment && activeAssignment.policyId) {
        // Handle policyId as object or string
        if (typeof activeAssignment.policyId === 'object' && activeAssignment.policyId._id) {
          policyId = activeAssignment.policyId._id.toString();
        } else if (typeof activeAssignment.policyId === 'string') {
          policyId = activeAssignment.policyId;
        } else {
          policyId = activeAssignment.policyId.toString();
        }
        console.log('✅ [POLICY] Found policyId:', policyId);
        console.log('✅ [POLICY] PolicyId type:', typeof policyId);

        // Fetch user details to get relationship
        console.log('🔍 [USER] Fetching user details to get relationship for patientId:', patientId);
        try {
          const userModel = this.appointmentModel.db.model('User');
          const userDoc = await userModel.findById(patientId).select('relationship').lean() as { relationship?: string } | null;
          if (userDoc && userDoc.relationship) {
            userRelationship = userDoc.relationship;
            console.log('✅ [USER] Found user relationship:', userRelationship);
          } else {
            console.log('⚠️ [USER] No relationship found for user, will use global config');
          }
        } catch (userError) {
          console.error('❌ [USER ERROR] Failed to fetch user relationship:', userError.message);
        }

        // Fetch plan config
        console.log('🔍 [POLICY] Fetching plan config for policyId:', policyId);
        const planConfig = await this.planConfigService.getConfig(policyId);
        console.log('📄 [POLICY] Plan config retrieved:', planConfig ? 'YES' : 'NO');

        if (planConfig) {
          console.log('📄 [POLICY] Plan config structure:', JSON.stringify({
            hasWallet: !!planConfig.wallet,
            hasMemberConfigs: !!planConfig.memberConfigs,
            memberConfigKeys: planConfig.memberConfigs ? Object.keys(planConfig.memberConfigs) : []
          }, null, 2));

          // ✅ FIX: Use CopayResolver to get copay config from correct location
          console.log('💰 [COPAY FIX] Using CopayResolver to resolve copay config...');
          const copayConfig = CopayResolver.resolve(planConfig, userRelationship);
          const copaySource = CopayResolver.getSource(planConfig, userRelationship);

          console.log('📄 [COPAY] Copay source:', copaySource);
          console.log('📄 [COPAY] Resolved copay config:', JSON.stringify(copayConfig, null, 2));

          // Determine category based on appointment type
          categoryCode = APPOINTMENT_TYPE_TO_CATEGORY[appointmentType] || 'CAT001';
          // Now benefit keys are category IDs directly (CAT001, CAT002, etc.)
          const categoryBenefit = planConfig.benefits && (planConfig.benefits as any)[categoryCode];

          console.log('📄 [CATEGORY] Appointment type:', appointmentType);
          console.log('📄 [CATEGORY] Category code:', categoryCode);
          console.log('📄 [CATEGORY] Category benefit:', JSON.stringify(categoryBenefit, null, 2));

          // Check if category is enabled OR vasEnabled (VAS = show but self-pay only)
          const categoryEnabled = categoryBenefit && categoryBenefit.enabled;
          const vasEnabled = categoryBenefit && categoryBenefit.vasEnabled;

          console.log('📄 [BENEFIT] Category enabled:', categoryEnabled);
          console.log('📄 [BENEFIT] VAS enabled:', vasEnabled);

          if (!categoryEnabled && !vasEnabled) {
            throw new BadRequestException(
              `${appointmentType === 'ONLINE' ? 'Online' : 'In-clinic'} consultations are not available under your policy`
            );
          }

          // If only VAS is enabled, user must pay out of pocket (no wallet deduction)
          mustUseVAS = !categoryEnabled && vasEnabled;

          if (mustUseVAS) {
            console.log('⚠️ [VAS] User must use VAS (self-pay) for category:', categoryCode);
            console.log('⚠️ [VAS] Forcing full out-of-pocket payment');
            // Will force wallet deduction to 0 and user pays full amount
          }

          if (copayConfig && categoryEnabled) {
            console.log('💰 [COPAY] Calculating copay for fee:', consultationFee);
            copayCalculation = CopayCalculator.calculate(consultationFee, copayConfig);
            console.log('✅ [COPAY] Copay calculation result:', JSON.stringify(copayCalculation, null, 2));
          } else {
            if (!copayConfig) {
              console.log('⚠️ [COPAY] No copay config found in plan');
            }
            if (!categoryEnabled) {
              console.log('⚠️ [COPAY] Category not enabled (VAS mode or disabled)');
            }
          }

          // Step 1.5: Apply service transaction limit (if configured)
          // Need to get specialty MongoDB ObjectId (not the specialty name)
          if (copayCalculation && categoryEnabled) {
            console.log('🔒 [SERVICE LIMIT] Checking for service transaction limit...');

            let specialtyObjectId: string | null = null;

            // Get specialty ObjectId from doctor document
            if (createAppointmentDto.doctorId) {
              try {
                const doctorModel = this.appointmentModel.db.model('Doctor');
                const doctorDoc = await doctorModel.findOne({ doctorId: createAppointmentDto.doctorId }).select('specialtyId specialty').lean() as { specialtyId?: string; specialty?: string } | null;

                if (doctorDoc && doctorDoc.specialtyId) {
                  console.log('✅ [CREATE - DOCTOR] Found specialtyId from doctor:', doctorDoc.specialtyId);

                  // Lookup specialty document to get MongoDB _id (ObjectId)
                  const specialtyModel = this.appointmentModel.db.model('Specialty');
                  const specialtyDoc = await specialtyModel.findOne({ specialtyId: doctorDoc.specialtyId }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;

                  if (specialtyDoc && specialtyDoc._id) {
                    specialtyObjectId = specialtyDoc._id.toString();
                    console.log('✅ [CREATE - SPECIALTY] Found specialty MongoDB ObjectId:', specialtyObjectId, '(for specialtyId:', specialtyDoc.specialtyId, 'name:', specialtyDoc.name, ')');
                  } else {
                    console.log('⚠️ [CREATE - SPECIALTY] Could not find specialty document for specialtyId:', doctorDoc.specialtyId);
                  }
                } else if (doctorDoc && doctorDoc.specialty) {
                  console.log('⚠️ [CREATE - DOCTOR] Using specialty name as fallback:', doctorDoc.specialty);
                  const specialtyModel = this.appointmentModel.db.model('Specialty');
                  const specialtyDoc = await specialtyModel.findOne({ name: doctorDoc.specialty }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;
                  if (specialtyDoc && specialtyDoc._id) {
                    specialtyObjectId = specialtyDoc._id.toString();
                    console.log('✅ [CREATE - SPECIALTY] Found specialty MongoDB ObjectId by name:', specialtyObjectId);
                  }
                }
              } catch (doctorError) {
                console.error('❌ [CREATE - DOCTOR ERROR] Failed to fetch doctor specialty:', doctorError.message);
              }
            }

            // Fallback: if no specialtyObjectId from doctor, try to lookup by specialty parameter
            if (!specialtyObjectId && createAppointmentDto.specialty) {
              try {
                const specialtyModel = this.appointmentModel.db.model('Specialty');
                let specialtyDoc = await specialtyModel.findOne({ name: createAppointmentDto.specialty }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;
                if (!specialtyDoc) {
                  specialtyDoc = await specialtyModel.findOne({ specialtyId: createAppointmentDto.specialty }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;
                }
                if (specialtyDoc && specialtyDoc._id) {
                  specialtyObjectId = specialtyDoc._id.toString();
                  console.log('⚠️ [CREATE - SPECIALTY] Using specialty parameter fallback, found ObjectId:', specialtyObjectId);
                }
              } catch (error) {
                console.error('❌ [CREATE - SPECIALTY ERROR] Failed to lookup specialty:', error.message);
              }
            }

            console.log('🔍 [CREATE - SPECIALTY OBJECTID] Final specialty ObjectId for limit lookup:', specialtyObjectId);

            if (specialtyObjectId) {
              const serviceLimit = ServiceTransactionLimitCalculator.getServiceLimit(
                planConfig,
                categoryCode,
                specialtyObjectId,
                userRelationship
              );

              if (serviceLimit) {
                console.log('🔒 [SERVICE LIMIT] Transaction limit found for specialty:', serviceLimit);
                serviceTransactionLimitResult = ServiceTransactionLimitCalculator.calculate(
                  consultationFee,
                  copayCalculation.copayAmount,
                  serviceLimit
                );
                console.log('✅ [SERVICE LIMIT] Result:', JSON.stringify(serviceTransactionLimitResult, null, 2));
              } else {
                console.log('⚠️ [SERVICE LIMIT] No transaction limit configured for this specialty');
              }
            } else {
              console.log('⚠️ [SERVICE LIMIT] Could not determine specialty ObjectId, skipping service limit check');
            }
          }
        } else {
          console.log('⚠️ [POLICY] Plan config is null');
        }
      } else {
        console.log('⚠️ [POLICY] No assignment or policyId found for member');
      }
    } catch (error) {
      console.error('❌❌❌ [DEPLOY_V4] ERROR IN ASSIGNMENTS SERVICE CALL ❌❌❌');
      console.error('❌ [POLICY ERROR] Failed to fetch policy/copay config:', error);
      console.error('❌ [POLICY ERROR] Error message:', error.message);
      console.error('❌ [POLICY ERROR] Error stack:', error.stack);
      console.error('❌❌❌ [DEPLOY_V4] If this error still occurs, there is a different issue than circular dependency ❌❌❌');
      // Continue without copay if config fetch fails
    }

    // Step 2: Determine payment breakdown (with service transaction limit)
    console.log('📋 [STEP 2] Determining payment breakdown...');
    let copayAmount = copayCalculation ? copayCalculation.copayAmount : 0;
    let walletDebitAmount = copayCalculation ? copayCalculation.walletDebitAmount : consultationFee;
    let excessAmount = 0;
    let totalMemberPayment = copayAmount;

    // Apply service transaction limit if calculated
    if (serviceTransactionLimitResult) {
      walletDebitAmount = serviceTransactionLimitResult.insurancePayment;
      excessAmount = serviceTransactionLimitResult.excessAmount;
      totalMemberPayment = serviceTransactionLimitResult.totalMemberPayment;
      copayAmount = serviceTransactionLimitResult.copayAmount; // Use from service limit result for consistency
    }

    console.log('💰 [PAYMENT BREAKDOWN] ================');
    console.log('💰 [PAYMENT] Total consultation fee: ₹' + consultationFee);
    console.log('💰 [PAYMENT] Copay amount: ₹' + copayAmount);
    if (serviceTransactionLimitResult && serviceTransactionLimitResult.wasLimitApplied) {
      console.log('🔒 [PAYMENT] Service transaction limit: ₹' + serviceTransactionLimitResult.serviceTransactionLimit);
      console.log('💰 [PAYMENT] Excess amount (beyond limit): ₹' + excessAmount);
    }
    console.log('💰 [PAYMENT] Wallet debit amount (insurance pays): ₹' + walletDebitAmount);
    console.log('💰 [PAYMENT] Total member payment: ₹' + totalMemberPayment);
    console.log('💰 [PAYMENT BREAKDOWN] ================');

    // Step 3: Check wallet balance
    console.log('📋 [STEP 3] Checking wallet balance...');
    let hasSufficientBalance = false;
    let availableBalance = 0;

    if (walletDebitAmount > 0) {
      try {
        console.log('🔍 [WALLET] Checking balance for userId:', walletUserId);
        console.log('🔍 [WALLET] Required amount:', walletDebitAmount);
        console.log('🔍 [WALLET] Category:', categoryCode);

        const balanceCheck = await this.walletService.checkSufficientBalance(
          walletUserId,
          walletDebitAmount,
          categoryCode
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
      categoryCode: categoryCode, // Add category code based on appointment type
      doctorName: createAppointmentDto.doctorName || '',
      specialty: createAppointmentDto.specialty || 'General Physician', // Default to General Physician if not provided
      clinicId: createAppointmentDto.clinicId || '',
      clinicName: createAppointmentDto.clinicName || '',
      clinicAddress: createAppointmentDto.clinicAddress || '',
      consultationFee: consultationFee,
      copayAmount: copayAmount,
      walletDebitAmount: walletDebitAmount,
      paymentId: null, // Will be set after payment creation
      // Service transaction limit tracking
      serviceId: createAppointmentDto.specialty?.toString() || null,
      serviceName: createAppointmentDto.specialty || null,
      serviceTransactionLimit: serviceTransactionLimitResult?.serviceTransactionLimit || null,
      wasServiceLimitApplied: serviceTransactionLimitResult?.wasLimitApplied || false,
      excessAmount: excessAmount,
    };

    console.log('📝 [APPOINTMENT] Appointment data prepared:', JSON.stringify(appointmentData, null, 2));

    // ✅ SLOT AVAILABILITY CHECK - Prevent double booking
    console.log('🔍 [SLOT VALIDATION] Checking if slot is already booked...');
    console.log('🔍 [SLOT VALIDATION] Doctor ID:', createAppointmentDto.doctorId);
    console.log('🔍 [SLOT VALIDATION] Date:', createAppointmentDto.appointmentDate);
    console.log('🔍 [SLOT VALIDATION] Time Slot:', createAppointmentDto.timeSlot);
    console.log('🔍 [SLOT VALIDATION] Slot ID:', createAppointmentDto.slotId);

    const existingBooking = await this.appointmentModel.findOne({
      doctorId: createAppointmentDto.doctorId,
      appointmentDate: createAppointmentDto.appointmentDate,
      timeSlot: createAppointmentDto.timeSlot,
      slotId: createAppointmentDto.slotId,
      status: {
        $in: [
          AppointmentStatus.PENDING_CONFIRMATION,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.PENDING_PAYMENT
        ]
      }
    }).lean();

    if (existingBooking) {
      console.error('❌ [SLOT VALIDATION] Slot already booked!');
      console.error('❌ [SLOT VALIDATION] Existing booking:', {
        appointmentId: (existingBooking as any).appointmentId,
        status: (existingBooking as any).status,
        patientName: (existingBooking as any).patientName,
      });
      throw new BadRequestException(
        'This time slot has already been booked. Please select another slot.'
      );
    }

    console.log('✅ [SLOT VALIDATION] Slot is available - proceeding with booking');

    const appointment = new this.appointmentModel(appointmentData);
    const saved = await appointment.save();

    console.log('✅ [APPOINTMENT] Appointment document created successfully');
    console.log('🆔 [APPOINTMENT] MongoDB _id:', saved._id);
    console.log('🆔 [APPOINTMENT] MongoDB _id type:', typeof saved._id);
    console.log('🆔 [APPOINTMENT] MongoDB _id toString:', (saved._id as Types.ObjectId).toString());
    console.log('🆔 [APPOINTMENT] appointmentId:', appointmentId);

    // SPECIAL CASE: Payment was already processed (from pay-first flow like online consultations)
    if (createAppointmentDto.paymentAlreadyProcessed && createAppointmentDto.existingPaymentId) {
      console.log('💳 [PAYMENT ALREADY PROCESSED] Skipping payment creation - using existing payment');
      console.log('💳 [EXISTING PAYMENT] Payment ID:', createAppointmentDto.existingPaymentId);

      // IMPORTANT: Still debit wallet for the insurance portion
      if (walletDebitAmount > 0 && hasSufficientBalance) {
        console.log('💰 [WALLET DEBIT - PAYMENT FLOW] Debiting wallet for insurance portion...');
        console.log('💰 [WALLET DEBIT] Amount:', walletDebitAmount);
        console.log('💰 [WALLET DEBIT] Category:', categoryCode);
        console.log('💰 [WALLET DEBIT] User:', walletUserId);

        try {
          await this.walletService.debitWallet(
            walletUserId,
            walletDebitAmount,
            categoryCode,
            (saved._id as Types.ObjectId).toString(),
            'CONSULTATION',
            createAppointmentDto.doctorName || 'Doctor',
            `Consultation fee (wallet portion) - ${createAppointmentDto.doctorName || 'Doctor'}`
          );
          console.log('✅ [WALLET DEBIT] Wallet debited successfully: ₹' + walletDebitAmount);

          // Create transaction summary for wallet portion
          const transactionData = {
            userId: walletUserId,
            serviceType: TransactionServiceType.APPOINTMENT,
            serviceId: (saved._id as Types.ObjectId).toString(),
            serviceReferenceId: appointmentId,
            serviceName: `Consultation - ${createAppointmentDto.doctorName || 'Doctor'}`,
            serviceDate: new Date(createAppointmentDto.appointmentDate),
            totalAmount: consultationFee,
            walletAmount: walletDebitAmount,
            selfPaidAmount: copayAmount + excessAmount,
            copayAmount: copayAmount,
            paymentMethod: copayAmount > 0 ? PaymentMethod.COPAY : PaymentMethod.WALLET_ONLY,
            status: TransactionStatus.COMPLETED,
          };

          const transaction = await this.transactionService.createTransaction(transactionData);
          saved.transactionId = transaction.transactionId;
          console.log('✅ [TRANSACTION] Transaction created:', transaction.transactionId);
        } catch (walletError) {
          console.error('❌ [WALLET DEBIT ERROR] Failed to debit wallet:', walletError);
          // Continue - appointment is still valid, just wallet debit failed
        }
      }

      // Update the existing payment's serviceId to point to this appointment
      try {
        await this.paymentService.updatePaymentServiceLink(
          createAppointmentDto.existingPaymentId,
          (saved._id as Types.ObjectId).toString(),
          appointmentId,
          PaymentServiceType.APPOINTMENT,
        );
        console.log('✅ [PAYMENT] Updated existing payment to link to appointment');
      } catch (linkError) {
        console.error('❌ [PAYMENT LINK ERROR] Failed to link existing payment:', linkError);
        // Don't fail the appointment creation, just log the error
      }

      // Set the paymentId on the appointment
      saved.paymentId = createAppointmentDto.existingPaymentId;
      saved.status = AppointmentStatus.CONFIRMED;
      saved.confirmedAt = new Date();
      await saved.save();

      console.log('✅ [APPOINTMENT] Appointment confirmed (payment already processed)');

      // Send notification to user about appointment creation (early return case)
      try {
        const dateStr = new Date(createAppointmentDto.appointmentDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        await this.notificationsService.notifyAppointmentCreated(
          userId,
          appointmentId,
          appointmentType,
          createAppointmentDto.doctorName || 'Doctor',
          dateStr,
          createAppointmentDto.timeSlot,
        );
        console.log('✅ [NOTIFICATION] Appointment creation notification sent');
      } catch (notifError) {
        console.error('⚠️ [NOTIFICATION] Failed to send notification:', notifError);
      }

      return {
        appointment: saved,
        paymentRequired: false,
        paymentId: createAppointmentDto.existingPaymentId,
        transactionId: null,
        copayAmount,
        walletDebitAmount,
      };
    }

    // Now create payment if needed (using saved._id)
    if (!hasSufficientBalance && walletDebitAmount > 0) {
      console.log('💳 [PAYMENT] Creating payment request for insufficient balance scenario...');
      const shortfall = walletDebitAmount - availableBalance;
      const paymentAmount = shortfall + copayAmount + excessAmount;

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
            categoryCode,
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
          selfPaidAmount: shortfall + copayAmount + excessAmount, // ✅ What user needs to pay (copay + excess + shortfall)
          copayAmount: copayAmount,
          paymentMethod: (shortfall + copayAmount + excessAmount) > 0
            ? (copayAmount > 0 ? PaymentMethod.COPAY : PaymentMethod.PARTIAL)
            : PaymentMethod.WALLET_ONLY,
          paymentId: paymentMongoId || undefined,
          status: (shortfall + copayAmount + excessAmount) > 0
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
          category: categoryCode,
          referenceId: (saved._id as Types.ObjectId).toString(),
        });

        await this.walletService.debitWallet(
          walletUserId,
          walletDebitAmount,
          categoryCode,
          (saved._id as Types.ObjectId).toString(),
          'CONSULTATION',
          createAppointmentDto.doctorName || 'Doctor',
          `Consultation fee (wallet portion) - ${createAppointmentDto.doctorName || 'Doctor'}`
        );

        console.log('✅ [WALLET DEBIT] Wallet debited successfully: ₹' + walletDebitAmount);

        // Create copay payment request (includes excess amount from service limits)
        console.log('💳 [COPAY PAYMENT] Creating copay payment request...');
        const copayPayment = await this.paymentService.createPaymentRequest({
          userId: walletUserId,
          amount: copayAmount + excessAmount,
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
          selfPaidAmount: copayAmount + excessAmount, // ✅ What user needs to pay (copay + excess)
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
            category: categoryCode,
            referenceId: (saved._id as Types.ObjectId).toString(),
          });

          await this.walletService.debitWallet(
            walletUserId,
            walletDebitAmount,
            categoryCode,
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

    // Send notification to user about appointment creation
    try {
      const dateStr = new Date(createAppointmentDto.appointmentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      await this.notificationsService.notifyAppointmentCreated(
        userId,
        appointmentId,
        appointmentType,
        createAppointmentDto.doctorName || 'Doctor',
        dateStr,
        createAppointmentDto.timeSlot,
      );
      console.log('✅ [NOTIFICATION] Appointment creation notification sent');
    } catch (notifError) {
      console.error('⚠️ [NOTIFICATION] Failed to send notification:', notifError);
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
    // PRIVACY: Filter by patientId (actual patient) instead of userId (booker)
    // This ensures each family member sees only their own appointments
    const filter: any = { patientId: userId };

    if (appointmentType) {
      filter.appointmentType = appointmentType;
    }

    console.log('[AppointmentsService] Filtering appointments by patientId:', { userId, filter });

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
    // PRIVACY: Filter by patientId (actual patient) instead of userId (booker)
    const today = new Date().toISOString().split('T')[0];

    const appointment = await this.appointmentModel
      .findOne({
        patientId: userId,
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

  async getDoctorBookedSlots(doctorId: string, appointmentType?: string): Promise<{ date: string; timeSlot: string }[]> {
    // Get booked slots for a doctor (for slot selection UI)
    const today = new Date().toISOString().split('T')[0];

    const filter: any = {
      doctorId,
      status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] },
      appointmentDate: { $gte: today },
    };

    if (appointmentType) {
      filter.appointmentType = appointmentType;
    }

    const appointments = await this.appointmentModel
      .find(filter)
      .select('appointmentDate timeSlot')
      .lean()
      .exec();

    return appointments.map((apt) => ({
      date: typeof apt.appointmentDate === 'string'
        ? apt.appointmentDate.split('T')[0]
        : new Date(apt.appointmentDate).toISOString().split('T')[0],
      timeSlot: apt.timeSlot,
    }));
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

    // Refund wallet if there was a wallet debit (same as user cancellation)
    // Use patientId for refund since that's whose wallet was debited
    // IMPORTANT: Only refund the walletDebitAmount, NOT the full consultationFee
    // The copayAmount was paid out of pocket and should not be refunded to wallet
    if (appointment.walletDebitAmount > 0) {
      try {
        console.log('💰 [REFUND] ========== OPS CANCELLATION REFUND START ==========');
        console.log('💰 [REFUND] Appointment ID:', appointmentId);
        console.log('💰 [REFUND] Patient ID:', appointment.patientId);
        console.log('💰 [REFUND] Consultation Fee:', appointment.consultationFee);
        console.log('💰 [REFUND] Wallet Debit Amount (to refund):', appointment.walletDebitAmount);
        console.log('💰 [REFUND] Copay Amount (NOT refunded to wallet):', appointment.copayAmount);
        console.log('💰 [REFUND] Category Code:', appointment.categoryCode);

        await this.walletService.creditWallet(
          appointment.patientId,
          appointment.walletDebitAmount,
          appointment.categoryCode || APPOINTMENT_TYPE_TO_CATEGORY[appointment.appointmentType] || 'CAT001',
          (appointment._id as any).toString(),
          'CONSULTATION_REFUND',
          appointment.doctorName || 'Doctor',
          `Refund for cancelled appointment - ${appointment.doctorName || 'Doctor'} - ${appointment.appointmentType || 'Appointment'}`
        );

        console.log('✅ [REFUND] Wallet credited with:', appointment.walletDebitAmount);
        console.log('💰 [REFUND] ========== OPS CANCELLATION WALLET REFUND COMPLETE ==========');
      } catch (walletError) {
        console.error('❌ [REFUND] Failed to refund wallet:', walletError);
        // Continue even if refund fails, appointment is already cancelled
      }
    } else {
      console.log('⚠️ [REFUND] No wallet refund needed - walletDebitAmount is 0');
    }

    // Process refund for any out-of-pocket payment (copay OR self-paid)
    // Use the appointment's paymentId to find the payment directly
    if (appointment.paymentId) {
      try {
        console.log('💰 [REFUND] ========== PROCESSING PAYMENT REFUND (OPS) ==========');
        console.log('💰 [REFUND] Copay Amount on appointment:', appointment.copayAmount);
        console.log('💰 [REFUND] Consultation Fee:', appointment.consultationFee);
        console.log('💰 [REFUND] Payment ID from appointment:', appointment.paymentId);

        const refundResult = await this.paymentService.processRefund(
          appointment.paymentId,
          `Refund for cancelled appointment (OPS) - ${appointment.doctorName || 'Doctor'}`
        );

        if (refundResult) {
          console.log('✅ [REFUND] Payment refund processed successfully');
          console.log('💰 [REFUND] Refund amount:', refundResult.amount);
          console.log('💰 [REFUND] Refund payment ID:', refundResult.paymentId);
        }
        console.log('💰 [REFUND] ========== PAYMENT REFUND COMPLETE (OPS) ==========');
      } catch (refundError: any) {
        // Don't log error if payment was never completed (PENDING status)
        if (!refundError.message?.includes('only refund completed')) {
          console.error('❌ [REFUND] Failed to process payment refund:', refundError);
        } else {
          console.log('⚠️ [REFUND] Payment was not completed, no refund needed');
        }
      }
    } else {
      console.log('⚠️ [REFUND] No payment ID on appointment - no refund to process');
    }

    // Send notification to user about appointment cancellation (OPS)
    try {
      const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      await this.notificationsService.notifyAppointmentCancelled(
        appointment.userId.toString(),
        appointmentId,
        appointment.appointmentType,
        appointment.doctorName || 'Doctor',
        dateStr,
        _reason,
      );
      console.log('✅ [NOTIFICATION] Appointment cancellation notification sent (OPS)');
    } catch (notifError) {
      console.error('⚠️ [NOTIFICATION] Failed to send cancellation notification:', notifError);
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

    // Refund wallet if there was a wallet debit
    // Use patientId for refund since that's whose wallet was debited
    // IMPORTANT: Only refund the walletDebitAmount, NOT the full consultationFee
    // The copayAmount was paid out of pocket and should not be refunded to wallet
    if (appointment.walletDebitAmount > 0) {
      try {
        console.log('💰 [REFUND] ========== USER CANCELLATION REFUND START ==========');
        console.log('💰 [REFUND] Appointment ID:', appointmentId);
        console.log('💰 [REFUND] Patient ID:', appointment.patientId);
        console.log('💰 [REFUND] Consultation Fee:', appointment.consultationFee);
        console.log('💰 [REFUND] Wallet Debit Amount (to refund):', appointment.walletDebitAmount);
        console.log('💰 [REFUND] Copay Amount (NOT refunded to wallet):', appointment.copayAmount);
        console.log('💰 [REFUND] Category Code:', appointment.categoryCode);

        await this.walletService.creditWallet(
          appointment.patientId,
          appointment.walletDebitAmount,
          appointment.categoryCode || APPOINTMENT_TYPE_TO_CATEGORY[appointment.appointmentType] || 'CAT001',
          (appointment._id as any).toString(),
          'CONSULTATION_REFUND',
          appointment.doctorName || 'Doctor',
          `Refund for cancelled appointment - ${appointment.doctorName || 'Doctor'} - ${appointment.appointmentType || 'Appointment'}`
        );

        console.log('✅ [REFUND] Wallet credited with:', appointment.walletDebitAmount);
        console.log('💰 [REFUND] ========== USER CANCELLATION WALLET REFUND COMPLETE ==========');
      } catch (walletError) {
        console.error('❌ [REFUND] Failed to refund wallet:', walletError);
        // Continue even if refund fails, appointment is already cancelled
      }
    } else {
      console.log('⚠️ [REFUND] No wallet refund needed - walletDebitAmount is 0');
    }

    // Process refund for any out-of-pocket payment (copay OR self-paid)
    // Use the appointment's paymentId to find the payment directly
    if (appointment.paymentId) {
      try {
        console.log('💰 [REFUND] ========== PROCESSING PAYMENT REFUND ==========');
        console.log('💰 [REFUND] Copay Amount on appointment:', appointment.copayAmount);
        console.log('💰 [REFUND] Consultation Fee:', appointment.consultationFee);
        console.log('💰 [REFUND] Payment ID from appointment:', appointment.paymentId);

        const refundResult = await this.paymentService.processRefund(
          appointment.paymentId,
          `Refund for cancelled appointment - ${appointment.doctorName || 'Doctor'}`
        );

        if (refundResult) {
          console.log('✅ [REFUND] Payment refund processed successfully');
          console.log('💰 [REFUND] Refund amount:', refundResult.amount);
          console.log('💰 [REFUND] Refund payment ID:', refundResult.paymentId);
        }
        console.log('💰 [REFUND] ========== PAYMENT REFUND COMPLETE ==========');
      } catch (refundError: any) {
        // Don't log error if payment was never completed (PENDING status)
        if (!refundError.message?.includes('only refund completed')) {
          console.error('❌ [REFUND] Failed to process payment refund:', refundError);
        } else {
          console.log('⚠️ [REFUND] Payment was not completed, no refund needed');
        }
        // Continue even if refund fails, appointment is already cancelled
      }
    } else {
      console.log('⚠️ [REFUND] No payment ID on appointment - no refund to process');
    }

    // Send notification to user about appointment cancellation (USER)
    try {
      const dateStr = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      await this.notificationsService.notifyAppointmentCancelled(
        appointment.userId.toString(),
        appointmentId,
        appointment.appointmentType,
        appointment.doctorName || 'Doctor',
        dateStr,
        'Cancelled by user',
      );
      console.log('✅ [NOTIFICATION] Appointment cancellation notification sent (USER)');
    } catch (notifError) {
      console.error('⚠️ [NOTIFICATION] Failed to send cancellation notification:', notifError);
    }

    return appointment;
  }

  async confirmAppointmentAfterPayment(appointmentMongoId: string, transactionId: string): Promise<Appointment> {
    console.log('💰 [APPOINTMENTS SERVICE] Confirming appointment after payment');
    console.log('  - appointmentMongoId:', appointmentMongoId);
    console.log('  - transactionId:', transactionId);

    // Search by MongoDB _id (not appointmentId string)
    const appointment = await this.appointmentModel.findById(appointmentMongoId);

    if (!appointment) {
      console.error('❌ [APPOINTMENTS SERVICE] Appointment not found with _id:', appointmentMongoId);
      throw new NotFoundException('Appointment not found');
    }

    console.log('✅ [APPOINTMENTS SERVICE] Found appointment:', {
      appointmentId: appointment.appointmentId,
      status: appointment.status,
      patientName: appointment.patientName,
    });

    if (appointment.status !== AppointmentStatus.PENDING_PAYMENT) {
      console.error('❌ [APPOINTMENTS SERVICE] Invalid status for confirmation:', appointment.status);
      throw new BadRequestException('Only appointments with PENDING_PAYMENT status can be confirmed after payment');
    }

    // Update appointment status to CONFIRMED
    console.log('🔄 [APPOINTMENTS SERVICE] Updating appointment status to CONFIRMED...');
    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();
    await appointment.save();

    console.log('✅ [APPOINTMENTS SERVICE] Appointment status updated to CONFIRMED');

    // Update transaction status to COMPLETED
    if (appointment.transactionId) {
      try {
        console.log('🔄 [APPOINTMENTS SERVICE] Updating transaction status to COMPLETED...');
        await this.transactionService.updateTransactionStatus(
          appointment.transactionId,
          TransactionStatus.COMPLETED
        );
        console.log('✅ [APPOINTMENTS SERVICE] Transaction status updated to COMPLETED');
      } catch (error) {
        console.error('❌ [APPOINTMENTS SERVICE] Failed to update transaction status:', error);
      }
    }

    console.log('✅ [APPOINTMENTS SERVICE] Appointment confirmed after payment successfully');
    return appointment;
  }

  /**
   * Validate booking and calculate payment breakdown including service limits
   * This method pre-calculates what the user will need to pay BEFORE booking
   */
  async validateBooking(validateDto: any): Promise<any> {
    console.log('🔍 [VALIDATE BOOKING] ========== VALIDATION START ==========');
    console.log('📥 [INPUT] Validation DTO:', JSON.stringify(validateDto, null, 2));

    const { userId, patientId, specialty, doctorId, consultationFee, appointmentType } = validateDto;

    // Step 1: Determine category code from appointment type
    const categoryCode = APPOINTMENT_TYPE_TO_CATEGORY[appointmentType];
    if (!categoryCode) {
      throw new BadRequestException(`Invalid appointment type: ${appointmentType}`);
    }
    console.log('📋 [CATEGORY] Mapped category code:', categoryCode);

    // Step 1.5: Get specialty MongoDB ObjectId from doctor document if doctorId is provided
    // IMPORTANT: Service transaction limits use specialty's MongoDB _id (ObjectId), not specialtyId field
    let specialtyObjectId: string | null = null;
    if (doctorId) {
      try {
        const doctorModel = this.appointmentModel.db.model('Doctor');
        const doctorDoc = await doctorModel.findOne({ doctorId }).select('specialtyId specialty').lean() as { specialtyId?: string; specialty?: string } | null;

        if (doctorDoc && doctorDoc.specialtyId) {
          console.log('✅ [DOCTOR] Found specialtyId from doctor:', doctorDoc.specialtyId);

          // Now lookup the specialty document to get its MongoDB _id (ObjectId)
          const specialtyModel = this.appointmentModel.db.model('Specialty');
          const specialtyDoc = await specialtyModel.findOne({ specialtyId: doctorDoc.specialtyId }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;

          if (specialtyDoc && specialtyDoc._id) {
            specialtyObjectId = specialtyDoc._id.toString();
            console.log('✅ [SPECIALTY] Found specialty MongoDB ObjectId:', specialtyObjectId, '(for specialtyId:', specialtyDoc.specialtyId, 'name:', specialtyDoc.name, ')');
          } else {
            console.log('⚠️ [SPECIALTY] Could not find specialty document for specialtyId:', doctorDoc.specialtyId);
          }
        } else if (doctorDoc && doctorDoc.specialty) {
          console.log('⚠️ [DOCTOR] Using specialty name as fallback:', doctorDoc.specialty);
          // Try to lookup specialty by name
          const specialtyModel = this.appointmentModel.db.model('Specialty');
          const specialtyDoc = await specialtyModel.findOne({ name: doctorDoc.specialty }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;
          if (specialtyDoc && specialtyDoc._id) {
            specialtyObjectId = specialtyDoc._id.toString();
            console.log('✅ [SPECIALTY] Found specialty MongoDB ObjectId by name:', specialtyObjectId);
          }
        } else {
          console.log('⚠️ [DOCTOR] No specialty found for doctor');
        }
      } catch (doctorError) {
        console.error('❌ [DOCTOR ERROR] Failed to fetch doctor specialty:', doctorError.message);
      }
    }

    // Fallback: if no specialtyObjectId from doctor, try to lookup by specialty parameter
    if (!specialtyObjectId && specialty) {
      try {
        const specialtyModel = this.appointmentModel.db.model('Specialty');
        // Try by name first
        let specialtyDoc = await specialtyModel.findOne({ name: specialty }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;
        // If not found, try by specialtyId
        if (!specialtyDoc) {
          specialtyDoc = await specialtyModel.findOne({ specialtyId: specialty }).select('_id specialtyId name').lean() as { _id?: any; specialtyId?: string; name?: string } | null;
        }
        if (specialtyDoc && specialtyDoc._id) {
          specialtyObjectId = specialtyDoc._id.toString();
          console.log('⚠️ [SPECIALTY] Using specialty parameter fallback, found ObjectId:', specialtyObjectId);
        }
      } catch (error) {
        console.error('❌ [SPECIALTY ERROR] Failed to lookup specialty:', error.message);
      }
    }

    console.log('🔍 [SPECIALTY OBJECTID] Final specialty ObjectId that will be used for limit lookup:', specialtyObjectId);

    // Step 2: Use patientId as walletUserId (matching create logic)
    const walletUserId = patientId;
    console.log('👤 [WALLET USER] Using wallet from userId:', walletUserId);

    // Step 3: Get wallet balance
    const balanceCheck = await this.walletService.checkSufficientBalance(
      walletUserId,
      consultationFee,
      categoryCode
    );
    const walletBalance = balanceCheck.categoryBalance;
    console.log('💰 [WALLET] Current balance:', walletBalance);

    // Step 4: Get active policy assignment
    const assignments = await this.assignmentsService.getUserAssignments(patientId);
    console.log('📄 [POLICY] Assignments found:', assignments ? assignments.length : 0);

    const activeAssignment = assignments && assignments.length > 0 ? assignments[0] : null;

    if (!activeAssignment) {
      console.log('⚠️ [VALIDATION] No active policy - user pays full amount');
      return {
        isAllowed: true,
        breakdown: {
          billAmount: consultationFee,
          copayAmount: 0,
          copayPercentage: 0,
          insuranceEligibleAmount: consultationFee,
          serviceTransactionLimit: null,
          insurancePayment: 0,
          excessAmount: 0,
          totalMemberPayment: consultationFee,
          walletBalance: 0,
          walletDebitAmount: 0,
          needsPayment: true,
          wasServiceLimitApplied: false,
        },
        warnings: ['No active insurance policy - full payment required'],
      };
    }

    // Step 5: Extract policyId
    let policyId: string;
    if (typeof activeAssignment.policyId === 'object' && activeAssignment.policyId._id) {
      policyId = activeAssignment.policyId._id.toString();
    } else if (typeof activeAssignment.policyId === 'string') {
      policyId = activeAssignment.policyId;
    } else {
      policyId = activeAssignment.policyId.toString();
    }
    console.log('✅ [POLICY] Found policyId:', policyId);

    // Step 6: Get user relationship (for limit lookups)
    let userRelationship = null;
    try {
      const userModel = this.appointmentModel.db.model('User');
      const userDoc = await userModel.findById(patientId).select('relationship').lean() as { relationship?: string } | null;
      if (userDoc && userDoc.relationship) {
        userRelationship = userDoc.relationship;
        console.log('✅ [USER] Found user relationship:', userRelationship);
      } else {
        console.log('⚠️ [USER] No relationship found for user, will use global config');
      }
    } catch (userError) {
      console.error('❌ [USER ERROR] Failed to fetch user relationship:', userError.message);
    }

    // Step 7: Get plan configuration
    const planConfig = await this.planConfigService.getConfig(policyId);
    if (!planConfig) {
      throw new BadRequestException('No active plan configuration found for policy');
    }
    console.log('📄 [POLICY] Plan config retrieved');

    // Step 8: Check if category is enabled in plan
    const categoryBenefit = planConfig.benefits && (planConfig.benefits as any)[categoryCode];
    const categoryEnabled = !!categoryBenefit;
    console.log('✅ [CATEGORY CHECK] Category enabled:', categoryEnabled);

    // DEBUG: Log category benefit structure
    if (categoryBenefit) {
      console.log('🔍 [DEBUG] Category benefit structure:', JSON.stringify(categoryBenefit, null, 2));
      if (categoryBenefit.serviceTransactionLimits) {
        console.log('🔍 [DEBUG] ServiceTransactionLimits keys:', Object.keys(categoryBenefit.serviceTransactionLimits));
        console.log('🔍 [DEBUG] ServiceTransactionLimits values:', JSON.stringify(categoryBenefit.serviceTransactionLimits, null, 2));
      }
    }

    if (!categoryEnabled) {
      console.log('⚠️ [VALIDATION] Category not covered - user pays full amount');
      return {
        isAllowed: true,
        breakdown: {
          billAmount: consultationFee,
          copayAmount: 0,
          copayPercentage: 0,
          insuranceEligibleAmount: consultationFee,
          serviceTransactionLimit: null,
          insurancePayment: 0,
          excessAmount: 0,
          totalMemberPayment: consultationFee,
          walletBalance,
          walletDebitAmount: 0,
          needsPayment: true,
          wasServiceLimitApplied: false,
        },
        warnings: ['This service is not covered by your policy - full payment required'],
      };
    }

    // Step 9: Calculate copay
    let copayCalculation = null;
    let copayAmount = 0;
    let copayPercentage = 0;
    let walletDebitAmount = consultationFee;

    try {
      const copayConfig = CopayResolver.resolve(planConfig, userRelationship);
      console.log('💰 [COPAY] Resolved copay config');

      copayCalculation = CopayCalculator.calculate(
        consultationFee,
        copayConfig || undefined
      );
      copayAmount = copayCalculation.copayAmount;
      // Calculate percentage based on copay config
      if (copayCalculation.copayConfig?.mode === 'PERCENT') {
        copayPercentage = copayCalculation.copayConfig.value;
      } else {
        copayPercentage = 0;
      }
      walletDebitAmount = copayCalculation.walletDebitAmount;
      console.log('💳 [COPAY] Calculation:', copayCalculation);
    } catch (error) {
      console.log('⚠️ [COPAY] Calculation failed:', error.message);
      // If copay calculation fails, assume full coverage
      copayAmount = 0;
      copayPercentage = 0;
      walletDebitAmount = consultationFee;
    }

    // Step 10: Apply service transaction limit (if specialtyObjectId available and configured)
    let serviceTransactionLimitResult = null;
    let excessAmount = 0;
    let totalMemberPayment = copayAmount;
    let insuranceEligibleAmount = consultationFee - copayAmount;
    let insurancePayment = insuranceEligibleAmount;

    if (specialtyObjectId && categoryEnabled) {
      console.log('🔍 [SERVICE LIMIT] Checking for specialty ObjectId:', specialtyObjectId);
      const serviceLimit = ServiceTransactionLimitCalculator.getServiceLimit(
        planConfig,
        categoryCode,
        specialtyObjectId,
        userRelationship
      );

      if (serviceLimit) {
        console.log('🔢 [SERVICE LIMIT] Configured limit:', serviceLimit);
        serviceTransactionLimitResult = ServiceTransactionLimitCalculator.calculate(
          consultationFee,
          copayAmount,
          serviceLimit
        );

        excessAmount = serviceTransactionLimitResult.excessAmount;
        totalMemberPayment = serviceTransactionLimitResult.totalMemberPayment;
        insurancePayment = serviceTransactionLimitResult.insurancePayment;
        walletDebitAmount = insurancePayment;

        console.log('📊 [SERVICE LIMIT] Result:', serviceTransactionLimitResult);
      } else {
        console.log('⚠️ [SERVICE LIMIT] No limit configured for this specialty');
      }
    } else {
      console.log('⚠️ [SERVICE LIMIT] Skipping - specialtyObjectId not available or category not enabled');
    }

    // Step 11: Determine if payment is needed
    const needsPayment = totalMemberPayment > 0;
    const wasServiceLimitApplied = excessAmount > 0;

    // Step 12: Build response
    const breakdown = {
      billAmount: consultationFee,
      copayAmount,
      copayPercentage,
      insuranceEligibleAmount,
      serviceTransactionLimit: serviceTransactionLimitResult?.serviceTransactionLimit || null,
      insurancePayment,
      excessAmount,
      totalMemberPayment,
      walletBalance,
      walletDebitAmount,
      needsPayment,
      wasServiceLimitApplied,
    };

    const warnings = [];
    if (wasServiceLimitApplied && serviceTransactionLimitResult) {
      warnings.push(
        `Service transaction limit of ₹${serviceTransactionLimitResult.serviceTransactionLimit} applied. You need to pay ₹${excessAmount} additional out-of-pocket.`
      );
    }
    if (walletBalance < walletDebitAmount) {
      warnings.push(
        `Insufficient wallet balance. Required: ₹${walletDebitAmount}, Available: ₹${walletBalance}`
      );
    }

    console.log('✅ [VALIDATE BOOKING] ========== VALIDATION COMPLETE ==========');
    console.log('📊 [BREAKDOWN] Result:', breakdown);

    return {
      isAllowed: true,
      breakdown,
      warnings,
    };
  }
}