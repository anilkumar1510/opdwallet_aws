import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AddressService } from './address.service';
import { User, UserSchema } from './schemas/user.schema';
import { Address, AddressSchema } from './schemas/address.schema';
import { CugMaster, CugMasterSchema } from '../masters/schemas/cug-master.schema';
import { CounterModule } from '../counters/counter.module';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Address.name, schema: AddressSchema },
      { name: CugMaster.name, schema: CugMasterSchema },
    ]),
    CounterModule,
    AssignmentsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, AddressService],
  exports: [UsersService, AddressService],
})
export class UsersModule {}