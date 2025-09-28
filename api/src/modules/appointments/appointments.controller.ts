import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req: any) {
    const userId = req.user.userId;
    console.log('[AppointmentsController] Creating appointment for user:', userId);
    console.log('[AppointmentsController] Appointment data:', createAppointmentDto);
    return this.appointmentsService.create({ ...createAppointmentDto, userId });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(@Query() query: any) {
    return this.appointmentsService.findAll(query);
  }

  @Get('user/:userId')
  async getUserAppointments(
    @Param('userId') userId: string,
    @Query('type') appointmentType?: string,
  ) {
    console.log('[AppointmentsController] Fetching appointments:', { userId, appointmentType });
    return this.appointmentsService.getUserAppointments(userId, appointmentType);
  }

  @Get('user/:userId/ongoing')
  async getOngoingAppointments(@Param('userId') userId: string) {
    return this.appointmentsService.getOngoingAppointments(userId);
  }

  @Get(':appointmentId')
  async findOne(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.findOne(appointmentId);
  }

  @Patch(':appointmentId/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async confirm(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.confirmAppointment(appointmentId);
  }

  @Patch(':appointmentId/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancel(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.cancelAppointment(appointmentId);
  }
}