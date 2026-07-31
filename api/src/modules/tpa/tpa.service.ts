import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MemberClaim, MemberClaimDocument, ClaimStatus, PaymentStatus, ClaimCategory } from '@/modules/memberclaims/schemas/memberclaim.schema';
import { User, UserDocument } from '@/modules/users/schemas/user.schema';
import { InternalUser, InternalUserDocument } from '@/modules/internal-users/schemas/internal-user.schema';
import { UserRole } from '@/common/constants/roles.enum';
import { UserStatus } from '@/common/constants/status.enum';
import { AssignClaimDto } from './dto/assign-claim.dto';
import { ReassignClaimDto } from './dto/reassign-claim.dto';
import { AutoAssignClaimsDto, AutoAssignStrategy } from './dto/auto-assign-claims.dto';
import { ApproveClaimDto } from './dto/approve-claim.dto';
import { RejectClaimDto } from './dto/reject-claim.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { UpdateClaimStatusDto } from './dto/update-status.dto';
import { WalletService } from '../wallet/wallet.service';
import { Policy, PolicyDocument } from '../policies/schemas/policy.schema';
import { PlanConfigService } from '../plan-config/plan-config.service';

// Category code mapping for wallet refunds
// Note: CONSULTATION maps to IN_CLINIC by default (CAT001)
// For ONLINE consultations, the claim metadata should specify CAT005
const CATEGORY_CODE_MAP: Record<string, string> = {
  [ClaimCategory.CONSULTATION]: 'CAT001', // In-Clinic Consultation
  [ClaimCategory.PHARMACY]: 'CAT002',     // Pharmacy
  [ClaimCategory.DIAGNOSTICS]: 'CAT003',  // Diagnostics/Labs
};

