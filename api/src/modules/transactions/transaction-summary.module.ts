import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionSummaryController } from './transaction-summary.controller';
import { TransactionSummaryService } from './transaction-summary.service';
import {
  TransactionSummary,
  TransactionSummarySchema,
} from './schemas/transaction-summary.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CounterModule } from '../counters/counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionSummary.name, schema: TransactionSummarySchema },
      { name: User.name, schema: UserSchema },
    ]),
    CounterModule,
  ],
  controllers: [TransactionSummaryController],
  providers: [TransactionSummaryService],
  exports: [TransactionSummaryService],
})
export class TransactionSummaryModule {}
