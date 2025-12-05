import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { PlanConfig, PlanConfigSchema } from '../plan-config/schemas/plan-config.schema';
import { CounterModule } from '../counters/counter.module';
import { WalletModule } from '../wallet/wallet.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { PaymentModule } from '../payments/payment.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { BenefitAccessGuard } from '@/common/guards/benefit-access.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: PlanConfig.name, schema: PlanConfigSchema },
    ]),
    CounterModule,
    WalletModule,
    PlanConfigModule,
    PaymentModule,
    TransactionSummaryModule,
    forwardRef(() => AssignmentsModule),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, BenefitAccessGuard],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}