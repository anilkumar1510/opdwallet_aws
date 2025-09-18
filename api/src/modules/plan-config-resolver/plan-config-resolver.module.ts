import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanConfigResolverController } from './plan-config-resolver.controller';
import { PlanConfigResolverService } from './plan-config-resolver.service';
import { Policy, PolicySchema } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionSchema } from '../plan-versions/schemas/plan-version.schema';
import { BenefitComponent, BenefitComponentSchema } from '../benefit-components/schemas/benefit-component.schema';
import { WalletRule, WalletRuleSchema } from '../wallet-rules/schemas/wallet-rule.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Policy.name, schema: PolicySchema },
      { name: PlanVersion.name, schema: PlanVersionSchema },
      { name: BenefitComponent.name, schema: BenefitComponentSchema },
      { name: WalletRule.name, schema: WalletRuleSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
  ],
  controllers: [PlanConfigResolverController],
  providers: [PlanConfigResolverService],
  exports: [PlanConfigResolverService],
})
export class PlanConfigResolverModule {}