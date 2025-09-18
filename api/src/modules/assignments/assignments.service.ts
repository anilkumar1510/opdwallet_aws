import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { UpdatePlanVersionDto } from './dto/update-plan-version.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionDocument } from '../plan-versions/schemas/plan-version.schema';
import { PlanVersionStatus } from '../plan-versions/schemas/plan-version.schema';
import { AssignmentStatus } from '@/common/constants/status.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
    private auditService: AuditService,
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

    const assignments = await this.assignmentModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('policyId', 'policyNumber name status effectiveFrom effectiveTo currentPlanVersion')
      .sort({ createdAt: -1 })
      .lean();

    // Add effectivePlanVersion to each assignment
    return assignments.map(assignment => ({
      ...assignment,
      effectivePlanVersion: assignment.planVersion ?? (assignment.policyId as any)?.currentPlanVersion ?? 1,
    }));
  }

  async getMemberAssignments(memberId: string) {
    const user = await this.userModel.findById(memberId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const assignments = await this.assignmentModel
      .find({
        userId: new Types.ObjectId(memberId),
        status: AssignmentStatus.ACTIVE,
      })
      .populate('policyId', 'policyNumber name status effectiveFrom effectiveTo currentPlanVersion')
      .sort({ effectiveFrom: -1 })
      .lean();

    // Add effectivePlanVersion to each assignment
    return assignments.map(assignment => ({
      ...assignment,
      effectivePlanVersion: assignment.planVersion ?? (assignment.policyId as any)?.currentPlanVersion ?? 1,
    }));
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

  async updatePlanVersion(
    assignmentId: string,
    dto: UpdatePlanVersionDto,
    user: any,
  ) {
    // Find the assignment
    const assignment = await this.assignmentModel
      .findById(assignmentId)
      .populate('userId', 'userId name email memberId')
      .populate('policyId', 'policyNumber name status');

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const before = {
      planVersion: assignment.planVersion,
    };

    // If planVersion is provided, validate it exists and is PUBLISHED
    if (dto.planVersion !== undefined && dto.planVersion !== null) {
      const targetVersion = await this.planVersionModel.findOne({
        policyId: assignment.policyId,
        planVersion: dto.planVersion,
      });

      if (!targetVersion) {
        throw new NotFoundException(`Plan version ${dto.planVersion} not found for this policy`);
      }

      if (targetVersion.status !== PlanVersionStatus.PUBLISHED) {
        throw new BadRequestException('Only PUBLISHED plan versions can be assigned');
      }

      assignment.planVersion = dto.planVersion;
    } else {
      // Clear the override
      assignment.planVersion = undefined;
    }

    const saved = await assignment.save();

    // Audit log
    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'ASSIGNMENT_PLAN_VERSION_UPDATE',
      resource: 'userPolicyAssignments',
      resourceId: assignment._id?.toString(),
      before,
      after: { planVersion: assignment.planVersion },
      description: dto.planVersion
        ? `Set plan version override to ${dto.planVersion} for assignment ${assignmentId}`
        : `Cleared plan version override for assignment ${assignmentId}`,
      metadata: {
        assignmentId,
        userId: (assignment.userId as any)?._id,
        policyId: (assignment.policyId as any)?._id,
        policyNumber: (assignment.policyId as any)?.policyNumber,
        memberId: (assignment.userId as any)?.memberId,
      },
    });

    // Return with effectivePlanVersion
    const result = saved.toObject();
    return {
      ...result,
      effectivePlanVersion: result.planVersion ?? (result.policyId as any)?.currentPlanVersion ?? 1,
    };
  }
}