import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrescriptionsService } from './prescriptions.service';
import { DigitalPrescriptionService } from './digital-prescription.service';
import { PdfGenerationService } from './pdf-generation.service';
import { DiagnosisService } from './diagnosis.service';
import { SymptomsService } from './symptoms.service';
import { DoctorAuthService } from './doctor-auth.service';
import {
  DoctorPrescriptionsController,
  MemberPrescriptionsController,
} from './prescriptions.controller';
import {
  DoctorDigitalPrescriptionsController,
  MemberDigitalPrescriptionsController,
  MedicinesController,
  DiagnosesController,
  SymptomsController,
} from './digital-prescription.controller';
import { DoctorAuthController } from './doctor-auth.controller';
import { DoctorAppointmentsController } from './doctor-appointments.controller';
import {
  DoctorPrescription,
  DoctorPrescriptionSchema,
} from './schemas/doctor-prescription.schema';
import {
  DigitalPrescription,
  DigitalPrescriptionSchema,
} from './schemas/digital-prescription.schema';
import { Medicine, MedicineSchema } from './schemas/medicine.schema';
import { Diagnosis, DiagnosisSchema } from './schemas/diagnosis.schema';
import { Symptom, SymptomSchema } from './schemas/symptom.schema';
import { Doctor, DoctorSchema } from './schemas/doctor.schema';
import { PrescriptionTemplate, PrescriptionTemplateSchema } from './schemas/prescription-template.schema';
import { PrescriptionTemplateService } from './prescription-template.service';
import { PrescriptionTemplateController } from './prescription-template.controller';
import { ConsultationNote, ConsultationNoteSchema } from './schemas/consultation-note.schema';
import { ConsultationNoteService } from './consultation-note.service';
import { ConsultationNoteController } from './consultation-note.controller';
import { HealthRecordsService } from './health-records.service';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CounterModule } from '../counters/counter.module';

@Module({
  imports: [
    CounterModule,
    MongooseModule.forFeature([
      { name: DoctorPrescription.name, schema: DoctorPrescriptionSchema },
      { name: DigitalPrescription.name, schema: DigitalPrescriptionSchema },
      { name: Medicine.name, schema: MedicineSchema },
      { name: Diagnosis.name, schema: DiagnosisSchema },
      { name: Symptom.name, schema: SymptomSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: PrescriptionTemplate.name, schema: PrescriptionTemplateSchema },
      { name: ConsultationNote.name, schema: ConsultationNoteSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('DOCTOR_JWT_SECRET') || configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('DOCTOR_JWT_EXPIRY') || '8h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    DoctorPrescriptionsController,
    MemberPrescriptionsController,
    DoctorDigitalPrescriptionsController,
    MemberDigitalPrescriptionsController,
    MedicinesController,
    DiagnosesController,
    SymptomsController,
    DoctorAuthController,
    DoctorAppointmentsController,
    PrescriptionTemplateController,
    ConsultationNoteController,
  ],
  providers: [
    PrescriptionsService,
    DigitalPrescriptionService,
    PdfGenerationService,
    DiagnosisService,
    SymptomsService,
    DoctorAuthService,
    PrescriptionTemplateService,
    ConsultationNoteService,
    HealthRecordsService,
  ],
  exports: [PrescriptionsService, DigitalPrescriptionService, PdfGenerationService, DoctorAuthService],
})
export class PrescriptionsModule {}
