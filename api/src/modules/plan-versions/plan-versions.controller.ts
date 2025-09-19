import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlanVersionsService } from './plan-versions.service';
import { QueryPlanVersionDto } from './dto/query-plan-version.dto';
import { CreatePlanVersionDto } from './dto/create-plan-version.dto';
import { UpdateCurrentVersionDto } from './dto/update-current-version.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { CoverageService } from '../benefits/coverage.service';
import { UpdateCoverageDto } from '../benefits/dto/update-coverage.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('plan-versions')
@Controller('admin/policies/:policyId/plan-versions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PlanVersionsController {
  constructor(
    private readonly planVersionsService: PlanVersionsService,
    private readonly coverageService: CoverageService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all plan versions for a policy' })
  @ApiResponse({ status: 200, description: 'Plan versions retrieved successfully' })
  findAll(@Param('policyId') policyId: string, @Query() query: QueryPlanVersionDto) {
    return this.planVersionsService.findByPolicyId(policyId, query);
  }

  @Get('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current plan version for a policy' })
  @ApiResponse({ status: 200, description: 'Current plan version retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Policy or version not found' })
  findCurrent(@Param('policyId') policyId: string) {
    return this.planVersionsService.findCurrentVersion(policyId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new draft plan version' })
  @ApiResponse({ status: 201, description: 'Plan version created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  create(
    @Param('policyId') policyId: string,
    @Body() dto: CreatePlanVersionDto,
    @Request() req: any,
  ) {
    return this.planVersionsService.create(policyId, dto, req.user);
  }

  @Post(':version/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish a draft plan version' })
  @ApiResponse({ status: 200, description: 'Plan version published successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Plan version not found' })
  publish(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
    @Request() req: any,
  ) {
    return this.planVersionsService.publish(policyId, parseInt(version), req.user);
  }

  @Get(':version/readiness')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check readiness for publishing a plan version' })
  @ApiResponse({ status: 200, description: 'Readiness check completed' })
  @ApiResponse({ status: 404, description: 'Plan version not found' })
  async checkReadiness(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
  ) {
    return this.planVersionsService.checkPublishReadiness(policyId, parseInt(version));
  }

  @Get(':version/effective-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get effective configuration for a plan version' })
  @ApiResponse({ status: 200, description: 'Effective configuration retrieved' })
  @ApiResponse({ status: 404, description: 'Plan version not found' })
  async getEffectiveConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
  ) {
    return this.planVersionsService.getEffectiveConfig(policyId, parseInt(version));
  }

  @Patch('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set the current plan version for a policy' })
  @ApiResponse({ status: 200, description: 'Current plan version updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid version or not published' })
  @ApiResponse({ status: 404, description: 'Policy or version not found' })
  setCurrentVersion(
    @Param('policyId') policyId: string,
    @Body() dto: UpdateCurrentVersionDto,
    @Request() req: any,
  ) {
    return this.planVersionsService.setCurrentVersion(policyId, dto.planVersion, req.user);
  }

  @Get(':version/coverage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get coverage matrix for a plan version' })
  @ApiResponse({ status: 200, description: 'Coverage matrix retrieved successfully' })
  async getCoverageMatrix(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') searchQuery?: string,
    @Query('enabledOnly') enabledOnly?: string,
  ) {
    const planVersion = await this.planVersionsService.findByVersion(policyId, parseInt(version));
    return this.coverageService.getCoverageMatrix(
      (planVersion as any)._id.toString(),
      categoryId,
      searchQuery,
      enabledOnly === 'true',
    );
  }

  @Get(':version/coverage/categories')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get categories for a plan version' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCoverageCategories(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
  ) {
    const planVersion = await this.planVersionsService.findByVersion(policyId, parseInt(version));
    return this.coverageService.getCategoriesForPlanVersion((planVersion as any)._id.toString());
  }

  @Patch(':version/coverage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update coverage matrix for a plan version' })
  @ApiResponse({ status: 200, description: 'Coverage matrix updated successfully' })
  async updateCoverageMatrix(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
    @Body() updateCoverageDto: UpdateCoverageDto,
    @Request() req: any,
  ) {
    const planVersion = await this.planVersionsService.findByVersion(policyId, parseInt(version));
    return this.coverageService.updateCoverageMatrix(
      (planVersion as any)._id.toString(),
      updateCoverageDto,
      req.user?.email,
    );
  }

  @Post(':version/coverage/bulk-enable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Enable all services for specific categories' })
  @ApiResponse({ status: 200, description: 'Services enabled successfully' })
  async bulkEnableServices(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
    @Body() body: { categoryIds: string[] },
    @Request() req: any,
  ) {
    const planVersion = await this.planVersionsService.findByVersion(policyId, parseInt(version));
    return this.coverageService.bulkUpdateCategoryServices(
      (planVersion as any)._id.toString(),
      body.categoryIds,
      true,
      req.user?.email,
    );
  }

  @Post(':version/coverage/bulk-disable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Disable all services for specific categories' })
  @ApiResponse({ status: 200, description: 'Services disabled successfully' })
  async bulkDisableServices(
    @Param('policyId') policyId: string,
    @Param('version') version: string,
    @Body() body: { categoryIds: string[] },
    @Request() req: any,
  ) {
    const planVersion = await this.planVersionsService.findByVersion(policyId, parseInt(version));
    return this.coverageService.bulkUpdateCategoryServices(
      (planVersion as any)._id.toString(),
      body.categoryIds,
      false,
      req.user?.email,
    );
  }
}