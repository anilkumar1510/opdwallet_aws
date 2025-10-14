import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './schemas/assignment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { WalletModule } from '../wallet/wallet.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    WalletModule,
    PlanConfigModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [MongooseModule, AssignmentsService],
})
export class AssignmentsModule {}