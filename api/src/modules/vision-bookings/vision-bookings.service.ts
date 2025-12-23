import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VisionBooking, VisionBookingDocument } from './schemas/vision-booking.schema';
import { CreateVisionBookingDto } from './dto/create-vision-booking.dto';
import { ValidateVisionBookingDto } from './dto/validate-vision-booking.dto';
import { AssignmentsService } from '../assignments/assignments.service';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../payments/payment.service';
import { PaymentType, ServiceType } from '../payments/schemas/payment.schema';
import { TransactionSummaryService } from '../transactions/transaction-summary.service';
import { TransactionServiceType, TransactionStatus, PaymentMethod } from '../transactions/schemas/transaction-summary.schema';
import { ClinicServicePricingService } from '../operations/dental-services/clinic-service-pricing.service';
import { VisionServiceSlot, VisionServiceSlotDocument } from '../operations/vision-services/schemas/vision-service-slot.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { ServiceMaster, ServiceMasterDocument } from '../masters/schemas/service-master.schema';
import { CopayCalculator } from '../plan-config/utils/copay-calculator';
import { ServiceTransactionLimitCalculator } from '../plan-config/utils/service-transaction-limit-calculator';
import { BenefitResolver } from '../plan-config/utils/benefit-resolver';
import { CopayResolver } from '../plan-config/utils/copay-resolver';
import { PolicyServicesConfigService } from '../plan-config/policy-services-config.service';
import { VisionInvoiceService } from './vision-invoice.service';
import { AdminQueryBookingsDto } from '../dental-bookings/dto/admin-query-bookings.dto';
import { RescheduleBookingDto } from '../dental-bookings/dto/reschedule-booking.dto';
import { Payment } from '../payments/schemas/payment.schema';

@Injectable()
export class VisionBookingsService {
  constructor(
    @InjectModel(VisionBooking.name)
    private visionBookingModel: Model<VisionBookingDocument>,
    @InjectModel(VisionServiceSlot.name)
    private visionServiceSlotModel: Model<VisionServiceSlotDocument>,
    @InjectModel(Clinic.name)
    private clinicModel: Model<ClinicDocument>,
    @InjectModel(ServiceMaster.name)
    private serviceMasterModel: Model<ServiceMasterDocument>,
    @InjectModel(Payment.name)
    private paymentModel: Model<any>,
    private assignmentsService: AssignmentsService,
    private planConfigService: PlanConfigService,
    private walletService: WalletService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
    private transactionSummaryService: TransactionSummaryService,
    private clinicServicePricingService: ClinicServicePricingService,
    private policyServicesConfigService: PolicyServicesConfigService,
    @Inject(forwardRef(() => VisionInvoiceService))
    private visionInvoiceService: VisionInvoiceService,
  ) {}

  /**
   * 1. Get member's allowed vision services (CAT007)
   */
  async getMemberAllowedServices(userId: string) {
    console.log('[VisionBookings] Fetching assigned services for user:', userId);

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
      'CAT007',
    );

    console.log('[VisionBookings] Allowed service codes:', allowedServiceCodes);

    // Fetch service details from service master
    const services = await this.serviceMasterModel
      .find({
        code: { $in: allowedServiceCodes },
        category: 'CAT007',
        isActive: true,
      })
      .lean();

    console.log('[VisionBookings] Found services:', services.length);

