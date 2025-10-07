import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MemberClaim, MemberClaimDocument, ClaimStatus, PaymentStatus } from '@/modules/memberclaims/schemas/memberclaim.schema';
import { User, UserDocument } from '@/modules/users/schemas/user.schema';
import { UserRole } from '@/common/constants/roles.enum';
import { AssignClaimDto } from './dto/assign-claim.dto';
import { ReassignClaimDto } from './dto/reassign-claim.dto';
import { ApproveClaimDto } from './dto/approve-claim.dto';
import { RejectClaimDto } from './dto/reject-claim.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { UpdateClaimStatusDto } from './dto/update-status.dto';

@Injectable()
export class TpaService {
  constructor(
    @InjectModel(MemberClaim.name) private memberClaimModel: Model<MemberClaimDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    // Role-based filtering
    if (userRole === UserRole.TPA_USER) {
      // TPA users can only see claims assigned to them
      query.assignedTo = new Types.ObjectId(userId);
    }

    // Status filter
    if (status) {
      query.status = status;
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
        status: ClaimStatus.UNASSIGNED,
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
      status: ClaimStatus.UNASSIGNED,
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
   * Get claim details by ID
   */
  async getClaimById(claimId: string, userId: string, userRole: string) {
    const claim = await this.memberClaimModel
      .findOne({ claimId })
      .populate('userId', 'name email phone memberId')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .exec();

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check permissions - TPA_USER can only view assigned claims
    if (userRole === UserRole.TPA_USER) {
      if (!claim.assignedTo || claim.assignedTo.toString() !== userId) {
        throw new ForbiddenException('You can only view claims assigned to you');
      }
    }

    return claim;
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

    // Verify the assignee is a TPA_USER
    const assignee = await this.userModel.findById(assignClaimDto.assignedTo);
    if (!assignee) {
      throw new NotFoundException('Assignee user not found');
    }

    if (assignee.role !== UserRole.TPA_USER && assignee.role !== UserRole.TPA_ADMIN) {
      throw new BadRequestException('Can only assign claims to TPA users');
    }

    // Update claim assignment
    claim.assignedTo = new Types.ObjectId(assignClaimDto.assignedTo);
    claim.assignedToName = assignee.name.fullName || `${assignee.name.firstName} ${assignee.name.lastName}`;
    claim.assignedBy = new Types.ObjectId(adminUserId);
    claim.assignedByName = adminUserName;
    claim.assignedAt = new Date();

    // Update status to ASSIGNED
    this.addStatusHistory(
      claim,
      ClaimStatus.ASSIGNED,
      new Types.ObjectId(adminUserId),
      adminUserName,
      UserRole.TPA_ADMIN,
      'Claim assigned to TPA user',
      assignClaimDto.notes,
    );

    // Add to review history
    this.addReviewHistory(
      claim,
      'ASSIGNED',
      new Types.ObjectId(adminUserId),
      adminUserName,
      assignClaimDto.notes,
    );

    await claim.save();

    return {
      message: 'Claim assigned successfully',
      claim,
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

    // Verify the new assignee is a TPA_USER
    const newAssignee = await this.userModel.findById(reassignClaimDto.assignedTo);
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
      reassignedByName: adminUserName,
      reassignedAt: new Date(),
      reason: reassignClaimDto.reason,
    });

    // Update claim assignment
    claim.assignedTo = new Types.ObjectId(reassignClaimDto.assignedTo);
    claim.assignedToName = newAssignee.name.fullName || `${newAssignee.name.firstName} ${newAssignee.name.lastName}`;
    claim.assignedBy = new Types.ObjectId(adminUserId);
    claim.assignedByName = adminUserName;
    claim.assignedAt = new Date();

    // Add to review history
    this.addReviewHistory(
      claim,
      'REASSIGNED',
      new Types.ObjectId(adminUserId),
      adminUserName,
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
  async getAnalyticsSummary(fromDate?: Date, toDate?: Date) {
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.submittedAt = {};
      if (fromDate) dateFilter.submittedAt.$gte = fromDate;
      if (toDate) dateFilter.submittedAt.$lte = toDate;
    }

    // Get all claims
    const totalClaims = await this.memberClaimModel.countDocuments(dateFilter);

    // Get claims by status
    const unassignedClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.UNASSIGNED,
    });

    const assignedClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.ASSIGNED,
    });

    const underReviewClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.UNDER_REVIEW,
    });

    const approvedClaims = await this.memberClaimModel.countDocuments({
      ...dateFilter,
      status: ClaimStatus.APPROVED,
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

    const tpaUsers = await this.userModel
      .find({
        role: { $in: [UserRole.TPA_USER, UserRole.TPA_ADMIN] },
        isActive: true,
      })
      .select('name email role createdAt')
      .sort({ 'name.fullName': 1 })
      .lean();

    // Get workload for each user
    const usersWithWorkload = await Promise.all(
      tpaUsers.map(async (user) => {
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
          _id: user._id.toString(),
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
}
