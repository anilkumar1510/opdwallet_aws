import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { UserWallet, UserWalletSchema } from './schemas/user-wallet.schema';
import { WalletTransaction, WalletTransactionSchema } from './schemas/wallet-transaction.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { PlanConfig, PlanConfigSchema } from '../plan-config/schemas/plan-config.schema';
import { MastersModule } from '../masters/masters.module';
import { CounterModule } from '../counters/counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: PlanConfig.name, schema: PlanConfigSchema },
    ]),
    MastersModule,
    CounterModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}