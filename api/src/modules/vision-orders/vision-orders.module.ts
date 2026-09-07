import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WalletModule } from '../wallet/wallet.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PaymentModule } from '../payments/payment.module';
import { VisionOrdersController } from './vision-orders.controller';
import { VisionOrdersOpsController } from './vision-orders-ops.controller';
import { VisionOrdersService } from './vision-orders.service';
import { VisionOrder, VisionOrderSchema } from './schemas/vision-order.schema';
import { VisionPartner, VisionPartnerSchema } from './schemas/vision-partner.schema';

/**
 * Vision orders and coupons — patient-flows flow 3.
 *
 * Separate from `vision-bookings`, which models a clinic visit with slots and a
 * payment. That journey appears in neither the Patient Flows sheet nor the
 * Vision Backend tab, and its clinic list is empty on the live database. The two
 * are left side by side deliberately: retiring the booking journey is a decision
 * recorded as open in openspec/changes/member-vision-order.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VisionOrder.name, schema: VisionOrderSchema },
      { name: VisionPartner.name, schema: VisionPartnerSchema },
    ]),
    // For the remaining vision cover quoted on the coupon. Nothing here debits
    // or holds it — the coupon records an entitlement, it does not move money.
    WalletModule,
    // For the copay percentage and the per-service transaction cap, which the
    // coupon amount depends on. Vision was the only paid flow ignoring both.
    PlanConfigModule,
    AssignmentsModule,
    // The copay is collected on the existing dummy gateway, same as every other
    // flow. Vision adds no payment path of its own.
    PaymentModule,
  ],
  controllers: [VisionOrdersController, VisionOrdersOpsController],
  providers: [VisionOrdersService],
  exports: [VisionOrdersService],
})
export class VisionOrdersModule {}
