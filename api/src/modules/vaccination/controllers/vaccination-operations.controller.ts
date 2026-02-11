import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Response,
} from '@nestjs/common';
import { VaccinationBookingService } from '../services/vaccination-booking.service';
import { AdminQueryVaccinationBookingsDto } from '../dto/admin-query-vaccination-bookings.dto';
import { RescheduleVaccinationBookingDto } from '../dto/reschedule-vaccination-booking.dto';
import { AdminCancelVaccinationBookingDto } from '../dto/admin-cancel-vaccination-booking.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

@Controller('admin/vaccination-bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class VaccinationOperationsController {
  constructor(
    private readonly vaccinationBookingService: VaccinationBookingService,
  ) {}

  /**
   * GET /api/admin/vaccination-bookings
   * List all vaccination bookings with filters
   */
  @Get()
  async findAllBookings(@Query() query: AdminQueryVaccinationBookingsDto) {
    console.log(
      '[VaccinationOperationsController] GET /api/admin/vaccination-bookings -',
      query,
    );
    return this.vaccinationBookingService.findAllBookings(query);
  }

  /**
   * GET /api/admin/vaccination-bookings/slots
   * Get available slots for rescheduling
   * Query params: vendorId (required), pincode (required), date (required)
   */
  @Get('slots')
  async getAvailableSlots(
    @Query('vendorId') vendorId: string,
    @Query('pincode') pincode: string,
    @Query('date') date: string,
  ) {
    console.log(
      '[VaccinationOperationsController] GET /api/admin/vaccination-bookings/slots -',
      { vendorId, pincode, date },
    );

    if (!vendorId || !pincode || !date) {
      return { slots: [] };
    }

    return this.vaccinationBookingService.getAvailableSlotsForDate(
      vendorId,
      pincode,
      date,
    );
  }

  /**
   * PATCH /api/admin/vaccination-bookings/:bookingId/confirm
   * Confirm pending booking
   */
  @Patch(':bookingId/confirm')
  async confirmBooking(@Param('bookingId') bookingId: string) {
    console.log(
      '[VaccinationOperationsController] PATCH /api/admin/vaccination-bookings/:bookingId/confirm -',
      bookingId,
    );
    return this.vaccinationBookingService.confirmBooking(bookingId);
  }

  /**
   * PATCH /api/admin/vaccination-bookings/:bookingId/complete
   * Mark as completed and generate invoice
   */
  @Patch(':bookingId/complete')
  async completeBooking(@Param('bookingId') bookingId: string) {
    console.log(
      '[VaccinationOperationsController] PATCH /api/admin/vaccination-bookings/:bookingId/complete -',
      bookingId,
    );
    return this.vaccinationBookingService.completeBooking(bookingId);
  }

  /**
   * PATCH /api/admin/vaccination-bookings/:bookingId/no-show
   * Mark booking as no-show
   */
  @Patch(':bookingId/no-show')
  async markNoShow(@Param('bookingId') bookingId: string) {
    console.log(
      '[VaccinationOperationsController] PATCH /api/admin/vaccination-bookings/:bookingId/no-show -',
      bookingId,
    );
    return this.vaccinationBookingService.markNoShow(bookingId);
  }

  /**
   * PATCH /api/admin/vaccination-bookings/:bookingId/admin-cancel
   * Cancel booking with refund
   */
  @Patch(':bookingId/admin-cancel')
  async adminCancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelDto: AdminCancelVaccinationBookingDto,
  ) {
    console.log(
      '[VaccinationOperationsController] PATCH /api/admin/vaccination-bookings/:bookingId/admin-cancel -',
      bookingId,
    );
    return this.vaccinationBookingService.adminCancelBooking(
      bookingId,
      cancelDto.reason,
    );
  }

  /**
   * PATCH /api/admin/vaccination-bookings/:bookingId/reschedule
   * Reschedule booking to new slot
   */
  @Patch(':bookingId/reschedule')
  async rescheduleBooking(
    @Param('bookingId') bookingId: string,
    @Body() rescheduleDto: RescheduleVaccinationBookingDto,
  ) {
    console.log(
      '[VaccinationOperationsController] PATCH /api/admin/vaccination-bookings/:bookingId/reschedule -',
      bookingId,
    );
    return this.vaccinationBookingService.rescheduleBooking(
      bookingId,
      rescheduleDto,
    );
  }

  /**
   * GET /api/admin/vaccination-bookings/:bookingId/invoice
   * Download invoice PDF
   */
  @Get(':bookingId/invoice')
  async downloadInvoice(
    @Param('bookingId') bookingId: string,
    @Response() res: any,
  ) {
    console.log(
      '[VaccinationOperationsController] GET /api/admin/vaccination-bookings/:bookingId/invoice -',
      bookingId,
    );
    const result = await this.vaccinationBookingService.getInvoice(bookingId);
    res.sendFile(result.filePath);
  }
}
