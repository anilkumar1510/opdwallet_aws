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
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MemberClaimsService {
  constructor(
    @InjectModel(MemberClaim.name)
    private memberClaimModel: Model<MemberClaimDocument>,
  ) {}

  async create(
    createClaimDto: CreateClaimDto,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<MemberClaimDocument> {
    console.log('=== MemberClaimsService.create CALLED ===');
    console.log('UserId:', userId);
    console.log('CreateClaimDto:', JSON.stringify(createClaimDto, null, 2));
    console.log('Files count:', files?.length || 0);

    try {
      // Generate unique claim ID
      console.log('Generating claim ID...');
      const claimId = await this.generateClaimId();
      console.log('Generated claimId:', claimId);

      // Process uploaded files
      console.log('Processing uploaded files...');
      const documents = files
        ? files.map((file, index) => {
            console.log(`Processing file ${index + 1}:`, {
              filename: file.filename,
              originalname: file.originalname,
              path: file.path,
              size: file.size
            });

            const doc = {
              fileName: file.filename,
              originalName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              filePath: file.path,
              uploadedAt: new Date(),
              documentType: this.determineDocumentType(file.originalname),
            };

            console.log(`Document ${index + 1} processed:`, doc);
            return doc;
          })
        : [];

      console.log('Total documents processed:', documents.length);

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

      console.log('Creating new claim with data:', {
        claimId: claimData.claimId,
        userId: claimData.userId.toString(),
        documentsCount: claimData.documents.length,
        status: claimData.status
      });

      const newClaim = new this.memberClaimModel(claimData);

      console.log('Saving claim to database...');

      let savedClaim;
      try {
        savedClaim = await newClaim.save();
        console.log('Raw saved claim:', savedClaim);
      } catch (saveError: any) {
        console.error('MongoDB Save Error:', saveError);
        console.error('Validation Errors:', saveError.errors);
        throw new Error(`Database save failed: ${saveError.message}`);
      }

      console.log('Claim saved successfully:', {
        _id: savedClaim._id,
        claimId: savedClaim.claimId,
        documentsCount: savedClaim.documents?.length || 0
      });

      return savedClaim;
    } catch (error) {
      console.error('ERROR in MemberClaimsService.create:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async submitClaim(claimId: string, userId: string): Promise<MemberClaimDocument> {
    const claim = await this.findByClaimId(claimId);

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    if (claim.userId.toString() !== userId) {
      throw new ForbiddenException('You are not authorized to submit this claim');
    }

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Only draft claims can be submitted');
    }

    // Validate required documents
    if (!claim.documents || claim.documents.length === 0) {
      throw new BadRequestException('Please upload at least one document');
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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

    if (claim.userId.toString() !== userId) {
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

    if (claim.userId.toString() !== userId) {
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
      console.error('Failed to delete file:', error);
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
        console.error('Failed to delete file:', error);
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
    const claims = await this.memberClaimModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();

    const summary = {
      total: claims.length,
      draft: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      totalClaimedAmount: 0,
      totalApprovedAmount: 0,
      totalPaidAmount: 0,
    };

    claims.forEach((claim) => {
      switch (claim.status) {
        case ClaimStatus.DRAFT:
          summary.draft++;
          break;
        case ClaimStatus.SUBMITTED:
          summary.submitted++;
          break;
        case ClaimStatus.UNDER_REVIEW:
          summary.underReview++;
          break;
        case ClaimStatus.APPROVED:
        case ClaimStatus.PARTIALLY_APPROVED:
          summary.approved++;
          summary.totalApprovedAmount += claim.approvedAmount || 0;
          if (claim.paymentStatus === PaymentStatus.PAID) {
            summary.totalPaidAmount += claim.approvedAmount || 0;
          }
          break;
        case ClaimStatus.REJECTED:
          summary.rejected++;
          break;
      }

      if (claim.status !== ClaimStatus.DRAFT) {
        summary.totalClaimedAmount += claim.billAmount || 0;
      }
    });

    return summary;
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

      console.log('Date range for count:', {
        start: todayStart,
        end: todayEnd
      });

      const todayCount = await this.memberClaimModel.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      });

      console.log('Today count:', todayCount);

      const sequence = String(todayCount + 1).padStart(4, '0');
      const claimId = `CLM-${year}${month}${day}-${sequence}`;

      console.log('Generated claim ID:', claimId);
      return claimId;
    } catch (error) {
      console.error('ERROR in generateClaimId:', error);
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
}