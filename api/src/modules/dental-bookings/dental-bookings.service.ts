import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DentalBooking, DentalBookingDocument } from './schemas/dental-booking.schema';
import { CreateDentalBookingDto } from './dto/create-dental-booking.dto';
import { ValidateDentalBookingDto } from './dto/validate-dental-booking.dto';
import { AssignmentsService } from '../assignments/assignments.service';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../payments/payment.service';
import { PaymentType, ServiceType } from '../payments/schemas/payment.schema';
import { TransactionSummaryService } from '../transactions/transaction-summary.service';
import { TransactionServiceType, TransactionStatus, PaymentMethod } from '../transactions/schemas/transaction-summary.schema';
import { ClinicServicePricingService } from '../operations/dental-services/clinic-service-pricing.service';
import { DentalServiceSlot, DentalServiceSlotDocument } from '../operations/dental-services/schemas/dental-service-slot.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { ServiceMaster, ServiceMasterDocument } from '../masters/schemas/service-master.schema';
import { CopayCalculator } from '../plan-config/utils/copay-calculator';
import { ServiceTransactionLimitCalculator } from '../plan-config/utils/service-transaction-limit-calculator';
import { BenefitResolver } from '../plan-config/utils/benefit-resolver';
import { CopayResolver } from '../plan-config/utils/copay-resolver';
import { PolicyServicesConfigService } from '../plan-config/policy-services-config.service';
import { DentalInvoiceService } from './dental-invoice.service';
import { AdminQueryBookingsDto } from './dto/admin-query-bookings.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DentalBookingsService {
  constructor(
    @InjectModel(DentalBooking.name)
    private dentalBookingModel: Model<DentalBookingDocument>,
    @InjectModel(DentalServiceSlot.name)
    private dentalServiceSlotModel: Model<DentalServiceSlotDocument>,
    @InjectModel(Clinic.name)
    private clinicModel: Model<ClinicDocument>,
    @InjectModel(ServiceMaster.name)
    private serviceMasterModel: Model<ServiceMasterDocument>,
    private assignmentsService: AssignmentsService,
    private planConfigService: PlanConfigService,
    private walletService: WalletService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
    private transactionSummaryService: TransactionSummaryService,
    private clinicServicePricingService: ClinicServicePricingService,
    private policyServicesConfigService: PolicyServicesConfigService,
    @Inject(forwardRef(() => DentalInvoiceService))
    private dentalInvoiceService: DentalInvoiceService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 1. Get member's allowed dental services (CAT006)
   */
  async getMemberAllowedServices(userId: string) {
    console.log('[DentalBookings] Fetching assigned services for user:', userId);

    // Get user's active assignment
    const assignments = await this.assignmentsService.getUserAssignments(userId);
    const assignment = assignments && assignments.length > 0 ? assignments[0] : null;

    if (!assignment) {
      throw new NotFoundException('No active policy assignment found for user');
    }

    // Get policyId as string
    const policyId = typeof assignment.policyId === 'object' && assignment.policyId._id
      ? assignment.policyId._id.toString()
      : assignment.policyId.toString();

    // Get current plan config
    const planConfig = await this.planConfigService.getConfig(policyId);
    if (!planConfig) {
      throw new NotFoundException('Plan configuration not found');
    }

    // Get allowed service codes from policy services config
    const allowedServiceCodes = await this.policyServicesConfigService.getMemberAllowedServices(
      userId,
      'CAT006',
    );

    console.log('[DentalBookings] Allowed service codes:', allowedServiceCodes);

    // Fetch service details from service master
    const services = await this.serviceMasterModel
      .find({
        code: { $in: allowedServiceCodes },
        category: 'CAT006',
        isActive: true,
      })
      .lean();

    console.log('[DentalBookings] Found services:', services.length);

    // Get dental benefit config for coverage info
    const dentalBenefit = BenefitResolver.resolve(
      planConfig,
      'CAT006',
      assignment.relationshipId,
    );

    // Map services with pricing and coverage info
    const servicesWithDetails = services.map((service) => ({
      code: service.code,
      name: service.name,
      description: service.description || '',
      priceRange: {
        min: 0,
        max: 0,
      },
      coveragePercentage: dentalBenefit?.coveragePercentage || 0,
      copayAmount: dentalBenefit?.copayAmount || 0,
    }));

    return {
      services: servicesWithDetails,
      benefit: dentalBenefit,
    };
  }

  /**
   * 2. Get clinics offering specific dental service within pincode/city area
   */
  async getClinicsForService(serviceCode: string, pincode?: string, city?: string) {
    console.log('[DentalBookings] Searching clinics for service:', serviceCode, 'pincode:', pincode, 'city:', city);

    // Get all clinics with the service enabled
    const clinicsWithService = await this.clinicServicePricingService.getClinicsWithServiceEnabled(serviceCode);

    console.log('[DentalBookings] Found clinics with service enabled:', clinicsWithService.length);

    // Filter by location if provided
    let filteredClinics = clinicsWithService;
    if (pincode || city) {
      filteredClinics = clinicsWithService.filter((clinic) => {
        if (pincode && clinic.address?.pincode === pincode) {
          return true;
        }
        if (city && clinic.address?.city?.toLowerCase() === city.toLowerCase()) {
          return true;
        }
        return false;
      });
    }

    console.log('[DentalBookings] Clinics after location filter:', filteredClinics.length);

    // Get available slots count for each clinic
    const clinicsWithAvailability = await Promise.all(
      filteredClinics.map(async (clinic: any) => {
        const today = new Date().toISOString().split('T')[0];
        const slotsCount = await this.dentalServiceSlotModel.countDocuments({
          clinicId: clinic.clinicId,
          date: { $gte: today },
          isActive: true,
        });

        return {
          clinicId: clinic.clinicId,
          clinicName: clinic.name,
          address: clinic.address,
          contactNumber: clinic.contactNumber || 'N/A',
          servicePrice: clinic.servicePrice || 0,
          availableSlots: slotsCount,
        };
      }),
    );

    return {
      clinics: clinicsWithAvailability,
    };
  }

  /**
   * 3. Get available time slots for clinic on specific date
   */
  async getAvailableSlots(clinicId: string, date: string) {
    console.log('[DentalBookings] Loading slots for clinic:', clinicId, 'date:', date);

    // Fetch slot configuration for the clinic and date
    const slotConfig = await this.dentalServiceSlotModel
      .findOne({
        clinicId,
        date,
        isActive: true,
      })
      .lean();

    if (!slotConfig) {
      console.log('[DentalBookings] No slot configuration found for this date');
      return { slots: [] };
    }

    // Get existing bookings for this clinic and date
    const existingBookings = await this.dentalBookingModel
      .find({
        clinicId,
        appointmentDate: new Date(date),
        status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
      })
      .lean();

    // Count bookings per time slot
    const bookingsCountByTime = existingBookings.reduce((acc, booking) => {
      acc[booking.appointmentTime] = (acc[booking.appointmentTime] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate time slots based on configuration
    const slots = [];
    const startHour = parseInt(slotConfig.startTime.split(':')[0]);
    const startMinute = parseInt(slotConfig.startTime.split(':')[1]);
    const endHour = parseInt(slotConfig.endTime.split(':')[0]);
    const endMinute = parseInt(slotConfig.endTime.split(':')[1]);

    let currentTime = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    while (currentTime < endTimeMinutes) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const bookedCount = bookingsCountByTime[timeString] || 0;
      const isAvailable = bookedCount < slotConfig.maxAppointments;

      slots.push({
        _id: `${slotConfig._id.toString()}-${timeString}`, // Unique ID per time slot
        slotId: slotConfig._id.toString(),
        date: slotConfig.date,
        startTime: timeString,
        endTime: `${Math.floor((currentTime + slotConfig.slotDuration) / 60).toString().padStart(2, '0')}:${((currentTime + slotConfig.slotDuration) % 60).toString().padStart(2, '0')}`,
        isAvailable: isAvailable, // Changed from 'available'
        currentBookings: bookedCount, // Changed from 'bookedCount'
        maxAppointments: slotConfig.maxAppointments,
      });

      currentTime += slotConfig.slotDuration;
    }

    console.log('[DentalBookings] Generated slots:', slots.length);

    return { slots };
  }

  /**
   * 4. Pre-validate booking and return payment breakdown
   */
  async validateBooking(userId: string, validateDto: ValidateDentalBookingDto) {
    console.log('[DentalBookings] Validating booking:', { userId, ...validateDto });

    try {
      // 1. Validate slot availability
      const slot = await this.dentalServiceSlotModel.findById(validateDto.slotId);
      if (!slot) {
        throw new BadRequestException('Slot not found');
      }

      // 2. Get user's active assignment and plan config
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

      // 3. Resolve dental benefits
      const dentalBenefit = BenefitResolver.resolve(
        planConfig,
        'CAT006',
        assignment.relationshipId,
      );

      if (!dentalBenefit) {
        throw new BadRequestException('Dental benefits not available for this user');
      }

      // 4. Get copay config
      const copayConfig = CopayResolver.resolve(planConfig, assignment.relationshipId) || undefined;

      // 5. Calculate copay
      const copayCalc = CopayCalculator.calculate(validateDto.price, copayConfig);

      // 6. Get service transaction limit from benefit config
      const serviceLimit = dentalBenefit?.serviceTransactionLimits?.[validateDto.serviceCode] || null;
      console.log('[DentalBookings] Service transaction limit for', validateDto.serviceCode, ':', serviceLimit);

      // 7. Apply service transaction limit
      const limitCalc = ServiceTransactionLimitCalculator.calculate(
        validateDto.price,
        copayCalc.copayAmount,
        serviceLimit,
      );

      // 7. Get wallet balance
      const wallet = await this.walletService.getUserWallet(userId);
      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      const walletBalance = wallet.totalBalance?.current || 0;

      // 8. Calculate payment breakdown
      const walletDebitAmount = limitCalc.insurancePayment;
      const memberPayment = limitCalc.totalMemberPayment;
      const insufficientBalance = walletBalance < walletDebitAmount;

      console.log('[DentalBookings] Payment breakdown:', {
        billAmount: validateDto.price,
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
          billAmount: validateDto.price,
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
      console.error('[DentalBookings] Validation error:', error);
      return {
        valid: false,
        breakdown: null,
        warnings: [error.message],
      };
    }
  }

  /**
   * 5. Create dental booking with payment processing
   */
  async create(userId: string, createDto: CreateDentalBookingDto) {
    console.log('[DentalBookings] Creating booking for user:', userId, createDto);
    console.log('[DentalBookings] paymentAlreadyProcessed flag:', createDto.paymentAlreadyProcessed);

    // 1. Validate slot availability
    const slot = await this.dentalServiceSlotModel.findById(createDto.slotId);
    if (!slot) {
      throw new BadRequestException('Slot not found');
    }

    // Check slot not fully booked
    const existingBookingsCount = await this.dentalBookingModel.countDocuments({
      slotId: new Types.ObjectId(createDto.slotId),
      appointmentDate: new Date(createDto.appointmentDate),
      appointmentTime: createDto.appointmentTime,
      status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
    });

    if (existingBookingsCount >= slot.maxAppointments) {
      throw new BadRequestException('This slot is fully booked');
    }

    // 2. Get user assignment and plan config
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

    // 3. Get patient details from User model
    const userModel = this.dentalBookingModel.db.model('User');
    const patient = await userModel
      .findById(createDto.patientId)
      .select('name relationship')
      .lean() as { name: { firstName: string; lastName: string }; relationship: string } | null;

    if (!patient) {
      throw new BadRequestException('Patient not found');
    }

    // Construct full name from firstName and lastName
    const patientFullName = `${patient.name.firstName} ${patient.name.lastName}`;

    // 4. Get clinic details
    const clinic = await this.clinicModel.findOne({ clinicId: createDto.clinicId }).lean();
    if (!clinic) {
      throw new BadRequestException('Clinic not found');
    }

    // 5. Calculate payment breakdown
    const validation = await this.validateBooking(userId, {
      patientId: createDto.patientId,
      clinicId: createDto.clinicId,
      serviceCode: createDto.serviceCode,
      slotId: createDto.slotId,
      price: createDto.price,
    });

    if (!validation.valid || !validation.breakdown) {
      throw new BadRequestException('Booking validation failed: ' + validation.warnings.join(', '));
    }

    const breakdown = validation.breakdown;

    // 6. Generate booking ID
    const bookingId = this.generateBookingId();

    // 7. Create booking document
    const booking = await this.dentalBookingModel.create({
      bookingId,
      userId: new Types.ObjectId(userId),
      patientId: createDto.patientId,
      patientName: patientFullName,
      patientRelationship: patient.relationship || 'REL001',
      serviceCode: createDto.serviceCode,
      serviceName: createDto.serviceName,
      categoryCode: 'CAT006',
      clinicId: createDto.clinicId,
      clinicName: clinic.name,
      clinicAddress: {
        street: (clinic.address as any)?.street || (clinic.address as any)?.line1 || '',
        city: clinic.address?.city || '',
        state: clinic.address?.state || '',
        pincode: clinic.address?.pincode || (clinic.address as any)?.zipCode || '',
      },
      clinicContact: clinic.contactNumber || '',
      slotId: new Types.ObjectId(createDto.slotId),
      appointmentDate: new Date(createDto.appointmentDate),
      appointmentTime: createDto.appointmentTime,
      duration: 30,
      servicePrice: createDto.price,
      billAmount: createDto.price,
      copayAmount: breakdown.copayAmount,
      insuranceEligibleAmount: breakdown.insuranceEligibleAmount,
      serviceTransactionLimit: breakdown.serviceTransactionLimit,
      insurancePayment: breakdown.insurancePayment,
      excessAmount: breakdown.excessAmount,
      totalMemberPayment: breakdown.totalMemberPayment,
      walletDebitAmount: breakdown.walletDebitAmount,
      paymentMethod: 'WALLET_ONLY',
      paymentStatus: 'PENDING',
      status: 'PENDING_CONFIRMATION',
      bookingSource: 'MEMBER_PORTAL',
      bookedAt: new Date(),
      policyId: assignment.policyId,
      planConfigId: new Types.ObjectId((planConfig._id as any).toString()),
      assignmentId: new Types.ObjectId((assignment._id as any).toString()),
    });

    console.log('[DentalBookings] Booking document created:', bookingId);

    // 8. Check if payment was already processed externally (e.g., by PaymentProcessor)
    if (createDto.paymentAlreadyProcessed) {
      console.log('[DentalBookings] Payment already processed externally, debiting wallet and keeping status as PENDING_CONFIRMATION');

      // Debit wallet for insurance portion
      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT006',
        (booking._id as Types.ObjectId).toString(),
        ServiceType.DENTAL,
        clinic.name,
        `Dental booking: ${createDto.serviceName}`,
      );

      console.log('[DentalBookings] Wallet debited:', breakdown.walletDebitAmount, 'for insurance portion');

      booking.paymentStatus = 'COMPLETED';
      // Keep status as PENDING_CONFIRMATION - clinic will confirm later
      booking.paymentMethod = 'COPAY';

      // Link payment to booking if paymentId is provided
      if (createDto.paymentId) {
        booking.paymentId = new Types.ObjectId(createDto.paymentId);
        console.log('[DentalBookings] Linked payment to booking:', createDto.paymentId);

        // Update payment record with correct booking references
        try {
          await this.paymentService.updatePaymentServiceLink(
            createDto.paymentId,
            (booking._id as Types.ObjectId).toString(),
            bookingId,
            ServiceType.DENTAL,
          );
          console.log('[DentalBookings] Updated payment service link to booking:', bookingId);
        } catch (error) {
          console.error('[DentalBookings] Failed to update payment service link:', error);
        }
      }

      await booking.save();

      // Create transaction summary
      const transaction = await this.transactionSummaryService.createTransaction({
        userId,
        serviceType: TransactionServiceType.DENTAL,
        serviceId: (booking._id as Types.ObjectId).toString(),
        serviceReferenceId: bookingId,
        serviceName: createDto.serviceName,
        serviceDate: new Date(createDto.appointmentDate),
        totalAmount: createDto.price,
        walletAmount: breakdown.walletDebitAmount,
        selfPaidAmount: breakdown.totalMemberPayment,
        copayAmount: breakdown.copayAmount,
        paymentMethod: PaymentMethod.COPAY,
        categoryCode: 'CAT006',
        categoryName: 'Dental Services',
        description: `Dental booking: ${createDto.serviceName}`,
        status: TransactionStatus.COMPLETED,
      });

      booking.transactionId = new Types.ObjectId((transaction as any)._id.toString());
      await booking.save();

      console.log('[DentalBookings] Booking created successfully:', bookingId);
      return booking;
    }

    // 9. Process payment based on scenario
    const wallet = await this.walletService.getUserWallet(userId);
    const walletBalance = wallet?.totalBalance?.current || 0;

    if (walletBalance >= breakdown.walletDebitAmount && breakdown.totalMemberPayment === 0) {
      // Scenario A: Wallet only, no copay
      console.log('[DentalBookings] Scenario A: Wallet-only payment');

      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT006',
        (booking._id as Types.ObjectId).toString(),
        ServiceType.DENTAL,
        clinic.name,
        `Dental booking: ${createDto.serviceName}`,
      );

      booking.paymentStatus = 'COMPLETED';
      // Keep status as PENDING_CONFIRMATION - clinic will confirm later
      booking.paymentMethod = 'WALLET_ONLY';
      await booking.save();

      console.log('[DentalBookings] Wallet debited:', breakdown.walletDebitAmount, 'Status: PENDING_CONFIRMATION');
    } else if (walletBalance >= breakdown.walletDebitAmount && breakdown.totalMemberPayment > 0) {
      // Scenario B: Wallet + copay
      console.log('[DentalBookings] Scenario B: Wallet + copay payment');

      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT006',
        (booking._id as Types.ObjectId).toString(),
        ServiceType.DENTAL,
        clinic.name,
        `Dental booking: ${createDto.serviceName} (partial)`,
      );

      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: breakdown.totalMemberPayment,
        paymentType: PaymentType.COPAY,
        serviceType: ServiceType.DENTAL,
        serviceId: (booking._id as Types.ObjectId).toString(),
        serviceReferenceId: bookingId,
        description: `Dental booking copay: ${createDto.serviceName}`,
      });

      booking.paymentId = new Types.ObjectId((payment as any)._id.toString());
      booking.paymentMethod = 'COPAY';
      await booking.save();

      console.log('[DentalBookings] Wallet debited:', breakdown.walletDebitAmount, 'Copay required:', breakdown.totalMemberPayment);
    } else {
      // Scenario C: Insufficient balance
      console.log('[DentalBookings] Scenario C: Insufficient wallet balance');

      const shortfall = breakdown.walletDebitAmount - walletBalance;
      const totalPayment = shortfall + breakdown.totalMemberPayment;

      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: totalPayment,
        paymentType: PaymentType.OUT_OF_POCKET,
        serviceType: ServiceType.DENTAL,
        serviceId: (booking._id as Types.ObjectId).toString(),
        serviceReferenceId: bookingId,
        description: `Dental booking payment: ${createDto.serviceName}`,
      });

      booking.paymentId = new Types.ObjectId((payment as any)._id.toString());
      booking.paymentMethod = 'OUT_OF_POCKET';
      await booking.save();

      console.log('[DentalBookings] Insufficient balance. Total payment required:', totalPayment);
    }

    // 9. Create transaction summary
    const transaction = await this.transactionSummaryService.createTransaction({
      userId,
      serviceType: TransactionServiceType.DENTAL,
      serviceId: (booking._id as Types.ObjectId).toString(),
      serviceReferenceId: bookingId,
      serviceName: createDto.serviceName,
      serviceDate: new Date(createDto.appointmentDate),
      totalAmount: createDto.price,
      walletAmount: breakdown.walletDebitAmount,
      selfPaidAmount: breakdown.totalMemberPayment,
      copayAmount: breakdown.copayAmount,
      paymentMethod: booking.paymentMethod as any,
      categoryCode: 'CAT006',
      description: `Dental booking: ${createDto.serviceName} at ${clinic.name}`,
    });

    booking.transactionId = new Types.ObjectId((transaction as any)._id.toString());
    await booking.save();

    // Send notification for booking creation
    const dateStr = new Date(createDto.appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    await this.notificationsService.notifyAppointmentCreated(
      userId,
      bookingId,
      'DENTAL',
      clinic.name,
      dateStr,
      createDto.appointmentTime,
    );

    console.log('[DentalBookings] Booking created successfully:', bookingId);

    return booking;
  }

  /**
   * 6. Get all dental bookings for user
   */
  async getUserBookings(userId: string, viewingUserId?: string) {
    console.log('[DentalBookings] Loading user dental bookings for:', userId);

    const query: any = { userId: new Types.ObjectId(userId) };

    // Filter by viewing user for privacy (family members)
    if (viewingUserId && viewingUserId !== userId) {
      query.patientId = viewingUserId;
    }

    const bookings = await this.dentalBookingModel
      .find(query)
      .sort({ appointmentDate: -1 })
      .lean();

    console.log('[DentalBookings] Found bookings:', bookings.length);

    return bookings;
  }

  /**
   * 7. Get single booking by ID
   */
  async getBookingById(bookingId: string, userId: string) {
    console.log('[DentalBookings] Fetching booking:', bookingId);

    const booking = await this.dentalBookingModel
      .findOne({
        bookingId,
        userId: new Types.ObjectId(userId),
      })
      .lean();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * 8. Cancel booking and process refund
   */
  async cancelBooking(bookingId: string, userId: string, reason: string) {
    console.log('[DentalBookings] Cancelling booking:', bookingId, 'Reason:', reason);

    const booking = await this.dentalBookingModel.findOne({
      bookingId,
      userId: new Types.ObjectId(userId),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Check cancellation policy (e.g., 24 hours before appointment)
    const appointmentTime = new Date(booking.appointmentDate).getTime();
    const now = new Date().getTime();
    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      throw new BadRequestException('Cannot cancel booking less than 24 hours before appointment');
    }

    // Process refund if wallet was debited
    if (booking.walletDebitAmount > 0 && (booking.paymentStatus === 'COMPLETED' || booking.status === 'CONFIRMED')) {
      await this.walletService.creditWallet(
        userId,
        booking.walletDebitAmount,
        'CAT006',
        (booking._id as Types.ObjectId).toString(),
        'DENTAL',
        booking.clinicName,
        `Refund for cancelled dental booking: ${booking.serviceName}`,
      );

      console.log('[DentalBookings] Wallet refunded:', booking.walletDebitAmount);
      booking.paymentStatus = 'REFUNDED';
    }

    // Process self-paid/copay refund through payment service
    if (booking.paymentId) {
      try {
        console.log('[DentalBookings] Processing self-paid refund for paymentId:', booking.paymentId);
        const refundResult = await this.paymentService.processRefund(
          booking.paymentId.toString(),
          `Refund for cancelled dental booking: ${booking.serviceName}`,
        );
        if (refundResult) {
          console.log('[DentalBookings] Self-paid refund processed:', refundResult.amount);
        }
      } catch (refundError: any) {
        if (!refundError.message?.includes('only refund completed')) {
          console.error('[DentalBookings] Failed to process self-paid refund:', refundError);
        } else {
          console.log('[DentalBookings] Payment was not completed, no self-paid refund needed');
        }
      }
    }

    // Update booking status
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    // Send notification for booking cancellation
    const dateStr = booking.appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    await this.notificationsService.notifyAppointmentCancelled(
      userId,
      bookingId,
      'DENTAL',
      booking.clinicName,
      dateStr,
      reason,
    );

    console.log('[DentalBookings] Booking cancelled:', bookingId);

    return booking;
  }

  /**
   * Helper: Generate unique booking ID
   */
  private generateBookingId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `DEN-BOOK-${timestamp}-${random}`;
  }

  /**
   * Handle payment completion callback
   */
  async handlePaymentComplete(paymentId: string) {
    console.log('[DentalBookings] Handling payment completion for:', paymentId);

    const booking = await this.dentalBookingModel.findOne({
      paymentId: new Types.ObjectId(paymentId),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found for payment');
    }

    booking.paymentStatus = 'COMPLETED';
    // Keep status as PENDING_CONFIRMATION - clinic will confirm later
    await booking.save();

    console.log('[DentalBookings] Payment completed for booking:', booking.bookingId);

    return booking;
  }

  /**
   * ADMIN METHODS
   */

  /**
   * Admin: Get all bookings with pagination and filters
   */
  async findAllBookings(query: AdminQueryBookingsDto) {
    console.log('[DentalBookingsAdmin] Finding all bookings with filters:', query);

    const page = parseInt(query.page?.toString() || '1');
    const limit = parseInt(query.limit?.toString() || '20');
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Status filter
    if (query.status) {
      filter.status = query.status;
    }

    // Clinic filter
    if (query.clinicId) {
      filter.clinicId = query.clinicId;
    }

    // Service code filter
    if (query.serviceCode) {
      filter.serviceCode = query.serviceCode;
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      filter.appointmentDate = {};
      if (query.dateFrom) {
        filter.appointmentDate.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.appointmentDate.$lte = new Date(query.dateTo);
      }
    }

    // Search term (patient name, booking ID)
    if (query.searchTerm) {
      filter.$or = [
        { patientName: { $regex: query.searchTerm, $options: 'i' } },
        { bookingId: { $regex: query.searchTerm, $options: 'i' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.dentalBookingModel
        .find(filter)
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.dentalBookingModel.countDocuments(filter),
    ]);

    console.log('[DentalBookingsAdmin] Found:', bookings.length, 'Total:', total);

    return {
      data: bookings,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin: Confirm pending booking
   */
  async confirmBooking(bookingId: string) {
    console.log('[DentalBookingsAdmin] Confirming booking:', bookingId);

    const booking = await this.dentalBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date();
    await booking.save();

    console.log('[DentalBookingsAdmin] Booking confirmed:', bookingId);

    return booking;
  }

  /**
   * Admin: Cancel booking and process refund
   */
  async adminCancelBooking(bookingId: string, reason: string) {
    console.log('[DentalBookingsAdmin] Admin cancelling booking:', bookingId, 'Reason:', reason);

    const booking = await this.dentalBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Process refund if wallet was debited (follow appointments pattern)
    if (booking.walletDebitAmount > 0 &&
        (booking.paymentStatus === 'COMPLETED' || booking.status === 'CONFIRMED')) {
      console.log('[DentalBookingsAdmin] Processing wallet refund:', booking.walletDebitAmount);

      await this.walletService.creditWallet(
        booking.userId.toString(),
        booking.walletDebitAmount,
        'CAT006',
        (booking._id as Types.ObjectId).toString(),
        'DENTAL',
        booking.clinicName,
        `Admin cancellation refund: ${booking.serviceName} - Reason: ${reason}`,
      );

      console.log('[DentalBookingsAdmin] Wallet refunded:', booking.walletDebitAmount);
      booking.paymentStatus = 'REFUNDED';
    }

    // Process self-paid/copay refund through payment service
    if (booking.paymentId) {
      try {
        console.log('[DentalBookingsAdmin] Processing self-paid refund for paymentId:', booking.paymentId);
        const refundResult = await this.paymentService.processRefund(
          booking.paymentId.toString(),
          `Admin cancellation refund: ${booking.serviceName} - Reason: ${reason}`,
        );
        if (refundResult) {
          console.log('[DentalBookingsAdmin] Self-paid refund processed:', refundResult.amount);
        }
      } catch (refundError: any) {
        if (!refundError.message?.includes('only refund completed')) {
          console.error('[DentalBookingsAdmin] Failed to process self-paid refund:', refundError);
        } else {
          console.log('[DentalBookingsAdmin] Payment was not completed, no self-paid refund needed');
        }
      }
    } else {
      console.log('[DentalBookingsAdmin] No paymentId on booking - no self-paid refund to process');
    }

    // Update booking status
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'ADMIN';
    booking.cancellationReason = reason;
    await booking.save();

    // Update transaction status if exists
    if (booking.transactionId) {
      try {
        await this.transactionSummaryService.updateTransactionStatus(
          booking.transactionId.toString(),
          TransactionStatus.REFUNDED,
        );
      } catch (error) {
        console.error('[DentalBookingsAdmin] Failed to update transaction:', error);
      }
    }

    console.log('[DentalBookingsAdmin] Booking cancelled:', bookingId);

    return booking;
  }

  /**
   * Admin: Reschedule booking to different slot
   */
  async rescheduleBooking(bookingId: string, rescheduleDto: RescheduleBookingDto) {
    console.log('[DentalBookingsAdmin] Rescheduling booking:', bookingId, rescheduleDto);

    const booking = await this.dentalBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot reschedule cancelled or completed bookings');
    }

    // Validate new slot availability
    const newSlot = await this.dentalServiceSlotModel.findById(rescheduleDto.slotId);
    if (!newSlot) {
      throw new BadRequestException('New slot not found');
    }

    // Check if new slot is available
    const existingBookingsCount = await this.dentalBookingModel.countDocuments({
      slotId: new Types.ObjectId(rescheduleDto.slotId),
      appointmentDate: new Date(rescheduleDto.appointmentDate),
      appointmentTime: rescheduleDto.appointmentTime,
      status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
    });

    if (existingBookingsCount >= newSlot.maxAppointments) {
      throw new BadRequestException('New slot is fully booked');
    }

    // Store original date for history
    const oldDate = booking.appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    booking.rescheduledFrom = booking.appointmentDate;
    booking.rescheduledReason = rescheduleDto.reason;

    // Update to new slot
    booking.slotId = new Types.ObjectId(rescheduleDto.slotId);
    booking.appointmentDate = new Date(rescheduleDto.appointmentDate);
    booking.appointmentTime = rescheduleDto.appointmentTime;

    await booking.save();

    // Send notification for booking reschedule
    const newDate = booking.appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    await this.notificationsService.notifyAppointmentRescheduled(
      booking.userId.toString(),
      bookingId,
      'DENTAL',
      booking.clinicName,
      oldDate,
      newDate,
      rescheduleDto.appointmentTime,
    );

    console.log('[DentalBookingsAdmin] Booking rescheduled:', bookingId);

    return booking;
  }

  /**
   * Admin: Mark booking as no-show (after appointment time)
   */
  async markNoShow(bookingId: string) {
    console.log('[DentalBookingsAdmin] Marking as no-show:', bookingId);

    const booking = await this.dentalBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot mark cancelled or completed bookings as no-show');
    }

    // Validate appointment time has passed
    // Appointment times are stored in IST (UTC+5:30), need to convert to UTC for comparison
    const appointmentDateStr = booking.appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const appointmentTimeParts = booking.appointmentTime.split(':');

    // Create datetime in UTC by treating the stored time as IST and converting to UTC
    // IST is UTC+5:30, so we subtract 5 hours 30 minutes to get UTC
    const appointmentDateTimeIST = new Date(`${appointmentDateStr}T${booking.appointmentTime}:00+05:30`);

    const now = new Date();

    console.log('[DentalBookingsAdmin] No-show validation:', {
      appointmentDate: appointmentDateStr,
      appointmentTime: booking.appointmentTime,
      appointmentDateTimeIST: appointmentDateTimeIST.toString(),
      appointmentDateTimeUTC: appointmentDateTimeIST.toISOString(),
      now: now.toString(),
      nowUTC: now.toISOString(),
      isPast: appointmentDateTimeIST <= now,
    });

    if (appointmentDateTimeIST > now) {
      throw new BadRequestException(
        'Cannot mark as no-show before appointment time. Appointment is scheduled for future.',
      );
    }

    // No refund for no-shows
    booking.status = 'NO_SHOW';
    booking.noShowAt = new Date();
    await booking.save();

    // Update transaction status if exists
    if (booking.transactionId) {
      try {
        await this.transactionSummaryService.updateTransactionStatus(
          booking.transactionId.toString(),
          TransactionStatus.CANCELLED,
        );
      } catch (error) {
        console.error('[DentalBookingsAdmin] Failed to update transaction:', error);
      }
    }

    console.log('[DentalBookingsAdmin] Booking marked as no-show:', bookingId);

    return booking;
  }

  /**
   * Admin: Mark as completed and generate invoice
   */
  async completeBooking(bookingId: string) {
    console.log('[DentalBookingsAdmin] Completing booking and generating invoice:', bookingId);

    const booking = await this.dentalBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed bookings can be marked as completed');
    }

    // Update booking status
    booking.status = 'COMPLETED';
    booking.completedAt = new Date();
    await booking.save();

    // Update transaction status if exists
    if (booking.transactionId) {
      try {
        await this.transactionSummaryService.updateTransactionStatus(
          booking.transactionId.toString(),
          TransactionStatus.COMPLETED,
        );
      } catch (error) {
        console.error('[DentalBookingsAdmin] Failed to update transaction:', error);
      }
    }

    // Generate invoice
    console.log('[DentalBookingsAdmin] Generating invoice for booking:', bookingId);
    const invoice = await this.dentalInvoiceService.generateInvoice(booking);

    // Update booking with invoice details
    booking.invoiceId = invoice.invoiceId;
    booking.invoicePath = invoice.filePath;
    booking.invoiceFileName = invoice.fileName;
    booking.invoiceGenerated = true;
    booking.invoiceGeneratedAt = new Date();
    await booking.save();

    console.log('[DentalBookingsAdmin] Booking completed and invoice generated:', bookingId);

    return {
      booking,
      invoice,
    };
  }

  /**
   * Get invoice file details for download (admin)
   */
  async getInvoice(bookingId: string) {
    console.log('[DentalBookingsAdmin] Getting invoice for booking:', bookingId);

    const booking = await this.dentalBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!booking.invoiceGenerated || !booking.invoicePath) {
      throw new NotFoundException('Invoice not generated for this booking');
    }

    return {
      filePath: booking.invoicePath,
      fileName: booking.invoiceFileName,
      invoiceId: booking.invoiceId,
    };
  }

  /**
   * Get invoice file details for download (member-facing with ownership check)
   */
  async getMemberInvoice(bookingId: string, userId: string) {
    console.log('[DentalBookings] Member getting invoice for booking:', bookingId, 'User:', userId);

    const booking = await this.dentalBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify ownership
    if (booking.userId.toString() !== userId) {
      console.log('[DentalBookings] Access denied - booking belongs to different user');
      throw new ForbiddenException('You do not have access to this invoice');
    }

    // Verify invoice exists
    if (!booking.invoiceGenerated || !booking.invoicePath) {
      throw new NotFoundException('Invoice not generated for this booking');
    }

    // Verify booking is completed
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Invoice is only available for completed bookings');
    }

    console.log('[DentalBookings] Invoice access granted for:', bookingId);

    return {
      filePath: booking.invoicePath,
      fileName: booking.invoiceFileName,
      invoiceId: booking.invoiceId,
    };
  }
}
