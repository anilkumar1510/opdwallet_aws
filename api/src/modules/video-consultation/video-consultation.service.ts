import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VideoConsultation, VideoConsultationDocument } from './schemas/video-consultation.schema';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

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

  /**
   * Creates a Daily.co room via REST API
   * @param roomName - Unique room name
   * @returns Room URL and room name
   */
  private async createDailyRoom(roomName: string): Promise<{ url: string; name: string }> {
    const apiKey = process.env.DAILY_API_KEY || '1317f4d3f42ab7b4ffb63e3ac66baa67306852a491393aaff8d5a665ffc02f09';

    console.log('\n========================================');
    console.log('[DEBUG] 🎬 DAILY.CO ROOM CREATION STARTED');
    console.log('[DEBUG] Timestamp:', new Date().toISOString());
    console.log('[DEBUG] Room Name:', roomName);
    console.log('[DEBUG] API Key (first 20 chars):', apiKey.substring(0, 20) + '...');
    console.log('[DEBUG] API Key Length:', apiKey.length);
    console.log('[DEBUG] API Endpoint:', 'https://api.daily.co/v1/rooms');
    console.log('[DEBUG] Request Config:', JSON.stringify({
      privacy: 'public',
      properties: {
        geo: 'ap-south-1',
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
        enable_recording: 'cloud',
        max_participants: 2,
      },
    }, null, 2));
    console.log('========================================\n');

    const requestStartTime = Date.now();

    try {
      const response = await axios.post(
        'https://api.daily.co/v1/rooms',
        {
          name: roomName,
          privacy: 'public',
          properties: {
            geo: 'ap-south-1', // Force India/Asia-South region for optimal performance
            enable_screenshare: true,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
            enable_recording: 'cloud',
            max_participants: 2,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      const requestDuration = Date.now() - requestStartTime;

      console.log('\n========================================');
      console.log('[DEBUG] ✅ DAILY.CO ROOM CREATION SUCCESS');
      console.log('[DEBUG] Duration:', requestDuration, 'ms');
      console.log('[DEBUG] Response Status:', response.status);
      console.log('[DEBUG] Response StatusText:', response.statusText);
      console.log('[DEBUG] Response Headers:', JSON.stringify(response.headers, null, 2));
      console.log('[DEBUG] Response Data:', JSON.stringify(response.data, null, 2));
      console.log('[DEBUG] Room URL:', response.data.url);
      console.log('[DEBUG] Room Name:', response.data.name);
      console.log('[DEBUG] Room ID:', response.data.id);
      console.log('[DEBUG] Room Config:', JSON.stringify(response.data.config, null, 2));
      console.log('[DEBUG] Room Privacy:', response.data.privacy);
      console.log('========================================\n');

      return {
        url: response.data.url,
        name: response.data.name,
      };
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;

      console.error('\n========================================');
      console.error('[DEBUG] ❌ DAILY.CO ROOM CREATION FAILED');
      console.error('[DEBUG] Duration:', requestDuration, 'ms');
      console.error('[DEBUG] Error Type:', error.constructor.name);
      console.error('[DEBUG] Error Message:', error.message);

      if (axios.isAxiosError(error)) {
        console.error('[DEBUG] Axios Error Details:');
        console.error('[DEBUG] - Status:', error.response?.status);
        console.error('[DEBUG] - StatusText:', error.response?.statusText);
        console.error('[DEBUG] - Headers:', JSON.stringify(error.response?.headers, null, 2));
        console.error('[DEBUG] - Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('[DEBUG] - Request URL:', error.config?.url);
        console.error('[DEBUG] - Request Method:', error.config?.method);
        console.error('[DEBUG] - Request Headers:', JSON.stringify(error.config?.headers, null, 2));
      }

      console.error('[DEBUG] Full Error Object:', JSON.stringify(error, null, 2));
      console.error('[DEBUG] Stack Trace:', error.stack);
      console.error('========================================\n');

      throw new BadRequestException('Failed to create video consultation room');
    }
  }

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

    // Check if an active consultation already exists
    const existingConsultation = await this.videoConsultationModel.findOne({
      appointmentId: new Types.ObjectId(appointmentId),
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
    });

    if (existingConsultation) {
      // Return existing active consultation
      return {
        consultationId: existingConsultation.consultationId,
        roomName: existingConsultation.roomName,
        roomUrl: existingConsultation.roomUrl,
        doctorName: existingConsultation.doctorName,
        patientName: existingConsultation.patientName,
        status: existingConsultation.status,
      };
    }

    // If previous consultation was completed, allow creating a new one for reinitiation

    // Generate unique room details and create Daily.co room
    const roomId = uuidv4();
    const roomName = `opd-consult-${appointmentId}-${roomId.slice(0, 8)}`;

    // Create Daily.co room
    const dailyRoom = await this.createDailyRoom(roomName);
    const roomUrl = dailyRoom.url;

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

    const result = {
      consultationId: consultation.consultationId,
      roomName: consultation.roomName,
      roomUrl: consultation.roomUrl,
      doctorName: consultation.doctorName,
      patientName: consultation.patientName,
      status: consultation.status,
    };

    console.log('\n========================================');
    console.log('[DEBUG] 📤 RETURNING CONSULTATION DATA TO FRONTEND');
    console.log('[DEBUG] Timestamp:', new Date().toISOString());
    console.log('[DEBUG] Consultation Data:', JSON.stringify(result, null, 2));
    console.log('[DEBUG] Room URL Structure:', {
      fullUrl: result.roomUrl,
      protocol: result.roomUrl.split('://')[0],
      domain: result.roomUrl.split('://')[1]?.split('/')[0],
      roomPath: result.roomUrl.split('://')[1]?.split('/').slice(1).join('/'),
    });
    console.log('========================================\n');

    return result;
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

    // Don't auto-complete appointment - doctor can restart consultation
    // Appointment will be marked complete manually by doctor when they're done

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
