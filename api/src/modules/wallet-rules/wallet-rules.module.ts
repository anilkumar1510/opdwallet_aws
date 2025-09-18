import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletRulesController } from './wallet-rules.controller';
import { WalletRulesService } from './wallet-rules.service';
import { WalletRule, WalletRuleSchema } from './schemas/wallet-rule.schema';
import { Policy, PolicySchema } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionSchema } from '../plan-versions/schemas/plan-version.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WalletRule.name, schema: WalletRuleSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: PlanVersion.name, schema: PlanVersionSchema },
    ]),
    AuditModule,
  ],
  controllers: [WalletRulesController],
  providers: [WalletRulesService],
  exports: [WalletRulesService],
})
export class WalletRulesModule {}