import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DentalBookingsController } from './dental-bookings.controller';
import { DentalBookingsService } from './dental-bookings.service';
import { DentalInvoiceService } from './dental-invoice.service';
import { DentalBooking, DentalBookingSchema } from './schemas/dental-booking.schema';
import { DentalServiceSlot, DentalServiceSlotSchema } from '../operations/dental-services/schemas/dental-service-slot.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
import { ServiceMaster, ServiceMasterSchema } from '../masters/schemas/service-master.schema';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payments/payment.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';
import { ClinicServicePricingModule } from '../operations/dental-services/clinic-service-pricing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DentalBooking.name, schema: DentalBookingSchema },
      { name: DentalServiceSlot.name, schema: DentalServiceSlotSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
    ]),
    AssignmentsModule,
    PlanConfigModule,
    WalletModule,
    forwardRef(() => PaymentModule),
    TransactionSummaryModule,
    ClinicServicePricingModule,
  ],
  controllers: [DentalBookingsController],
  providers: [DentalBookingsService, DentalInvoiceService],
  exports: [DentalBookingsService],
})
export class DentalBookingsModule {}
