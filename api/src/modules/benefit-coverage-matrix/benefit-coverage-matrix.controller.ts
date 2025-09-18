import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { BenefitCoverageMatrixService } from './benefit-coverage-matrix.service';
import { UpdateBenefitCoverageMatrixDto } from './dto/benefit-coverage-matrix.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('benefit-coverage-matrix')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BenefitCoverageMatrixController {
  constructor(
    private readonly coverageMatrixService: BenefitCoverageMatrixService,
  ) {}

  // Admin endpoints
  @Get('admin/policies/:policyId/plan-versions/:version/coverage')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get coverage matrix for a plan version (Admin)' })
  @ApiResponse({ status: 200, description: 'Coverage matrix retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Policy or plan version not found' })
  async getCoverageMatrix(
    @Param('policyId') policyId: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.coverageMatrixService.getCoverageMatrix(policyId, version);
  }

  @Put('admin/policies/:policyId/plan-versions/:version/coverage')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update coverage matrix for a plan version (Admin)' })
  @ApiResponse({ status: 200, description: 'Coverage matrix updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or validation error' })
  @ApiResponse({ status: 403, description: 'Cannot edit non-DRAFT plan version' })
  @ApiResponse({ status: 404, description: 'Policy or plan version not found' })
  async updateCoverageMatrix(
    @Param('policyId') policyId: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() dto: UpdateBenefitCoverageMatrixDto,
    @Request() req: AuthRequest,
  ) {
    return this.coverageMatrixService.updateCoverageMatrix(
      policyId,
      version,
      dto,
      {
        ...req.user,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );
  }

  // Member endpoints
  @Get('member/coverage-matrix')
  @ApiOperation({ summary: 'Get coverage matrix for current member' })
  @ApiResponse({ status: 200, description: 'Coverage matrix retrieved successfully' })
  async getMemberCoverageMatrix(
    @Request() req: AuthRequest,
  ) {
    return this.coverageMatrixService.getMemberCoverageMatrix(req.user.userId);
  }
}