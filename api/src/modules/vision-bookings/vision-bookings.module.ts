import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisionBookingsController } from './vision-bookings.controller';
import { VisionBookingsService } from './vision-bookings.service';
import { VisionInvoiceService } from './vision-invoice.service';
import { VisionBooking, VisionBookingSchema } from './schemas/vision-booking.schema';
import { VisionServiceSlot, VisionServiceSlotSchema } from '../operations/vision-services/schemas/vision-service-slot.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
import { ServiceMaster, ServiceMasterSchema } from '../masters/schemas/service-master.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payments/payment.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';
import { ClinicServicePricingModule } from '../operations/dental-services/clinic-service-pricing.module';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisionBooking.name, schema: VisionBookingSchema },
      { name: VisionServiceSlot.name, schema: VisionServiceSlotSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AssignmentsModule,
    PlanConfigModule,
    WalletModule,
    forwardRef(() => PaymentModule),
    TransactionSummaryModule,
    ClinicServicePricingModule,
  ],
  controllers: [VisionBookingsController],
  providers: [VisionBookingsService, VisionInvoiceService],
  exports: [VisionBookingsService],
})
export class VisionBookingsModule {}
