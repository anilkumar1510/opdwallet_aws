import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BenefitComponentsController } from './benefit-components.controller';
import { BenefitComponentsService } from './benefit-components.service';
import { BenefitComponent, BenefitComponentSchema } from './schemas/benefit-component.schema';
import { Policy, PolicySchema } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionSchema } from '../plan-versions/schemas/plan-version.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BenefitComponent.name, schema: BenefitComponentSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: PlanVersion.name, schema: PlanVersionSchema },
    ]),
    AuditModule,
  ],
  controllers: [BenefitComponentsController],
  providers: [BenefitComponentsService],
  exports: [BenefitComponentsService],
})
export class BenefitComponentsModule {}