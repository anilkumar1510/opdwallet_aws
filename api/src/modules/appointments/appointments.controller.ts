import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req) {
    const userId = req.user.userId;
    console.log('[AppointmentsController] Creating appointment for user:', userId);
    console.log('[AppointmentsController] Appointment data:', createAppointmentDto);
    return this.appointmentsService.create({ ...createAppointmentDto, userId });
  }

  @Get('user/:userId')
  async getUserAppointments(@Param('userId') userId: string) {
    return this.appointmentsService.getUserAppointments(userId);
  }

  @Get('user/:userId/ongoing')
  async getOngoingAppointments(@Param('userId') userId: string) {
    return this.appointmentsService.getOngoingAppointments(userId);
  }

  @Get(':appointmentId')
  async findOne(@Param('appointmentId') appointmentId: string) {
    return this.appointmentsService.findOne(appointmentId);
  }
}