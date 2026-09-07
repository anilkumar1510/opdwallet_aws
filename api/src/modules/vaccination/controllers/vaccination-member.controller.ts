import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VaccinationBookingService } from '../services/vaccination-booking.service';
import { CreateVaccinationBookingDto } from '../dto/create-vaccination-booking.dto';
import { ValidateVaccinationBookingDto } from '../dto/validate-vaccination-booking.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { FamilyAccessHelper } from '@/common/helpers/family-access.helper';

@Controller('member/vaccination')
@UseGuards(JwtAuthGuard)
export class VaccinationMemberController {
  constructor(
    private readonly vaccinationBookingService: VaccinationBookingService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * POST /api/member/vaccination/bookings/:bookingId/demo-advance
   *
   * Steps 7-8 and 15 performed by the member, for demonstrations only.
   *
   * Flow 6 gives both to other people: operations confirm the slot with the
   * vendor, and *"completion or a no show is confirmed by the vendor, not by
   * the member"*. Nothing in the member portal can reach those states, so on a
   * demo database a vaccination booking stops at step 6 and the whole tail —
   * cart, payment, the dose, the invoice — cannot be seen.
   *
   * Refused outside development, scoped to the caller's own booking, and it
   * calls the same service methods operations call, so a demo cannot reach a
   * state real operations could not.
   */
  @Post('bookings/:bookingId/demo-advance')
  async demoAdvance(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body('outcome') outcome?: 'completed' | 'no-show',
  ) {
    if (this.configService.get<string>('nodeEnv') !== 'development') {
      throw new ForbiddenException('Our team and the vendor confirm this');
    }
    const booking: any = await this.vaccinationBookingService.getBookingById(
      bookingId,
      req.user.userId,
    );

    if (booking.status === 'PENDING_CONFIRMATION') {
      return this.vaccinationBookingService.confirmBooking(bookingId);
    }
    if (booking.status === 'CONFIRMED') {
      // Step 15 is one report with two answers, so the caller says which.
      return outcome === 'no-show'
        ? this.vaccinationBookingService.markNoShow(bookingId)
        : this.vaccinationBookingService.completeBooking(bookingId);
    }
    throw new BadRequestException(
      `This booking is ${booking.status}, which is not waiting on us or the vendor.`,
    );
  }

  /**
   * GET /api/member/vaccination/services
   * Get vaccination services assigned to user based on policy configuration
   */
  @Get('services')
  async getMemberVaccinationServices(@Request() req: any) {
    const userId = req.user.userId;
    console.log(
      '[VaccinationMemberController] GET /api/member/vaccination/services - User:',
      userId,
    );
    return this.vaccinationBookingService.getMemberAllowedServices(userId);
  }

  /**
   * GET /api/member/vaccination/vendors
   * Get vendors offering specific vaccination service
   * Query params: serviceId (required), pincode (optional - filters by location)
   */
  @Get('vendors')
  async getVendorsForService(
    @Query('serviceId') serviceId: string,
    @Query('pincode') pincode?: string,
  ) {
    console.log(
      '[VaccinationMemberController] GET /api/member/vaccination/vendors -',
      { serviceId, pincode: pincode || 'ALL' },
    );

    if (!serviceId) {
      return { vendors: [] };
    }

    return this.vaccinationBookingService.getVendorsForService(
      serviceId,
      pincode,
    );
  }

  /**
   * GET /api/member/vaccination/vendors/:vendorId/slots
   * Get available time slots for vendor
   * Query params: pincode (optional), date (optional, YYYY-MM-DD format)
   * - If date is provided: returns slots for that specific date
   * - If date is omitted: returns all upcoming slots grouped by date (only dates with available slots)
   * - If pincode is omitted: returns slots for all locations
   */
  @Get('vendors/:vendorId/slots')
  async getAvailableSlots(
    @Param('vendorId') vendorId: string,
    @Query('pincode') pincode?: string,
    @Query('date') date?: string,
  ) {
    console.log(
      '[VaccinationMemberController] GET /api/member/vaccination/vendors/:vendorId/slots -',
      { vendorId, pincode: pincode || 'ALL', date: date || 'ALL_UPCOMING' },
    );

    if (!vendorId) {
      return date ? { slots: [] } : { days: [] };
    }

    // If date is provided, return slots for that specific date (existing behavior)
    if (date) {
      return this.vaccinationBookingService.getAvailableSlotsForDate(
        vendorId,
        pincode,
        date,
      );
    }

    // If no date, return all upcoming slots grouped by date (new behavior)
    return this.vaccinationBookingService.getUpcomingSlots(vendorId, pincode);
  }

  /**
   * POST /api/member/vaccination/bookings/validate
   * Pre-validate booking and return payment breakdown
   */
  @Post('bookings/validate')
  async validateBooking(
    @Request() req: any,
    @Body() validateDto: ValidateVaccinationBookingDto,
  ) {
    const userId = req.user.userId;
    console.log(
      '[VaccinationMemberController] POST /api/member/vaccination/bookings/validate - User:',
      userId,
    );
    return this.vaccinationBookingService.validateBooking(userId, validateDto);
  }

  /**
   * POST /api/member/vaccination/bookings
   * Create vaccination booking with payment processing
   */
  @Post('bookings')
  async createBooking(
    @Request() req: any,
    @Body() createDto: CreateVaccinationBookingDto,
  ) {
    const userId = req.user.userId;
    console.log(
      '[VaccinationMemberController] POST /api/member/vaccination/bookings - User:',
      userId,
    );
    return this.vaccinationBookingService.create(userId, createDto);
  }

  /**
   * GET /api/member/vaccination/bookings
   * Get all vaccination bookings for user
   * Optional query param: userId (for viewing family member bookings)
   */
  @Get('bookings')
  async getUserBookings(
    @Request() req: any,
    @Query('userId') userId?: string,
  ) {
    const requestingUserId = req.user.userId;
    const targetUserId = userId || requestingUserId;

    console.log(
      '[VaccinationMemberController] GET /api/member/vaccination/bookings -',
      { requestingUserId, targetUserId },
    );

    // Verify family access if viewing another user's bookings
    if (targetUserId !== requestingUserId) {
      await FamilyAccessHelper.verifyFamilyAccess(
        this.userModel,
        requestingUserId,
        targetUserId,
      );
    }

    return this.vaccinationBookingService.getUserBookings(targetUserId);
  }

  /**
   * GET /api/member/vaccination/bookings/:bookingId
   * Get single booking details
   */
  @Get('bookings/:bookingId')
  async getBookingById(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    const userId = req.user.userId;
    console.log(
      '[VaccinationMemberController] GET /api/member/vaccination/bookings/:bookingId -',
      bookingId,
    );
    return this.vaccinationBookingService.getBookingById(bookingId, userId);
  }

  /**
   * POST /api/member/vaccination/bookings/:bookingId/cancel
   * Cancel booking and process refund
   */
  @Post('bookings/:bookingId/cancel')
  async cancelBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body('reason') reason: string,
  ) {
    const userId = req.user.userId;
    console.log(
      '[VaccinationMemberController] POST /api/member/vaccination/bookings/:bookingId/cancel -',
      bookingId,
    );
    return this.vaccinationBookingService.cancelBooking(
      bookingId,
      userId,
      reason || 'User cancelled',
    );
  }

  /**
   * GET /api/member/vaccination/bookings/:bookingId/invoice
   * Download invoice PDF
   */
  @Get('bookings/:bookingId/invoice')
  async getInvoice(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Response() res: any,
  ) {
    const userId = req.user.userId;
    console.log(
      '[VaccinationMemberController] GET /api/member/vaccination/bookings/:bookingId/invoice -',
      bookingId,
    );
    const result = await this.vaccinationBookingService.getMemberInvoice(
      bookingId,
      userId,
    );
    res.sendFile(result.filePath);
  }
}
