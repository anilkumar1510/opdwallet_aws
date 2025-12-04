import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { Policy, PolicySchema } from './schemas/policy.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { PlanConfig, PlanConfigSchema } from '../plan-config/schemas/plan-config.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CugMaster, CugMasterSchema } from '../masters/schemas/cug-master.schema';
import { CounterModule } from '../counters/counter.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Policy.name, schema: PolicySchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: PlanConfig.name, schema: PlanConfigSchema },
      { name: User.name, schema: UserSchema },
      { name: CugMaster.name, schema: CugMasterSchema }
    ]),
    CounterModule,
    AuditModule,
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}