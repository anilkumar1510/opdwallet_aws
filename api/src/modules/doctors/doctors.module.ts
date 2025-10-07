import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DoctorsController } from './doctors.controller';
import { DoctorAppointmentsController } from './doctor-appointments.controller';
import { DoctorAuthController } from './doctor-auth.controller';
import { DoctorsService } from './doctors.service';
import { DoctorAuthService } from './doctor-auth.service';
import { Doctor, DoctorSchema } from './schemas/doctor.schema';
import { DoctorSlot, DoctorSlotSchema } from '../doctor-slots/schemas/doctor-slot.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { CounterModule } from '../counters/counter.module';
import { PrescriptionsModule } from './prescriptions.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: DoctorSlot.name, schema: DoctorSlotSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: Appointment.name, schema: AppointmentSchema },
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
  ],
  controllers: [DoctorsController, DoctorAppointmentsController, DoctorAuthController],
  providers: [DoctorsService, DoctorAuthService],
  exports: [DoctorsService],
})
export class DoctorsModule {}