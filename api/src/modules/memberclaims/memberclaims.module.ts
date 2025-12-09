import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberClaimsController } from './memberclaims.controller';
import { MemberClaimsService } from './memberclaims.service';
import { MemberClaim, MemberClaimSchema } from './schemas/memberclaim.schema';
import { WalletModule } from '../wallet/wallet.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { PlanConfigModule } from '../plan-config/plan-config.module';
import { PaymentModule } from '../payments/payment.module';
import { TransactionSummaryModule } from '../transactions/transaction-summary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MemberClaim.name, schema: MemberClaimSchema },
      { name: User.name, schema: UserSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
    WalletModule,
    PlanConfigModule,
    PaymentModule,
    TransactionSummaryModule,
  ],
  controllers: [MemberClaimsController],
  providers: [MemberClaimsService],
  exports: [MemberClaimsService],
})
export class MemberClaimsModule {}