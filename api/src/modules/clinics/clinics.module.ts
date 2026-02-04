import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { Clinic, ClinicSchema } from './schemas/clinic.schema';
import { DoctorSlot, DoctorSlotSchema } from '../doctor-slots/schemas/doctor-slot.schema';
import { CounterModule } from '../counters/counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Clinic.name, schema: ClinicSchema },
      { name: DoctorSlot.name, schema: DoctorSlotSchema },
    ]),
    CounterModule,
  ],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}