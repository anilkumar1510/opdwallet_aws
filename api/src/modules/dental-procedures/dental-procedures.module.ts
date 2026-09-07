import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WalletModule } from '../wallet/wallet.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PaymentModule } from '../payments/payment.module';
import { DentalBookingsModule } from '../dental-bookings/dental-bookings.module';
import { DentalBooking, DentalBookingSchema } from '../dental-bookings/schemas/dental-booking.schema';
import { DentalProcedure, DentalProcedureSchema } from './schemas/dental-procedure.schema';
import { DentalProceduresController } from './dental-procedures.controller';
import { DentalProceduresOpsController } from './dental-procedures-ops.controller';
import { DentalProceduresService } from './dental-procedures.service';

/**
 * The dental procedure route — flow 4 steps 18-33.
 *
 * Separate from `dental-bookings` because a procedure is its own thing: own
 * estimate, own approved value, own slot, own payment. It reads the booking to
 * enforce that the dentist and the prescription are the same ones, and nothing
 * more.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DentalProcedure.name, schema: DentalProcedureSchema },
      { name: DentalBooking.name, schema: DentalBookingSchema },
    ]),
    WalletModule,
    PlanConfigModule,
    AssignmentsModule,
    // Circular on purpose: payments call back here when a co-payment clears,
    // which is what moves a procedure from awaiting payment to paid.
    forwardRef(() => PaymentModule),
    // For the clinic's slot list only. A procedure slot has to come from the
    // same availability the consultation books against, or the two journeys
    // can hand out the same time twice.
    DentalBookingsModule,
  ],
  controllers: [DentalProceduresController, DentalProceduresOpsController],
  providers: [DentalProceduresService],
  exports: [DentalProceduresService],
})
export class DentalProceduresModule {}
