import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TpaService } from './tpa.service';
import { AssignClaimDto } from './dto/assign-claim.dto';
import { ReassignClaimDto } from './dto/reassign-claim.dto';
import { ApproveClaimDto } from './dto/approve-claim.dto';
import { RejectClaimDto } from './dto/reject-claim.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { UpdateClaimStatusDto } from './dto/update-status.dto';
import { ClaimStatus } from '@/modules/memberclaims/schemas/memberclaim.schema';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { UserRole } from '@/common/constants/roles.enum';

@ApiTags('TPA')
@Controller('tpa')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TpaController {
  constructor(private readonly tpaService: TpaService) {}

  @Get('claims')
  @Roles(UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all claims (TPA_ADMIN) or assigned claims (TPA_USER)' })
  @ApiQuery({ name: 'status', enum: ClaimStatus, required: false })
  @ApiQuery({ name: 'assignedTo', type: String, required: false })
  @ApiQuery({ name: 'fromDate', type: Date, required: false })
  @ApiQuery({ name: 'toDate', type: Date, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Claims retrieved successfully' })
  async getClaims(
    @Request() req: any,
    @Query('status') status?: ClaimStatus,
    @Query('assignedTo') assignedTo?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      status,
      assignedTo,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    return this.tpaService.getClaims(
      req.user.userId,
      req.user.role,
      filters,
    );
  }

  @Get('claims/unassigned')
  @Roles(UserRole.TPA_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get unassigned claims (TPA_ADMIN only)' })
  @ApiQuery({ name: 'fromDate', type: Date, required: false })
  @ApiQuery({ name: 'toDate', type: Date, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Unassigned claims retrieved successfully' })
  async getUnassignedClaims(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tpaService.getUnassignedClaims(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get('claims/:claimId')
  @Roles(UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get claim details by ID' })
  @ApiResponse({ status: 200, description: 'Claim details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - TPA user can only view assigned claims' })
  async getClaimById(@Param('claimId') claimId: string, @Request() req: any) {
    const claim = await this.tpaService.getClaimById(claimId, req.user.userId, req.user.role);
    return {
      message: 'Claim retrieved successfully',
      claim,
    };
  }

  @Post('claims/:claimId/assign')
  @Roles(UserRole.TPA_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign claim to TPA user (TPA_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Claim assigned successfully' })
  @ApiResponse({ status: 404, description: 'Claim or assignee not found' })
  @ApiResponse({ status: 400, description: 'Invalid assignment' })
  async assignClaim(
    @Param('claimId') claimId: string,
    @Body() assignClaimDto: AssignClaimDto,
    @Request() req: any,
  ) {
    const adminName = req.user.name?.fullName || `${req.user.name?.firstName} ${req.user.name?.lastName}`;

    return this.tpaService.assignClaim(
      claimId,
      assignClaimDto,
      req.user.userId,
      adminName,
    );
  }

  @Post('claims/:claimId/reassign')
  @Roles(UserRole.TPA_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reassign claim to different TPA user (TPA_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Claim reassigned successfully' })
  @ApiResponse({ status: 404, description: 'Claim or assignee not found' })
  @ApiResponse({ status: 400, description: 'Invalid reassignment' })
  async reassignClaim(
    @Param('claimId') claimId: string,
    @Body() reassignClaimDto: ReassignClaimDto,
    @Request() req: any,
  ) {
    const adminName = req.user.name?.fullName || `${req.user.name?.firstName} ${req.user.name?.lastName}`;

    return this.tpaService.reassignClaim(
      claimId,
      reassignClaimDto,
      req.user.userId,
      adminName,
    );
  }

  @Patch('claims/:claimId/status')
  @Roles(UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update claim status' })
  @ApiResponse({ status: 200, description: 'Claim status updated successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - TPA user can only update assigned claims' })
  async updateClaimStatus(
    @Param('claimId') claimId: string,
    @Body() updateStatusDto: UpdateClaimStatusDto,
    @Request() req: any,
  ) {
    const userName = req.user.name?.fullName || `${req.user.name?.firstName} ${req.user.name?.lastName}`;

    return this.tpaService.updateClaimStatus(
      claimId,
      updateStatusDto,
      req.user.userId,
      userName,
      req.user.role,
    );
  }

  @Post('claims/:claimId/approve')
  @Roles(UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve claim (full or partial)' })
  @ApiResponse({ status: 200, description: 'Claim approved successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - TPA user can only approve assigned claims' })
  @ApiResponse({ status: 400, description: 'Invalid approval amount' })
  async approveClaim(
    @Param('claimId') claimId: string,
    @Body() approveClaimDto: ApproveClaimDto,
    @Request() req: any,
  ) {
    const userName = req.user.name?.fullName || `${req.user.name?.firstName} ${req.user.name?.lastName}`;

    return this.tpaService.approveClaim(
      claimId,
      approveClaimDto,
      req.user.userId,
      userName,
      req.user.role,
    );
  }

  @Post('claims/:claimId/reject')
  @Roles(UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject claim' })
  @ApiResponse({ status: 200, description: 'Claim rejected successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - TPA user can only reject assigned claims' })
  async rejectClaim(
    @Param('claimId') claimId: string,
    @Body() rejectClaimDto: RejectClaimDto,
    @Request() req: any,
  ) {
    const userName = req.user.name?.fullName || `${req.user.name?.firstName} ${req.user.name?.lastName}`;

    return this.tpaService.rejectClaim(
      claimId,
      rejectClaimDto,
      req.user.userId,
      userName,
      req.user.role,
    );
  }

  @Post('claims/:claimId/request-documents')
  @Roles(UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request additional documents from member' })
  @ApiResponse({ status: 200, description: 'Documents requested successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - TPA user can only request documents for assigned claims' })
  async requestDocuments(
    @Param('claimId') claimId: string,
    @Body() requestDocumentsDto: RequestDocumentsDto,
    @Request() req: any,
  ) {
    const userName = req.user.name?.fullName || `${req.user.name?.firstName} ${req.user.name?.lastName}`;

    return this.tpaService.requestDocuments(
      claimId,
      requestDocumentsDto,
      req.user.userId,
      userName,
      req.user.role,
    );
  }

  @Get('analytics/summary')
  @Roles(UserRole.TPA_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get TPA analytics summary' })
  @ApiQuery({ name: 'fromDate', type: Date, required: false })
  @ApiQuery({ name: 'toDate', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved successfully' })
  async getAnalyticsSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const summary = await this.tpaService.getAnalyticsSummary(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
    return {
      message: 'Analytics summary retrieved successfully',
      summary,
    };
  }

  @Get('users')
  @Roles(UserRole.TPA_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all TPA users with workload (TPA_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'TPA users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only TPA admins can view users' })
  async getTPAUsers(@Request() req: any) {
    return this.tpaService.getTPAUsers(req.user.role);
  }

  @Get('recent-activity')
  @Roles(UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get recent activity from claim status changes' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Number of activities to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
  async getRecentActivity(@Query('limit') limit?: string) {
    const activityLimit = limit ? parseInt(limit, 10) : 10;
    const result = await this.tpaService.getRecentActivity(activityLimit);
    return {
      message: 'Recent activity retrieved successfully',
      ...result,
    };
  }
}
