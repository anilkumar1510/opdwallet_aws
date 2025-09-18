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
import { BenefitComponentsService } from './benefit-components.service';
import { UpdateBenefitComponentsDto } from './dto/benefit-components.dto';
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

@ApiTags('benefit-components')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BenefitComponentsController {
  constructor(private readonly benefitComponentsService: BenefitComponentsService) {}

  // Admin endpoints
  @Get('admin/policies/:policyId/plan-versions/:version/benefit-components')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get benefit components for a plan version (Admin)' })
  @ApiResponse({ status: 200, description: 'Benefit components retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Policy or plan version not found' })
  async getBenefitComponents(
    @Param('policyId') policyId: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.benefitComponentsService.getBenefitComponents(policyId, version);
  }

  @Put('admin/policies/:policyId/plan-versions/:version/benefit-components')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update benefit components for a plan version (Admin)' })
  @ApiResponse({ status: 200, description: 'Benefit components updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or validation error' })
  @ApiResponse({ status: 403, description: 'Cannot edit published plan version' })
  @ApiResponse({ status: 404, description: 'Policy or plan version not found' })
  async updateBenefitComponents(
    @Param('policyId') policyId: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() dto: UpdateBenefitComponentsDto,
    @Request() req: AuthRequest,
  ) {
    return this.benefitComponentsService.updateBenefitComponents(
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
  @Get('member/benefit-components')
  @ApiOperation({ summary: 'Get benefit components for current member' })
  @ApiResponse({ status: 200, description: 'Benefit components retrieved successfully' })
  async getMemberBenefitComponents(
    @Request() req: AuthRequest,
  ) {
    return this.benefitComponentsService.getMemberBenefitComponents(req.user.userId);
  }
}