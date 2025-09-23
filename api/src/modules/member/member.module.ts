import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    AssignmentsModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}