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
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorPrescription.name, schema: DoctorPrescriptionSchema },
      { name: DigitalPrescription.name, schema: DigitalPrescriptionSchema },
      { name: Medicine.name, schema: MedicineSchema },
      { name: Diagnosis.name, schema: DiagnosisSchema },
      { name: Symptom.name, schema: SymptomSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Appointment.name, schema: AppointmentSchema },
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
  ],
  providers: [
    PrescriptionsService,
    DigitalPrescriptionService,
    PdfGenerationService,
    DiagnosisService,
    SymptomsService,
    DoctorAuthService,
  ],
  exports: [PrescriptionsService, DigitalPrescriptionService, PdfGenerationService, DoctorAuthService],
})
export class PrescriptionsModule {}
