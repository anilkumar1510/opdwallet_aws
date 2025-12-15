import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { InternalUser, InternalUserSchema } from '../internal-users/schemas/internal-user.schema';
import { CounterModule } from '../counters/counter.module';
import { CommonUserService } from '../users/common-user.service';

/**
 * Members Module
 * Provides endpoints and services for managing external users (members)
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: InternalUser.name, schema: InternalUserSchema },
    ]),
    CounterModule,
  ],
  controllers: [MembersController],
  providers: [MembersService, CommonUserService],
  exports: [MembersService],
})
export class MembersModule {}
