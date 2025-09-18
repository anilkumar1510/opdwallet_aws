import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanVersionsController } from './plan-versions.controller';
import { PlanVersionsService } from './plan-versions.service';
import { PlanVersion, PlanVersionSchema } from './schemas/plan-version.schema';
import { Policy, PolicySchema } from '../policies/schemas/policy.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanVersion.name, schema: PlanVersionSchema },
      { name: Policy.name, schema: PolicySchema },
    ]),
    AuditModule,
  ],
  controllers: [PlanVersionsController],
  providers: [PlanVersionsService],
  exports: [PlanVersionsService],
})
export class PlanVersionsModule {}