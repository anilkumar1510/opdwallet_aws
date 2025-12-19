import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import { DentalBookingsService } from './dental-bookings.service';
import { CreateDentalBookingDto } from './dto/create-dental-booking.dto';
import { ValidateDentalBookingDto } from './dto/validate-dental-booking.dto';
import { QueryDentalBookingsDto } from './dto/query-dental-bookings.dto';
import { AdminQueryBookingsDto } from './dto/admin-query-bookings.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { AdminCancelBookingDto } from './dto/admin-cancel-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

@Controller()
@UseGuards(JwtAuthGuard)
export class DentalBookingsController {
  constructor(private readonly dentalBookingsService: DentalBookingsService) {}

  /**
   * GET /api/member/benefits/CAT006/services
   * Get dental services assigned to user based on policy configuration
   */
  @Get('member/benefits/CAT006/services')
  async getMemberDentalServices(@Request() req: any) {
    const userId = req.user.userId;
    console.log('[DentalBookingsController] GET /api/member/benefits/CAT006/services - User:', userId);
    return this.dentalBookingsService.getMemberAllowedServices(userId);
  }

  /**
   * GET /api/dental-bookings/clinics
   * Get clinics offering specific dental service within pincode/city area
   * Query params: serviceCode (required), pincode (optional), city (optional)
   */
  @Get('dental-bookings/clinics')
  async getClinicsForService(@Query() query: QueryDentalBookingsDto) {
    console.log('[DentalBookingsController] GET /api/dental-bookings/clinics -', query);

    if (!query.serviceCode) {
      return { clinics: [] };
    }

    return this.dentalBookingsService.getClinicsForService(
      query.serviceCode,
      query.pincode,
      query.city,
    );
  }

  /**
   * GET /api/dental-bookings/slots
   * Get available time slots for clinic on specific date
   * Query params: clinicId (required), date (required, YYYY-MM-DD format)
   */
  @Get('dental-bookings/slots')
  async getAvailableSlots(
    @Query('clinicId') clinicId: string,
    @Query('date') date: string,
  ) {
    console.log('[DentalBookingsController] GET /api/dental-bookings/slots -', { clinicId, date });

    if (!clinicId || !date) {
      return { slots: [] };
    }

    return this.dentalBookingsService.getAvailableSlots(clinicId, date);
  }

  /**
   * POST /api/dental-bookings/validate
   * Pre-validate booking and return payment breakdown
   */
  @Post('dental-bookings/validate')
  async validateBooking(
    @Request() req: any,
    @Body() validateDto: ValidateDentalBookingDto,
  ) {
    const userId = req.user.userId;
    console.log('[DentalBookingsController] POST /api/dental-bookings/validate - User:', userId);
    return this.dentalBookingsService.validateBooking(userId, validateDto);
  }

  /**
   * POST /api/dental-bookings
   * Create dental booking with payment processing
   */
  @Post('dental-bookings')
  async createBooking(
    @Request() req: any,
    @Body() createDto: CreateDentalBookingDto,
  ) {
    const userId = req.user.userId;
    console.log('[DentalBookingsController] POST /api/dental-bookings - User:', userId);
    return this.dentalBookingsService.create(userId, createDto);
  }

  /**
   * GET /api/dental-bookings/user/:userId
   * Get all dental bookings for user
   * Optional query param: viewingUserId (for privacy filtering)
   */
  @Get('dental-bookings/user/:userId')
  async getUserBookings(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('viewingUserId') viewingUserId?: string,
  ) {
    console.log('[DentalBookingsController] GET /api/dental-bookings/user/:userId -', userId);

    // Ensure user can only access their own bookings
    if (req.user.userId !== userId) {
      return { bookings: [] };
    }

    return this.dentalBookingsService.getUserBookings(userId, viewingUserId);
  }

  /**
   * GET /api/dental-bookings/:bookingId
   * Get single booking details
   */
  @Get('dental-bookings/:bookingId')
  async getBookingById(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    const userId = req.user.userId;
    console.log('[DentalBookingsController] GET /api/dental-bookings/:bookingId -', bookingId);
    return this.dentalBookingsService.getBookingById(bookingId, userId);
  }

