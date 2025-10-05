import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TpaController } from './tpa.controller';
import { TpaService } from './tpa.service';
import { MemberClaim, MemberClaimSchema } from '@/modules/memberclaims/schemas/memberclaim.schema';
import { User, UserSchema } from '@/modules/users/schemas/user.schema';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MemberClaim.name, schema: MemberClaimSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [TpaController],
  providers: [TpaService],
  exports: [TpaService],
})
export class TpaModule {}
