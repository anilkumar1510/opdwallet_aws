import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  VaccinationBooking,
  VaccinationBookingDocument,
} from '../schemas/vaccination-booking.schema';
import { VaccinationService } from '../schemas/vaccination-service.schema';
import { VaccinationVendor } from '../schemas/vaccination-vendor.schema';
import { VaccinationVendorPricing } from '../schemas/vaccination-vendor-pricing.schema';
import { VaccinationVendorSlot } from '../schemas/vaccination-vendor-slot.schema';
import { CreateVaccinationBookingDto } from '../dto/create-vaccination-booking.dto';
import { ValidateVaccinationBookingDto } from '../dto/validate-vaccination-booking.dto';
import { AdminQueryVaccinationBookingsDto } from '../dto/admin-query-vaccination-bookings.dto';
import { RescheduleVaccinationBookingDto } from '../dto/reschedule-vaccination-booking.dto';
import { AssignmentsService } from '../../assignments/assignments.service';
import { PlanConfigService } from '../../plan-config/plan-config.service';
import { WalletService } from '../../wallet/wallet.service';
import { PaymentService } from '../../payments/payment.service';
import {
  PaymentType,
  ServiceType,
} from '../../payments/schemas/payment.schema';
import { TransactionSummaryService } from '../../transactions/transaction-summary.service';
import {
  TransactionServiceType,
  TransactionStatus,
  PaymentMethod,
} from '../../transactions/schemas/transaction-summary.schema';
import { PolicyServicesConfigService } from '../../plan-config/policy-services-config.service';
import { VaccinationInvoiceService } from './vaccination-invoice.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CopayCalculator } from '../../plan-config/utils/copay-calculator';
import { ServiceTransactionLimitCalculator } from '../../plan-config/utils/service-transaction-limit-calculator';
import { BenefitResolver } from '../../plan-config/utils/benefit-resolver';
import { CopayResolver } from '../../plan-config/utils/copay-resolver';

