import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InternalUsersController } from './internal-users.controller';
import { InternalUsersService } from './internal-users.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { InternalUser, InternalUserSchema } from './schemas/internal-user.schema';
import { CounterModule } from '../counters/counter.module';
import { CommonUserService } from '../users/common-user.service';

/**
 * Internal Users Module
 * Provides endpoints and services for managing internal staff users
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: InternalUser.name, schema: InternalUserSchema },
    ]),
    CounterModule,
  ],
  controllers: [InternalUsersController],
  providers: [InternalUsersService, CommonUserService],
  exports: [InternalUsersService],
})
export class InternalUsersModule {}
