import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlanConfigService } from './plan-config.service';
import { CreatePlanConfigDto } from './dto/create-plan-config.dto';
import { UpdatePlanConfigDto } from './dto/update-plan-config.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('plan-config')
@Controller('policies/:policyId/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PlanConfigController {
  constructor(private readonly planConfigService: PlanConfigService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new plan configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  async createConfig(
    @Param('policyId') policyId: string,
    @Body() dto: CreatePlanConfigDto,
    @Request() req: any,
  ) {
    console.log('🔵 [PLAN CONFIG CONTROLLER] createConfig called');
    console.log('🔵 [PLAN CONFIG CONTROLLER] policyId:', policyId);
    console.log('🔵 [PLAN CONFIG CONTROLLER] dto:', JSON.stringify(dto, null, 2));
    console.log('🔵 [PLAN CONFIG CONTROLLER] req.user:', req.user);

    try {
      const result = await this.planConfigService.createConfig(policyId, dto, req.user.userId);
      console.log('✅ [PLAN CONFIG CONTROLLER] createConfig success:', result);
      return result;
    } catch (error) {
      console.error('❌ [PLAN CONFIG CONTROLLER] createConfig error:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get plan configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  async getConfig(
    @Param('policyId') policyId: string,
    @Query('version') version?: number,
  ) {
    return this.planConfigService.getConfig(policyId, version);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all plan configurations for a policy' })
  @ApiResponse({ status: 200, description: 'All configurations retrieved' })
  async getAllConfigs(@Param('policyId') policyId: string) {
    return this.planConfigService.getAllConfigs(policyId);
  }

  @Put(':version')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update plan configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  @ApiResponse({ status: 400, description: 'Can only edit DRAFT configurations' })
  async updateConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: number,
    @Body() dto: UpdatePlanConfigDto,
    @Request() req: any,
  ) {
    console.log('🔵 [PLAN CONFIG CONTROLLER] updateConfig called');
    console.log('🔵 [PLAN CONFIG CONTROLLER] policyId:', policyId);
    console.log('🔵 [PLAN CONFIG CONTROLLER] version:', version);
    console.log('🔵 [PLAN CONFIG CONTROLLER] dto:', JSON.stringify(dto, null, 2));
    console.log('🔵 [PLAN CONFIG CONTROLLER] req.user:', req.user);

    try {
      const result = await this.planConfigService.updateConfig(policyId, version, dto, req.user.userId);
      console.log('✅ [PLAN CONFIG CONTROLLER] updateConfig success:', result);
      return result;
    } catch (error) {
      console.error('❌ [PLAN CONFIG CONTROLLER] updateConfig error:', error);
      throw error;
    }
  }

  @Post(':version/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish plan configuration' })
  @ApiResponse({ status: 200, description: 'Configuration published' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async publishConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: number,
    @Request() req: any,
  ) {
    return this.planConfigService.publishConfig(policyId, version, req.user.userId);
  }

  @Post(':version/set-current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set configuration as current' })
  @ApiResponse({ status: 200, description: 'Configuration set as current' })
  @ApiResponse({ status: 400, description: 'Can only set PUBLISHED configurations as current' })
  async setCurrentConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: number,
  ) {
    return this.planConfigService.setCurrentConfig(policyId, version);
  }

  @Delete(':version')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete plan configuration' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete published configurations that are current' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete current configuration with active user assignments' })
  async deleteConfig(
    @Param('policyId') policyId: string,
    @Param('version') version: number,
  ) {
    return this.planConfigService.deleteConfig(policyId, version);
  }

}