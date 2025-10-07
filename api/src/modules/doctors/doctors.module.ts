import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorsController } from './doctors.controller';
import { DoctorAppointmentsController } from './doctor-appointments.controller';
import { DoctorsService } from './doctors.service';
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
    CounterModule, // Added for proper ID generation
    PrescriptionsModule, // Added for DoctorAuthService
    LocationModule, // Added for location-based filtering
  ],
  controllers: [DoctorsController, DoctorAppointmentsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}