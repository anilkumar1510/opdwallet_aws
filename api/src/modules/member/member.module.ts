import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CategoryMaster, CategoryMasterSchema } from '../masters/schemas/category-master.schema';
import { AssignmentsModule } from '../assignments/assignments.module';
import { WalletModule } from '../wallet/wallet.module';
import { PlanConfigModule } from '../plan-config/plan-config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CategoryMaster.name, schema: CategoryMasterSchema },
    ]),
    AssignmentsModule,
    WalletModule,
    PlanConfigModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}