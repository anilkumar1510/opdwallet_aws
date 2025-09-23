import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './schemas/assignment.schema';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [MongooseModule, AssignmentsService],
})
export class AssignmentsModule {}