@Injectable()
export class VaccinationBookingService {
  constructor(
    @InjectModel(VaccinationBooking.name)
    private vaccinationBookingModel: Model<VaccinationBookingDocument>,
    @InjectModel(VaccinationService.name)
    private vaccinationServiceModel: Model<VaccinationService>,
    @InjectModel(VaccinationVendor.name)
    private vendorModel: Model<VaccinationVendor>,
    @InjectModel(VaccinationVendorPricing.name)
    private pricingModel: Model<VaccinationVendorPricing>,
    @InjectModel(VaccinationVendorSlot.name)
    private slotModel: Model<VaccinationVendorSlot>,
    @Inject(forwardRef(() => AssignmentsService))
    private assignmentsService: AssignmentsService,
    private planConfigService: PlanConfigService,
    private walletService: WalletService,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService,
    private transactionSummaryService: TransactionSummaryService,
    private policyServicesConfigService: PolicyServicesConfigService,
    @Inject(forwardRef(() => VaccinationInvoiceService))
    private vaccinationInvoiceService: VaccinationInvoiceService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 1. Get member's allowed vaccination services
   */
  async getMemberAllowedServices(userId: string) {
    console.log(
      '[VaccinationBookings] Fetching allowed services for user:',
      userId,
    );

    // Get user's active assignment
    const assignments = await this.assignmentsService.getUserAssignments(
      userId,
    );
    const assignment =
      assignments && assignments.length > 0 ? assignments[0] : null;

    if (!assignment) {
      throw new NotFoundException(
        'No active policy assignment found for user',
      );
    }

    // Get policyId as string
    const policyId =
      typeof assignment.policyId === 'object' && assignment.policyId._id
        ? assignment.policyId._id.toString()
        : assignment.policyId.toString();

    // Get current plan config
    const planConfig = await this.planConfigService.getConfig(policyId);
    if (!planConfig) {
      throw new NotFoundException('Plan configuration not found');
    }

    // Get allowed vaccination services from policy services config
    // Note: CAT009 is the vaccination category
    const allowedServices =
      await this.policyServicesConfigService.getMemberAllowedServices(
        userId,
        'CAT009',
      );

    console.log(
      '[VaccinationBookings] Allowed services count:',
      allowedServices?.length || 0,
    );

    // Get vaccination benefit config for coverage info
    // Note: CAT009 is the category ID for vaccination
    const vaccinationBenefit = BenefitResolver.resolve(
      planConfig,
      'CAT009',
      assignment.relationshipId,
    );

    // Map services with coverage info
    const servicesWithDetails = (allowedServices || []).map((service: any) => ({
      _id: service._id,
      serviceId: service.serviceId,
      code: service.code,
      name: service.name,
      description: service.description || '',
      vaccineType: service.vaccineType,
      manufacturer: service.manufacturer,
      dosesRequired: service.dosesRequired,
      ageGroup: service.ageGroup,
      coveragePercentage: vaccinationBenefit?.coveragePercentage || 0,
      copayAmount: vaccinationBenefit?.copayAmount || 0,
    }));

    console.log('[VaccinationBookings] Found services:', servicesWithDetails.length);

    return {
      services: servicesWithDetails,
      benefit: vaccinationBenefit,
    };
  }

  /**
   * 2. Get vendors for a specific service
   * If pincode is provided, filter by vendors serving that pincode
   * If no pincode, return all active vendors offering the service
   */
  async getVendorsForService(serviceId: string, pincode?: string) {
    console.log(
      '[VaccinationBookings] Searching vendors for service:',
      serviceId,
      'pincode:',
      pincode || 'ALL',
    );

    // Build vendor query - filter by pincode only if provided
    const vendorQuery: any = { isActive: true };
    if (pincode) {
      vendorQuery.serviceablePincodes = pincode;
    }

    const vendors = await this.vendorModel.find(vendorQuery);

    if (vendors.length === 0) {
      return { vendors: [] };
    }

    const eligibleVendors = [];

    for (const vendor of vendors) {
      // Check if vendor has pricing for this service
      const pricing = await this.pricingModel
        .findOne({
          vendorId: vendor._id,
          serviceId: new Types.ObjectId(serviceId),
          isActive: true,
        })
        .populate('serviceId', 'name code');

      if (!pricing) {
        continue;
      }

      // Build slot query - filter by pincode only if provided
      const slotQuery: any = {
        vendorId: vendor._id,
        isActive: true,
      };
      if (pincode) {
        slotQuery.pincode = pincode;
      }

      // Check if vendor has active schedules
      const activeSchedules = await this.slotModel.find(slotQuery);

      eligibleVendors.push({
        _id: vendor._id,
        vendorId: vendor.vendorId,
        name: vendor.name,
        code: vendor.code,
        contactInfo: vendor.contactInfo,
        centerVisit: vendor.centerVisit,
        actualPrice: pricing.actualPrice,
        discountedPrice: pricing.discountedPrice,
        activeSchedulesCount: activeSchedules.length,
        serviceablePincodes: vendor.serviceablePincodes || [],
      });
    }

    // Sort by price (cheapest first)
    eligibleVendors.sort((a, b) => a.discountedPrice - b.discountedPrice);

    console.log('[VaccinationBookings] Found vendors:', eligibleVendors.length);

    return { vendors: eligibleVendors };
  }

  /**
   * 3. Get available time slots for vendor on specific date
   */
  async getAvailableSlotsForDate(
    vendorId: string,
    pincode: string | undefined,
    date: string,
  ) {
    console.log(
      '[VaccinationBookings] Loading slots for vendor:',
      vendorId,
      'pincode:',
      pincode || 'ALL',
      'date:',
      date,
    );

    // Get vendor by vendorId (string)
    const vendor = await this.vendorModel.findOne({ vendorId });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Convert date to day of week
    const dateObj = new Date(date);
    const dayOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][dateObj.getDay()];

    // Fetch slot configuration for the vendor (and pincode if provided) and day
    const slotQuery: any = {
      vendorId: vendor._id,
      dayOfWeek,
      isActive: true,
    };
    if (pincode) {
      slotQuery.pincode = pincode;
    }

    const slotConfigs = await this.slotModel.find(slotQuery).lean();

    if (!slotConfigs || slotConfigs.length === 0) {
      console.log(
        '[VaccinationBookings] No slot configuration found for this day',
      );
      return { slots: [] };
    }

    // Get existing bookings for this vendor and date
    const bookingsQuery: any = {
      vendorId: vendor.vendorId,
      appointmentDate: new Date(date),
      status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
    };
    if (pincode) {
      bookingsQuery.pincode = pincode;
    }

    const existingBookings = await this.vaccinationBookingModel
      .find(bookingsQuery)
      .lean();

    // Count bookings per time slot
    const bookingsCountByTime = existingBookings.reduce(
      (acc, booking) => {
        acc[booking.appointmentTime] =
          (acc[booking.appointmentTime] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Generate time slots based on all configurations
    const allSlots = [];

    for (const slotConfig of slotConfigs) {
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

        // Generate unique slotId for each time slot (combining config slotId and time)
        const uniqueSlotId = `${slotConfig.slotId}-${timeString.replace(':', '')}`;

        allSlots.push({
          _id: `${slotConfig._id.toString()}-${timeString}`,
          slotId: uniqueSlotId,
          date: date,
          startTime: timeString,
          endTime: `${Math.floor((currentTime + slotConfig.slotDuration) / 60).toString().padStart(2, '0')}:${((currentTime + slotConfig.slotDuration) % 60).toString().padStart(2, '0')}`,
          isAvailable,
          currentBookings: bookedCount,
          maxAppointments: slotConfig.maxAppointments,
        });

        currentTime += slotConfig.slotDuration;
      }
    }

    // Sort slots by time
    allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    console.log('[VaccinationBookings] Generated slots:', allSlots.length);

    return { slots: allSlots };
  }

  /**
   * 3b. Get all upcoming available slots for next 30 days
   * Returns slots grouped by date, only including dates with available slots
   */
  async getUpcomingSlots(vendorId: string, pincode?: string) {
    console.log(
      '[VaccinationBookings] Loading upcoming slots for vendor:',
      vendorId,
      'pincode:',
      pincode || 'ALL',
    );

    // Get vendor by vendorId (string)
    const vendor = await this.vendorModel.findOne({ vendorId });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Get all active slot configurations for this vendor (and pincode if provided)
    const slotQuery: any = {
      vendorId: vendor._id,
      isActive: true,
    };
    if (pincode) {
      slotQuery.pincode = pincode;
    }

    const slotConfigs = await this.slotModel
      .find(slotQuery)
      .lean();

    if (!slotConfigs || slotConfigs.length === 0) {
      console.log(
        '[VaccinationBookings] No slot configurations found for vendor/pincode',
      );
      return { days: [] };
    }

    // Group slot configs by day of week for quick lookup
    const configsByDay: Record<string, typeof slotConfigs> = {};
    for (const config of slotConfigs) {
      if (!configsByDay[config.dayOfWeek]) {
        configsByDay[config.dayOfWeek] = [];
      }
      configsByDay[config.dayOfWeek].push(config);
    }

    // Get existing bookings for next 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    const bookingsQuery: any = {
      vendorId: vendor.vendorId,
      appointmentDate: { $gte: today, $lt: endDate },
      status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
    };
    if (pincode) {
      bookingsQuery.pincode = pincode;
    }

    const existingBookings = await this.vaccinationBookingModel
      .find(bookingsQuery)
      .lean();

    // Group bookings by date and time
    const bookingsByDateTime: Record<string, Record<string, number>> = {};
    for (const booking of existingBookings) {
      const dateKey = booking.appointmentDate.toISOString().split('T')[0];
      if (!bookingsByDateTime[dateKey]) {
        bookingsByDateTime[dateKey] = {};
      }
      bookingsByDateTime[dateKey][booking.appointmentTime] =
        (bookingsByDateTime[dateKey][booking.appointmentTime] || 0) + 1;
    }

    const dayNames = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    const days: Array<{
      date: string;
      dayName: string;
      slots: Array<{
        time: string;
        available: boolean;
        slotId: string;
      }>;
    }> = [];

    // Iterate through next 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = dayNames[currentDate.getDay()];

      const dayConfigs = configsByDay[dayOfWeek];
      if (!dayConfigs || dayConfigs.length === 0) {
        continue; // No slots configured for this day
      }

      const bookingsForDate = bookingsByDateTime[dateStr] || {};
      const slots: Array<{ time: string; available: boolean; slotId: string }> = [];

      // Generate time slots for this day
      for (const slotConfig of dayConfigs) {
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

          const bookedCount = bookingsForDate[timeString] || 0;
          const isAvailable = bookedCount < slotConfig.maxAppointments;

          // Generate unique slotId for each time slot
          const uniqueSlotId = `${slotConfig.slotId}-${timeString.replace(':', '')}`;

          slots.push({
            time: timeString,
            available: isAvailable,
            slotId: uniqueSlotId,
          });

          currentTime += slotConfig.slotDuration;
        }
      }

      // Sort slots by time
      slots.sort((a, b) => a.time.localeCompare(b.time));

      // Only include days that have at least one available slot
      const hasAvailableSlots = slots.some((slot) => slot.available);
      if (hasAvailableSlots) {
        // Calculate day name label
        let dayName: string;
        if (i === 0) {
          dayName = 'Today';
        } else if (i === 1) {
          dayName = 'Tomorrow';
        } else {
          dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
        }

        days.push({
          date: dateStr,
          dayName,
          slots,
        });
      }
    }

