import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PolicyServicesConfigService } from './policy-services-config.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('policy-services-config')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PolicyServicesConfigController {
  constructor(
    private readonly policyServicesConfigService: PolicyServicesConfigService,
  ) {}

  /**
   * Admin: Get available services for a category (pool for selection)
   * GET /api/admin/categories/:categoryId/available-services
   */
  @Get('admin/categories/:categoryId/available-services')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get available services for a category (admin: for selection)',
  })
  @ApiResponse({
    status: 200,
    description: 'Available services retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Category does not support service-level configuration',
  })
  async getAvailableServices(@Param('categoryId') categoryId: string) {
    console.log(
      `[PolicyServicesConfigController] GET admin/categories/${categoryId}/available-services`,
    );
    return this.policyServicesConfigService.getAvailableServicesForCategory(
      categoryId,
    );
  }

  /**
   * Admin: Update service configuration for a benefit
   * PATCH /api/policies/:policyId/config/:version/services/:categoryId
   */
  @Patch('policies/:policyId/config/:version/services/:categoryId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update service configuration for a benefit (admin: save selections)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service configuration updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid configuration or benefit not enabled',
  })
  @ApiResponse({
    status: 404,
    description: 'Plan configuration not found or not in DRAFT status',
  })
  async updateServiceConfiguration(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
    @Param('categoryId') categoryId: string,
    @Body() body: { serviceIds: string[] },
    @Request() req: any,
  ) {
    console.log(
      `[PolicyServicesConfigController] PATCH policies/${policyId}/config/${version}/services/${categoryId}`,
    );
    console.log('[PolicyServicesConfigController] Service IDs:', body.serviceIds);

    return this.policyServicesConfigService.updateServiceConfiguration(
      policyId,
      parseInt(version),
      categoryId,
      body.serviceIds || [],
      req.user.userId,
    );
  }
}
