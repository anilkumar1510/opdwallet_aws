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
import { VisionBookingsService } from './vision-bookings.service';
import { CreateVisionBookingDto } from './dto/create-vision-booking.dto';
import { ValidateVisionBookingDto } from './dto/validate-vision-booking.dto';
import { QueryVisionBookingsDto } from './dto/query-vision-bookings.dto';
import { AdminQueryBookingsDto } from '../dental-bookings/dto/admin-query-bookings.dto';
import { RescheduleBookingDto } from '../dental-bookings/dto/reschedule-booking.dto';
import { AdminCancelBookingDto } from '../dental-bookings/dto/admin-cancel-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

@Controller()
@UseGuards(JwtAuthGuard)
export class VisionBookingsController {
  constructor(private readonly visionBookingsService: VisionBookingsService) {}

  /**
   * GET /api/member/benefits/CAT007/services
   * Get vision services assigned to user based on policy configuration
   */
  @Get('member/benefits/CAT007/services')
  async getMemberVisionServices(@Request() req: any) {
    const userId = req.user.userId;
    console.log('[VisionBookingsController] GET /api/member/benefits/CAT007/services - User:', userId);
    return this.visionBookingsService.getMemberAllowedServices(userId);
  }

  /**
   * GET /api/vision-bookings/clinics
   * Get clinics offering specific vision service within pincode/city area
   * Query params: serviceCode (required), pincode (optional), city (optional)
   */
  @Get('vision-bookings/clinics')
  async getClinicsForService(@Query() query: QueryVisionBookingsDto) {
    console.log('[VisionBookingsController] GET /api/vision-bookings/clinics -', query);

    if (!query.serviceCode) {
      return { clinics: [] };
    }

    return this.visionBookingsService.getClinicsForService(
      query.serviceCode,
      query.pincode,
      query.city,
    );
  }

  /**
   * GET /api/vision-bookings/slots
   * Get available time slots for clinic on specific date
   * Query params: clinicId (required), date (required, YYYY-MM-DD format)
   */
  @Get('vision-bookings/slots')
  async getAvailableSlots(
    @Query('clinicId') clinicId: string,
    @Query('date') date: string,
  ) {
    console.log('[VisionBookingsController] GET /api/vision-bookings/slots -', { clinicId, date });

    if (!clinicId || !date) {
      return { slots: [] };
    }

    return this.visionBookingsService.getAvailableSlots(clinicId, date);
  }

  /**
   * POST /api/vision-bookings/validate
   * Pre-validate booking and return payment breakdown
   */
  @Post('vision-bookings/validate')
  async validateBooking(
    @Request() req: any,
    @Body() validateDto: ValidateVisionBookingDto,
  ) {
    const userId = req.user.userId;
    console.log('[VisionBookingsController] POST /api/vision-bookings/validate - User:', userId);
    return this.visionBookingsService.validateBooking(userId, validateDto);
  }

  /**
   * POST /api/vision-bookings
   * Create vision booking with payment processing
   */
  @Post('vision-bookings')
  async createBooking(
    @Request() req: any,
    @Body() createDto: CreateVisionBookingDto,
  ) {
    const userId = req.user.userId;
    console.log('[VisionBookingsController] POST /api/vision-bookings - User:', userId);
    return this.visionBookingsService.create(userId, createDto);
  }

  /**
   * GET /api/vision-bookings/user/:userId
   * Get all vision bookings for user
   * Optional query param: viewingUserId (for privacy filtering)
   */
  @Get('vision-bookings/user/:userId')
  async getUserBookings(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('viewingUserId') viewingUserId?: string,
  ) {
    console.log('[VisionBookingsController] GET /api/vision-bookings/user/:userId -', userId);

    // Ensure user can only access their own bookings
    if (req.user.userId !== userId) {
      return { bookings: [] };
    }

    return this.visionBookingsService.getUserBookings(userId, viewingUserId);
  }

  /**
   * GET /api/vision-bookings/:bookingId
   * Get single booking details
   */
  @Get('vision-bookings/:bookingId')
  async getBookingById(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    const userId = req.user.userId;
    console.log('[VisionBookingsController] GET /api/vision-bookings/:bookingId -', bookingId);
    return this.visionBookingsService.getBookingById(bookingId, userId);
  }

