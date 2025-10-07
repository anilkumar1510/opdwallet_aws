import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberClaimsController } from './memberclaims.controller';
import { MemberClaimsService } from './memberclaims.service';
import { MemberClaim, MemberClaimSchema } from './schemas/memberclaim.schema';
import { WalletModule } from '../wallet/wallet.module';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MemberClaim.name, schema: MemberClaimSchema },
      { name: User.name, schema: UserSchema },
    ]),
    WalletModule,
  ],
  controllers: [MemberClaimsController],
  providers: [MemberClaimsService],
  exports: [MemberClaimsService],
})
export class MemberClaimsModule {}