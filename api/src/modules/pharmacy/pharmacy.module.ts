import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PharmacyMedicine, PharmacyMedicineSchema } from './schemas/pharmacy-medicine.schema';
import { PharmacyCart, PharmacyCartSchema } from './schemas/pharmacy-cart.schema';
import { PharmacyOrder, PharmacyOrderSchema } from './schemas/pharmacy-order.schema';
import {
  PharmacyPrescription,
  PharmacyPrescriptionSchema,
} from './schemas/pharmacy-prescription.schema';
import { PharmacyCatalogueService } from './services/pharmacy-catalogue.service';
import { PharmacyCartService } from './services/pharmacy-cart.service';
import { PharmacyOrderService } from './services/pharmacy-order.service';
import { PharmacyPrescriptionService } from './services/pharmacy-prescription.service';
import { PharmacyInvoiceService } from './services/pharmacy-invoice.service';
import { PharmacyMemberController } from './controllers/pharmacy-member.controller';
import { PharmacyOpsController } from './controllers/pharmacy-ops.controller';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { WalletModule } from '../wallet/wallet.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentModule } from '../payments/payment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PharmacyMedicine.name, schema: PharmacyMedicineSchema },
      { name: PharmacyCart.name, schema: PharmacyCartSchema },
      { name: PharmacyOrder.name, schema: PharmacyOrderSchema },
      { name: PharmacyPrescription.name, schema: PharmacyPrescriptionSchema },
    ]),
    AssignmentsModule,
    PlanConfigModule,
    WalletModule,
    TransactionSummaryModule,
    NotificationsModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [PharmacyMemberController, PharmacyOpsController],
  providers: [
    PharmacyCatalogueService,
    PharmacyCartService,
    PharmacyOrderService,
    PharmacyInvoiceService,
    PharmacyPrescriptionService,
  ],
  exports: [PharmacyOrderService],
})
export class PharmacyModule {}
