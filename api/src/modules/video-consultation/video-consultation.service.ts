import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VideoConsultation, VideoConsultationDocument } from './schemas/video-consultation.schema';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

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

  /**
   * Development only — see the controller. Starts the call on the member's own
   * appointment, using the doctor recorded on it, so every check in
   * `startConsultation` still runs.
   */
  async demoStartAsMember(appointmentId: string, userId: string) {
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const owner =
      typeof (appointment as any).userId === 'object' && (appointment as any).userId?._id
        ? (appointment as any).userId._id.toString()
        : String((appointment as any).userId);
    if (owner !== userId) {
      throw new ForbiddenException('That appointment belongs to another member');
    }

    return this.startConsultation(appointmentId, (appointment as any).doctorId);
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
        agora: this.agoraFor(
          existingConsultation.consultationId,
          VideoConsultationService.AGORA_UID_DOCTOR,
        ),
      };
    }

    // If previous consultation was completed, allow creating a new one for reinitiation

    // Generate unique room details and create Daily.co room
    const roomId = uuidv4();
    const roomName = `opd-consult-${appointmentId}-${roomId.slice(0, 8)}`;

    // Create the Daily.co room — BEST EFFORT once Agora is configured.
    //
    // This used to be fatal: `startConsultation` created a Daily room first and
    // threw if it failed, so no consultation record existed, the member could
    // not join, and Agora never got a chance. The doctor saw only "Failed to
    // create video consultation room".
    //
    // Daily is still the transport for every client that has not moved, so it is
    // still attempted and still fatal when Agora is NOT configured. What changed
    // is that an Agora-capable server no longer depends on a third party it does
    // not need for this call.
    let roomUrl = '';
    try {
      const dailyRoom = await this.createDailyRoom(roomName);
      roomUrl = dailyRoom.url;
    } catch (error) {
      if (!this.agoraConfigured()) throw error;
      console.warn(
        '[VideoConsultation] Daily room creation failed; continuing with Agora only:',
        error?.message ?? error,
      );
    }

    /*
     * One consultation per appointment, created atomically.
     *
     * The check above ("is there an active one?") and this create used to be
     * two separate round trips, so two starts a few milliseconds apart — a
     * double-mounted effect in React dev, a double click, the doctor and an
     * automation at once — both found nothing and both created a record.
     *
     * That is not a harmless duplicate. The Agora channel IS the consultation
     * id, so the second start put the doctor in a different channel from the
     * member, and both sides sat looking at "waiting for the other to join"
     * while each was alone in their own room. It happened live: VID1788689464775
     * and VID1788689464789, 14ms apart, same appointment.
     *
     * `findOneAndUpdate` with `upsert` makes the find and the insert one
     * operation, so concurrent callers converge on the same document and the
     * loser of the race is handed the winner's consultation. `$setOnInsert`
     * means an existing consultation is never overwritten — a second start is
     * a no-op that returns what is already running.
     */
    const consultation = await this.videoConsultationModel.findOneAndUpdate(
      {
        appointmentId: new Types.ObjectId(appointmentId),
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      {
        $setOnInsert: {
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
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        /*
         * The SAME document `joinConsultation` picks.
         *
         * Without a sort, findOneAndUpdate takes whichever match the storage
         * engine offers first. On an appointment that already carries
         * duplicates from before this was atomic, that could be the older
         * record while the member's join — which sorts newest-first — took the
         * newer one, putting them back in different channels. Both sides now
         * order the same way, so they agree even on old data.
         */
        sort: { createdAt: -1, _id: -1 },
      },
    );

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
      agora: this.agoraFor(
        consultation.consultationId,
        VideoConsultationService.AGORA_UID_DOCTOR,
      ),
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


  /**
   * Agora participant ids. A consultation is two-party, so fixed ids are
   * enough — and they MUST differ, or the second joiner evicts the first.
   */
  private static readonly AGORA_UID_DOCTOR = 1;
  private static readonly AGORA_UID_PATIENT = 2;

  /**
   * Agora channel names allow letters, digits, space and a fixed punctuation
   * set, under 64 bytes. `consultationId` is the natural key — both ends must
   * derive the SAME string or they join different channels and never meet — but
   * it is sanitised rather than trusted, so an id format change cannot silently
   * produce an unjoinable channel.
   */
  private agoraChannel(consultationId: string): string {
    return consultationId.replace(/[^A-Za-z0-9!#$%&()+\-:;<=.>?@\[\]^_{}|~,]/g, '-').slice(0, 63);
  }

  /**
   * Mint an RTC token, or return null when Agora is not configured.
   *
   * **Returning null is the designed path, not a failure.** While AGORA_APP_ID
   * or AGORA_APP_CERTIFICATE is blank the response carries no `agora` block, and
   * both clients fall back to the Daily.co room they use today. Nothing breaks
   * by adding this; video only changes once the credentials exist.
   *
   * The certificate is read here and never returned. Only the app id, which is
   * public, and the signed token reach the browser.
   */
  /** Whether this server can mint Agora tokens at all. */
  private agoraConfigured(): boolean {
    return Boolean(process.env.AGORA_APP_ID?.trim() && process.env.AGORA_APP_CERTIFICATE?.trim());
  }

  private agoraFor(consultationId: string, uid: number) {
    const appId = process.env.AGORA_APP_ID?.trim();
    const certificate = process.env.AGORA_APP_CERTIFICATE?.trim();
    if (!appId || !certificate) return null;

    const ttl = Number(process.env.AGORA_TOKEN_TTL_SECONDS ?? 3600) || 3600;
    const channel = this.agoraChannel(consultationId);
    // Both expiries are SECONDS FROM NOW, not absolute timestamps.
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      certificate,
      channel,
      uid,
      RtcRole.PUBLISHER,
      ttl,
      ttl,
    );
    return { appId, channel, token, uid, expiresIn: ttl };
  }

  /**
   * A fresh token for a consultation already in progress.
   *
   * Tokens expire — the default here is an hour — and a consultation running
   * past that would drop mid-call. The clients renew on
   * `token-privilege-will-expire` rather than waiting to be disconnected.
   */
  async refreshAgoraToken(consultationId: string, userId: string) {
    const consultation = await this.videoConsultationModel.findOne({ consultationId });
    if (!consultation) throw new NotFoundException('Consultation not found');

    /*
     * A finished consultation gets no token.
     *
     * This handed out a perfectly valid token for an ENDED consultation, so a
     * tab still holding an old id would rejoin a channel nobody else is in and
     * sit there looking connected and alone — which is exactly what a stale tab
     * did after a duplicate was closed. Refusing tells the client to start
     * again, which returns the consultation that is actually running.
     */
    if (consultation.status !== 'SCHEDULED' && consultation.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `This consultation is ${consultation.status.toLowerCase()}. Reopen it from your appointment.`,
      );
    }

    const isDoctor = consultation.doctorId.toString() === userId;
    const isPatient = consultation.patientId.toString() === userId;
    if (!isDoctor && !isPatient) {
      throw new ForbiddenException('You are not a participant in this consultation');
    }

    const agora = this.agoraFor(
      consultation.consultationId,
      isDoctor
        ? VideoConsultationService.AGORA_UID_DOCTOR
        : VideoConsultationService.AGORA_UID_PATIENT,
    );
    if (!agora) throw new BadRequestException('Agora is not configured on this server');
    return agora;
  }

  async joinConsultation(appointmentId: string, patientId: string) {
    /*
     * The one the doctor is actually in.
     *
     * Sorted newest-first so that where duplicates already exist — created
     * before `startConsultation` was made atomic — the member lands on the
     * same one a fresh start would return, instead of whichever the storage
     * engine happened to hand back. Without the sort this silently put the two
     * of them in different Agora channels.
     */
    const consultation = await this.videoConsultationModel
      .findOne({
        appointmentId: new Types.ObjectId(appointmentId),
        patientId: new Types.ObjectId(patientId),
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      })
      .sort({ createdAt: -1, _id: -1 });

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
      agora: this.agoraFor(
        consultation.consultationId,
        VideoConsultationService.AGORA_UID_PATIENT,
      ),
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
