import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisionServicesController } from './vision-services.controller';
import { VisionServicesService } from './vision-services.service';
import {
  ClinicServicePricing,
  ClinicServicePricingSchema,
} from '../dental-services/schemas/clinic-service-pricing.schema';
import { Clinic, ClinicSchema } from '../../clinics/schemas/clinic.schema';
import {
  ServiceMaster,
  ServiceMasterSchema,
} from '../../masters/schemas/service-master.schema';
import {
  VisionServiceSlot,
  VisionServiceSlotSchema,
} from './schemas/vision-service-slot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicServicePricing.name, schema: ClinicServicePricingSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
      { name: VisionServiceSlot.name, schema: VisionServiceSlotSchema },
    ]),
  ],
  controllers: [VisionServicesController],
  providers: [VisionServicesService],
  exports: [VisionServicesService],
})
export class VisionServicesModule {}
