import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanVersionsController } from './plan-versions.controller';
import { PlanVersionsService } from './plan-versions.service';
import { PlanVersion, PlanVersionSchema } from './schemas/plan-version.schema';
import { Policy, PolicySchema } from '../policies/schemas/policy.schema';
import { BenefitComponent, BenefitComponentSchema } from '../benefit-components/schemas/benefit-component.schema';
import { WalletRule, WalletRuleSchema } from '../wallet-rules/schemas/wallet-rule.schema';
import { BenefitCoverageMatrix, BenefitCoverageMatrixSchema } from '../benefit-coverage-matrix/schemas/benefit-coverage-matrix.schema';
import { AuditModule } from '../audit/audit.module';
import { BenefitsModule } from '../benefits/benefits.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanVersion.name, schema: PlanVersionSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: BenefitComponent.name, schema: BenefitComponentSchema },
      { name: WalletRule.name, schema: WalletRuleSchema },
      { name: BenefitCoverageMatrix.name, schema: BenefitCoverageMatrixSchema },
    ]),
    AuditModule,
    BenefitsModule,
  ],
  controllers: [PlanVersionsController],
  providers: [PlanVersionsService],
  exports: [PlanVersionsService],
})
export class PlanVersionsModule {}