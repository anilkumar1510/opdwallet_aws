import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { CounterModule } from '../counters/counter.module';
import { WalletModule } from '../wallet/wallet.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { PaymentModule } from '../payments/payment.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Appointment.name, schema: AppointmentSchema }]),
    CounterModule,
    WalletModule,
    PlanConfigModule,
    PaymentModule,
    TransactionSummaryModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}