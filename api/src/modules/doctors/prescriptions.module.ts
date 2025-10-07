import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrescriptionsService } from './prescriptions.service';
import { DoctorAuthService } from './doctor-auth.service';
import {
  DoctorPrescriptionsController,
  MemberPrescriptionsController,
} from './prescriptions.controller';
import { DoctorAuthController } from './doctor-auth.controller';
import { DoctorAppointmentsController } from './doctor-appointments.controller';
import {
  DoctorPrescription,
  DoctorPrescriptionSchema,
} from './schemas/doctor-prescription.schema';
import { Doctor, DoctorSchema } from './schemas/doctor.schema';
import {
  Appointment,
  AppointmentSchema,
} from '../appointments/schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorPrescription.name, schema: DoctorPrescriptionSchema },
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
    DoctorAuthController,
    DoctorAppointmentsController,
  ],
  providers: [PrescriptionsService, DoctorAuthService],
  exports: [PrescriptionsService, DoctorAuthService],
})
export class PrescriptionsModule {}
