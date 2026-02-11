import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VaccinationService,
  VaccinationServiceSchema,
} from './schemas/vaccination-service.schema';
import {
  VaccinationVendor,
  VaccinationVendorSchema,
} from './schemas/vaccination-vendor.schema';
import {
  VaccinationVendorPricing,
  VaccinationVendorPricingSchema,
} from './schemas/vaccination-vendor-pricing.schema';
import {
  VaccinationVendorSlot,
  VaccinationVendorSlotSchema,
} from './schemas/vaccination-vendor-slot.schema';
import {
  VaccinationMasterParameter,
  VaccinationMasterParameterSchema,
} from './schemas/vaccination-master.schema';
import {
  VaccinationBooking,
  VaccinationBookingSchema,
} from './schemas/vaccination-booking.schema';
import { VaccinationServiceService } from './services/vaccination-service.service';
import { VaccinationVendorService } from './services/vaccination-vendor.service';
import { VaccinationMasterService } from './services/vaccination-master.service';
import { VaccinationBookingService } from './services/vaccination-booking.service';
import { VaccinationInvoiceService } from './services/vaccination-invoice.service';
import { VaccinationAdminController } from './controllers/vaccination-admin.controller';
import { VaccinationMemberController } from './controllers/vaccination-member.controller';
import { VaccinationOperationsController } from './controllers/vaccination-operations.controller';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payments/payment.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VaccinationService.name, schema: VaccinationServiceSchema },
      { name: VaccinationVendor.name, schema: VaccinationVendorSchema },
      {
        name: VaccinationVendorPricing.name,
        schema: VaccinationVendorPricingSchema,
      },
      { name: VaccinationVendorSlot.name, schema: VaccinationVendorSlotSchema },
      {
        name: VaccinationMasterParameter.name,
        schema: VaccinationMasterParameterSchema,
      },
      { name: VaccinationBooking.name, schema: VaccinationBookingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => AssignmentsModule),
    PlanConfigModule,
    WalletModule,
    forwardRef(() => PaymentModule),
    TransactionSummaryModule,
    NotificationsModule,
  ],
  controllers: [
    VaccinationAdminController,
    VaccinationMemberController,
    VaccinationOperationsController,
  ],
  providers: [
    VaccinationServiceService,
    VaccinationVendorService,
    VaccinationMasterService,
    VaccinationBookingService,
    VaccinationInvoiceService,
  ],
  exports: [
    VaccinationServiceService,
    VaccinationVendorService,
    VaccinationMasterService,
    VaccinationBookingService,
  ],
})
export class VaccinationModule {}