@Injectable()
export class TpaService {
  constructor(
    @InjectModel(MemberClaim.name) private memberClaimModel: Model<MemberClaimDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InternalUser.name) private internalUserModel: Model<InternalUserDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    private readonly walletService: WalletService,
    private readonly planConfigService: PlanConfigService,
  ) {}

  // Helper method to add status history
  private addStatusHistory(claim: MemberClaimDocument, newStatus: ClaimStatus, changedBy: Types.ObjectId, changedByName: string, changedByRole: string, reason?: string, notes?: string) {
    const previousStatus = claim.status;

    if (!claim.statusHistory) {
      claim.statusHistory = [];
    }

    claim.statusHistory.push({
      status: newStatus,
      changedBy,
      changedByName,
      changedByRole,
      changedAt: new Date(),
      reason: reason || '',
      notes: notes || '',
    });

    claim.status = newStatus;
  }

  // Helper method to read a display name off an internal user
  private getInternalUserName(user: InternalUserDocument): string {
    return user.name?.fullName || `${user.name?.firstName || ''} ${user.name?.lastName || ''}`.trim();
  }

  /**
   * Write the assignment fields and history onto a claim. Shared by single assignment
   * and auto-assignment so both record the claim exactly the same way. Does not save.
   */
  private applyAssignment(
    claim: MemberClaimDocument,
    assignee: InternalUserDocument,
    adminUserId: string,
    adminName: string,
    notes?: string,
  ) {
    const adminObjectId = new Types.ObjectId(adminUserId);

    claim.assignedTo = new Types.ObjectId(String(assignee._id));
    claim.assignedToName = this.getInternalUserName(assignee);
    claim.assignedBy = adminObjectId;
    claim.assignedByName = adminName;
    claim.assignedAt = new Date();

    this.addStatusHistory(
      claim,
      ClaimStatus.ASSIGNED,
      adminObjectId,
      adminName,
      UserRole.TPA_ADMIN,
      'Claim assigned to TPA user',
      notes,
    );

    this.addReviewHistory(claim, 'ASSIGNED', adminObjectId, adminName, notes);
  }

  // Helper method to add review history
  private addReviewHistory(claim: MemberClaimDocument, action: string, reviewedBy: Types.ObjectId, reviewedByName: string, notes?: string) {
    if (!claim.reviewHistory) {
      claim.reviewHistory = [];
    }

    claim.reviewHistory.push({
      reviewedBy,
      reviewedByName,
      reviewedAt: new Date(),
      action,
      notes: notes || '',
      previousStatus: claim.status,
      newStatus: claim.status,
    });
  }

  /**
   * Get all claims (for TPA_ADMIN) or assigned claims (for TPA_USER)
   */
  async getClaims(
    userId: string,
    userRole: string,
    filters: {
      status?: ClaimStatus;
      assignedTo?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const {
      status,
      assignedTo,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = filters;

    const query: any = {};

    // Exclude DRAFT claims from TPA portal
    query.status = { $ne: ClaimStatus.DRAFT };

    // Role-based filtering
    if (userRole === UserRole.TPA_USER) {
      // TPA users can only see claims assigned to them
      query.assignedTo = new Types.ObjectId(userId);
    }

    // Status filter (if provided, combine with DRAFT exclusion)
    if (status) {
      query.status = { $ne: ClaimStatus.DRAFT, $eq: status };
    }

    // Assigned to filter (for TPA_ADMIN only)
    if (assignedTo && userRole === UserRole.TPA_ADMIN) {
      query.assignedTo = new Types.ObjectId(assignedTo);
    }

    // Date range filter
    if (fromDate || toDate) {
      query.submittedAt = {};
      if (fromDate) query.submittedAt.$gte = fromDate;
      if (toDate) query.submittedAt.$lte = toDate;
    }

    const total = await this.memberClaimModel.countDocuments(query);
    const claims = await this.memberClaimModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email memberId')
      .populate('assignedTo', 'name email')
      .exec();

    // Get unassigned count (for TPA_ADMIN only)
    let unassignedCount = 0;
    if (userRole === UserRole.TPA_ADMIN) {
      unassignedCount = await this.memberClaimModel.countDocuments({
        status: { $in: [ClaimStatus.SUBMITTED, ClaimStatus.UNASSIGNED] },
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: null },
        ],
      });
    }

    return {
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unassignedCount,
    };
  }

  /**
   * Get unassigned claims (TPA_ADMIN only)
   */
  async getUnassignedClaims(
    fromDate?: Date,
    toDate?: Date,
    page: number = 1,
    limit: number = 10,
  ) {
    const query: any = {
      status: { $in: [ClaimStatus.SUBMITTED, ClaimStatus.UNASSIGNED] },
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    };

    if (fromDate || toDate) {
      query.submittedAt = {};
      if (fromDate) query.submittedAt.$gte = fromDate;
      if (toDate) query.submittedAt.$lte = toDate;
    }

    const total = await this.memberClaimModel.countDocuments(query);
    const claims = await this.memberClaimModel
      .find(query)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email memberId')
      .exec();

    return {
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get assigned claims (claims that have been assigned to TPA users)
   */
  async getAssignedClaims(
    userId: string,
    userRole: string,
    fromDate?: Date,
    toDate?: Date,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'assignedAt',
    sortOrder: string = 'desc',
  ) {
    const query: any = {
      assignedTo: { $exists: true, $ne: null },
      status: { $in: [ClaimStatus.ASSIGNED, ClaimStatus.UNDER_REVIEW, ClaimStatus.DOCUMENTS_REQUIRED] },
    };

    // Role-based filtering
    if (userRole === UserRole.TPA_USER) {
      // TPA users can only see claims assigned to them
      query.assignedTo = new Types.ObjectId(userId);
    }

    // Date range filter
    if (fromDate || toDate) {
      query.assignedAt = {};
      if (fromDate) query.assignedAt.$gte = fromDate;
      if (toDate) query.assignedAt.$lte = toDate;
    }

    // Determine sort field and order
    const sortField = sortBy === 'assignedAt' ? 'assignedAt' : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const total = await this.memberClaimModel.countDocuments(query);
    const claims = await this.memberClaimModel
      .find(query)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email memberId')
      .populate('assignedTo', 'name email')
      .exec();

    return {
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get claim details by ID
   */
  async getClaimById(claimId: string, userId: string, userRole: string) {
    // First, fetch claim WITHOUT populate to check authorization
    const claimForAuth = await this.memberClaimModel
      .findOne({ claimId })
      .lean()
      .exec();

    if (!claimForAuth) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check permissions - TPA_USER can only view assigned claims
    if (userRole === UserRole.TPA_USER) {
      const assignedToId = claimForAuth.assignedTo?.toString();

      // Debug logging
      console.log('Authorization check for TPA_USER:');
      console.log('  - Claim ID:', claimId);
      console.log('  - assignedTo (raw):', claimForAuth.assignedTo);
      console.log('  - assignedToId (extracted):', assignedToId);
      console.log('  - userId (from request):', userId);
      console.log('  - Types:', typeof assignedToId, 'vs', typeof userId);
      console.log('  - Match:', assignedToId === userId);

      if (!assignedToId || assignedToId !== userId) {
        throw new ForbiddenException('You can only view claims assigned to you');
      }
    }

    // Now fetch the full claim with populated fields
    const claim = await this.memberClaimModel
      .findOne({ claimId })
      .populate('userId', 'name email phone memberId')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('policyId')
      .exec();

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Fetch policy details if policyId exists
    let policyDetails = null;
    if (claim.policyId) {
      // Handle both ObjectId and populated Policy document
      const policyIdString = typeof claim.policyId === 'object' && claim.policyId._id
        ? claim.policyId._id.toString()
        : claim.policyId.toString();
      policyDetails = await this.getPolicyDetailsForClaim(policyIdString);
    }

    // Convert to plain object and add raw assignedToId for frontend authorization
    const claimObject = claim.toObject();
    return {
      claim: {
        ...claimObject,
        // Include raw assignedTo ID even if populate failed
        assignedToId: claimForAuth.assignedTo?.toString(),
      },
      policyDetails,
    };
  }

  /**
   * Assign claim to TPA user (TPA_ADMIN only)
   */
  async assignClaim(
    claimId: string,
    assignClaimDto: AssignClaimDto,
    adminUserId: string,
    adminUserName: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check if claim is already assigned
    if (claim.status !== ClaimStatus.UNASSIGNED && claim.status !== ClaimStatus.SUBMITTED) {
      throw new BadRequestException('Claim is already assigned or in processing');
    }

    // Fetch admin user details
    const adminUser = await this.internalUserModel.findById(adminUserId);
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }
    const adminName = this.getInternalUserName(adminUser);

    // Verify the assignee is a TPA_USER
    const assignee = await this.internalUserModel.findById(assignClaimDto.assignedTo);
    if (!assignee) {
      throw new NotFoundException('Assignee user not found');
    }

    if (assignee.role !== UserRole.TPA_USER && assignee.role !== UserRole.TPA_ADMIN) {
      throw new BadRequestException('Can only assign claims to TPA users');
    }

    this.applyAssignment(claim, assignee, adminUserId, adminName, assignClaimDto.notes);

    await claim.save();

    return {
      message: 'Claim assigned successfully',
      claim,
    };
  }

  /**
   * Auto-assign unassigned claims across the TPA users an admin has marked as available.
   *
   * BALANCED seeds each user with the open claims they already hold and always hands the
   * next claim to whoever is lowest, which levels the queue. ROUND_ROBIN ignores existing
   * load and splits this batch evenly. Claims go out oldest-first so the longest-waiting
   * member is served first, and a failure on one claim never aborts the rest of the run.
   */
  async autoAssignClaims(autoAssignDto: AutoAssignClaimsDto, adminUserId: string) {
    const adminUser = await this.internalUserModel.findById(adminUserId);
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }
    const adminName = this.getInternalUserName(adminUser);

    const strategy = autoAssignDto.strategy || AutoAssignStrategy.BALANCED;
    const maxClaims = autoAssignDto.maxClaims ?? 200;

    // Resolve the selected users, and reject the request if any of them cannot take claims
    const requestedIds = [...new Set(autoAssignDto.assigneeIds.map((id) => new Types.ObjectId(id).toString()))];
    const assignees = await this.internalUserModel
      .find({
        _id: { $in: requestedIds.map((id) => new Types.ObjectId(id)) },
        role: { $in: [UserRole.TPA_USER, UserRole.TPA_ADMIN] },
        status: UserStatus.ACTIVE,
      })
      // Same order as getTPAUsers so a tie breaks toward the same person the portal
      // preview shows - otherwise the preview and the actual split can disagree by one.
      .sort({ 'name.fullName': 1 });

    if (assignees.length !== requestedIds.length) {
      const resolved = new Set(assignees.map((user) => String(user._id)));
      const invalid = requestedIds.filter((id) => !resolved.has(id));
      throw new BadRequestException(
        `Cannot auto-assign to these users - they are not active TPA users: ${invalid.join(', ')}`,
      );
    }

    // Same definition of "unassigned" the unassigned-claims list uses
    const query: any = {
      status: { $in: [ClaimStatus.SUBMITTED, ClaimStatus.UNASSIGNED] },
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    };

    if (autoAssignDto.claimIds?.length) {
      query.claimId = { $in: autoAssignDto.claimIds };
    }

    const claims = await this.memberClaimModel
      .find(query)
      .sort({ submittedAt: 1 })
      .limit(maxClaims)
      .exec();

    // One slot per available user, kept in selection order so ties resolve predictably
    const slots = await Promise.all(
      assignees.map(async (user) => {
        // The open claims a user already holds - the same count the TPA users list shows.
        // Always reported, so the result reads truthfully under either strategy.
        const startingWorkload = await this.memberClaimModel.countDocuments({
          assignedTo: user._id,
          status: { $nin: [ClaimStatus.APPROVED, ClaimStatus.REJECTED, ClaimStatus.PAYMENT_COMPLETED] },
        });

        return {
          user,
          userId: String(user._id),
          startingWorkload,
          // BALANCED picks on real workload so the queue levels out; ROUND_ROBIN starts
          // everyone at zero so this batch alone is split evenly.
          score: strategy === AutoAssignStrategy.BALANCED ? startingWorkload : 0,
          assigned: 0,
        };
      }),
    );

    const failed: Array<{ claimId: string; reason: string }> = [];
    let assignedCount = 0;

    for (const claim of claims) {
      // Lowest score wins; ties fall to the earlier user in the selection order
      let target = slots[0];
      for (const slot of slots) {
        if (slot.score < target.score) {
          target = slot;
        }
      }

      try {
        this.applyAssignment(claim, target.user, adminUserId, adminName, autoAssignDto.notes);
        await claim.save();

        target.score++;
        target.assigned++;
        assignedCount++;
      } catch (error) {
        // One bad claim must not strand the rest of the batch
        console.error(`[TPA] Auto-assign failed for claim ${claim.claimId}:`, error?.message);
        failed.push({ claimId: claim.claimId, reason: error?.message || 'Failed to save assignment' });
      }
    }

    const distribution = slots.map((slot) => ({
      userId: slot.userId,
      name: this.getInternalUserName(slot.user),
      email: slot.user.email,
      assigned: slot.assigned,
      previousWorkload: slot.startingWorkload,
      newWorkload: slot.startingWorkload + slot.assigned,
    }));

    return {
      message:
        assignedCount > 0
          ? `${assignedCount} claim${assignedCount === 1 ? '' : 's'} auto-assigned across ${assignees.length} TPA user${assignees.length === 1 ? '' : 's'}`
          : 'No unassigned claims were available to distribute',
      strategy,
      assignedCount,
      totalCandidates: claims.length,
      distribution,
      failed,
    };
  }

  /**
   * Reassign claim to different TPA user (TPA_ADMIN only)
   */
  async reassignClaim(
    claimId: string,
    reassignClaimDto: ReassignClaimDto,
    adminUserId: string,
    adminUserName: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    if (!claim.assignedTo) {
      throw new BadRequestException('Claim is not currently assigned');
    }

    // Fetch admin user details
    const adminUser = await this.internalUserModel.findById(adminUserId);
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }
    const adminName = adminUser.name.fullName || `${adminUser.name.firstName} ${adminUser.name.lastName}`;

    // Verify the new assignee is a TPA_USER
    const newAssignee = await this.internalUserModel.findById(reassignClaimDto.assignedTo);
    if (!newAssignee) {
      throw new NotFoundException('New assignee user not found');
    }

    if (newAssignee.role !== UserRole.TPA_USER && newAssignee.role !== UserRole.TPA_ADMIN) {
      throw new BadRequestException('Can only assign claims to TPA users');
    }

    // Add to reassignment history
    if (!claim.reassignmentHistory) {
      claim.reassignmentHistory = [];
    }

    claim.reassignmentHistory.push({
      previousAssignee: claim.assignedTo,
      previousAssigneeName: claim.assignedToName,
      newAssignee: new Types.ObjectId(reassignClaimDto.assignedTo),
      newAssigneeName: newAssignee.name.fullName || `${newAssignee.name.firstName} ${newAssignee.name.lastName}`,
      reassignedBy: new Types.ObjectId(adminUserId),
      reassignedByName: adminName,
      reassignedAt: new Date(),
      reason: reassignClaimDto.reason,
      notes: reassignClaimDto.notes,
    });

    // Update claim assignment
    claim.assignedTo = new Types.ObjectId(reassignClaimDto.assignedTo);
    claim.assignedToName = newAssignee.name.fullName || `${newAssignee.name.firstName} ${newAssignee.name.lastName}`;
    claim.assignedBy = new Types.ObjectId(adminUserId);
    claim.assignedByName = adminName;
    claim.assignedAt = new Date();

    // Add to review history
    this.addReviewHistory(
      claim,
      'REASSIGNED',
      new Types.ObjectId(adminUserId),
      adminName,
      reassignClaimDto.reason,
    );

    await claim.save();

    return {
      message: 'Claim reassigned successfully',
      claim,
    };
  }

  /**
   * Update claim status (TPA_USER for assigned claims)
   */
  async updateClaimStatus(
    claimId: string,
    updateStatusDto: UpdateClaimStatusDto,
    userId: string,
    userName: string,
    userRole: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check permissions
    if (userRole === UserRole.TPA_USER) {
      if (!claim.assignedTo || claim.assignedTo.toString() !== userId) {
        throw new ForbiddenException('You can only update claims assigned to you');
      }
    }

    // Update status
    this.addStatusHistory(
      claim,
      updateStatusDto.status,
      new Types.ObjectId(userId),
      userName,
      userRole,
      'Status updated by TPA user',
      updateStatusDto.notes,
    );

    // Add to review history
    this.addReviewHistory(
      claim,
      'STATUS_UPDATE',
      new Types.ObjectId(userId),
      userName,
      updateStatusDto.notes,
    );

    await claim.save();

    return {
      message: 'Claim status updated successfully',
      claim,
    };
  }

  /**
   * Approve claim (full or partial)
   */
  async approveClaim(
    claimId: string,
    approveClaimDto: ApproveClaimDto,
    userId: string,
    userName: string,
    userRole: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check permissions
    if (userRole === UserRole.TPA_USER) {
      if (!claim.assignedTo || claim.assignedTo.toString() !== userId) {
        throw new ForbiddenException('You can only approve claims assigned to you');
      }
    }

    // Validate approved amount
    if (approveClaimDto.approvedAmount > claim.billAmount) {
      throw new BadRequestException('Approved amount cannot be greater than bill amount');
    }

    // Update approval fields
    claim.approvedAmount = approveClaimDto.approvedAmount;
    claim.approvalReason = approveClaimDto.approvalReason;
    claim.approvedBy = new Types.ObjectId(userId);
    claim.approvedByName = userName;
    claim.approvedAt = new Date();

    // Calculate rejected amount for partial approval
    if (approveClaimDto.isPartial) {
      claim.rejectedAmount = claim.billAmount - approveClaimDto.approvedAmount;

      this.addStatusHistory(
        claim,
        ClaimStatus.PARTIALLY_APPROVED,
        new Types.ObjectId(userId),
        userName,
        userRole,
        approveClaimDto.approvalReason,
        approveClaimDto.notes,
      );
    } else {
      this.addStatusHistory(
        claim,
        ClaimStatus.APPROVED,
        new Types.ObjectId(userId),
        userName,
        userRole,
        approveClaimDto.approvalReason,
        approveClaimDto.notes,
      );
    }

    // Move to payment pending automatically
    claim.paymentStatus = PaymentStatus.APPROVED;

    // Add final status change to PAYMENT_PENDING
    this.addStatusHistory(
      claim,
      ClaimStatus.PAYMENT_PENDING,
      new Types.ObjectId(userId),
      userName,
      userRole,
      'Claim approved - moved to payment pending',
    );

    // Add to review history
    this.addReviewHistory(
      claim,
      approveClaimDto.isPartial ? 'PARTIALLY_APPROVED' : 'APPROVED',
      new Types.ObjectId(userId),
      userName,
      approveClaimDto.notes,
    );

    await claim.save();

    return {
      message: approveClaimDto.isPartial ? 'Claim partially approved successfully' : 'Claim approved successfully',
      claim,
    };
  }

  /**
   * Reject claim
   */
  async rejectClaim(
    claimId: string,
    rejectClaimDto: RejectClaimDto,
    userId: string,
    userName: string,
    userRole: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check permissions
    if (userRole === UserRole.TPA_USER) {
      if (!claim.assignedTo || claim.assignedTo.toString() !== userId) {
        throw new ForbiddenException('You can only reject claims assigned to you');
      }
    }

    // Refund wallet if amount was debited
    if (claim.walletDebitAmount && claim.walletDebitAmount > 0) {
      const categoryCode = CATEGORY_CODE_MAP[claim.category];

      if (categoryCode) {
        try {
          await this.walletService.creditWallet(
            claim.userId.toString(),
            claim.walletDebitAmount,
            categoryCode,
            (claim._id as any).toString(),
            'CLAIM',
            claim.providerName || 'Provider',
            `Claim ${claimId} rejected - Wallet refund for ${claim.category}`
          );

          console.log(`✅ [TPA] Refunded ₹${claim.walletDebitAmount} to user ${claim.userId} for rejected claim ${claimId}`);
        } catch (error) {
          console.error(`❌ [TPA] Failed to refund wallet for claim ${claimId}:`, error);
          // Log error but don't block rejection - claim rejection is more important
        }
      } else {
        console.warn(`⚠️ [TPA] No category code mapping found for category: ${claim.category}`);
      }
    }

    // Update rejection fields
    claim.rejectionReason = rejectClaimDto.rejectionReason;
    claim.rejectedBy = new Types.ObjectId(userId);
    claim.rejectedByName = userName;
    claim.rejectedAt = new Date();
    claim.rejectedAmount = claim.billAmount;

    // Update status
    this.addStatusHistory(
      claim,
      ClaimStatus.REJECTED,
      new Types.ObjectId(userId),
      userName,
      userRole,
      rejectClaimDto.rejectionReason,
      rejectClaimDto.notes,
    );

    // Add to review history
    this.addReviewHistory(
      claim,
      'REJECTED',
      new Types.ObjectId(userId),
      userName,
      rejectClaimDto.notes,
    );

    await claim.save();

    return {
      message: 'Claim rejected successfully',
      claim,
    };
  }

  /**
   * Request additional documents from member
   */
  async requestDocuments(
    claimId: string,
    requestDocumentsDto: RequestDocumentsDto,
    userId: string,
    userName: string,
    userRole: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check permissions
    if (userRole === UserRole.TPA_USER) {
      if (!claim.assignedTo || claim.assignedTo.toString() !== userId) {
        throw new ForbiddenException('You can only request documents for claims assigned to you');
      }
    }

    // Update documents required fields
    claim.documentsRequired = true;
    claim.documentsRequiredReason = requestDocumentsDto.documentsRequiredReason;
    claim.documentsRequiredAt = new Date();
    claim.documentsRequiredBy = new Types.ObjectId(userId);
    claim.requiredDocumentsList = requestDocumentsDto.requiredDocuments;

    // Update status
    this.addStatusHistory(
      claim,
      ClaimStatus.DOCUMENTS_REQUIRED,
      new Types.ObjectId(userId),
      userName,
      userRole,
      requestDocumentsDto.documentsRequiredReason,
      requestDocumentsDto.notes,
    );

    // Add to review history
    this.addReviewHistory(
      claim,
      'DOCUMENTS_REQUIRED',
      new Types.ObjectId(userId),
      userName,
      requestDocumentsDto.notes,
    );

    await claim.save();

    return {
      message: 'Documents requested successfully',
      claim,
    };
  }

  /**
   * Get TPA analytics summary
   */
  async getAnalyticsSummary(fromDate?: Date, toDate?: Date, userId?: string, userRole?: string) {
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.submittedAt = {};
      if (fromDate) dateFilter.submittedAt.$gte = fromDate;
      if (toDate) dateFilter.submittedAt.$lte = toDate;
    }

    // For TPA_USER, filter by assigned claims only
    if (userRole === UserRole.TPA_USER && userId) {
      dateFilter.assignedTo = new Types.ObjectId(userId);
    }

    // Get all claims
    const totalClaims = await this.memberClaimModel.countDocuments(dateFilter);

    // Get claims by status
    // For TPA_USER, unassigned count is always 0 (they don't see unassigned claims)
    const unassignedClaims = userRole === UserRole.TPA_USER ? 0 : await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: { $in: [ClaimStatus.SUBMITTED, ClaimStatus.UNASSIGNED] },
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    });

    const assignedClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.ASSIGNED,
    });

    const underReviewClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.UNDER_REVIEW,
    });

    // Approved claims include APPROVED and all payment stages (PAYMENT_PENDING, PAYMENT_PROCESSING, PAYMENT_COMPLETED)
    const approvedClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: { $in: [ClaimStatus.APPROVED, ClaimStatus.PAYMENT_PENDING, ClaimStatus.PAYMENT_PROCESSING, ClaimStatus.PAYMENT_COMPLETED] },
    });

    const partiallyApprovedClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.PARTIALLY_APPROVED,
    });

    const rejectedClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.REJECTED,
    });

    const documentsRequiredClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.DOCUMENTS_REQUIRED,
    });

    // Calculate financial metrics
    const claimsAggregate = await this.memberClaimModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalClaimedAmount: { $sum: '$billAmount' },
          totalApprovedAmount: { $sum: '$approvedAmount' },
          totalRejectedAmount: { $sum: '$rejectedAmount' },
        },
      },
    ]);

    const financialMetrics = claimsAggregate[0] || {
      totalClaimedAmount: 0,
      totalApprovedAmount: 0,
      totalRejectedAmount: 0,
    };

    // Calculate average processing time (in hours)
    const processingTimeData = await this.memberClaimModel.aggregate([
      {
        $match: {
          ...dateFilter,
          submittedAt: { $exists: true },
          $or: [
            { approvedAt: { $exists: true } },
            { rejectedAt: { $exists: true } },
          ],
        },
      },
      {
        $project: {
          processingTime: {
            $divide: [
              {
                $subtract: [
                  { $ifNull: ['$approvedAt', '$rejectedAt'] },
                  '$submittedAt',
                ],
              },
              1000 * 60 * 60, // Convert to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$processingTime' },
        },
      },
    ]);

    const avgProcessingTime = processingTimeData[0]?.avgProcessingTime || 0;

    // Calculate rates
    const processedClaims = approvedClaims + partiallyApprovedClaims + rejectedClaims;
    const approvalRate = processedClaims > 0 ? ((approvedClaims + partiallyApprovedClaims) / processedClaims) * 100 : 0;
    const rejectionRate = processedClaims > 0 ? (rejectedClaims / processedClaims) * 100 : 0;

    return {
      summary: {
        totalClaims,
        unassignedClaims,
        assignedClaims,
        underReviewClaims,
        approvedClaims,
        partiallyApprovedClaims,
        rejectedClaims,
        documentsRequiredClaims,
        totalClaimedAmount: financialMetrics.totalClaimedAmount,
        totalApprovedAmount: financialMetrics.totalApprovedAmount,
        totalRejectedAmount: financialMetrics.totalRejectedAmount,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10, // Round to 1 decimal
        approvalRate: Math.round(approvalRate * 10) / 10,
        rejectionRate: Math.round(rejectionRate * 10) / 10,
      },
      period: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    };
  }

  // Get all TPA users (TPA_ADMIN only)
  async getTPAUsers(userRole: string) {
    // Only TPA_ADMIN, ADMIN, and SUPER_ADMIN can view all TPA users
    if (![UserRole.TPA_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole as UserRole)) {
      throw new ForbiddenException('Only TPA admins can view TPA users');
    }

    const tpaUsers = await this.internalUserModel
      .find({
        role: { $in: [UserRole.TPA_USER, UserRole.TPA_ADMIN] },
        status: UserStatus.ACTIVE,
      })
      .select('name email role createdAt')
      .sort({ 'name.fullName': 1 })
      .lean();

    // Get workload for each user
    const usersWithWorkload = await Promise.all(
      tpaUsers.map(async (user) => {
        const userId = (user._id as any).toString();

        const assignedClaims = await this.memberClaimModel.countDocuments({
          assignedTo: user._id,
          status: { $nin: [ClaimStatus.APPROVED, ClaimStatus.REJECTED, ClaimStatus.PAYMENT_COMPLETED] },
        });

        const totalReviewed = await this.memberClaimModel.countDocuments({
          assignedTo: user._id,
          status: { $in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED, ClaimStatus.REJECTED] },
        });

        const approvedClaims = await this.memberClaimModel.countDocuments({
          assignedTo: user._id,
          status: { $in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED] },
        });

        const approvalRate = totalReviewed > 0 ? (approvedClaims / totalReviewed) * 100 : 0;

        return {
          _id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          currentWorkload: assignedClaims,
          totalReviewed,
          approvalRate: Math.round(approvalRate * 10) / 10,
          isActive: true,
        };
      })
    );

    return {
      users: usersWithWorkload,
      total: usersWithWorkload.length,
    };
  }

  /**
   * Get recent activity from status history
   */
  async getRecentActivity(limit: number = 10) {
    // Get recent claims with status history
    const recentClaims = await this.memberClaimModel
      .find({
        statusHistory: { $exists: true, $ne: [] },
      })
      .select('claimId statusHistory')
      .sort({ updatedAt: -1 })
      .limit(limit * 2) // Get more to filter from
      .lean();

    // Extract and flatten status history entries
    const activityEntries: any[] = [];

    for (const claim of recentClaims) {
      if (claim.statusHistory && claim.statusHistory.length > 0) {
        // Get the most recent status change for this claim
        const recentHistory = claim.statusHistory[claim.statusHistory.length - 1];

        activityEntries.push({
          id: `${claim._id}-${recentHistory.changedAt}`,
          claimId: claim.claimId,
          action: this.getActionDescription(recentHistory.status, recentHistory.reason),
          actor: recentHistory.changedByName,
          actorRole: recentHistory.changedByRole,
          timestamp: recentHistory.changedAt,
          status: recentHistory.status,
        });
      }
    }

    // Sort by timestamp descending and limit
    const sortedActivity = activityEntries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return {
      activities: sortedActivity,
      total: sortedActivity.length,
    };
  }

  /**
   * Helper method to get human-readable action description
   */
  private getActionDescription(status: string, reason?: string): string {
    const statusDescriptions: Record<string, string> = {
      SUBMITTED: 'Claim submitted',
      UNASSIGNED: 'Claim unassigned',
      ASSIGNED: 'Claim assigned',
      UNDER_REVIEW: 'Claim under review',
      DOCUMENTS_REQUIRED: 'Documents requested',
      APPROVED: 'Claim approved',
      PARTIALLY_APPROVED: 'Claim partially approved',
      REJECTED: 'Claim rejected',
      PAYMENT_PENDING: 'Payment pending',
      PAYMENT_PROCESSING: 'Payment processing',
      PAYMENT_COMPLETED: 'Payment completed',
    };

    return statusDescriptions[status] || `Status changed to ${status}`;
  }

  /**
   * Get formatted policy and plan configuration details for a claim
   */
  private async getPolicyDetailsForClaim(policyId: string) {
    try {
      // Fetch policy document
      const policy = await this.policyModel.findById(policyId).lean();
      if (!policy) {
        console.warn('[TPA] Policy not found:', policyId);
        return null;
      }

      // Fetch current plan config
      const planConfig = await this.planConfigService.getConfig(policyId);

      // Format wallet configuration
      const walletConfig = planConfig?.wallet ? {
        allocationType: planConfig.wallet.allocationType || 'INDIVIDUAL',
        totalAnnualAmount: planConfig.wallet.totalAnnualAmount || 0,
        perClaimLimit: planConfig.wallet.perClaimLimit,
        copay: planConfig.wallet.copay || null,
        partialPaymentEnabled: planConfig.wallet.partialPaymentEnabled || false,
      } : null;

      // Format benefits with category names
      const benefits = [];
      const categoryMapping = {
        'CAT001': 'In-Clinic Consultation',
        'CAT002': 'Pharmacy',
        'CAT003': 'Diagnostic Services',
        'CAT004': 'Laboratory Services',
        'CAT005': 'Online Consultation',
        'CAT006': 'Dental Services',
        'CAT007': 'Vision Care',
        'CAT008': 'Wellness Programs',
      };

      if (planConfig?.benefits) {
        for (const [catId, catName] of Object.entries(categoryMapping)) {
          const benefit = planConfig.benefits[catId as keyof typeof planConfig.benefits];
          if (benefit) {
            benefits.push({
              categoryId: catId,
              categoryName: catName,
              enabled: benefit.enabled || false,
              claimEnabled: benefit.claimEnabled || false,
              vasEnabled: benefit.vasEnabled || false,
              annualLimit: benefit.annualLimit || null,
              perClaimLimit: benefit.perClaimLimit || null,
              visitLimit: (benefit as any).visitLimit || null,
            });
          }
        }
      }

      return {
        policy: {
          policyNumber: policy.policyNumber,
          name: policy.name,
          description: policy.description,
          corporateName: policy.corporateName,
          status: policy.status,
          effectiveFrom: policy.effectiveFrom,
          effectiveTo: policy.effectiveTo,
        },
        planConfig: planConfig ? {
          version: planConfig.version,
          status: planConfig.status,
          walletConfig,
          benefits,
          policyDescription: planConfig.policyDescription || { inclusions: [], exclusions: [] },
          coveredRelationships: planConfig.coveredRelationships || ['SELF'],
        } : null,
      };
    } catch (error) {
      console.error('[TPA] Error fetching policy details:', error);
      return null;
    }
  }
}
