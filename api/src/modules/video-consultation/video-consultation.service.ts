import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VideoConsultation, VideoConsultationDocument } from './schemas/video-consultation.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoConsultationService {
  constructor(
    @InjectModel(VideoConsultation.name)
    private videoConsultationModel: Model<VideoConsultationDocument>,
    @InjectModel('Appointment')
    private appointmentModel: Model<any>,
    @InjectModel('Doctor')
    private doctorModel: Model<any>,
  ) {}

  async startConsultation(appointmentId: string, doctorId: string) {
    // Get appointment details
    const appointment = await this.appointmentModel
      .findById(appointmentId)
      .populate('userId', 'name email');
      // Note: doctorId is stored as string in Appointment schema, not ObjectId, so no populate needed

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify doctor owns this appointment
    // appointment.doctorId is human-readable ID (DOC001), doctorId from JWT is also DOC001
    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException('You are not authorized to start this consultation');
    }

    // Look up doctor to get MongoDB _id for VideoConsultation record
    const doctor = await this.doctorModel.findOne({ doctorId });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if appointment type is ONLINE
    if (appointment.appointmentType !== 'ONLINE') {
      throw new BadRequestException('This appointment is not scheduled for online consultation');
    }

    // Check if consultation already exists
    const existingConsultation = await this.videoConsultationModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
    });

    if (existingConsultation) {
      // Return existing consultation
      return {
        consultationId: existingConsultation.consultationId,
        roomName: existingConsultation.roomName,
        roomUrl: existingConsultation.roomUrl,
        jitsiDomain: existingConsultation.jitsiDomain,
        doctorName: existingConsultation.doctorName,
        patientName: existingConsultation.patientName,
        status: existingConsultation.status,
      };
    }

    // Generate unique room details
    const roomId = uuidv4();
    const roomName = `opd-consult-${appointmentId}-${roomId.slice(0, 8)}`;
    const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
    const roomUrl = `https://${jitsiDomain}/${roomName}`;

    // Create consultation record
    const consultation = await this.videoConsultationModel.create({
      consultationId: `VID${Date.now()}`,
      appointmentId: new Types.ObjectId(appointmentId),
      doctorId: doctor._id, // Use MongoDB _id from doctor lookup
      doctorName: appointment.doctorName,
      patientId: appointment.userId._id,
      patientName: appointment.patientName,
      roomId,
      roomName,
      jitsiDomain,
      roomUrl,
      scheduledStartTime: appointment.appointmentDate,
      actualStartTime: new Date(),
      status: 'IN_PROGRESS',
      doctorJoinedAt: new Date(),
    });

    // Update appointment status
    await this.appointmentModel.findByIdAndUpdate(appointmentId, {
      status: 'CONFIRMED', // Keep as CONFIRMED during consultation
      consultationStartedAt: new Date(),
    });

    return {
      consultationId: consultation.consultationId,
      roomName: consultation.roomName,
      roomUrl: consultation.roomUrl,
      jitsiDomain: consultation.jitsiDomain,
      doctorName: consultation.doctorName,
      patientName: consultation.patientName,
      status: consultation.status,
    };
  }

  async joinConsultation(appointmentId: string, patientId: string) {
    // Find existing consultation
    const consultation = await this.videoConsultationModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
      patientId: new Types.ObjectId(patientId),
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
    });

    if (!consultation) {
      throw new NotFoundException('No active consultation found for this appointment');
    }

    // Update patient joined time if first join
    if (!consultation.patientJoinedAt) {
      await this.videoConsultationModel.findByIdAndUpdate(consultation._id, {
        patientJoinedAt: new Date(),
      });
    }

    return {
      consultationId: consultation.consultationId,
      roomName: consultation.roomName,
      roomUrl: consultation.roomUrl,
      jitsiDomain: consultation.jitsiDomain,
      doctorName: consultation.doctorName,
      patientName: consultation.patientName,
      status: consultation.status,
    };
  }

  async endConsultation(consultationId: string, doctorId: string, endData: any) {
    const consultation = await this.videoConsultationModel.findOne({
      consultationId,
      doctorId: new Types.ObjectId(doctorId),
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    if (consultation.status === 'COMPLETED') {
      throw new BadRequestException('Consultation already ended');
    }

    const endTime = new Date();
    const duration = consultation.actualStartTime
      ? Math.floor((endTime.getTime() - consultation.actualStartTime.getTime()) / 60000)
      : 0;

    await this.videoConsultationModel.findByIdAndUpdate(consultation._id, {
      status: 'COMPLETED',
      endTime,
      duration,
      endedBy: endData.endedBy || 'DOCTOR',
    });

    // Update appointment status
    await this.appointmentModel.findByIdAndUpdate(consultation.appointmentId, {
      status: 'COMPLETED',
      consultationCompletedAt: endTime,
    });

    return {
      consultationId,
      duration,
      appointmentId: consultation.appointmentId.toString(),
      status: 'COMPLETED',
    };
  }

  async getConsultationStatus(consultationId: string) {
    const consultation = await this.videoConsultationModel.findOne({
      consultationId,
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    const duration = consultation.actualStartTime
      ? Math.floor((new Date().getTime() - consultation.actualStartTime.getTime()) / 60000)
      : 0;

    return {
      consultationId: consultation.consultationId,
      status: consultation.status,
      doctorJoined: !!consultation.doctorJoinedAt,
      patientJoined: !!consultation.patientJoinedAt,
      startedAt: consultation.actualStartTime,
      duration,
      roomUrl: consultation.roomUrl,
    };
  }

  async getDoctorConsultations(doctorId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const consultations = await this.videoConsultationModel
      .find({ doctorId: new Types.ObjectId(doctorId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('appointmentId', 'appointmentNumber appointmentDate')
      .lean();

    const total = await this.videoConsultationModel.countDocuments({
      doctorId: new Types.ObjectId(doctorId),
    });

    return {
      consultations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPatientConsultations(patientId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const consultations = await this.videoConsultationModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('appointmentId', 'appointmentNumber appointmentDate')
      .lean();

    const total = await this.videoConsultationModel.countDocuments({
      patientId: new Types.ObjectId(patientId),
    });

    return {
      consultations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
