import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { WalletService } from '../wallet/wallet.service';
import { PlanConfigService } from '../plan-config/plan-config.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    private walletService: WalletService,
    private planConfigService: PlanConfigService,
  ) {}

  async createAssignment(createAssignmentDto: CreateAssignmentDto, createdBy: string) {
    console.log('🟡 [ASSIGNMENTS SERVICE] Creating assignment:', createAssignmentDto);

    const { userId, policyId, effectiveFrom, effectiveTo, planVersionOverride, isActive, relationshipId, primaryMemberId, planConfigId } = createAssignmentDto;

    // Validate effective dates
    if (!effectiveFrom || !effectiveTo) {
      throw new BadRequestException('effectiveFrom and effectiveTo dates are required');
    }

    if (new Date(effectiveTo) <= new Date(effectiveFrom)) {
      throw new BadRequestException('effectiveTo must be after effectiveFrom');
    }

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

    // Validate relationshipId and primaryMemberId
    if (relationshipId && relationshipId !== 'REL001' && !primaryMemberId) {
      throw new BadRequestException('primaryMemberId is required when relationshipId is not REL001 (SELF)');
    }

    // Validate planConfigId if provided
    if (planConfigId && !Types.ObjectId.isValid(planConfigId)) {
      throw new BadRequestException('Invalid planConfigId format');
    }

    // Create assignment
    const assignment = new this.assignmentModel({
      assignmentId,
      userId: new Types.ObjectId(userId),
      policyId: new Types.ObjectId(policyId),
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: new Date(effectiveTo),
      planVersionOverride,
      isActive: isActive !== undefined ? isActive : true,
      relationshipId,
      primaryMemberId,
      planConfigId: planConfigId ? new Types.ObjectId(planConfigId) : undefined,
      createdBy,
      updatedBy: createdBy,
    });

    const savedAssignment = await assignment.save();
    console.log('✅ [ASSIGNMENTS SERVICE] Assignment created successfully:', savedAssignment.assignmentId);

    // Initialize wallet from policy configuration
    try {
      console.log('🟡 [ASSIGNMENTS SERVICE] Fetching plan config for policy:', policyId);
      const planConfig = await this.planConfigService.getConfig(policyId.toString());

      if (planConfig) {
        console.log('🟡 [ASSIGNMENTS SERVICE] Creating wallet for user:', userId);
        await this.walletService.initializeWalletFromPolicy(
          userId.toString(),
          (savedAssignment._id as any).toString(),
          planConfig,
          savedAssignment.effectiveFrom,
          savedAssignment.effectiveTo
        );
      } else {
        console.warn('⚠️ [ASSIGNMENTS SERVICE] No plan config found for policy:', policyId);
      }
    } catch (walletError) {
      // Don't fail the assignment if wallet creation fails
      console.error('❌ [ASSIGNMENTS SERVICE] Failed to create wallet (assignment still created):', walletError);
    }

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
      .populate('policyId', 'policyNumber name description status effectiveFrom effectiveTo')
      .sort({ createdAt: -1 })
      .lean(); // PERFORMANCE: Added lean() for read-only query
  }

  // PERFORMANCE OPTIMIZATION: Batch query for multiple users
  async getBatchUserAssignments(userIds: string[]) {
    const validUserIds = userIds.filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (validUserIds.length === 0) {
      return [];
    }

    return this.assignmentModel
      .find({
        userId: { $in: validUserIds },
        isActive: true,
      })
      .populate('userId', 'memberId firstName lastName email')
      .populate('policyId', 'policyNumber name description status effectiveFrom effectiveTo')
      .sort({ createdAt: -1 })
      .lean(); // PERFORMANCE: Added lean() for read-only query
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
      .populate('policyId', 'policyNumber name description status effectiveFrom effectiveTo')
      .sort({ createdAt: -1 });
  }

  async removeAssignment(assignmentId: string, updatedBy: string) {
    const assignment = await this.assignmentModel.findOne({ assignmentId });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Delete associated wallet
    try {
      await this.walletService.deleteWalletByAssignment((assignment._id as any).toString());
    } catch (walletError) {
      console.error('❌ [ASSIGNMENTS SERVICE] Failed to delete wallet (continuing with assignment deletion):', walletError);
    }

    // Delete the assignment permanently
    await this.assignmentModel.deleteOne({ assignmentId });
    console.log('✅ [ASSIGNMENTS SERVICE] Assignment deleted:', assignmentId);

    return { message: 'Assignment removed successfully' };
  }

  async unassignPolicyFromUser(userId: string, policyId: string, updatedBy: string) {
    console.log('🟡 [ASSIGNMENTS SERVICE] Unassigning policy from user:', { userId, policyId });

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }
    if (!Types.ObjectId.isValid(policyId)) {
      throw new BadRequestException('Invalid policyId format');
    }

    // Find active assignment
    const assignment = await this.assignmentModel.findOne({
      userId: new Types.ObjectId(userId),
      policyId: new Types.ObjectId(policyId),
      isActive: true,
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found or already inactive');
    }

    // Delete associated wallet
    try {
      await this.walletService.deleteWalletByAssignment((assignment._id as any).toString());
    } catch (walletError) {
      console.error('❌ [ASSIGNMENTS SERVICE] Failed to delete wallet (continuing with assignment deletion):', walletError);
    }

    // Delete the assignment permanently
    const assignmentId = assignment.assignmentId;
    await this.assignmentModel.deleteOne({
      userId: new Types.ObjectId(userId),
      policyId: new Types.ObjectId(policyId),
    });
    console.log('✅ [ASSIGNMENTS SERVICE] Policy unassigned from user (deleted):', assignmentId);

    return {
      message: 'Policy unassigned successfully',
      assignmentId
    };
  }

  async getAllAssignments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      this.assignmentModel
        .find({ isActive: true })
        .populate('userId', 'memberId firstName lastName email')
        .populate('policyId', 'policyNumber name description status effectiveFrom effectiveTo')
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