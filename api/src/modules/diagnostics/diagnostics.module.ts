import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiagnosticService, DiagnosticServiceSchema } from './schemas/diagnostic-service.schema';
import { DiagnosticVendor, DiagnosticVendorSchema } from './schemas/diagnostic-vendor.schema';
import { DiagnosticVendorPricing, DiagnosticVendorPricingSchema } from './schemas/diagnostic-vendor-pricing.schema';
import { DiagnosticVendorSlot, DiagnosticVendorSlotSchema } from './schemas/diagnostic-vendor-slot.schema';
import { DiagnosticPrescription, DiagnosticPrescriptionSchema } from './schemas/diagnostic-prescription.schema';
import { DiagnosticCart, DiagnosticCartSchema } from './schemas/diagnostic-cart.schema';
import { DiagnosticOrder, DiagnosticOrderSchema } from './schemas/diagnostic-order.schema';
import { DiagnosticMasterTest, DiagnosticMasterTestSchema } from './schemas/diagnostic-master-test.schema';
import { DiagnosticServiceService } from './services/diagnostic-service.service';
import { DiagnosticVendorService } from './services/diagnostic-vendor.service';
import { DiagnosticPrescriptionService } from './services/diagnostic-prescription.service';
import { DiagnosticCartService } from './services/diagnostic-cart.service';
import { DiagnosticOrderService } from './services/diagnostic-order.service';
import { DiagnosticMasterTestService } from './services/diagnostic-master-test.service';
import { DiagnosticAdminController } from './controllers/diagnostic-admin.controller';
import { DiagnosticOpsController } from './controllers/diagnostic-ops.controller';
import { DiagnosticMemberController } from './controllers/diagnostic-member.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiagnosticService.name, schema: DiagnosticServiceSchema },
      { name: DiagnosticVendor.name, schema: DiagnosticVendorSchema },
      { name: DiagnosticVendorPricing.name, schema: DiagnosticVendorPricingSchema },
      { name: DiagnosticVendorSlot.name, schema: DiagnosticVendorSlotSchema },
      { name: DiagnosticPrescription.name, schema: DiagnosticPrescriptionSchema },
      { name: DiagnosticCart.name, schema: DiagnosticCartSchema },
      { name: DiagnosticOrder.name, schema: DiagnosticOrderSchema },
      { name: DiagnosticMasterTest.name, schema: DiagnosticMasterTestSchema },
    ]),
  ],
  controllers: [
    DiagnosticAdminController,
    DiagnosticOpsController,
    DiagnosticMemberController,
  ],
  providers: [
    DiagnosticServiceService,
    DiagnosticVendorService,
    DiagnosticPrescriptionService,
    DiagnosticCartService,
    DiagnosticOrderService,
    DiagnosticMasterTestService,
  ],
  exports: [
    DiagnosticServiceService,
    DiagnosticVendorService,
    DiagnosticPrescriptionService,
    DiagnosticCartService,
    DiagnosticOrderService,
    DiagnosticMasterTestService,
  ],
})
export class DiagnosticsModule {}
