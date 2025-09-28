import { Injectable } from '@nestjs/common';
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

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ userId: new Types.ObjectId(userId) })
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