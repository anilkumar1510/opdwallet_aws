import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlanConfigResolverService } from './plan-config-resolver.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('plan-config')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlanConfigResolverController {
  constructor(private readonly resolverService: PlanConfigResolverService) {}

  @Get('plan-config/effective')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get effective plan configuration for admin' })
  @ApiQuery({ name: 'policyId', required: true, type: String })
  @ApiQuery({ name: 'planVersion', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plan version not found' })
  async getEffectiveConfigForAdmin(
    @Query('policyId') policyId: string,
    @Query('planVersion') planVersion: string,
  ) {
    return this.resolverService.resolveForAdmin(policyId, parseInt(planVersion, 10));
  }

  @Get('member/plan-config')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get effective plan configuration for member' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No assignment found for member' })
  async getEffectiveConfigForMember(@Request() req: any) {
    return this.resolverService.resolveForMember(req.user.memberId || req.user.id);
  }

  @Get('admin/policies/:policyId/plan-versions/:version/readiness')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check if plan version is ready for publishing' })
  @ApiResponse({ status: 200, description: 'Readiness status retrieved' })
  @ApiResponse({ status: 404, description: 'Plan version not found' })
  async checkReadiness(
    @Query('policyId') policyId: string,
    @Query('version') version: string,
  ) {
    return this.resolverService.checkPublishReadiness(policyId, parseInt(version, 10));
  }
}