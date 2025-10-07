import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MemberClaim,
  MemberClaimDocument,
  ClaimStatus,
  PaymentStatus,
  ClaimType,
  ClaimCategory,
} from './schemas/memberclaim.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { WalletService } from '../wallet/wallet.service';
import { UserRole } from '@/common/constants/roles.enum';
import { unlink } from 'fs/promises';
import { join } from 'path';

// Category code mapping for wallet debit
const CATEGORY_CODE_MAP: Record<string, string> = {
  [ClaimCategory.CONSULTATION]: 'CAT001', // Consult
  [ClaimCategory.DIAGNOSTICS]: 'CAT002', // Lab
  [ClaimCategory.PHARMACY]: 'CAT003', // Pharmacy
};

@Injectable()
export class MemberClaimsService {
  constructor(
    @InjectModel(MemberClaim.name)
    private memberClaimModel: Model<MemberClaimDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Check if logged-in user can manage a claim for the claim's user
   * Returns true if:
   * 1. Same user (claimUserId === loggedInUserId)
   * 2. Claim user is a dependent of logged-in user
   */
  private async canManageClaim(claimUserId: string, loggedInUserId: string): Promise<boolean> {
    // If same user, always allowed
    if (claimUserId === loggedInUserId) {
      return true;
    }

    // Check if claimUser is a dependent of loggedInUser
    const claimUser = await this.userModel.findById(claimUserId).lean();
    if (claimUser && claimUser.primaryMemberId) {
      // Find the primary member by memberId
      const primaryMember = await this.userModel.findOne({
        memberId: claimUser.primaryMemberId
      }).lean();

      // Check if the primary member's _id matches loggedInUserId
      return primaryMember?._id.toString() === loggedInUserId;
    }

    return false;
  }

  async create(
    createClaimDto: CreateClaimDto,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<MemberClaimDocument> {
    try {
      // Generate unique claim ID
      const claimId = await this.generateClaimId();

      // Process uploaded files
      const documents = files
        ? files.map((file) => {
            return {
              fileName: file.filename,
              originalName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              filePath: file.path,
              uploadedAt: new Date(),
              documentType: this.determineDocumentType(file.originalname),
            };
          })
        : [];

      // Ensure all required fields are present
      const claimData: any = {
        claimId,
        userId: new Types.ObjectId(userId),
        memberName: 'Test User', // Add a default for now
        claimType: createClaimDto.claimType || ClaimType.REIMBURSEMENT,
        category: createClaimDto.category || ClaimCategory.CONSULTATION,
        treatmentDate: createClaimDto.treatmentDate || new Date(),
        providerName: createClaimDto.providerName || 'Unknown Provider',
        billAmount: createClaimDto.billAmount || 0,
        billNumber: createClaimDto.billNumber,
        treatmentDescription: createClaimDto.treatmentDescription,
        patientName: createClaimDto.patientName,
        relationToMember: createClaimDto.relationToMember || 'SELF',
        documents,
        status: ClaimStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
        createdBy: userId,
        isUrgent: createClaimDto.isUrgent || false,
        requiresPreAuth: createClaimDto.requiresPreAuth || false,
        preAuthNumber: createClaimDto.preAuthNumber,
        isActive: true,
      };

      const newClaim = new this.memberClaimModel(claimData);

      let savedClaim;
      try {
        savedClaim = await newClaim.save();
      } catch (saveError: any) {
        throw new Error(`Database save failed: ${saveError.message}`);
      }

      return savedClaim;
    } catch (error) {
      throw error;
    }
  }

  async submitClaim(claimId: string, userId: string): Promise<MemberClaimDocument> {
    const claim = await this.findByClaimId(claimId);

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check if user can manage this claim (own claim or dependent's claim)
    const canSubmit = await this.canManageClaim(claim.userId.toString(), userId);
    if (!canSubmit) {
      throw new ForbiddenException('You are not authorized to submit this claim');
    }

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Only draft claims can be submitted');
    }

    // Validate required documents
    if (!claim.documents || claim.documents.length === 0) {
      throw new BadRequestException('Please upload at least one document');
    }

    // Check and debit wallet for Consult category only
    const categoryCode = CATEGORY_CODE_MAP[claim.category];
    if (categoryCode && claim.billAmount > 0) {
      console.log('🟡 [CLAIMS SERVICE] Checking wallet balance for claim:', {
        claimId,
        category: claim.category,
        categoryCode,
        amount: claim.billAmount
      });

      try {
        // Check sufficient balance
        const balanceCheck = await this.walletService.checkSufficientBalance(
          userId,
          claim.billAmount,
          categoryCode
        );

        if (!balanceCheck.hasSufficient) {
          console.warn(`⚠️ [CLAIMS SERVICE] Insufficient wallet balance. Available: ₹${balanceCheck.categoryBalance}, Required: ₹${claim.billAmount}`);
          throw new BadRequestException(
            `Insufficient wallet balance. Available: ₹${balanceCheck.categoryBalance} in ${claim.category} category, Required: ₹${claim.billAmount}`
          );
        }

        console.log('✅ [CLAIMS SERVICE] Sufficient balance available, debiting wallet');

        // Debit wallet
        await this.walletService.debitWallet(
          userId,
          claim.billAmount,
          categoryCode,
          (claim._id as any).toString(),
          'CLAIM',
          claim.providerName || 'Provider',
          `Claim ${claimId} - ${claim.category} - ${claim.providerName || 'Provider'}`
        );

        console.log('✅ [CLAIMS SERVICE] Wallet debited successfully');
      } catch (walletError) {
        console.error('❌ [CLAIMS SERVICE] Wallet operation failed:', walletError);
        // Re-throw wallet errors to prevent claim submission
        throw walletError;
      }
    }

    claim.status = ClaimStatus.SUBMITTED;
    claim.submittedAt = new Date();
    claim.updatedBy = userId;

    return claim.save();
  }

  async findAll(
    userId?: string,
    status?: ClaimStatus,
    page = 1,
    limit = 10,
  ): Promise<{
    claims: MemberClaimDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = {};

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await this.memberClaimModel.countDocuments(query);
    const claims = await this.memberClaimModel
      .find(query)
      .select('claimId userId memberName claimType category treatmentDate providerName billAmount billNumber status paymentStatus approvedAmount submittedAt createdAt isUrgent requiresPreAuth')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return {
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string): Promise<MemberClaimDocument> {
    const query: any = { _id: new Types.ObjectId(id) };

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const claim = await this.memberClaimModel.findOne(query).exec();

    if (!claim) {
      throw new NotFoundException(`Claim not found`);
    }

    return claim;
  }

  async findByClaimId(claimId: string): Promise<MemberClaimDocument> {
    const claim = await this.memberClaimModel.findOne({ claimId }).exec();

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    return claim;
  }

  async update(
    id: string,
    updateClaimDto: UpdateClaimDto,
    userId: string,
  ): Promise<MemberClaimDocument> {
    const claim = await this.findOne(id, userId);

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Only draft claims can be updated');
    }

    Object.assign(claim, updateClaimDto);
    claim.updatedBy = userId;

    return claim.save();
  }

  async addDocuments(
    claimId: string,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<MemberClaimDocument> {
    const claim = await this.findByClaimId(claimId);

    // Check if user can manage this claim (own claim or dependent's claim)
    const canManage = await this.canManageClaim(claim.userId.toString(), userId);
    if (!canManage) {
      throw new ForbiddenException('You are not authorized to update this claim');
    }

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Documents can only be added to draft claims');
    }

    const newDocuments = files.map((file) => ({
      fileName: file.filename,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      uploadedAt: new Date(),
      documentType: this.determineDocumentType(file.originalname),
    }));

    claim.documents.push(...newDocuments);
    claim.updatedBy = userId;

    return claim.save();
  }

  async removeDocument(
    claimId: string,
    documentId: string,
    userId: string,
  ): Promise<MemberClaimDocument> {
    const claim = await this.findByClaimId(claimId);

    // Check if user can manage this claim (own claim or dependent's claim)
    const canManage = await this.canManageClaim(claim.userId.toString(), userId);
    if (!canManage) {
      throw new ForbiddenException('You are not authorized to update this claim');
    }

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Documents can only be removed from draft claims');
    }

    const documentIndex = claim.documents.findIndex(
      (doc) => doc.fileName === documentId,
    );

    if (documentIndex === -1) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from disk
    const document = claim.documents[documentIndex];
    try {
      await unlink(document.filePath);
    } catch (error) {
      // File deletion failed - continue with database update
    }

    // Remove from database
    claim.documents.splice(documentIndex, 1);
    claim.updatedBy = userId;

    return claim.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const claim = await this.findOne(id, userId);

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Only draft claims can be deleted');
    }

    // Delete all associated files
    for (const document of claim.documents) {
      try {
        await unlink(document.filePath);
      } catch (error) {
        // File deletion failed - continue with deletion
      }
    }

    await this.memberClaimModel.deleteOne({ _id: id }).exec();
  }

