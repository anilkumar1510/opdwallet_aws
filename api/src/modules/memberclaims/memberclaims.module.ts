import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberClaimsController } from './memberclaims.controller';
import { MemberClaimsService } from './memberclaims.service';
import { MemberClaim, MemberClaimSchema } from './schemas/memberclaim.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MemberClaim.name, schema: MemberClaimSchema },
    ]),
  ],
  controllers: [MemberClaimsController],
  providers: [MemberClaimsService],
  exports: [MemberClaimsService],
})
export class MemberClaimsModule {}