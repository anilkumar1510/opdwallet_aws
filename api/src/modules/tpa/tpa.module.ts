import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TpaController } from './tpa.controller';
import { TpaService } from './tpa.service';
import { MemberClaim, MemberClaimSchema } from '@/modules/memberclaims/schemas/memberclaim.schema';
import { User, UserSchema } from '@/modules/users/schemas/user.schema';
import { InternalUser, InternalUserSchema } from '@/modules/internal-users/schemas/internal-user.schema';
import { Policy, PolicySchema } from '@/modules/policies/schemas/policy.schema';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { PoliciesModule } from '@/modules/policies/policies.module';
import { PlanConfigModule } from '@/modules/plan-config/plan-config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MemberClaim.name, schema: MemberClaimSchema },
      { name: User.name, schema: UserSchema },
      { name: InternalUser.name, schema: InternalUserSchema },
      { name: Policy.name, schema: PolicySchema },
    ]),
    NotificationsModule,
    WalletModule,
    PoliciesModule,
    PlanConfigModule,
  ],
  controllers: [TpaController],
  providers: [TpaService],
  exports: [TpaService],
})
export class TpaModule {}