  async getUserClaimsSummary(userId: string): Promise<{
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    totalClaimedAmount: number;
    totalApprovedAmount: number;
    totalPaidAmount: number;
  }> {
    // PERFORMANCE: Use aggregation pipeline instead of loading all claims into memory
    const result = await this.memberClaimModel.aggregate([
      {
        $match: { userId: new Types.ObjectId(userId) }
      },
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          amounts: [
            {
              $group: {
                _id: null,
                totalClaimedAmount: {
                  $sum: {
                    $cond: [
                      { $ne: ['$status', ClaimStatus.DRAFT] },
                      { $ifNull: ['$billAmount', 0] },
                      0
                    ]
                  }
                },
                totalApprovedAmount: {
                  $sum: {
                    $cond: [
                      {
                        $in: ['$status', [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED]]
                      },
                      { $ifNull: ['$approvedAmount', 0] },
                      0
                    ]
                  }
                },
                totalPaidAmount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $in: ['$status', [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED]] },
                          { $eq: ['$paymentStatus', PaymentStatus.PAID] }
                        ]
                      },
                      { $ifNull: ['$approvedAmount', 0] },
                      0
                    ]
                  }
                }
              }
            }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Parse aggregation results
    const statusMap = new Map();
    if (result[0]?.statusCounts) {
      result[0].statusCounts.forEach((item: any) => {
        statusMap.set(item._id, item.count);
      });
    }

    const amounts = result[0]?.amounts?.[0] || {
      totalClaimedAmount: 0,
      totalApprovedAmount: 0,
      totalPaidAmount: 0
    };

    const total = result[0]?.total?.[0]?.count || 0;

    return {
      total,
      draft: statusMap.get(ClaimStatus.DRAFT) || 0,
      submitted: statusMap.get(ClaimStatus.SUBMITTED) || 0,
      underReview: statusMap.get(ClaimStatus.UNDER_REVIEW) || 0,
      approved: (statusMap.get(ClaimStatus.APPROVED) || 0) +
                (statusMap.get(ClaimStatus.PARTIALLY_APPROVED) || 0),
      rejected: statusMap.get(ClaimStatus.REJECTED) || 0,
      totalClaimedAmount: amounts.totalClaimedAmount,
      totalApprovedAmount: amounts.totalApprovedAmount,
      totalPaidAmount: amounts.totalPaidAmount
    };
  }

  private async generateClaimId(): Promise<string> {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // Create new date objects to avoid mutation
      const todayStart = new Date(year, date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(year, date.getMonth(), date.getDate(), 23, 59, 59, 999);

      const todayCount = await this.memberClaimModel.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      const sequence = String(todayCount + 1).padStart(4, '0');
      const claimId = `CLM-${year}${month}${day}-${sequence}`;

      return claimId;
    } catch (error) {
      // Fallback to timestamp-based ID
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      return `CLM-${timestamp}-${randomNum}`;
    }
  }

  private determineDocumentType(filename: string): string {
    const lowercaseFilename = filename.toLowerCase();

    if (lowercaseFilename.includes('invoice') || lowercaseFilename.includes('bill')) {
      return 'INVOICE';
    }
    if (lowercaseFilename.includes('prescription') || lowercaseFilename.includes('rx')) {
      return 'PRESCRIPTION';
    }
    if (lowercaseFilename.includes('report') || lowercaseFilename.includes('test')) {
      return 'REPORT';
    }
    if (lowercaseFilename.includes('discharge')) {
      return 'DISCHARGE_SUMMARY';
    }

    return 'OTHER';
  }

  // Timeline endpoint for members to see claim progress
  async getClaimTimeline(claimId: string, userId: string, userRole: string) {
    const claim = await this.memberClaimModel
      .findOne({ claimId })
      .select('claimId status statusHistory submittedAt approvedAt rejectedAt paymentDate userId')
      .populate('userId', 'name memberId')
      .lean();

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // For members, verify they own the claim
    if (userRole === 'MEMBER' && claim.userId._id.toString() !== userId) {
      throw new ForbiddenException('You can only view your own claims');
    }

    // Build timeline from status history
    const timeline = (claim.statusHistory || []).map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt,
      changedBy: entry.changedByName || 'System',
      changedByRole: entry.changedByRole || 'SYSTEM',
      reason: entry.reason,
      notes: userRole === 'MEMBER' ? undefined : entry.notes, // Hide internal notes from members
    }));

    return {
      claimId: claim.claimId,
      currentStatus: claim.status,
      timeline,
      submittedAt: claim.submittedAt,
      approvedAt: claim.approvedAt,
      rejectedAt: claim.rejectedAt,
      paymentDate: claim.paymentDate,
    };
  }

  // Document resubmission for DOCUMENTS_REQUIRED status
  async resubmitDocuments(
    claimId: string,
    userId: string,
    documents: Array<{ fileName: string; filePath: string; documentType: string; notes?: string }>,
    resubmissionNotes?: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Check if user can manage this claim (own claim or dependent's claim)
    const canManage = await this.canManageClaim(claim.userId.toString(), userId);
    if (!canManage) {
      throw new ForbiddenException('You can only resubmit documents for your own claims or your dependents\' claims');
    }

    // Check if claim is in DOCUMENTS_REQUIRED status
    if (claim.status !== ClaimStatus.DOCUMENTS_REQUIRED) {
      throw new BadRequestException(
        'Documents can only be resubmitted when claim status is DOCUMENTS_REQUIRED',
      );
    }

    // Add new documents to the claim
    const docsToAdd = documents.map(doc => ({
      fileName: doc.fileName,
      originalName: doc.fileName, // Use fileName as originalName
      fileType: 'application/octet-stream', // Default file type
      fileSize: 0, // Size unknown for resubmitted docs
      filePath: doc.filePath,
      uploadedAt: new Date(),
      documentType: doc.documentType,
    }));
    claim.documents.push(...docsToAdd);

    // Update status to SUBMITTED (back to review queue)
    claim.status = ClaimStatus.SUBMITTED;

    // Add status history entry
    claim.statusHistory.push({
      status: ClaimStatus.SUBMITTED,
      changedBy: new Types.ObjectId(userId),
      changedByName: 'Member',
      changedByRole: 'MEMBER',
      changedAt: new Date(),
      reason: 'Documents resubmitted by member',
      notes: resubmissionNotes || 'Member resubmitted requested documents',
    });

    // Clear assignment (needs reassignment)
    // @ts-ignore - These fields should be optional in schema
    delete claim.assignedTo;
    // @ts-ignore
    delete claim.assignedBy;
    // @ts-ignore
    delete claim.assignedAt;

    await claim.save();

    return {
      message: 'Documents resubmitted successfully. Claim has been moved back to review queue.',
      claim: {
        claimId: claim.claimId,
        status: claim.status,
        documentsCount: claim.documents.length,
      },
    };
  }

  // Get TPA notes filtered for member view (only non-internal notes)
  async getTPANotesForMember(claimId: string, userId: string) {
    const claim = await this.memberClaimModel
      .findOne({ claimId })
      .select('claimId userId reviewNotes approvalReason rejectionReason documentsRequested')
      .lean();

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Check if user can manage this claim (own claim or dependent's claim)
    const canManage = await this.canManageClaim(claim.userId.toString(), userId);
    if (!canManage) {
      throw new ForbiddenException('You can only view notes for your own claims or your dependents\' claims');
    }

    // Filter out internal notes, only show member-facing information
    const memberNotes = [];

    if (claim.approvalReason) {
      memberNotes.push({
        type: 'approval',
        message: claim.approvalReason,
        timestamp: claim.approvedAt,
      });
    }

    if (claim.rejectionReason) {
      memberNotes.push({
        type: 'rejection',
        message: claim.rejectionReason,
        timestamp: claim.rejectedAt,
      });
    }

    if (claim.documentsRequired && claim.requiredDocumentsList && claim.requiredDocumentsList.length > 0) {
      memberNotes.push({
        type: 'documents_required',
        message: 'Additional documents requested',
        documents: claim.requiredDocumentsList.map((docType: string) => ({
          documentType: docType,
          reason: claim.documentsRequiredReason || 'Required for processing',
        })),
      });
    }

    return {
      claimId: claim.claimId,
      notes: memberNotes,
    };
  }

  /**
   * Cancel a claim (only if not approved/rejected)
   */
  async cancelClaim(claimId: string, userId: string, reason?: string) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Check if user can manage this claim (own claim or dependent's claim)
    const canCancel = await this.canManageClaim(claim.userId.toString(), userId);
    if (!canCancel) {
      throw new ForbiddenException('You can only cancel your own claims or your dependents\' claims');
    }

    // Check if claim can be cancelled (not already approved/rejected/cancelled)
    const nonCancellableStatuses = [
      ClaimStatus.APPROVED,
      ClaimStatus.PARTIALLY_APPROVED,
      ClaimStatus.REJECTED,
      ClaimStatus.CANCELLED,
      ClaimStatus.PAYMENT_COMPLETED,
      ClaimStatus.PAYMENT_PROCESSING,
    ];

    if (nonCancellableStatuses.includes(claim.status)) {
      throw new BadRequestException(
        `Cannot cancel claim with status ${claim.status}. Only pending claims can be cancelled.`,
      );
    }

    // Update claim status to CANCELLED
    claim.status = ClaimStatus.CANCELLED;
    claim.cancellationReason = reason || 'Cancelled by member';
    claim.cancelledAt = new Date();

    // Add to status history
    if (!claim.statusHistory) {
      claim.statusHistory = [];
    }

    claim.statusHistory.push({
      status: ClaimStatus.CANCELLED,
      changedBy: new Types.ObjectId(userId),
      changedByName: 'Member',
      changedByRole: UserRole.MEMBER,
      changedAt: new Date(),
      reason: reason || 'Cancelled by member',
      notes: '',
    });

    await claim.save();

    return {
      message: 'Claim cancelled successfully',
      claim: claim.toObject(),
    };
  }
}