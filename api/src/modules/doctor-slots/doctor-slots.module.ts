import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorSlotsService } from './doctor-slots.service';
import { DoctorSlotsController } from './doctor-slots.controller';
import { DoctorCalendarService } from './doctor-calendar.service';
import { DoctorCalendarController } from './doctor-calendar.controller';
import { DoctorSlot, DoctorSlotSchema } from './schemas/doctor-slot.schema';
import { DoctorUnavailability, DoctorUnavailabilitySchema } from './schemas/doctor-unavailability.schema';
import { CounterModule } from '../counters/counter.module';
import { DoctorClinicAssignmentsModule } from '../doctor-clinic-assignments/doctor-clinic-assignments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorSlot.name, schema: DoctorSlotSchema },
      { name: DoctorUnavailability.name, schema: DoctorUnavailabilitySchema },
    ]),
    CounterModule,
    forwardRef(() => DoctorClinicAssignmentsModule),
  ],
  controllers: [DoctorSlotsController, DoctorCalendarController],
  providers: [DoctorSlotsService, DoctorCalendarService],
  exports: [DoctorSlotsService, DoctorCalendarService],
})
export class DoctorSlotsModule {}