    console.log('[VaccinationBookings] Found', days.length, 'days with available slots');

    return { days };
  }

  /**
   * 4. Pre-validate booking and return payment breakdown
   */
  async validateBooking(
    userId: string,
    validateDto: ValidateVaccinationBookingDto,
  ) {
    console.log('[VaccinationBookings] Validating booking:', {
      userId,
      ...validateDto,
    });

    try {
      // 1. Validate service exists
      const service = await this.vaccinationServiceModel.findById(
        validateDto.serviceId,
      );
      if (!service) {
        throw new BadRequestException('Vaccination service not found');
      }

      // 2. Validate vendor exists and has pricing
      const vendor = await this.vendorModel.findOne({
        vendorId: validateDto.vendorId,
      });
      if (!vendor) {
        throw new BadRequestException('Vendor not found');
      }

      const pricing = await this.pricingModel.findOne({
        vendorId: vendor._id,
        serviceId: new Types.ObjectId(validateDto.serviceId),
        isActive: true,
      });
      if (!pricing) {
        throw new BadRequestException(
          'Pricing not available for this service at this vendor',
        );
      }

      // 3. Get user's active assignment and plan config
      const assignments = await this.assignmentsService.getUserAssignments(
        userId,
      );
      const assignment =
        assignments && assignments.length > 0 ? assignments[0] : null;

      if (!assignment) {
        throw new BadRequestException('No active policy assignment found');
      }

      const policyId =
        typeof assignment.policyId === 'object' && assignment.policyId._id
          ? assignment.policyId._id.toString()
          : assignment.policyId.toString();

      const planConfig = await this.planConfigService.getConfig(policyId);
      if (!planConfig) {
        throw new BadRequestException('Plan configuration not found');
      }

      // 4. Resolve vaccination benefits
      // Note: CAT009 is the category ID for vaccination
      const vaccinationBenefit = BenefitResolver.resolve(
        planConfig,
        'CAT009',
        assignment.relationshipId,
      );

      if (!vaccinationBenefit) {
        throw new BadRequestException(
          'Vaccination benefits not available for this user',
        );
      }

      // 5. Get copay config
      const copayConfig =
        CopayResolver.resolve(planConfig, assignment.relationshipId) ||
        undefined;

      // 6. Calculate copay
      const copayCalc = CopayCalculator.calculate(validateDto.price, copayConfig);

      // 7. Get service transaction limit from benefit config
      // Note: Service transaction limits are keyed by serviceId for vaccination (not code)
      const serviceLimit =
        vaccinationBenefit?.serviceTransactionLimits?.[service.serviceId] || null;
      console.log(
        '[VaccinationBookings] Service transaction limit for',
        service.serviceId,
        ':',
        serviceLimit,
      );

      // 8. Apply service transaction limit
      const limitCalc = ServiceTransactionLimitCalculator.calculate(
        validateDto.price,
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

      console.log('[VaccinationBookings] Payment breakdown:', {
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
      console.error('[VaccinationBookings] Validation error:', error);
      return {
        valid: false,
        breakdown: null,
        warnings: [error.message],
      };
    }
  }

  /**
   * 5. Create vaccination booking with payment processing
   */
  async create(userId: string, createDto: CreateVaccinationBookingDto) {
    console.log(
      '[VaccinationBookings] Creating booking for user:',
      userId,
      createDto,
    );

    // 1. Validate service exists
    const service = await this.vaccinationServiceModel.findById(
      createDto.serviceId,
    );
    if (!service) {
      throw new BadRequestException('Vaccination service not found');
    }

    // 2. Validate vendor exists
    const vendor = await this.vendorModel.findOne({
      vendorId: createDto.vendorId,
    });
    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    // 3. Check slot availability
    // Extract original slotId (remove time suffix if present)
    // Format: {originalSlotId}-{HHMM} e.g., VSLOT-xxx-1400 -> VSLOT-xxx
    const slotIdParts = createDto.slotId.split('-');
    const lastPart = slotIdParts[slotIdParts.length - 1];
    const isTimeFormat = /^\d{4}$/.test(lastPart);
    const originalSlotId = isTimeFormat
      ? slotIdParts.slice(0, -1).join('-')
      : createDto.slotId;

    const slotConfig = await this.slotModel.findOne({
      slotId: originalSlotId,
    });
    if (!slotConfig) {
      throw new BadRequestException('Slot configuration not found');
    }

    // Build query for existing bookings - pincode is optional
    const existingBookingsQuery: any = {
      vendorId: createDto.vendorId,
      appointmentDate: new Date(createDto.appointmentDate),
      appointmentTime: createDto.appointmentTime,
      status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
    };

    // Only filter by pincode if provided
    if (createDto.pincode) {
      existingBookingsQuery.pincode = createDto.pincode;
    }

    const existingBookingsCount = await this.vaccinationBookingModel.countDocuments(existingBookingsQuery);

    if (existingBookingsCount >= slotConfig.maxAppointments) {
      throw new BadRequestException('This slot is fully booked');
    }

    // 4. Get user assignment and plan config
    const assignments = await this.assignmentsService.getUserAssignments(
      userId,
    );
    const assignment =
      assignments && assignments.length > 0 ? assignments[0] : null;

    if (!assignment) {
      throw new BadRequestException('No active policy assignment found');
    }

    const policyId =
      typeof assignment.policyId === 'object' && assignment.policyId._id
        ? assignment.policyId._id.toString()
        : assignment.policyId.toString();

    const planConfig = await this.planConfigService.getConfig(policyId);
    if (!planConfig) {
      throw new BadRequestException('Plan configuration not found');
    }

    // 5. Get patient details from User model
    const userModel = this.vaccinationBookingModel.db.model('User');
    const patient = (await userModel
      .findById(createDto.patientId)
      .select('name relationship')
      .lean()) as {
      name: { firstName: string; lastName: string };
      relationship: string;
    } | null;

    if (!patient) {
      throw new BadRequestException('Patient not found');
    }

    const patientFullName = `${patient.name.firstName} ${patient.name.lastName}`;

    // 6. Calculate payment breakdown
    const validation = await this.validateBooking(userId, {
      patientId: createDto.patientId,
      vendorId: createDto.vendorId,
      serviceId: createDto.serviceId,
      slotId: createDto.slotId,
      price: createDto.price,
      appointmentDate: createDto.appointmentDate,
    });

    if (!validation.valid || !validation.breakdown) {
      throw new BadRequestException(
        'Booking validation failed: ' + validation.warnings.join(', '),
      );
    }

    const breakdown = validation.breakdown;

    // 7. Generate booking ID
    const bookingId = this.generateBookingId();

    // 8. Create booking document
    const booking = await this.vaccinationBookingModel.create({
      bookingId,
      userId: new Types.ObjectId(userId),
      patientId: createDto.patientId,
      patientName: patientFullName,
      patientRelationship: patient.relationship || 'REL001',
      serviceId: createDto.serviceId,
      serviceCode: createDto.serviceCode,
      serviceName: createDto.serviceName,
      vaccineType: createDto.vaccineType || service.vaccineType,
      manufacturer: createDto.manufacturer || service.manufacturer,
      dosesRequired: createDto.dosesRequired || service.dosesRequired,
      vendorId: createDto.vendorId,
      vendorName: vendor.name,
      vendorAddress: {
        street: vendor.contactInfo.address || '',
        city: '',
        state: '',
        pincode: createDto.pincode || '',
      },
      vendorPhone: vendor.contactInfo.phone,
      vendorEmail: vendor.contactInfo.email,
      slotId: createDto.slotId,
      appointmentDate: new Date(createDto.appointmentDate),
      appointmentTime: createDto.appointmentTime,
      pincode: createDto.pincode,
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

    console.log('[VaccinationBookings] Booking document created:', bookingId);

    // 9. Check if payment was already processed externally
    if (createDto.paymentAlreadyProcessed) {
      console.log(
        '[VaccinationBookings] Payment already processed externally',
      );

      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT009',
        (booking._id as Types.ObjectId).toString(),
        ServiceType.VACCINATION,
        vendor.name,
        `Vaccination booking: ${createDto.serviceName}`,
      );

      booking.paymentStatus = 'COMPLETED';
      booking.paymentMethod = 'COPAY';

      if (createDto.paymentId) {
        booking.paymentId = createDto.paymentId;
        try {
          await this.paymentService.updatePaymentServiceLink(
            createDto.paymentId,
            (booking._id as Types.ObjectId).toString(),
            bookingId,
            ServiceType.VACCINATION,
          );
        } catch (error) {
          console.error(
            '[VaccinationBookings] Failed to update payment service link:',
            error,
          );
        }
      }

      await booking.save();

      const transaction = await this.transactionSummaryService.createTransaction({
        userId,
        serviceType: TransactionServiceType.VACCINATION,
        serviceId: (booking._id as Types.ObjectId).toString(),
        serviceReferenceId: bookingId,
        serviceName: createDto.serviceName,
        serviceDate: new Date(createDto.appointmentDate),
        totalAmount: createDto.price,
        walletAmount: breakdown.walletDebitAmount,
        selfPaidAmount: breakdown.totalMemberPayment,
        copayAmount: breakdown.copayAmount,
        paymentMethod: PaymentMethod.COPAY,
        categoryCode: 'CAT009',
        categoryName: 'Vaccination Services',
        description: `Vaccination booking: ${createDto.serviceName}`,
        status: TransactionStatus.COMPLETED,
      });

      booking.transactionId = new Types.ObjectId(
        (transaction as any)._id.toString(),
      );
      await booking.save();

      return booking;
    }

    // 10. Process payment based on scenario
    const wallet = await this.walletService.getUserWallet(userId);
    const walletBalance = wallet?.totalBalance?.current || 0;

    if (
      walletBalance >= breakdown.walletDebitAmount &&
      breakdown.totalMemberPayment === 0
    ) {
      // Scenario A: Wallet only, no copay
      console.log('[VaccinationBookings] Scenario A: Wallet-only payment');

      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT009',
        (booking._id as Types.ObjectId).toString(),
        ServiceType.VACCINATION,
        vendor.name,
        `Vaccination booking: ${createDto.serviceName}`,
      );

      booking.paymentStatus = 'COMPLETED';
      booking.paymentMethod = 'WALLET_ONLY';
      await booking.save();
    } else if (
      walletBalance >= breakdown.walletDebitAmount &&
      breakdown.totalMemberPayment > 0
    ) {
      // Scenario B: Wallet + copay
      console.log('[VaccinationBookings] Scenario B: Wallet + copay payment');

      await this.walletService.debitWallet(
        userId,
        breakdown.walletDebitAmount,
        'CAT009',
        (booking._id as Types.ObjectId).toString(),
        ServiceType.VACCINATION,
        vendor.name,
        `Vaccination booking: ${createDto.serviceName} (partial)`,
      );

      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: breakdown.totalMemberPayment,
        paymentType: PaymentType.COPAY,
        serviceType: ServiceType.VACCINATION,
        serviceId: (booking._id as Types.ObjectId).toString(),
        serviceReferenceId: bookingId,
        description: `Vaccination booking copay: ${createDto.serviceName}`,
      });

      booking.paymentId = (payment as any).paymentId;
      booking.paymentMethod = 'COPAY';
      await booking.save();
    } else {
      // Scenario C: Insufficient balance
      console.log(
        '[VaccinationBookings] Scenario C: Insufficient wallet balance',
      );

      const shortfall = breakdown.walletDebitAmount - walletBalance;
      const totalPayment = shortfall + breakdown.totalMemberPayment;

      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: totalPayment,
        paymentType: PaymentType.OUT_OF_POCKET,
        serviceType: ServiceType.VACCINATION,
        serviceId: (booking._id as Types.ObjectId).toString(),
        serviceReferenceId: bookingId,
        description: `Vaccination booking payment: ${createDto.serviceName}`,
      });

      booking.paymentId = (payment as any).paymentId;
      booking.paymentMethod = 'OUT_OF_POCKET';
      await booking.save();
    }

    // 11. Create transaction summary
    const transaction = await this.transactionSummaryService.createTransaction({
      userId,
      serviceType: TransactionServiceType.VACCINATION,
      serviceId: (booking._id as Types.ObjectId).toString(),
      serviceReferenceId: bookingId,
      serviceName: createDto.serviceName,
      serviceDate: new Date(createDto.appointmentDate),
      totalAmount: createDto.price,
      walletAmount: breakdown.walletDebitAmount,
      selfPaidAmount: breakdown.totalMemberPayment,
      copayAmount: breakdown.copayAmount,
      paymentMethod: booking.paymentMethod as any,
      categoryCode: 'CAT009',
      description: `Vaccination booking: ${createDto.serviceName} at ${vendor.name}`,
    });

    booking.transactionId = new Types.ObjectId(
      (transaction as any)._id.toString(),
    );
    await booking.save();

    // Send notification
    const dateStr = new Date(createDto.appointmentDate).toLocaleDateString(
      'en-IN',
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    );
    await this.notificationsService.notifyAppointmentCreated(
      userId,
      bookingId,
      'VACCINATION',
      vendor.name,
      dateStr,
      createDto.appointmentTime,
    );

    console.log('[VaccinationBookings] Booking created successfully:', bookingId);

    return booking;
  }

  /**
   * 6. Get all vaccination bookings for user
   */
  async getUserBookings(userId: string, viewingUserId?: string) {
    console.log(
      '[VaccinationBookings] Loading user vaccination bookings for:',
      userId,
    );

    const query: any = { userId: new Types.ObjectId(userId) };

    if (viewingUserId && viewingUserId !== userId) {
      query.patientId = viewingUserId;
    }

    const bookings = await this.vaccinationBookingModel
      .find(query)
      .sort({ appointmentDate: -1 })
      .lean();

    console.log('[VaccinationBookings] Found bookings:', bookings.length);

    return bookings;
  }

  /**
   * 7. Get single booking by ID
   */
  async getBookingById(bookingId: string, userId: string) {
    console.log('[VaccinationBookings] Fetching booking:', bookingId);

    const booking = await this.vaccinationBookingModel
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
    console.log(
      '[VaccinationBookings] Cancelling booking:',
      bookingId,
      'Reason:',
      reason,
    );

    const booking = await this.vaccinationBookingModel.findOne({
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

    // Check cancellation policy (24 hours before)
    const appointmentTime = new Date(booking.appointmentDate).getTime();
    const now = new Date().getTime();
    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      throw new BadRequestException(
        'Cannot cancel booking less than 24 hours before appointment',
      );
    }

    // Process refund if wallet was debited
    if (
      booking.walletDebitAmount > 0 &&
      (booking.paymentStatus === 'COMPLETED' || booking.status === 'CONFIRMED')
    ) {
      await this.walletService.creditWallet(
        userId,
        booking.walletDebitAmount,
        'CAT009',
        (booking._id as Types.ObjectId).toString(),
        'VACCINATION',
        booking.vendorName,
        `Refund for cancelled vaccination booking: ${booking.serviceName}`,
      );

      console.log(
        '[VaccinationBookings] Wallet refunded:',
        booking.walletDebitAmount,
      );
      booking.paymentStatus = 'REFUNDED';
    }

    // Process self-paid refund
    if (booking.paymentId) {
      try {
        const refundResult = await this.paymentService.processRefund(
          booking.paymentId.toString(),
          `Refund for cancelled vaccination booking: ${booking.serviceName}`,
        );
        if (refundResult) {
          console.log(
            '[VaccinationBookings] Self-paid refund processed:',
            refundResult.amount,
          );
        }
      } catch (refundError: any) {
        if (!refundError.message?.includes('only refund completed')) {
          console.error(
            '[VaccinationBookings] Failed to process self-paid refund:',
            refundError,
          );
        }
      }
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'MEMBER';
    booking.cancellationReason = reason;
    await booking.save();

    // Send notification
    const dateStr = booking.appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    await this.notificationsService.notifyAppointmentCancelled(
      userId,
      bookingId,
      'VACCINATION',
      booking.vendorName,
      dateStr,
      reason,
    );

    console.log('[VaccinationBookings] Booking cancelled:', bookingId);

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
    return `VAXBK-${timestamp}-${random}`;
  }

  /**
   * Handle payment completion callback
   */
  async handlePaymentComplete(paymentId: string) {
    console.log(
      '[VaccinationBookings] Handling payment completion for:',
      paymentId,
    );

    const booking = await this.vaccinationBookingModel.findOne({
      paymentId: paymentId,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found for payment');
    }

    booking.paymentStatus = 'COMPLETED';
    await booking.save();

    console.log(
      '[VaccinationBookings] Payment completed for booking:',
      booking.bookingId,
    );

    return booking;
  }

  // ADMIN METHODS

  /**
   * Admin: Get all bookings with pagination and filters
   */
  async findAllBookings(query: AdminQueryVaccinationBookingsDto) {
    console.log(
      '[VaccinationBookingsAdmin] Finding all bookings with filters:',
      query,
    );

    const page = parseInt(query.page?.toString() || '1');
    const limit = parseInt(query.limit?.toString() || '20');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.vendorId) {
      filter.vendorId = query.vendorId;
    }

    if (query.serviceCode) {
      filter.serviceCode = query.serviceCode;
    }

    if (query.dateFrom || query.dateTo) {
      filter.appointmentDate = {};
      if (query.dateFrom) {
        filter.appointmentDate.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.appointmentDate.$lte = new Date(query.dateTo);
      }
    }

    if (query.searchTerm) {
      filter.$or = [
        { patientName: { $regex: query.searchTerm, $options: 'i' } },
        { bookingId: { $regex: query.searchTerm, $options: 'i' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.vaccinationBookingModel
        .find(filter)
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.vaccinationBookingModel.countDocuments(filter),
    ]);

    console.log(
      '[VaccinationBookingsAdmin] Found:',
      bookings.length,
      'Total:',
      total,
    );

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
    console.log('[VaccinationBookingsAdmin] Confirming booking:', bookingId);

    const booking = await this.vaccinationBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date();
    await booking.save();

    console.log('[VaccinationBookingsAdmin] Booking confirmed:', bookingId);

    return booking;
  }

  /**
   * Admin: Cancel booking and process refund
   */
  async adminCancelBooking(bookingId: string, reason: string) {
    console.log(
      '[VaccinationBookingsAdmin] Admin cancelling booking:',
      bookingId,
    );

    const booking = await this.vaccinationBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Process refund
    if (
      booking.walletDebitAmount > 0 &&
      (booking.paymentStatus === 'COMPLETED' || booking.status === 'CONFIRMED')
    ) {
      await this.walletService.creditWallet(
        booking.userId.toString(),
        booking.walletDebitAmount,
        'CAT009',
        (booking._id as Types.ObjectId).toString(),
        'VACCINATION',
        booking.vendorName,
        `Admin cancellation refund: ${booking.serviceName} - Reason: ${reason}`,
      );

      booking.paymentStatus = 'REFUNDED';
    }

    if (booking.paymentId) {
      try {
        await this.paymentService.processRefund(
          booking.paymentId.toString(),
          `Admin cancellation refund: ${booking.serviceName} - Reason: ${reason}`,
        );
      } catch (refundError: any) {
        if (!refundError.message?.includes('only refund completed')) {
          console.error(
            '[VaccinationBookingsAdmin] Failed to process refund:',
            refundError,
          );
        }
      }
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'ADMIN';
    booking.cancellationReason = reason;
    await booking.save();

    if (booking.transactionId) {
      try {
        await this.transactionSummaryService.updateTransactionStatus(
          booking.transactionId.toString(),
          TransactionStatus.REFUNDED,
        );
      } catch (error) {
        console.error(
          '[VaccinationBookingsAdmin] Failed to update transaction:',
          error,
        );
      }
    }

    console.log('[VaccinationBookingsAdmin] Booking cancelled:', bookingId);

    return booking;
  }

  /**
   * Admin: Reschedule booking to different slot
   */
  async rescheduleBooking(
    bookingId: string,
    rescheduleDto: RescheduleVaccinationBookingDto,
  ) {
    console.log(
      '[VaccinationBookingsAdmin] Rescheduling booking:',
      bookingId,
      rescheduleDto,
    );

    const booking = await this.vaccinationBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException(
        'Cannot reschedule cancelled or completed bookings',
      );
    }

    // Extract original slotId (remove time suffix if present)
    // Format: {originalSlotId}-{HHMM} e.g., VSLOT-xxx-1400 -> VSLOT-xxx
    const slotIdParts = rescheduleDto.slotId.split('-');
    const lastPart = slotIdParts[slotIdParts.length - 1];
    // Check if last part is a 4-digit time (e.g., 1400, 0930)
    const isTimeFormat = /^\d{4}$/.test(lastPart);
    const originalSlotId = isTimeFormat
      ? slotIdParts.slice(0, -1).join('-')
      : rescheduleDto.slotId;

    // Validate new slot availability
    const newSlot = await this.slotModel.findOne({
      slotId: originalSlotId,
    });
    if (!newSlot) {
      throw new BadRequestException('New slot not found');
    }

    const existingBookingsCount = await this.vaccinationBookingModel.countDocuments(
      {
        vendorId: booking.vendorId,
        pincode: booking.pincode,
        appointmentDate: new Date(rescheduleDto.appointmentDate),
        appointmentTime: rescheduleDto.appointmentTime,
        status: { $in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
        _id: { $ne: booking._id },
      },
    );

    if (existingBookingsCount >= newSlot.maxAppointments) {
      throw new BadRequestException('New slot is fully booked');
    }

    const oldDate = booking.appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    booking.rescheduledFrom = booking.appointmentDate;
    booking.rescheduledReason = rescheduleDto.reason;
    booking.slotId = rescheduleDto.slotId;
    booking.appointmentDate = new Date(rescheduleDto.appointmentDate);
    booking.appointmentTime = rescheduleDto.appointmentTime;

    await booking.save();

    const newDate = booking.appointmentDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    await this.notificationsService.notifyAppointmentRescheduled(
      booking.userId.toString(),
      bookingId,
      'VACCINATION',
      booking.vendorName,
      oldDate,
      newDate,
      rescheduleDto.appointmentTime,
    );

    console.log('[VaccinationBookingsAdmin] Booking rescheduled:', bookingId);

    return booking;
  }

  /**
   * Admin: Mark booking as no-show
   */
  async markNoShow(bookingId: string) {
    console.log('[VaccinationBookingsAdmin] Marking as no-show:', bookingId);

    const booking = await this.vaccinationBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException(
        'Cannot mark cancelled or completed bookings as no-show',
      );
    }

    const appointmentDateStr = booking.appointmentDate
      .toISOString()
      .split('T')[0];
    const appointmentDateTimeIST = new Date(
      `${appointmentDateStr}T${booking.appointmentTime}:00+05:30`,
    );
    const now = new Date();

    if (appointmentDateTimeIST > now) {
      throw new BadRequestException(
        'Cannot mark as no-show before appointment time',
      );
    }

    booking.status = 'NO_SHOW';
    booking.noShowAt = new Date();
    await booking.save();

    if (booking.transactionId) {
      try {
        await this.transactionSummaryService.updateTransactionStatus(
          booking.transactionId.toString(),
          TransactionStatus.CANCELLED,
        );
      } catch (error) {
        console.error(
          '[VaccinationBookingsAdmin] Failed to update transaction:',
          error,
        );
      }
    }

    console.log('[VaccinationBookingsAdmin] Booking marked as no-show:', bookingId);

    return booking;
  }

  /**
   * Admin: Mark as completed and generate invoice
   */
  async completeBooking(bookingId: string) {
    console.log(
      '[VaccinationBookingsAdmin] Completing booking and generating invoice:',
      bookingId,
    );

    const booking = await this.vaccinationBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Only confirmed bookings can be marked as completed',
      );
    }

    booking.status = 'COMPLETED';
    booking.completedAt = new Date();
    await booking.save();

    if (booking.transactionId) {
      try {
        await this.transactionSummaryService.updateTransactionStatus(
          booking.transactionId.toString(),
          TransactionStatus.COMPLETED,
        );
      } catch (error) {
        console.error(
          '[VaccinationBookingsAdmin] Failed to update transaction:',
          error,
        );
      }
    }

    // Generate invoice
    console.log(
      '[VaccinationBookingsAdmin] Generating invoice for booking:',
      bookingId,
    );
    const invoice = await this.vaccinationInvoiceService.generateInvoice(
      booking,
    );

    booking.invoiceId = invoice.invoiceId;
    booking.invoicePath = invoice.filePath;
    booking.invoiceFileName = invoice.fileName;
    booking.invoiceGenerated = true;
    booking.invoiceGeneratedAt = new Date();
    await booking.save();

    console.log(
      '[VaccinationBookingsAdmin] Booking completed and invoice generated:',
      bookingId,
    );

    return {
      booking,
      invoice,
    };
  }

  /**
   * Get invoice file details for download (admin)
   */
  async getInvoice(bookingId: string) {
    console.log(
      '[VaccinationBookingsAdmin] Getting invoice for booking:',
      bookingId,
    );

    const booking = await this.vaccinationBookingModel.findOne({ bookingId });

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
   * Get invoice file details for download (member)
   */
  async getMemberInvoice(bookingId: string, userId: string) {
    console.log(
      '[VaccinationBookings] Member getting invoice for booking:',
      bookingId,
    );

    const booking = await this.vaccinationBookingModel.findOne({ bookingId });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    if (!booking.invoiceGenerated || !booking.invoicePath) {
      throw new NotFoundException('Invoice not generated for this booking');
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Invoice is only available for completed bookings',
      );
    }

    return {
      filePath: booking.invoicePath,
      fileName: booking.invoiceFileName,
      invoiceId: booking.invoiceId,
    };
  }
}
