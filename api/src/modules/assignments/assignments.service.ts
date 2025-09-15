import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { AssignmentStatus } from '@/common/constants/status.enum';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
  ) {}

  async createAssignment(
    userId: string,
    createAssignmentDto: CreateAssignmentDto,
    assignedBy: string,
  ) {
    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify policy exists
    const policy = await this.policyModel.findById(createAssignmentDto.policyId);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Check for existing active assignment
    const existingAssignment = await this.assignmentModel.findOne({
      userId: new Types.ObjectId(userId),
      policyId: new Types.ObjectId(createAssignmentDto.policyId),
      status: AssignmentStatus.ACTIVE,
    });

    if (existingAssignment) {
      throw new ConflictException('User already has an active assignment for this policy');
    }

    const assignment = new this.assignmentModel({
      userId: new Types.ObjectId(userId),
      policyId: new Types.ObjectId(createAssignmentDto.policyId),
      effectiveFrom: createAssignmentDto.effectiveFrom || new Date(),
      effectiveTo: createAssignmentDto.effectiveTo,
      notes: createAssignmentDto.notes,
      assignedBy,
      status: AssignmentStatus.ACTIVE,
    });

    const savedAssignment = await assignment.save();
    return this.assignmentModel
      .findById(savedAssignment._id)
      .populate('userId', 'userId name email memberId')
      .populate('policyId', 'policyNumber name status');
  }

  async getUserAssignments(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.assignmentModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('policyId', 'policyNumber name status effectiveFrom effectiveTo')
      .sort({ createdAt: -1 });
  }

  async getMemberAssignments(memberId: string) {
    const user = await this.userModel.findById(memberId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.assignmentModel
      .find({
        userId: new Types.ObjectId(memberId),
        status: AssignmentStatus.ACTIVE,
      })
      .populate('policyId', 'policyNumber name status effectiveFrom effectiveTo')
      .sort({ effectiveFrom: -1 });
  }

  async updateAssignment(
    assignmentId: string,
    updateAssignmentDto: UpdateAssignmentDto,
  ) {
    const assignment = await this.assignmentModel.findByIdAndUpdate(
      assignmentId,
      updateAssignmentDto,
      { new: true },
    ).populate('userId', 'userId name email memberId')
     .populate('policyId', 'policyNumber name status');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  async endAssignment(assignmentId: string) {
    const assignment = await this.assignmentModel.findByIdAndUpdate(
      assignmentId,
      {
        status: AssignmentStatus.ENDED,
        effectiveTo: new Date(),
      },
      { new: true },
    ).populate('userId', 'userId name email memberId')
     .populate('policyId', 'policyNumber name status');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }
}