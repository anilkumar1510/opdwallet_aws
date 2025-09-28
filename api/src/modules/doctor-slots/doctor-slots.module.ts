import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorSlotsService } from './doctor-slots.service';
import { DoctorSlotsController } from './doctor-slots.controller';
import { DoctorSlot, DoctorSlotSchema } from './schemas/doctor-slot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorSlot.name, schema: DoctorSlotSchema },
    ]),
  ],
  controllers: [DoctorSlotsController],
  providers: [DoctorSlotsService],
  exports: [DoctorSlotsService],
})
export class DoctorSlotsModule {}