  /**
   * PUT /api/dental-bookings/:bookingId/cancel
   * Cancel booking and process refund
   */
  @Put('dental-bookings/:bookingId/cancel')
  async cancelBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body('reason') reason: string,
  ) {
    const userId = req.user.userId;
    console.log('[DentalBookingsController] PUT /api/dental-bookings/:bookingId/cancel -', bookingId);
    return this.dentalBookingsService.cancelBooking(bookingId, userId, reason || 'User cancelled');
  }

  /**
   * GET /api/dental-bookings/:bookingId/invoice
   * Download invoice PDF (member-facing)
   */
  @Get('dental-bookings/:bookingId/invoice')
  async getMemberInvoice(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Response() res: any,
  ) {
    const userId = req.user.userId;
    console.log('[DentalBookingsController] GET /api/dental-bookings/:bookingId/invoice -', bookingId, 'User:', userId);
    const result = await this.dentalBookingsService.getMemberInvoice(bookingId, userId);
    res.sendFile(result.filePath);
  }

  /**
   * ADMIN ENDPOINTS
   */

  /**
   * GET /api/admin/dental-bookings
   * List all dental bookings with filters (admin-facing)
   */
  @Get('admin/dental-bookings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAllBookings(@Query() query: AdminQueryBookingsDto) {
    console.log('[DentalBookingsAdmin] GET /api/admin/dental-bookings -', query);
    return this.dentalBookingsService.findAllBookings(query);
  }

  /**
   * PATCH /api/admin/dental-bookings/:bookingId/confirm
   * Confirm pending booking
   */
  @Patch('admin/dental-bookings/:bookingId/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async confirmBooking(@Param('bookingId') bookingId: string) {
    console.log('[DentalBookingsAdmin] PATCH /api/admin/dental-bookings/:bookingId/confirm -', bookingId);
    return this.dentalBookingsService.confirmBooking(bookingId);
  }

  /**
   * PATCH /api/admin/dental-bookings/:bookingId/admin-cancel
   * Cancel booking with refund (admin action)
   */
  @Patch('admin/dental-bookings/:bookingId/admin-cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adminCancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelDto: AdminCancelBookingDto,
  ) {
    console.log('[DentalBookingsAdmin] PATCH /api/admin/dental-bookings/:bookingId/admin-cancel -', bookingId);
    return this.dentalBookingsService.adminCancelBooking(bookingId, cancelDto.reason);
  }

  /**
   * PATCH /api/admin/dental-bookings/:bookingId/reschedule
   * Reschedule booking to different slot
   */
  @Patch('admin/dental-bookings/:bookingId/reschedule')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async rescheduleBooking(
    @Param('bookingId') bookingId: string,
    @Body() rescheduleDto: RescheduleBookingDto,
  ) {
    console.log('[DentalBookingsAdmin] PATCH /api/admin/dental-bookings/:bookingId/reschedule -', bookingId);
    return this.dentalBookingsService.rescheduleBooking(bookingId, rescheduleDto);
  }

  /**
   * PATCH /api/admin/dental-bookings/:bookingId/no-show
   * Mark booking as no-show (after appointment time)
   */
  @Patch('admin/dental-bookings/:bookingId/no-show')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markNoShow(@Param('bookingId') bookingId: string) {
    console.log('[DentalBookingsAdmin] PATCH /api/admin/dental-bookings/:bookingId/no-show -', bookingId);
    return this.dentalBookingsService.markNoShow(bookingId);
  }

  /**
   * PATCH /api/admin/dental-bookings/:bookingId/complete
   * Mark as completed and generate invoice
   */
  @Patch('admin/dental-bookings/:bookingId/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async completeBooking(@Param('bookingId') bookingId: string) {
    console.log('[DentalBookingsAdmin] PATCH /api/admin/dental-bookings/:bookingId/complete -', bookingId);
    return this.dentalBookingsService.completeBooking(bookingId);
  }

  /**
   * GET /api/admin/dental-bookings/:bookingId/invoice
   * Download invoice PDF
   */
  @Get('admin/dental-bookings/:bookingId/invoice')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async downloadInvoice(
    @Param('bookingId') bookingId: string,
    @Response() res: any,
  ) {
    console.log('[DentalBookingsAdmin] GET /api/admin/dental-bookings/:bookingId/invoice -', bookingId);
    const result = await this.dentalBookingsService.getInvoice(bookingId);
    res.sendFile(result.filePath);
  }
}
