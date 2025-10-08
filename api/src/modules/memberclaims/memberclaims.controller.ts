import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  Request,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { MemberClaimsService } from './memberclaims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ResubmitDocumentsDto } from './dto/resubmit-documents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { multerConfig } from './config/multer.config';
import { ClaimStatus } from './schemas/memberclaim.schema';

interface AuthRequest extends Request {
  user: {
    userId?: string;
    id?: string;
    role: UserRole;
  };
}

@Controller('member/claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MemberClaimsController {
  constructor(private readonly memberClaimsService: MemberClaimsService) {}

  @Post()
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FilesInterceptor('documents', 10, multerConfig))
  async create(
    @Body() createClaimDto: CreateClaimDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: AuthRequest,
  ) {
    // Get logged-in user (the person submitting the claim)
    const submittedBy = req.user.userId || req.user.id;

    // Get claim owner (from body if provided, otherwise use logged-in user)
    const claimOwnerId = createClaimDto['userId'] || submittedBy;

    if (!claimOwnerId || !submittedBy) {
      throw new BadRequestException('User ID is required');
    }

    // Verify the logged-in user has permission to create claim for this userId
    if (claimOwnerId !== submittedBy) {
      // TODO: Verify claimOwnerId is a dependent of submittedBy
      // For now, we'll allow it and rely on wallet access controls
    }

    try {
      const claim = await this.memberClaimsService.create(
        createClaimDto,
        claimOwnerId,
        submittedBy,
        files,
      );

      return {
        message: 'Claim created successfully',
        claim: claim.toObject(),
      };
    } catch (error: any) {
      // Return more detailed error for debugging
      throw new BadRequestException({
        message: 'Failed to create claim',
        error: error.message,
        details: error.stack?.split('\n')[0],
        mongoError: error.code ? `MongoDB Error Code: ${error.code}` : undefined
      });
    }
  }

  @Post(':claimId/submit')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async submitClaim(@Param('claimId') claimId: string, @Request() req: AuthRequest) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const claim = await this.memberClaimsService.submitClaim(claimId, userId);

    return {
      message: 'Claim submitted successfully',
      claim: claim.toObject(),
    };
  }

  @Get()
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TPA, UserRole.OPS)
  async findAll(
    @Request() req: AuthRequest,
    @Query('status') status?: ClaimStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const userId = req.user.role === UserRole.MEMBER
      ? (req.user.userId || req.user.id)
      : undefined;

    const result = await this.memberClaimsService.findAll(
      userId,
      status,
      +page,
      +limit,
    );

    return {
      message: 'Claims retrieved successfully',
      ...result,
    };
  }

  @Get('summary')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getUserSummary(@Request() req: AuthRequest) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const summary = await this.memberClaimsService.getUserClaimsSummary(userId);

    return {
      message: 'Claims summary retrieved successfully',
      summary,
    };
  }

  @Get(':claimId/timeline')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.FINANCE_USER)
  async getClaimTimeline(@Param('claimId') claimId: string, @Request() req: AuthRequest) {
    const userId = req.user?.userId || req.user?.id;
    return this.memberClaimsService.getClaimTimeline(claimId, userId || '', req.user.role);
  }

  @Get(':claimId/tpa-notes')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTPANotes(@Param('claimId') claimId: string, @Request() req: AuthRequest) {
    const userId = req.user?.userId || req.user?.id;
    return this.memberClaimsService.getTPANotesForMember(claimId, userId || '');
  }

  @Get(':id')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TPA, UserRole.OPS)
  async findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    const userId = req.user.role === UserRole.MEMBER
      ? (req.user.userId || req.user.id)
      : undefined;

    const claim = await this.memberClaimsService.findOne(id, userId);

    return {
      message: 'Claim retrieved successfully',
      claim: claim.toObject(),
    };
  }

  @Get('claim/:claimId')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TPA, UserRole.OPS)
  async findByClaimId(@Param('claimId') claimId: string) {
    const claim = await this.memberClaimsService.findByClaimId(claimId);

    return {
      message: 'Claim retrieved successfully',
      claim: claim.toObject(),
    };
  }

  @Patch(':id')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateClaimDto: UpdateClaimDto,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const claim = await this.memberClaimsService.update(id, updateClaimDto, userId);

    return {
      message: 'Claim updated successfully',
      claim: claim.toObject(),
    };
  }

  @Post(':claimId/documents')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FilesInterceptor('documents', 10, multerConfig))
  async addDocuments(
    @Param('claimId') claimId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: AuthRequest,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const claim = await this.memberClaimsService.addDocuments(
      claimId,
      userId,
      files,
    );

    return {
      message: 'Documents added successfully',
      claim: claim.toObject(),
    };
  }

  @Delete(':claimId/documents/:documentId')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeDocument(
    @Param('claimId') claimId: string,
    @Param('documentId') documentId: string,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const claim = await this.memberClaimsService.removeDocument(
      claimId,
      documentId,
      userId,
    );

    return {
      message: 'Document removed successfully',
      claim: claim.toObject(),
    };
  }

  @Delete(':id')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req: AuthRequest) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    await this.memberClaimsService.delete(id, userId);
  }

  @Get('files/:userId/:filename')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TPA, UserRole.OPS)
  async getFile(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
    @Request() req: AuthRequest,
  ) {
    // Security check: Members can access files if they are either:
    // 1. The user who submitted the claim (createdBy)
    // 2. The user for whom the claim was submitted (userId)
    if (req.user.role === UserRole.MEMBER) {
      const requestUserId = req.user.userId || req.user.id;

      // Find the claim that contains this file using service method
      const claim = await this.memberClaimsService.findClaimByFileName(filename);

      if (!claim) {
        throw new BadRequestException('Claim not found for this file');
      }

      // Allow access if logged-in user is either the submitter or the claim owner
      const isSubmitter = requestUserId === claim.createdBy;
      const isClaimOwner = requestUserId === claim.userId.toString();

      if (!isSubmitter && !isClaimOwner) {
        throw new BadRequestException('Unauthorized access to file');
      }
    }

    const filePath = join(process.cwd(), 'uploads', 'claims', userId, filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    // Determine content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Post(':claimId/resubmit-documents')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('documents', 10, multerConfig))
  async resubmitDocuments(
    @Param('claimId') claimId: string,
    @Body() resubmitDto: ResubmitDocumentsDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: AuthRequest,
  ) {
    const userId = req.user?.userId || req.user?.id;

    if (!files || files.length === 0) {
      throw new BadRequestException('No documents provided for resubmission');
    }

    const documentsData = files.map((file, index) => ({
      fileName: file.filename,
      filePath: `/uploads/claims/${file.filename}`,
      documentType: resubmitDto.documents[index]?.documentType || 'Supporting Document',
      notes: resubmitDto.documents[index]?.notes,
    }));

    return this.memberClaimsService.resubmitDocuments(
      claimId,
      userId || '',
      documentsData,
      resubmitDto.resubmissionNotes,
    );
  }

  @Patch(':claimId/cancel')
  @Roles(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancelClaim(
    @Param('claimId') claimId: string,
    @Body() body: { reason?: string },
    @Request() req: AuthRequest,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.memberClaimsService.cancelClaim(claimId, userId || '', body.reason);
  }
}