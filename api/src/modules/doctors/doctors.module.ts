import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DoctorsController } from './doctors.controller';
import { DoctorAppointmentsController } from './doctor-appointments.controller';
import { DoctorAuthController } from './doctor-auth.controller';
import { ConsultationNoteController } from './consultation-note.controller';
import { DoctorsService } from './doctors.service';
import { DoctorAuthService } from './doctor-auth.service';
import { HealthRecordsService } from './health-records.service';
import { ConsultationNoteService } from './consultation-note.service';
import { Doctor, DoctorSchema } from './schemas/doctor.schema';
import { DoctorSlot, DoctorSlotSchema } from '../doctor-slots/schemas/doctor-slot.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { DigitalPrescription, DigitalPrescriptionSchema } from './schemas/digital-prescription.schema';
import { ConsultationNote, ConsultationNoteSchema } from './schemas/consultation-note.schema';
import { CounterModule } from '../counters/counter.module';
import { PrescriptionsModule } from './prescriptions.module';
import { LocationModule } from '../location/location.module';
import { DoctorClinicAssignmentsModule } from '../doctor-clinic-assignments/doctor-clinic-assignments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: DoctorSlot.name, schema: DoctorSlotSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: DigitalPrescription.name, schema: DigitalPrescriptionSchema },
      { name: ConsultationNote.name, schema: ConsultationNoteSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'dev_jwt_secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '8h',
        },
      }),
    }),
    CounterModule, // Added for proper ID generation
    PrescriptionsModule, // Added for DoctorAuthService
    LocationModule, // Added for location-based filtering
    DoctorClinicAssignmentsModule, // Added for clinic assignments
  ],
  controllers: [DoctorsController, DoctorAppointmentsController, DoctorAuthController, ConsultationNoteController],
  providers: [DoctorsService, DoctorAuthService, HealthRecordsService, ConsultationNoteService],
  exports: [DoctorsService],
})
export class DoctorsModule {}