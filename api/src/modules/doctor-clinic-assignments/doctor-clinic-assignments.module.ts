import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorClinicAssignmentsController } from './doctor-clinic-assignments.controller';
import { DoctorClinicAssignmentsService } from './doctor-clinic-assignments.service';
import { DoctorClinicAssignment, DoctorClinicAssignmentSchema } from './schemas/doctor-clinic-assignment.schema';
import { Doctor, DoctorSchema } from '../doctors/schemas/doctor.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
import { DoctorSlot, DoctorSlotSchema } from '../doctor-slots/schemas/doctor-slot.schema';
import { CounterModule } from '../counters/counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorClinicAssignment.name, schema: DoctorClinicAssignmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: DoctorSlot.name, schema: DoctorSlotSchema },
    ]),
    CounterModule,
  ],
  controllers: [DoctorClinicAssignmentsController],
  providers: [DoctorClinicAssignmentsService],
  exports: [DoctorClinicAssignmentsService],
})
export class DoctorClinicAssignmentsModule {}
