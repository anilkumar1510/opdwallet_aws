import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicServicePricingController } from './clinic-service-pricing.controller';
import { ClinicServicePricingService } from './clinic-service-pricing.service';
import {
  ClinicServicePricing,
  ClinicServicePricingSchema,
} from './schemas/clinic-service-pricing.schema';
import { Clinic, ClinicSchema } from '../../clinics/schemas/clinic.schema';
import {
  ServiceMaster,
  ServiceMasterSchema,
} from '../../masters/schemas/service-master.schema';
import {
  DentalServiceSlot,
  DentalServiceSlotSchema,
} from './schemas/dental-service-slot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicServicePricing.name, schema: ClinicServicePricingSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
      { name: DentalServiceSlot.name, schema: DentalServiceSlotSchema },
    ]),
  ],
  controllers: [ClinicServicePricingController],
  providers: [ClinicServicePricingService],
  exports: [ClinicServicePricingService],
})
export class ClinicServicePricingModule {}
