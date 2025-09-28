import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument, AppointmentStatus } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    console.log('[AppointmentsService] Creating appointment with DTO:', createAppointmentDto);

    const counter = await this.getNextAppointmentNumber();
    const appointmentId = `APT${counter}`;

    console.log('[AppointmentsService] Generated appointmentId:', appointmentId, 'counter:', counter);

    const appointmentData = {
      ...createAppointmentDto,
      appointmentId,
      appointmentNumber: counter.toString(),
      userId: new Types.ObjectId(createAppointmentDto.userId),
      status: AppointmentStatus.PENDING_CONFIRMATION,
      requestedAt: new Date(),
      slotId: createAppointmentDto.slotId,
      doctorName: createAppointmentDto.doctorName || '',
      specialty: createAppointmentDto.specialty || '',
      clinicId: createAppointmentDto.clinicId || '',
      clinicName: createAppointmentDto.clinicName || '',
      clinicAddress: createAppointmentDto.clinicAddress || '',
      consultationFee: createAppointmentDto.consultationFee || 0,
    };

    console.log('[AppointmentsService] Final appointment data:', appointmentData);

    const appointment = new this.appointmentModel(appointmentData);

    const saved = await appointment.save();
    console.log('[AppointmentsService] Appointment saved successfully:', saved.appointmentId);

    return saved;
  }

  async getUserAppointments(userId: string, appointmentType?: string): Promise<Appointment[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (appointmentType) {
      filter.appointmentType = appointmentType;
      console.log('[AppointmentsService] Filtering by appointmentType:', appointmentType);
    }

    console.log('[AppointmentsService] Query filter:', filter);

    return this.appointmentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOngoingAppointments(userId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({
        userId: new Types.ObjectId(userId),
        status: { $in: [AppointmentStatus.PENDING_CONFIRMATION, AppointmentStatus.CONFIRMED] },
      })
      .sort({ appointmentDate: 1 })
      .exec();
  }

  async findOne(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentModel.findOne({ appointmentId }).exec();
  }

  async findAll(query: any): Promise<{ data: Appointment[]; total: number; page: number; pages: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.doctorId) {
      filter.doctorId = query.doctorId;
    }

    if (query.specialtyId || query.specialty) {
      filter.specialty = query.specialtyId || query.specialty;
    }

    if (query.type) {
      filter.appointmentType = query.type;
    }

    const today = new Date().toISOString().split('T')[0];

    if (query.dateFrom) {
      filter.appointmentDate = { $gte: query.dateFrom };
    } else if (!query.includeOld) {
      filter.appointmentDate = { $gte: today };
    }

    if (query.dateTo) {
      filter.appointmentDate = filter.appointmentDate || {};
      filter.appointmentDate.$lte = query.dateTo;
    }

    const [appointments, total] = await Promise.all([
      this.appointmentModel
        .find(filter)
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.appointmentModel.countDocuments(filter),
    ]);

    return {
      data: appointments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException('Only pending appointments can be confirmed');
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();
    await appointment.save();

    return appointment;
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    return appointment;
  }

  private async getNextAppointmentNumber(): Promise<number> {
    const lastAppointment = await this.appointmentModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastAppointment) {
      return 34078;
    }

    return parseInt(lastAppointment.appointmentNumber) + 1;
  }
}