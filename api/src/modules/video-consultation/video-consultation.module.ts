import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoConsultationController } from './video-consultation.controller';
import { VideoConsultationService } from './video-consultation.service';
import { VideoConsultation, VideoConsultationSchema } from './schemas/video-consultation.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideoConsultation.name, schema: VideoConsultationSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [VideoConsultationController],
  providers: [VideoConsultationService],
  exports: [VideoConsultationService],
})
export class VideoConsultationModule {}
