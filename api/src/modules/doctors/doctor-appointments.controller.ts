import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request as ExpressRequest } from 'express';
import { Appointment, AppointmentDocument, AppointmentStatus } from '../appointments/schemas/appointment.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

interface AuthRequest extends ExpressRequest {
  user: {
    doctorId?: string;
    role: UserRole;
  };
}

@Controller('doctor/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorAppointmentsController {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  @Get('today')
  async getTodayAppointments(@Request() req: AuthRequest) {
    console.log('=== DOCTOR APPOINTMENTS TODAY DEBUG START ===');
    console.log('[DoctorAppointmentsController] GET /doctor/appointments/today');
    console.log('[DoctorAppointmentsController] Request headers:', req.headers);
    console.log('[DoctorAppointmentsController] Request cookies:', req.cookies);
    console.log('[DoctorAppointmentsController] Request user:', req.user);
    console.log('[DoctorAppointmentsController] Request user type:', typeof req.user);
    console.log('[DoctorAppointmentsController] Request user keys:', req.user ? Object.keys(req.user) : 'null');

    const doctorId = req.user?.doctorId;
    console.log('[DoctorAppointmentsController] Extracted doctorId:', doctorId);
    console.log('[DoctorAppointmentsController] doctorId type:', typeof doctorId);

    if (!doctorId) {
      console.error('[DoctorAppointmentsController] No doctorId found in request!');
      console.error('[DoctorAppointmentsController] Full req.user object:', JSON.stringify(req.user, null, 2));
      throw new BadRequestException('Doctor ID is required');
    }

    const today = new Date().toISOString().split('T')[0];
    console.log('[DoctorAppointmentsController] Today date:', today);

    console.log('[DoctorAppointmentsController] Querying appointments with:', {
      doctorId,
      appointmentDate: today,
      status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
    });

    // First, check ALL appointments in the collection
    const allAppointments = await this.appointmentModel.find({}).limit(10).exec();
    console.log('[DoctorAppointmentsController] Total appointments in DB (first 10):', allAppointments.length);
    console.log('[DoctorAppointmentsController] Sample appointments:', allAppointments.map(a => ({
      appointmentId: a.appointmentId,
      doctorId: a.doctorId,
      appointmentDate: a.appointmentDate,
      status: a.status,
      patientName: a.patientName
    })));

    // Check appointments for this doctor regardless of date/status
    const doctorAllAppts = await this.appointmentModel.find({ doctorId }).exec();
    console.log('[DoctorAppointmentsController] Total appointments for doctorId', doctorId, ':', doctorAllAppts.length);

    // Check appointments for today regardless of doctor/status
    const todayAllAppts = await this.appointmentModel.find({ appointmentDate: today }).exec();
    console.log('[DoctorAppointmentsController] Total appointments for date', today, ':', todayAllAppts.length);

    const appointments = await this.appointmentModel
      .find({
        doctorId,
        appointmentDate: today,
        status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
      })
      .sort({ timeSlot: 1 })
      .exec();

    console.log('[DoctorAppointmentsController] Found appointments matching ALL criteria:', appointments.length);
    console.log('[DoctorAppointmentsController] Appointments:', appointments.map(a => ({
      appointmentId: a.appointmentId,
      patientName: a.patientName,
      timeSlot: a.timeSlot,
      status: a.status
    })));

    const response = {
      message: 'Today\'s appointments retrieved successfully',
      appointments: appointments.map(apt => apt.toObject()),
      total: appointments.length,
      date: today,
    };

    console.log('[DoctorAppointmentsController] Sending response:', {
      message: response.message,
      total: response.total,
      date: response.date,
    });
    console.log('=== DOCTOR APPOINTMENTS TODAY DEBUG END ===');

    return response;
  }

  @Get('date/:date')
  async getAppointmentsByDate(
    @Param('date') date: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const appointments = await this.appointmentModel
      .find({
        doctorId,
        appointmentDate: date,
        status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
      })
      .sort({ timeSlot: 1 })
      .exec();

    return {
      message: 'Appointments retrieved successfully',
      appointments: appointments.map(apt => apt.toObject()),
      total: appointments.length,
      date,
    };
  }

  @Get('upcoming')
  async getUpcomingAppointments(
    @Request() req: AuthRequest,
    @Query('limit') limit = 10,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const today = new Date().toISOString().split('T')[0];

    const appointments = await this.appointmentModel
      .find({
        doctorId,
        appointmentDate: { $gte: today },
        status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING_CONFIRMATION] },
      })
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .limit(+limit)
      .exec();

    return {
      message: 'Upcoming appointments retrieved successfully',
      appointments: appointments.map(apt => apt.toObject()),
      total: appointments.length,
    };
  }

  @Get(':appointmentId')
  async getAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const appointment = await this.appointmentModel
      .findOne({
        appointmentId,
        doctorId,
      })
      .populate('prescriptionId')
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return {
      message: 'Appointment retrieved successfully',
      appointment: appointment.toObject(),
    };
  }

  @Patch(':appointmentId/complete')
  async markComplete(
    @Param('appointmentId') appointmentId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const appointment = await this.appointmentModel.findOne({
      appointmentId,
      doctorId,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    await appointment.save();

    return {
      message: 'Appointment marked as completed',
      appointment: appointment.toObject(),
    };
  }
}
