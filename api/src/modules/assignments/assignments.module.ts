import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment, AssignmentSchema } from './schemas/assignment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Policy, PolicySchema } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionSchema } from '../plan-versions/schemas/plan-version.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: PlanVersion.name, schema: PlanVersionSchema },
    ]),
    AuditModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}