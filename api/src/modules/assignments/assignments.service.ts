import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { WalletService } from '../wallet/wallet.service';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private walletService: WalletService,
    private planConfigService: PlanConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    // Single Policy per User Constraint: Check if user has ANY active policy assignment
    const existingActiveAssignment = await this.assignmentModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
    }).populate('policyId', 'name');

    if (existingActiveAssignment) {
      const existingPolicyName = (existingActiveAssignment.policyId as any)?.name || 'Unknown Policy';
      throw new ConflictException(
        `User already has an active policy assignment (${existingPolicyName}). ` +
        `Please unassign the current policy before assigning a new one.`
      );
    }

    // Generate unique assignment ID
    const assignmentId = `ASG-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Fetch and validate plan configuration
    console.log('🟡 [ASSIGNMENTS SERVICE] Fetching plan config for validation');
    const planConfig = await this.planConfigService.getConfig(policyId.toString());

    if (!planConfig) {
      throw new BadRequestException('No published plan configuration found for this policy');
    }

    // Validate relationship is covered in plan config
    if (relationshipId) {
      const coveredRelationships = planConfig.coveredRelationships || [];
      if (!coveredRelationships.includes(relationshipId)) {
        throw new BadRequestException(
          `Relationship ${relationshipId} is not covered in the current plan configuration. ` +
          `Covered relationships: ${coveredRelationships.join(', ')}`
        );
      }
      console.log('✅ [ASSIGNMENTS SERVICE] Relationship validated:', relationshipId);
    }

    // Validate relationshipId and primaryMemberId
    if (relationshipId && relationshipId !== 'REL001' && relationshipId !== 'SELF' && !primaryMemberId) {
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

    // Sync user document with assignment relationship data
    if (relationshipId) {
      try {
        console.log('🔄 [ASSIGNMENTS SERVICE] Syncing user document with assignment data');
        const updateData: any = { relationship: relationshipId };

        // Only set primaryMemberId if it's provided (for dependents)
        if (primaryMemberId) {
          updateData.primaryMemberId = primaryMemberId;
        }

        await this.userModel.updateOne(
          { _id: new Types.ObjectId(userId) },
          { $set: updateData }
        );
        console.log('✅ [ASSIGNMENTS SERVICE] User document synced successfully');
      } catch (syncError) {
        console.warn('⚠️ [ASSIGNMENTS SERVICE] Failed to sync user document (assignment still created):', syncError);
      }
    }

    // Initialize wallet from policy configuration
    try {
      console.log('🟡 [ASSIGNMENTS SERVICE] Fetching plan config for policy:', policyId);
      const planConfig = await this.planConfigService.getConfig(policyId.toString());

      if (planConfig) {
        console.log('🟡 [ASSIGNMENTS SERVICE] Creating wallet for user:', userId);

        // Determine if this is a primary member or dependent
        const isPrimaryMember = !savedAssignment.primaryMemberId;
        const primaryUserIdForFloater = isPrimaryMember ? undefined : savedAssignment.primaryMemberId;

        console.log('🟡 [ASSIGNMENTS SERVICE] Wallet type:', isPrimaryMember ? 'PRIMARY' : 'DEPENDENT');
        if (!isPrimaryMember) {
          console.log('🟡 [ASSIGNMENTS SERVICE] Primary member ID:', primaryUserIdForFloater);

          // Validate that primary member exists
          const primaryMemberUser = await this.userModel.findOne({
            memberId: primaryUserIdForFloater
          }).lean().exec();

          if (!primaryMemberUser) {
            throw new BadRequestException(
              `Primary member with memberId ${primaryUserIdForFloater} not found. ` +
              `Cannot create dependent assignment.`
            );
          }

          // Check if primary member has active assignment for floater policies
          if (planConfig.wallet?.allocationType === 'FLOATER') {
            const primaryAssignment = await this.assignmentModel.findOne({
              userId: primaryMemberUser._id,
              policyId: new Types.ObjectId(policyId),
              isActive: true
            }).lean().exec();

            if (!primaryAssignment) {
              console.warn(
                `⚠️ [ASSIGNMENTS SERVICE] Primary member ${primaryUserIdForFloater} ` +
                `does not have an active assignment for this policy yet. ` +
                `Their wallet should be created first for FLOATER policies.`
              );
            }
          }
        }

        await this.walletService.initializeWalletFromPolicy(
          userId.toString(),
          (savedAssignment._id as any).toString(),
          planConfig,
          savedAssignment.effectiveFrom,
          savedAssignment.effectiveTo,
          primaryUserIdForFloater  // NEW parameter for floater wallet linking
        );
      } else {
        console.warn('⚠️ [ASSIGNMENTS SERVICE] No plan config found for policy:', policyId);
      }
    } catch (walletError) {
      // Don't fail the assignment if wallet creation fails
      console.error('❌ [ASSIGNMENTS SERVICE] Failed to create wallet (assignment still created):', walletError);
    }

    // Invalidate user's cached data (profile and wallet) so they see the new assignment immediately
    await this.invalidateUserCache(userId.toString(), 'policy assigned');

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
      .populate('userId', 'memberId name email')
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
      .populate('userId', 'memberId name email')
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
      .populate('userId', 'memberId name email')
      .populate('policyId', 'policyNumber name description status effectiveFrom effectiveTo')
      .sort({ createdAt: -1 });
  }

  async getPolicyConfigForUser(policyId: string, versionOverride?: number) {
    console.log('🟡 [ASSIGNMENTS SERVICE] Getting policy config for user, policyId:', policyId, 'versionOverride:', versionOverride);

    try {
      // Get the plan configuration with copay details
      const config = await this.planConfigService.getConfig(policyId, versionOverride);

      if (!config) {
        console.log('⚠️ [ASSIGNMENTS SERVICE] No plan config found for policy:', policyId);
        return null;
      }

      console.log('🟡 [ASSIGNMENTS SERVICE] Raw config from planConfigService:', JSON.stringify(config, null, 2));

      // Access the wallet config from the planConfig
      const walletConfig = (config as any).wallet;
      console.log('🟡 [ASSIGNMENTS SERVICE] Wallet config extracted:', JSON.stringify(walletConfig, null, 2));

      const copayConfig = walletConfig?.copay;
      console.log('🟡 [ASSIGNMENTS SERVICE] Copay config from wallet:', JSON.stringify(copayConfig, null, 2));

      // Build the copay object with proper percentage
      const copayValue = copayConfig?.value || 20;
      const copayMode = copayConfig?.mode || 'PERCENT';

      const finalCopay = {
        percentage: copayValue, // Always use the value as percentage
        mode: copayMode,
        value: copayValue
      };

      console.log('🟡 [ASSIGNMENTS SERVICE] Final copay config to return:', finalCopay);

      // Return the config with copay details
      const result = {
        currentVersion: {
          copay: finalCopay,
          wallet: walletConfig || {
            totalAnnualAmount: 5000000,
            perClaimLimit: 500000,
            copay: { mode: 'PERCENT', value: 20 },
            partialPaymentEnabled: true,
            carryForward: { enabled: true, maxAmount: 1000000 },
            topUpAllowed: true
          },
          services: (config as any).services,
          limits: (config as any).limits,
          version: config.version,
        },
        policyId: config.policyId,
      };

      console.log('✅ [ASSIGNMENTS SERVICE] Returning policy config:', JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error('❌ [ASSIGNMENTS SERVICE] Error getting policy config:', error);
      return null;
    }
  }

  async searchPrimaryMembers(policyId: string, search: string) {
    console.log('🟡 [SEARCH-PRIMARY] ========== SEARCHING PRIMARY MEMBERS ==========');
    console.log('🟡 [SEARCH-PRIMARY] Policy ID:', policyId);
    console.log('🟡 [SEARCH-PRIMARY] Search term:', search);

    if (!policyId) {
      throw new BadRequestException('policyId is required');
    }

    if (!search || search.length < 2) {
      console.log('⚠️ [SEARCH-PRIMARY] Search term too short or empty');
      return [];
    }

    if (!Types.ObjectId.isValid(policyId)) {
      throw new BadRequestException('Invalid policyId format');
    }

    // Step 1: Get all active assignments for this policy
    console.log('🔍 [SEARCH-PRIMARY] Step 1: Finding all active assignments for policy...');
    const assignments = await this.assignmentModel
      .find({
        policyId: new Types.ObjectId(policyId),
        isActive: true,
      })
      .select('userId relationshipId')
      .lean();

    console.log('📊 [SEARCH-PRIMARY] Found', assignments.length, 'total active assignments');

    if (assignments.length === 0) {
      console.log('⚠️ [SEARCH-PRIMARY] No active assignments found for this policy');
      return [];
    }

    // ✅ FIX: Filter assignments to get only primary members (SELF/REL001)
    const primaryAssignments = assignments.filter(a =>
      a.relationshipId === 'SELF' || a.relationshipId === 'REL001' || !a.relationshipId
    );

    console.log('👥 [SEARCH-PRIMARY] Total assignments:', assignments.length);
    console.log('👤 [SEARCH-PRIMARY] Primary member assignments (SELF/REL001):', primaryAssignments.length);

    if (primaryAssignments.length === 0) {
      console.log('⚠️ [SEARCH-PRIMARY] No primary member assignments found');
      return [];
    }

    const primaryUserIds = primaryAssignments.map(a => a.userId);

    // Step 2: Search for users within primary assignments
    console.log('🔍 [SEARCH-PRIMARY] Step 2: Searching users by name/ID...');
    const searchRegex = new RegExp(search, 'i');

    const primaryMembers = await this.userModel
      .find({
        _id: { $in: primaryUserIds },
        $or: [
          { memberId: searchRegex },
          { 'name.firstName': searchRegex },
          { 'name.lastName': searchRegex },
          { 'name.fullName': searchRegex },
          { employeeId: searchRegex },
          { uhid: searchRegex },
        ],
      })
      .select('_id memberId uhid employeeId name email relationship')
      .limit(10)
      .lean();

    console.log('✅ [SEARCH-PRIMARY] Found', primaryMembers.length, 'primary members matching search');

    if (primaryMembers.length > 0) {
      console.log('📋 [SEARCH-PRIMARY] Results:');
      primaryMembers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name?.fullName || user.name?.firstName + ' ' + user.name?.lastName} (${user.memberId}) - Relationship: ${user.relationship}`);
      });
    }

    // DEBUG: Show assignment relationshipId distribution
    console.log('🔍 [SEARCH-PRIMARY] DEBUG - Assignment relationshipId distribution:');
    const assignmentRelCounts: Record<string, number> = {};
    assignments.forEach((assignment: any) => {
      const rel = assignment.relationshipId || 'undefined';
      assignmentRelCounts[rel] = (assignmentRelCounts[rel] || 0) + 1;
    });
    console.log('📊 [SEARCH-PRIMARY] Assignment relationships:', assignmentRelCounts);

    return primaryMembers.map(user => ({
      _id: user._id,
      memberId: user.memberId,
      uhid: user.uhid,
      employeeId: user.employeeId,
      name: user.name.fullName || `${user.name.firstName} ${user.name.lastName}`,
      email: user.email,
    }));
  }

  /**
   * Invalidate cached data for a user after assignment changes
   * Invalidates both profile and wallet caches
   */
  private async invalidateUserCache(userId: string, reason: string): Promise<void> {
    try {
      const userIdStr = userId.toString();

      // Invalidate profile cache
      const profileCacheKey = `member:profile:${userIdStr}`;
      await this.cacheManager.del(profileCacheKey);
      console.log(`[CACHE DELETE] ${profileCacheKey} | Reason: ${reason}`);

      // Invalidate wallet cache
      const walletCacheKey = `wallet:balance:${userIdStr}`;
      await this.cacheManager.del(walletCacheKey);
      console.log(`[CACHE DELETE] ${walletCacheKey} | Reason: ${reason}`);

      // Also invalidate for floater family members if applicable
      const user = await this.userModel.findById(userId).select('primaryMemberId').lean().exec();
      if (user?.primaryMemberId) {
        // This is a dependent, invalidate primary member's cache too
        const primaryUser = await this.userModel.findOne({ memberId: user.primaryMemberId }).select('_id').lean().exec();
        if (primaryUser) {
          const primaryUserId = primaryUser._id.toString();
          await this.cacheManager.del(`member:profile:${primaryUserId}`);
          await this.cacheManager.del(`wallet:balance:${primaryUserId}`);
          console.log(`[CACHE DELETE] Primary member ${primaryUserId} caches | Reason: ${reason}`);
        }
      } else {
        // This might be a primary member, invalidate all dependents
        const dependents = await this.userModel.find({ primaryMemberId: userIdStr }).select('_id').lean().exec();
        for (const dependent of dependents) {
          const depId = dependent._id.toString();
          await this.cacheManager.del(`member:profile:${depId}`);
          await this.cacheManager.del(`wallet:balance:${depId}`);
          console.log(`[CACHE DELETE] Dependent ${depId} caches | Reason: ${reason}`);
        }
      }
    } catch (error) {
      console.error('[CACHE ERROR] Failed to invalidate user cache:', error);
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }

  async removeAssignment(assignmentId: string, _updatedBy: string) {
    const assignment = await this.assignmentModel.findOne({ assignmentId });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const userId = assignment.userId.toString();

    // Delete associated wallet
    try {
      await this.walletService.deleteWalletByAssignment((assignment._id as any).toString());
    } catch (walletError) {
      console.error('❌ [ASSIGNMENTS SERVICE] Failed to delete wallet (continuing with assignment deletion):', walletError);
    }

    // Delete the assignment permanently
    await this.assignmentModel.deleteOne({ assignmentId });
    console.log('✅ [ASSIGNMENTS SERVICE] Assignment deleted:', assignmentId);

    // Invalidate user's cached data
    await this.invalidateUserCache(userId, 'assignment removed');

    return { message: 'Assignment removed successfully' };
  }

  async unassignPolicyFromUser(userId: string, policyId: string, _updatedBy: string) {
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

    // Invalidate user's cached data (profile and wallet)
    await this.invalidateUserCache(userId, 'policy unassigned');

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
        .populate('userId', 'memberId name email')
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