    // Get vision benefit config for coverage info
    const visionBenefit = BenefitResolver.resolve(
      planConfig,
      'CAT007',
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
      coveragePercentage: visionBenefit?.coveragePercentage || 0,
      copayAmount: visionBenefit?.copayAmount || 0,
    }));

    return {
      services: servicesWithDetails,
      benefit: visionBenefit,
    };
  }

  /**
   * 2. Get clinics offering specific vision service within pincode/city area
   */
  async getClinicsForService(serviceCode: string, pincode?: string, city?: string) {
    console.log('[VisionBookings] Searching clinics for service:', serviceCode, 'pincode:', pincode, 'city:', city);

    // Get all clinics with the service enabled (CAT007 for vision)
    const clinicsWithService = await this.clinicServicePricingService.getClinicsWithServiceEnabled(serviceCode, 'CAT007');

    console.log('[VisionBookings] Found clinics with service enabled:', clinicsWithService.length);

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

    console.log('[VisionBookings] Clinics after location filter:', filteredClinics.length);

    // Get available slots count for each clinic
    const clinicsWithAvailability = await Promise.all(
      filteredClinics.map(async (clinic: any) => {
        const today = new Date().toISOString().split('T')[0];
        const slotsCount = await this.visionServiceSlotModel.countDocuments({
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
    console.log('[VisionBookings] Loading slots for clinic:', clinicId, 'date:', date);

    // Fetch slot configuration for the clinic and date
    const slotConfig = await this.visionServiceSlotModel
      .findOne({
        clinicId,
        date,
        isActive: true,
      })
      .lean();

    if (!slotConfig) {
      console.log('[VisionBookings] No slot configuration found for this date');
      return { slots: [] };
    }

    // Get existing bookings for this clinic and date
    const existingBookings = await this.visionBookingModel
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
        isAvailable: isAvailable,
        currentBookings: bookedCount,
        maxAppointments: slotConfig.maxAppointments,
      });

      currentTime += slotConfig.slotDuration;
    }

    console.log('[VisionBookings] Generated slots:', slots.length);

    return { slots };
  }

  /**
   * 4. Pre-validate booking and return payment breakdown
   */
  async validateBooking(userId: string, validateDto: ValidateVisionBookingDto) {
    console.log('[VisionBookings] Validating booking:', { userId, ...validateDto });

    try {
      // 1. Validate slot availability
      const slot = await this.visionServiceSlotModel.findById(validateDto.slotId);
      if (!slot) {
        throw new BadRequestException('Slot not found');
      }

      // 2. Calculate payment breakdown using shared helper
      const breakdown = await this.calculatePaymentBreakdown(
        validateDto.patientId,
        validateDto.serviceCode,
        validateDto.price,
      );

      // 3. Get wallet balance
      const wallet = await this.walletService.getUserWallet(userId);
      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      const walletBalance = wallet.totalBalance?.current || 0;
      const insufficientBalance = walletBalance < breakdown.walletDebitAmount;

      console.log('[VisionBookings] Validation result:', {
        walletBalance,
        walletDebitAmount: breakdown.walletDebitAmount,
        insufficientBalance,
      });

      return {
        valid: true,
        breakdown: {
          billAmount: validateDto.price,
          ...breakdown,
          walletBalance,
          insufficientBalance,
        },
        warnings: insufficientBalance ? ['Insufficient wallet balance'] : [],
      };
    } catch (error) {
      console.error('[VisionBookings] Validation error:', error);
      return {
        valid: false,
        breakdown: null,
        warnings: [error.message],
      };
    }
  }

  /**
   * PRIVATE HELPER: Calculate payment breakdown for a booking
   * Shared logic used by both validateBooking and generateBill
   */
  private async calculatePaymentBreakdown(
    patientId: string,
    serviceCode: string,
    billAmount: number,
  ): Promise<{
    copayAmount: number;
    insuranceEligibleAmount: number;
    serviceTransactionLimit: number | null;
    insurancePayment: number;
    excessAmount: number;
    totalMemberPayment: number;
    walletDebitAmount: number;
  }> {
    console.log('[VisionBookings] Calculating payment breakdown for patient:', patientId);

    // 1. Get patient's active assignment
    const assignments = await this.assignmentsService.getUserAssignments(patientId);
    const assignment = assignments && assignments.length > 0 ? assignments[0] : null;

    if (!assignment) {
      throw new BadRequestException(
        'Cannot calculate payment breakdown: Patient does not have an active policy assignment. Please verify patient enrollment.'
      );
    }

    // 2. Get policy ID
    const policyId = typeof assignment.policyId === 'object' && assignment.policyId._id
      ? assignment.policyId._id.toString()
      : assignment.policyId.toString();

    // 3. Get plan config
    const planConfig = await this.planConfigService.getConfig(policyId);
    if (!planConfig) {
      throw new BadRequestException('Plan configuration not found for patient policy');
    }

    // 4. Resolve vision benefits
    const visionBenefit = BenefitResolver.resolve(
      planConfig,
      'CAT007',
      assignment.relationshipId,
    );

    if (!visionBenefit) {
      throw new BadRequestException('Vision benefits not available for this patient');
    }

    // 5. Get copay config and calculate copay
    const copayConfig = CopayResolver.resolve(planConfig, assignment.relationshipId) || undefined;
    const copayCalc = CopayCalculator.calculate(billAmount, copayConfig);

    // 6. Get service transaction limit
    const serviceLimit = visionBenefit?.serviceTransactionLimits?.[serviceCode] || null;
    console.log('[VisionBookings] Service transaction limit for', serviceCode, ':', serviceLimit);

    // 7. Apply service transaction limit
    const limitCalc = ServiceTransactionLimitCalculator.calculate(
      billAmount,
      copayCalc.copayAmount,
      serviceLimit,
    );

    console.log('[VisionBookings] Payment breakdown calculated:', {
      billAmount,
      copayAmount: limitCalc.copayAmount,
      insuranceEligibleAmount: limitCalc.insuranceEligibleAmount,
      serviceTransactionLimit: limitCalc.serviceTransactionLimit,
      insurancePayment: limitCalc.insurancePayment,
      excessAmount: limitCalc.excessAmount,
      totalMemberPayment: limitCalc.totalMemberPayment,
      walletDebitAmount: limitCalc.insurancePayment, // Wallet pays the insurance portion
    });

    return {
      copayAmount: limitCalc.copayAmount,
      insuranceEligibleAmount: limitCalc.insuranceEligibleAmount,
      serviceTransactionLimit: limitCalc.serviceTransactionLimit,
      insurancePayment: limitCalc.insurancePayment,
      excessAmount: limitCalc.excessAmount,
      totalMemberPayment: limitCalc.totalMemberPayment,
      walletDebitAmount: limitCalc.insurancePayment,
    };
  }

  /**
   * 5. Create vision booking (no payment processing at booking time)
   */
  async create(userId: string, createDto: CreateVisionBookingDto) {
    console.log('[VisionBookings] Creating booking for user:', userId, createDto);

    // 1. Validate slot availability
    const slot = await this.visionServiceSlotModel.findById(createDto.slotId);
    if (!slot) {
      throw new BadRequestException('Slot not found');
    }

    // Check slot not fully booked
    const existingBookingsCount = await this.visionBookingModel.countDocuments({
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
    const userModel = this.visionBookingModel.db.model('User');
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

    // 5. Generate booking ID
    const bookingId = this.generateBookingId();

    // 6. Create booking document (no payment processing)
    const booking = await this.visionBookingModel.create({
      bookingId,
      userId: new Types.ObjectId(userId),
      patientId: createDto.patientId,
      patientName: patientFullName,
      patientRelationship: patient.relationship || 'REL001',
      serviceCode: createDto.serviceCode,
      serviceName: createDto.serviceName,
      categoryCode: 'CAT007',
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
      copayAmount: 0,
      insuranceEligibleAmount: 0,
      serviceTransactionLimit: null,
      insurancePayment: 0,
      excessAmount: 0,
      totalMemberPayment: 0,
      walletDebitAmount: 0,
      paymentMethod: 'WALLET_ONLY',
      paymentStatus: 'PENDING',
      status: 'PENDING_CONFIRMATION',
      bookingSource: 'MEMBER_PORTAL',
      bookedAt: new Date(),
      policyId: assignment.policyId,
      planConfigId: new Types.ObjectId((planConfig._id as any).toString()),
      assignmentId: new Types.ObjectId((assignment._id as any).toString()),
    });

    console.log('[VisionBookings] Booking created successfully:', bookingId, '- Status: PENDING_CONFIRMATION, Payment: PENDING');
    console.log('[VisionBookings] Payment will be processed after appointment confirmation by operations');

    return booking;
  }

  /**
   * 6. Get all vision bookings for user
   */
  async getUserBookings(userId: string, viewingUserId?: string) {
    console.log('[VisionBookings] Loading user vision bookings for:', userId);

    const query: any = { userId: new Types.ObjectId(userId) };

    // Filter by viewing user for privacy (family members)
    if (viewingUserId && viewingUserId !== userId) {
      query.patientId = viewingUserId;
    }

    const bookings = await this.visionBookingModel
      .find(query)
      .sort({ appointmentDate: -1 })
      .lean();

    console.log('[VisionBookings] Found bookings:', bookings.length);

    return bookings;
  }

  /**
   * 7. Get single booking by ID
   */
  async getBookingById(bookingId: string, userId: string) {
    console.log('[VisionBookings] Fetching booking:', bookingId);

    const booking = await this.visionBookingModel
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
    console.log('[VisionBookings] Cancelling booking:', bookingId, 'Reason:', reason);

    const booking = await this.visionBookingModel.findOne({
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
        'CAT007',
        (booking._id as Types.ObjectId).toString(),
        'VISION',
        booking.clinicName,
        `Refund for cancelled vision booking: ${booking.serviceName}`,
      );

      console.log('[VisionBookings] Wallet refunded:', booking.walletDebitAmount);
      booking.paymentStatus = 'REFUNDED';
    }

    // Update booking status
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    console.log('[VisionBookings] Booking cancelled:', bookingId);

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
    return `VIS-BOOK-${timestamp}-${random}`;
  }

  /**
   * ADMIN METHODS
   */

  /**
   * Admin: Get all bookings with pagination and filters
   */
  async findAllBookings(query: AdminQueryBookingsDto) {
    console.log('[VisionBookingsAdmin] Finding all bookings with filters:', query);

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
      this.visionBookingModel
        .find(filter)
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.visionBookingModel.countDocuments(filter),
    ]);

    console.log('[VisionBookingsAdmin] Found:', bookings.length, 'Total:', total);

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
    console.log('[VisionBookingsAdmin] Confirming booking:', bookingId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date();
    await booking.save();

    console.log('[VisionBookingsAdmin] Booking confirmed:', bookingId);

    return booking;
  }

  /**
   * Admin: Cancel booking and process refund
   */
  async adminCancelBooking(bookingId: string, reason: string) {
    console.log('[VisionBookingsAdmin] Admin cancelling booking:', bookingId, 'Reason:', reason);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Process refund if wallet was debited
    if (booking.walletDebitAmount > 0 &&
        (booking.paymentStatus === 'COMPLETED' || booking.status === 'CONFIRMED')) {
      console.log('[VisionBookingsAdmin] Processing refund:', booking.walletDebitAmount);

      await this.walletService.creditWallet(
        booking.userId.toString(),
        booking.walletDebitAmount,
        'CAT007',
        (booking._id as Types.ObjectId).toString(),
        'VISION',
        booking.clinicName,
        `Admin cancellation refund: ${booking.serviceName} - Reason: ${reason}`,
      );

      console.log('[VisionBookingsAdmin] Wallet refunded:', booking.walletDebitAmount);
      booking.paymentStatus = 'REFUNDED';
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
        console.error('[VisionBookingsAdmin] Failed to update transaction:', error);
      }
    }

    console.log('[VisionBookingsAdmin] Booking cancelled:', bookingId);

    return booking;
  }

  /**
   * Admin: Reschedule booking to different slot
   */
  async rescheduleBooking(bookingId: string, rescheduleDto: RescheduleBookingDto) {
    console.log('[VisionBookingsAdmin] Rescheduling booking:', bookingId, rescheduleDto);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot reschedule cancelled or completed bookings');
    }

    // Validate new slot availability
    const newSlot = await this.visionServiceSlotModel.findById(rescheduleDto.slotId);
    if (!newSlot) {
      throw new BadRequestException('New slot not found');
    }

    // Check if new slot is available
    const existingBookingsCount = await this.visionBookingModel.countDocuments({
      slotId: new Types.ObjectId(rescheduleDto.slotId),
      appointmentDate: new Date(rescheduleDto.appointmentDate),
      appointmentTime: rescheduleDto.appointmentTime,
      status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
    });

    if (existingBookingsCount >= newSlot.maxAppointments) {
      throw new BadRequestException('New slot is fully booked');
    }

    // Store original date for history
    booking.rescheduledFrom = booking.appointmentDate;
    booking.rescheduledReason = rescheduleDto.reason;

    // Update to new slot
    booking.slotId = new Types.ObjectId(rescheduleDto.slotId);
    booking.appointmentDate = new Date(rescheduleDto.appointmentDate);
    booking.appointmentTime = rescheduleDto.appointmentTime;

    await booking.save();

    console.log('[VisionBookingsAdmin] Booking rescheduled:', bookingId);

    return booking;
  }

  /**
   * Admin: Mark booking as no-show (after appointment time)
   */
  async markNoShow(bookingId: string) {
    console.log('[VisionBookingsAdmin] Marking as no-show:', bookingId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot mark cancelled or completed bookings as no-show');
    }

    // Validate appointment time has passed
    const appointmentDateStr = booking.appointmentDate.toISOString().split('T')[0];
    const appointmentTimeParts = booking.appointmentTime.split(':');

    // Create datetime in UTC by treating the stored time as IST and converting to UTC
    const appointmentDateTimeIST = new Date(`${appointmentDateStr}T${booking.appointmentTime}:00+05:30`);

    const now = new Date();

    console.log('[VisionBookingsAdmin] No-show validation:', {
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
        console.error('[VisionBookingsAdmin] Failed to update transaction:', error);
      }
    }

    console.log('[VisionBookingsAdmin] Booking marked as no-show:', bookingId);

    return booking;
  }

  /**
   * Admin: Mark as completed and generate invoice
   */
  async completeBooking(bookingId: string) {
    console.log('[VisionBookingsAdmin] Completing booking and generating invoice:', bookingId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

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
        console.error('[VisionBookingsAdmin] Failed to update transaction:', error);
      }
    }

    // Generate invoice
    console.log('[VisionBookingsAdmin] Generating invoice for booking:', bookingId);
    const invoice = await this.visionInvoiceService.generateInvoice(booking);

    // Update booking with invoice details
    booking.invoiceId = invoice.invoiceId;
    booking.invoicePath = invoice.filePath;
    booking.invoiceFileName = invoice.fileName;
    booking.invoiceGenerated = true;
    booking.invoiceGeneratedAt = new Date();
    await booking.save();

    console.log('[VisionBookingsAdmin] Booking completed and invoice generated:', bookingId);

    return {
      booking,
      invoice,
    };
  }

  /**
   * Generate bill for confirmed booking
   * Admin manually sets the service price
   * NOW INCLUDES: Payment breakdown calculation and storage
   */
  async generateBill(bookingId: string, adminUserId: string, generateBillDto: any) {
    console.log('[VisionBookings] Generating bill for:', bookingId, 'Price:', generateBillDto.servicePrice);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only confirmed bookings can have bills generated
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Only confirmed bookings can have bills generated. Current status: ' + booking.status
      );
    }

    // Check if bill already generated
    if (booking.billGenerated) {
      throw new BadRequestException('Bill has already been generated for this booking');
    }

    // Validate booking has patientId (should always be true, but defensive check)
    if (!booking.patientId) {
      throw new BadRequestException('Booking is missing patient information. Cannot generate bill.');
    }

    // Calculate payment breakdown using the actual bill amount
    console.log('[VisionBookings] Calculating payment breakdown for bill...');
    const breakdown = await this.calculatePaymentBreakdown(
      booking.patientId,
      booking.serviceCode,
      generateBillDto.servicePrice,
    );

    // Update booking with bill info AND payment breakdown
    booking.servicePrice = generateBillDto.servicePrice;
    booking.billAmount = generateBillDto.servicePrice;
    booking.billGenerated = true;
    booking.billGeneratedAt = new Date();
    booking.billGeneratedBy = adminUserId;

    // Store payment breakdown (calculated at bill generation time)
    booking.copayAmount = breakdown.copayAmount;
    booking.insuranceEligibleAmount = breakdown.insuranceEligibleAmount;
    booking.serviceTransactionLimit = breakdown.serviceTransactionLimit || 0;
    booking.insurancePayment = breakdown.insurancePayment;
    booking.excessAmount = breakdown.excessAmount;
    booking.totalMemberPayment = breakdown.totalMemberPayment;
    booking.walletDebitAmount = breakdown.walletDebitAmount;

    await booking.save();

    console.log('[VisionBookings] Bill generated successfully with payment breakdown:', {
      bookingId,
      billAmount: booking.billAmount,
      copayAmount: booking.copayAmount,
      insurancePayment: booking.insurancePayment,
      totalMemberPayment: booking.totalMemberPayment,
      walletDebitAmount: booking.walletDebitAmount,
    });

    return booking;
  }

  /**
   * Process payment for a booking with generated bill
   */
  async processPaymentForBilling(userId: string, bookingId: string) {
    console.log('[VisionBookings] Processing payment for billing:', bookingId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!booking.billGenerated) {
      throw new BadRequestException('Bill has not been generated for this booking');
    }

    if (booking.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Payment has already been completed');
    }

    // Call validateBooking to get payment breakdown with the actual bill amount
    const validation = await this.validateBooking(userId, {
      patientId: booking.patientId,
      clinicId: booking.clinicId,
      serviceCode: booking.serviceCode,
      slotId: booking.slotId.toString(),
      price: booking.billAmount, // Use the generated bill amount
    });

    if (!validation.valid || !validation.breakdown) {
      throw new BadRequestException('Booking validation failed');
    }

    const breakdown = validation.breakdown;

    // Process payment logic (wallet debit + copay handling)
    const wallet = await this.walletService.getUserWallet(userId);
    const walletBalance = wallet?.totalBalance?.current || 0;

    if (walletBalance >= breakdown.walletDebitAmount && breakdown.totalMemberPayment === 0) {
      // Wallet only
      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT007',
        (booking as any)._id.toString(),
        ServiceType.VISION,
        booking.clinicName,
        `Vision booking: ${booking.serviceName}`,
      );

      booking.paymentStatus = 'COMPLETED';
      booking.paymentMethod = 'WALLET_ONLY';
    } else if (walletBalance >= breakdown.walletDebitAmount && breakdown.totalMemberPayment > 0) {
      // Wallet + Copay
      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT007',
        (booking as any)._id.toString(),
        ServiceType.VISION,
        booking.clinicName,
        `Vision booking: ${booking.serviceName}`,
      );

      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: breakdown.totalMemberPayment,
        paymentType: PaymentType.COPAY,
        serviceType: ServiceType.VISION,
        serviceId: (booking as any)._id.toString(),
        serviceReferenceId: bookingId,
        description: `Vision booking copay: ${booking.serviceName}`,
      });

      booking.paymentId = new Types.ObjectId((payment as any)._id.toString());
      booking.paymentMethod = 'COPAY';
      booking.paymentStatus = 'PENDING'; // Will be updated after copay payment
    } else {
      // Out of pocket
      const shortfall = breakdown.walletDebitAmount - walletBalance;
      const totalPayment = shortfall + breakdown.totalMemberPayment;

      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: totalPayment,
        paymentType: PaymentType.OUT_OF_POCKET,
        serviceType: ServiceType.VISION,
        serviceId: (booking as any)._id.toString(),
        serviceReferenceId: bookingId,
        description: `Vision booking payment: ${booking.serviceName}`,
      });

      booking.paymentId = new Types.ObjectId((payment as any)._id.toString());
      booking.paymentMethod = 'OUT_OF_POCKET';
      booking.paymentStatus = 'PENDING';
    }

    // Update payment breakdown fields
    booking.copayAmount = breakdown.copayAmount;
    booking.insuranceEligibleAmount = breakdown.insuranceEligibleAmount;
    booking.serviceTransactionLimit = breakdown.serviceTransactionLimit || 0;
    booking.insurancePayment = breakdown.insurancePayment;
    booking.excessAmount = breakdown.excessAmount;
    booking.totalMemberPayment = breakdown.totalMemberPayment;
    booking.walletDebitAmount = breakdown.walletDebitAmount;

    await booking.save();

    // Create transaction summary
    const transaction = await this.transactionSummaryService.createTransaction({
      userId,
      serviceType: TransactionServiceType.VISION,
      serviceId: (booking as any)._id.toString(),
      serviceReferenceId: bookingId,
      serviceName: booking.serviceName,
      serviceDate: booking.appointmentDate,
      totalAmount: booking.billAmount,
      walletAmount: breakdown.walletDebitAmount,
      selfPaidAmount: breakdown.totalMemberPayment,
      copayAmount: breakdown.copayAmount,
      paymentMethod: booking.paymentMethod as any,
      categoryCode: 'CAT007',
      description: `Vision booking: ${booking.serviceName}`,
      status: booking.paymentStatus === 'COMPLETED' ? TransactionStatus.COMPLETED : TransactionStatus.PENDING_PAYMENT,
    });

    booking.transactionId = new Types.ObjectId((transaction as any)._id.toString());
    await booking.save();

    // If payment completed (wallet only), generate invoice
    if (booking.paymentStatus === 'COMPLETED') {
      const invoice = await this.visionInvoiceService.generateInvoice(booking);
      booking.invoiceId = invoice.invoiceId;
      booking.invoicePath = invoice.filePath;
      booking.invoiceFileName = invoice.fileName;
      booking.invoiceGenerated = true;
      booking.invoiceGeneratedAt = new Date();
      await booking.save();
    }

    return {
      booking,
      breakdown,
      paymentRequired: breakdown.totalMemberPayment > 0,
    };
  }

  /**
   * @deprecated This method is no longer needed as payment breakdown is now calculated
   * during bill generation (generateBill method). Keeping for backward compatibility only.
   *
   * Store payment breakdown on booking
   * Called before PaymentProcessor to ensure breakdown data is available for handlePaymentComplete
   */
  async storePaymentBreakdown(bookingId: string, breakdown: any) {
    console.warn('[VisionBookings] [DEPRECATED] storePaymentBreakdown called - this is no longer needed');
    console.log('[VisionBookings] Storing payment breakdown for:', bookingId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Store all payment breakdown fields
    booking.copayAmount = breakdown.copayAmount;
    booking.insuranceEligibleAmount = breakdown.insuranceEligibleAmount;
    booking.serviceTransactionLimit = breakdown.serviceTransactionLimit || 0;
    booking.insurancePayment = breakdown.insurancePayment;
    booking.excessAmount = breakdown.excessAmount;
    booking.totalMemberPayment = breakdown.totalMemberPayment;
    booking.walletDebitAmount = breakdown.walletDebitAmount;

    await booking.save();

    console.log('[VisionBookings] Payment breakdown stored successfully');

    return booking;
  }

  /**
   * Complete wallet-only payment
   * Called after PaymentProcessor handles wallet debit for wallet-only payments
   * Just updates booking status and generates invoice
   */
  async completeWalletPayment(bookingId: string) {
    console.log('[VisionBookings] Completing wallet payment for:', bookingId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Update payment status
    booking.paymentStatus = 'COMPLETED';
    await booking.save();

    // Generate invoice
    const invoice = await this.visionInvoiceService.generateInvoice(booking);

    booking.invoiceId = invoice.invoiceId;
    booking.invoicePath = invoice.filePath;
    booking.invoiceFileName = invoice.fileName;
    booking.invoiceGenerated = true;
    booking.invoiceGeneratedAt = new Date();
    await booking.save();

    console.log('[VisionBookings] Wallet payment completed and invoice generated:', invoice.invoiceId);

    return { booking, invoice };
  }

  /**
   * Handle payment completion callback
   * Complete payment processing and generate invoice
   */
  async handlePaymentComplete(payment: any) {
    // Support both old (string paymentId) and new (payment object) signatures
    const paymentId = typeof payment === 'string' ? payment : payment._id.toString();
    const paymentObjectId = new Types.ObjectId(paymentId);

    console.log('[VisionBookings] Handling payment completion for payment:', paymentId);

    // Try to find booking by paymentId first (normal flow)
    let booking = await this.visionBookingModel.findOne({
      paymentId: paymentObjectId,
    });

    // Fallback 1: If not found and we have serviceId, search by booking _id
    if (!booking && typeof payment === 'object' && payment.serviceId) {
      console.log('[VisionBookings] Booking not found by paymentId, trying serviceId fallback:', payment.serviceId);
      booking = await this.visionBookingModel.findById(payment.serviceId);

      // If found via serviceId, update the paymentId field for future lookups
      if (booking) {
        console.log('[VisionBookings] Booking found via serviceId, updating paymentId field');
        booking.paymentId = paymentObjectId;
        // Will be saved later in the method
      }
    }

    // Fallback 2: If still not found and we have serviceReferenceId, search by bookingId
    if (!booking && typeof payment === 'object' && payment.serviceReferenceId) {
      console.log('[VisionBookings] Booking not found by serviceId, trying serviceReferenceId fallback:', payment.serviceReferenceId);
      booking = await this.visionBookingModel.findOne({
        bookingId: payment.serviceReferenceId,
      });

      // If found via serviceReferenceId, update the paymentId field for future lookups
      if (booking) {
        console.log('[VisionBookings] Booking found via serviceReferenceId (bookingId), updating paymentId field');
        booking.paymentId = paymentObjectId;
        // Will be saved later in the method
      }
    }

    if (!booking) {
      throw new NotFoundException('Booking not found for payment');
    }

    console.log('[VisionBookings] Found booking:', booking.bookingId);

    // Check if wallet has already been debited (transaction exists)
    const alreadyProcessed = booking.transactionId != null;

    if (!alreadyProcessed) {
      console.log('[VisionBookings] Payment breakdown not processed yet, processing now...');

      // This happens for COPAY/OOP payments where processPaymentForBilling was never called
      // We need to debit wallet and create transaction now

      // Get payment to find userId
      const payment = await this.paymentModel.findById(paymentId);
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const userId = payment.userId.toString();

      // Get wallet info
      const wallet = await this.walletService.getUserWallet(userId);
      const walletBalance = wallet?.totalBalance?.current || 0;

      // Debit wallet if there's a wallet component
      if (booking.walletDebitAmount > 0 && walletBalance >= booking.walletDebitAmount) {
        await this.walletService.debitWallet(
          userId,
          booking.walletDebitAmount,
          'CAT007',
          (booking as any)._id.toString(),
          ServiceType.VISION,
          booking.clinicName,
          `Vision booking: ${booking.serviceName}`,
        );
        console.log('[VisionBookings] Wallet debited:', booking.walletDebitAmount);
      }

      // Create transaction summary
      const transaction = await this.transactionSummaryService.createTransaction({
        userId,
        serviceType: TransactionServiceType.VISION,
        serviceId: (booking as any)._id.toString(),
        serviceReferenceId: booking.bookingId,
        serviceName: booking.serviceName,
        serviceDate: booking.appointmentDate,
        totalAmount: booking.billAmount,
        walletAmount: booking.walletDebitAmount || 0,
        selfPaidAmount: booking.totalMemberPayment || 0,
        copayAmount: booking.copayAmount || 0,
        paymentMethod: booking.paymentMethod as any,
        categoryCode: 'CAT007',
        description: `Vision booking: ${booking.serviceName}`,
        status: TransactionStatus.COMPLETED,
      });

      booking.transactionId = new Types.ObjectId((transaction as any)._id.toString());
      console.log('[VisionBookings] Transaction created:', (transaction as any)._id);
    } else {
      console.log('[VisionBookings] Payment already processed, updating transaction status');

      // Update transaction status to completed
      if (booking.transactionId) {
        await this.transactionSummaryService.updateTransactionStatus(
          booking.transactionId.toString(),
          TransactionStatus.COMPLETED,
        );
      }
    }

    // Update both payment status and booking status
    booking.paymentStatus = 'COMPLETED';
    booking.status = 'COMPLETED';
    booking.completedAt = new Date();
    await booking.save();

    // Generate invoice
    const invoice = await this.visionInvoiceService.generateInvoice(booking);

    booking.invoiceId = invoice.invoiceId;
    booking.invoicePath = invoice.filePath;
    booking.invoiceFileName = invoice.fileName;
    booking.invoiceGenerated = true;
    booking.invoiceGeneratedAt = new Date();
    await booking.save();

    console.log('[VisionBookings] Payment completed and invoice generated:', invoice.invoiceId);

    return { booking, invoice };
  }

  /**
   * Get invoice file details for download (admin)
   */
  async getInvoice(bookingId: string) {
    console.log('[VisionBookingsAdmin] Getting invoice for booking:', bookingId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

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
    console.log('[VisionBookings] Member getting invoice for booking:', bookingId, 'User:', userId);

    const booking = await this.visionBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify ownership
    if (booking.userId.toString() !== userId) {
      console.log('[VisionBookings] Access denied - booking belongs to different user');
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

    console.log('[VisionBookings] Invoice access granted for:', bookingId);

    return {
      filePath: booking.invoicePath,
      fileName: booking.invoiceFileName,
      invoiceId: booking.invoiceId,
    };
  }
}
