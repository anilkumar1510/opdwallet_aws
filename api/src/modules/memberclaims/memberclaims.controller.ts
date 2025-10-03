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
    console.log('=== CLAIM CREATE ENDPOINT CALLED ===');
    console.log('Request User:', JSON.stringify(req.user, null, 2));
    console.log('Request Body:', JSON.stringify(createClaimDto, null, 2));
    console.log('Files Received:', files ? files.length : 0);

    if (files && files.length > 0) {
      console.log('File Details:');
      files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          originalname: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          destination: file.destination
        });
      });
    }

    const userId = req.user.userId || req.user.id;
    console.log('Extracted userId:', userId);

    if (!userId) {
      console.error('ERROR: User ID is missing!');
      throw new BadRequestException('User ID is required');
    }

    try {
      console.log('Calling memberClaimsService.create...');
      const claim = await this.memberClaimsService.create(
        createClaimDto,
        userId,
        files,
      );

      console.log('Claim created successfully:', {
        claimId: claim.claimId,
        _id: (claim as any)._id,
        documentsCount: claim.documents?.length || 0
      });

      return {
        message: 'Claim created successfully',
        claim: claim.toObject(),
      };
    } catch (error: any) {
      console.error('ERROR in create claim:', error);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);

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
    console.log('=== SUBMIT CLAIM ENDPOINT CALLED ===');
    console.log('ClaimId:', claimId);
    console.log('Request User:', JSON.stringify(req.user, null, 2));

    const userId = req.user.userId || req.user.id;
    console.log('Extracted userId:', userId);

    if (!userId) {
      console.error('ERROR: User ID is missing for submit!');
      throw new BadRequestException('User ID is required');
    }

    try {
      console.log('Calling memberClaimsService.submitClaim...');
      const claim = await this.memberClaimsService.submitClaim(claimId, userId);

      console.log('Claim submitted successfully:', {
        claimId: claim.claimId,
        status: claim.status,
        submittedAt: claim.submittedAt
      });

      return {
        message: 'Claim submitted successfully',
        claim: claim.toObject(),
      };
    } catch (error) {
      console.error('ERROR in submit claim:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
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
      claims: result.claims.map(claim => claim.toObject()),
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
    // Security check: Members can only access their own files
    if (req.user.role === UserRole.MEMBER) {
      const requestUserId = req.user.userId || req.user.id;
      if (requestUserId !== userId) {
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
}