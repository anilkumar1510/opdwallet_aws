import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Policy, PolicyDocument } from './schemas/policy.schema';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { QueryPolicyDto } from './dto/query-policy.dto';
import { CounterService } from '../counters/counter.service';
import { PolicyStatus } from '@/common/constants/status.enum';
import { Assignment, AssignmentDocument } from '../assignments/schemas/assignment.schema';
import { PlanConfig, PlanConfigDocument } from '../plan-config/schemas/plan-config.schema';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(PlanConfig.name) private planConfigModel: Model<PlanConfigDocument>,
    private counterService: CounterService,
  ) {}

  async create(createPolicyDto: CreatePolicyDto, createdBy: string) {
    // Validate dates
    if (createPolicyDto.effectiveTo) {
      const effectiveFrom = new Date(createPolicyDto.effectiveFrom);
      const effectiveTo = new Date(createPolicyDto.effectiveTo);
      if (effectiveTo < effectiveFrom) {
        throw new BadRequestException('Effective To date must be greater than or equal to Effective From date');
      }
    }

    const policyNumber = await this.counterService.generatePolicyNumber();

    const policy = new this.policyModel({
      ...createPolicyDto,
      policyNumber,
      status: createPolicyDto.status || PolicyStatus.DRAFT,
      createdBy,
    });

    return policy.save();
  }

  async findAll(query: QueryPolicyDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { policyNumber: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } },
      ];
    }

    const [policies, total] = await Promise.all([
      this.policyModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.policyModel.countDocuments(filter),
    ]);

    return {
      data: policies,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const policy = await this.policyModel.findById(id);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }
    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto, updatedBy: string) {
    // Find existing policy first to check status transitions
    const existingPolicy = await this.policyModel.findById(id);
    if (!existingPolicy) {
      throw new NotFoundException('Policy not found');
    }

    // Validate dates
    if (updatePolicyDto.effectiveTo) {
      const effectiveFrom = new Date(updatePolicyDto.effectiveFrom || existingPolicy.effectiveFrom);
      const effectiveTo = new Date(updatePolicyDto.effectiveTo);
      if (effectiveTo < effectiveFrom) {
        throw new BadRequestException('Effective To date must be greater than or equal to Effective From date');
      }
    }

    // Validate status transitions
    if (updatePolicyDto.status && updatePolicyDto.status !== existingPolicy.status) {
      this.validateStatusTransition(existingPolicy.status, updatePolicyDto.status, updatePolicyDto.effectiveFrom || existingPolicy.effectiveFrom.toISOString());
    }

    // Remove policyNumber if it was accidentally included (it's immutable)
    const { policyNumber, ...updateData } = updatePolicyDto as any;

    const policy = await this.policyModel.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy,
        updatedAt: new Date(),
      },
      { new: true },
    );

    return policy;
  }

  private validateStatusTransition(currentStatus: PolicyStatus, newStatus: PolicyStatus, effectiveFrom: string) {
    // Draft -> Active: Only if effectiveFrom <= today
    if (currentStatus === PolicyStatus.DRAFT && newStatus === PolicyStatus.ACTIVE) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const effectiveDate = new Date(effectiveFrom);
      effectiveDate.setHours(0, 0, 0, 0);

      if (effectiveDate > today) {
        throw new BadRequestException('Cannot activate policy with future effective date');
      }
    }

    // Active -> Inactive/Expired: Always allowed (would need confirmation in UI)
    if (currentStatus === PolicyStatus.ACTIVE) {
      if (newStatus !== PolicyStatus.INACTIVE && newStatus !== PolicyStatus.EXPIRED && newStatus !== PolicyStatus.ACTIVE) {
        throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }
    }

    // Inactive/Expired -> Any other: Not allowed
    if ((currentStatus === PolicyStatus.INACTIVE || currentStatus === PolicyStatus.EXPIRED) && newStatus !== currentStatus) {
      throw new BadRequestException(`Cannot change status from ${currentStatus}`);
    }
  }

  async delete(id: string) {
    console.log('🟡 [POLICIES SERVICE] Attempting to delete policy:', id);

    // Check if policy exists
    const policy = await this.policyModel.findById(id);
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Check if policy is assigned to any users
    const activeAssignments = await this.assignmentModel.countDocuments({
      policyId: id,
      isActive: true,
    });

    if (activeAssignments > 0) {
      throw new ConflictException(`Cannot delete policy. It is currently assigned to ${activeAssignments} user(s). Please unassign all users from this policy before deleting.`);
    }

    // Delete all plan configurations for this policy
    const planConfigsDeleted = await this.planConfigModel.deleteMany({ policyId: id });
    console.log(`🟡 [POLICIES SERVICE] Deleted ${planConfigsDeleted.deletedCount} plan configurations for policy`);

    // Delete the policy
    await this.policyModel.findByIdAndDelete(id);
    console.log('✅ [POLICIES SERVICE] Policy deleted successfully:', policy.policyNumber);

    return {
      message: 'Policy deleted successfully',
      policyNumber: policy.policyNumber,
      policyName: policy.name,
      planConfigsDeleted: planConfigsDeleted.deletedCount
    };
  }
}