  /**
   * PUT /api/vision-bookings/:bookingId/cancel
   * Cancel booking and process refund
   */
  @Put('vision-bookings/:bookingId/cancel')
  async cancelBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body('reason') reason: string,
  ) {
    const userId = req.user.userId;
    console.log('[VisionBookingsController] PUT /api/vision-bookings/:bookingId/cancel -', bookingId);
    return this.visionBookingsService.cancelBooking(bookingId, userId, reason || 'User cancelled');
  }

  /**
   * GET /api/vision-bookings/:bookingId/invoice
   * Download invoice PDF (member-facing)
   */
  @Get('vision-bookings/:bookingId/invoice')
  async getMemberInvoice(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Response() res: any,
  ) {
    const userId = req.user.userId;
    console.log('[VisionBookingsController] GET /api/vision-bookings/:bookingId/invoice -', bookingId, 'User:', userId);
    const result = await this.visionBookingsService.getMemberInvoice(bookingId, userId);
    res.sendFile(result.filePath);
  }

  /**
   * ADMIN ENDPOINTS
   */

  /**
   * GET /api/admin/vision-bookings
   * List all vision bookings with filters (admin-facing)
   */
  @Get('admin/vision-bookings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAllBookings(@Query() query: AdminQueryBookingsDto) {
    console.log('[VisionBookingsAdmin] GET /api/admin/vision-bookings -', query);
    return this.visionBookingsService.findAllBookings(query);
  }

  /**
   * PATCH /api/admin/vision-bookings/:bookingId/confirm
   * Confirm pending booking
   */
  @Patch('admin/vision-bookings/:bookingId/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async confirmBooking(@Param('bookingId') bookingId: string) {
    console.log('[VisionBookingsAdmin] PATCH /api/admin/vision-bookings/:bookingId/confirm -', bookingId);
    return this.visionBookingsService.confirmBooking(bookingId);
  }

  /**
   * PATCH /api/admin/vision-bookings/:bookingId/admin-cancel
   * Cancel booking with refund (admin action)
   */
  @Patch('admin/vision-bookings/:bookingId/admin-cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adminCancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelDto: AdminCancelBookingDto,
  ) {
    console.log('[VisionBookingsAdmin] PATCH /api/admin/vision-bookings/:bookingId/admin-cancel -', bookingId);
    return this.visionBookingsService.adminCancelBooking(bookingId, cancelDto.reason);
  }

  /**
   * PATCH /api/admin/vision-bookings/:bookingId/reschedule
   * Reschedule booking to different slot
   */
  @Patch('admin/vision-bookings/:bookingId/reschedule')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async rescheduleBooking(
    @Param('bookingId') bookingId: string,
    @Body() rescheduleDto: RescheduleBookingDto,
  ) {
    console.log('[VisionBookingsAdmin] PATCH /api/admin/vision-bookings/:bookingId/reschedule -', bookingId);
    return this.visionBookingsService.rescheduleBooking(bookingId, rescheduleDto);
  }

  /**
   * PATCH /api/admin/vision-bookings/:bookingId/no-show
   * Mark booking as no-show (after appointment time)
   */
  @Patch('admin/vision-bookings/:bookingId/no-show')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markNoShow(@Param('bookingId') bookingId: string) {
    console.log('[VisionBookingsAdmin] PATCH /api/admin/vision-bookings/:bookingId/no-show -', bookingId);
    return this.visionBookingsService.markNoShow(bookingId);
  }

  /**
   * PATCH /api/admin/vision-bookings/:bookingId/complete
   * Mark as completed and generate invoice
   */
  @Patch('admin/vision-bookings/:bookingId/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async completeBooking(@Param('bookingId') bookingId: string) {
    console.log('[VisionBookingsAdmin] PATCH /api/admin/vision-bookings/:bookingId/complete -', bookingId);
    return this.visionBookingsService.completeBooking(bookingId);
  }

  /**
   * PATCH /api/admin/vision-bookings/:bookingId/generate-bill
   * Generate bill for confirmed booking (admin sets service price)
   */
  @Patch('admin/vision-bookings/:bookingId/generate-bill')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateBill(
    @Param('bookingId') bookingId: string,
    @Request() req: any,
    @Body() generateBillDto: any,
  ) {
    console.log('[VisionBookingsAdmin] PATCH /api/admin/vision-bookings/:bookingId/generate-bill -', bookingId);
    const adminUserId = req.user.userId;
    return this.visionBookingsService.generateBill(bookingId, adminUserId, generateBillDto);
  }

  /**
   * POST /api/vision-bookings/:bookingId/process-payment
   * Process payment for booking with generated bill
   */
  @Post(':bookingId/process-payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @Param('bookingId') bookingId: string,
    @Request() req: any,
  ) {
    console.log('[VisionBookings] POST /api/vision-bookings/:bookingId/process-payment -', bookingId);
    const userId = req.user.userId;
    return this.visionBookingsService.processPaymentForBilling(userId, bookingId);
  }

  /**
   * POST /api/vision-bookings/:bookingId/complete-wallet-payment
   * Complete wallet-only payment (updates status and generates invoice)
   */
  @Post('vision-bookings/:bookingId/complete-wallet-payment')
  @UseGuards(JwtAuthGuard)
  async completeWalletPayment(
    @Param('bookingId') bookingId: string,
  ) {
    console.log('[VisionBookings] POST /api/vision-bookings/:bookingId/complete-wallet-payment -', bookingId);
    return this.visionBookingsService.completeWalletPayment(bookingId);
  }

  /**
   * GET /api/admin/vision-bookings/:bookingId/invoice
   * Download invoice PDF
   */
  @Get('admin/vision-bookings/:bookingId/invoice')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async downloadInvoice(
    @Param('bookingId') bookingId: string,
    @Response() res: any,
  ) {
    console.log('[VisionBookingsAdmin] GET /api/admin/vision-bookings/:bookingId/invoice -', bookingId);
    const result = await this.visionBookingsService.getInvoice(bookingId);
    res.sendFile(result.filePath);
  }
}
