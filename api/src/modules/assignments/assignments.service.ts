import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
  ) {}

  async createAssignment(createAssignmentDto: CreateAssignmentDto, createdBy: string) {
    console.log('🟡 [ASSIGNMENTS SERVICE] Creating assignment:', createAssignmentDto);

    const { userId, policyId, effectiveFrom, effectiveTo, planVersionOverride, isActive } = createAssignmentDto;

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }
    if (!Types.ObjectId.isValid(policyId)) {
      throw new BadRequestException('Invalid policyId format');
    }

    // Check if user is already assigned to this policy
    const existingAssignment = await this.assignmentModel.findOne({
      userId: new Types.ObjectId(userId),
      policyId: new Types.ObjectId(policyId),
      isActive: true,
    });

    if (existingAssignment) {
      throw new ConflictException('User is already assigned to this policy');
    }

    // Generate unique assignment ID
    const assignmentId = `ASG-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create assignment
    const assignment = new this.assignmentModel({
      assignmentId,
      userId: new Types.ObjectId(userId),
      policyId: new Types.ObjectId(policyId),
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo,
      planVersionOverride,
      isActive: isActive !== undefined ? isActive : true,
      createdBy,
      updatedBy: createdBy,
    });

    const savedAssignment = await assignment.save();
    console.log('✅ [ASSIGNMENTS SERVICE] Assignment created successfully:', savedAssignment.assignmentId);

    return savedAssignment;
  }

  async getUserAssignments(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }

    return this.assignmentModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .populate('userId', 'memberId firstName lastName email')
      .populate('policyId', 'policyNumber name description status')
      .sort({ createdAt: -1 });
  }

  async getPolicyAssignments(policyId: string) {
    if (!Types.ObjectId.isValid(policyId)) {
      throw new BadRequestException('Invalid policyId format');
    }

    return this.assignmentModel
      .find({
        policyId: new Types.ObjectId(policyId),
        isActive: true,
      })
      .populate('userId', 'memberId firstName lastName email')
      .populate('policyId', 'policyNumber name description status')
      .sort({ createdAt: -1 });
  }

  async removeAssignment(assignmentId: string, updatedBy: string) {
    const assignment = await this.assignmentModel.findOne({ assignmentId });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    assignment.isActive = false;
    assignment.updatedBy = updatedBy;
    assignment.effectiveTo = new Date();

    await assignment.save();
    console.log('✅ [ASSIGNMENTS SERVICE] Assignment deactivated:', assignmentId);

    return { message: 'Assignment removed successfully' };
  }

  async getAllAssignments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      this.assignmentModel
        .find({ isActive: true })
        .populate('userId', 'memberId firstName lastName email')
        .populate('policyId', 'policyNumber name description status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.assignmentModel.countDocuments({ isActive: true }),
    ]);

    return {
      data: assignments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}