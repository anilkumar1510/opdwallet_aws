import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { QueryPolicyDto } from './dto/query-policy.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AuditService } from '../audit/audit.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('policies')
@Controller('policies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PoliciesController {
  constructor(
    private readonly policiesService: PoliciesService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  async create(@Body() createPolicyDto: CreatePolicyDto, @Request() req: AuthRequest) {
    const policy = await this.policiesService.create(createPolicyDto, req.user.userId);

    // Log audit
    await this.auditService.log({
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CREATE',
      resource: 'policies',
      resourceId: (policy as any)._id.toString(),
      after: (policy as any).toObject(),
      description: `Created policy: ${policy.name}`,
    });

    return policy;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all policies with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Policies retrieved successfully' })
  findAll(@Query() query: QueryPolicyDto) {
    return this.policiesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy found' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Get(':id/current')
  @Roles(UserRole.MEMBER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get policy with current configuration for members' })
  @ApiResponse({ status: 200, description: 'Policy with current config retrieved' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  getPolicyWithCurrentConfig(@Param('id') id: string, @Request() req: AuthRequest) {
    console.log('🔵 [POLICIES CONTROLLER] getPolicyWithCurrentConfig called for id:', id, 'userId:', req.user.userId);
    return this.policiesService.getPolicyWithCurrentConfig(id, req.user.userId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update policy' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @Request() req: AuthRequest,
  ) {
    // Get before state for audit
    const before = await this.policiesService.findOne(id);

    const policy = await this.policiesService.update(id, updatePolicyDto, req.user.userId);

    if (policy) {
      // Log audit
      await this.auditService.log({
        userId: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'policies',
        resourceId: (policy as any)._id.toString(),
        before: (before as any).toObject(),
        after: (policy as any).toObject(),
        description: `Updated policy: ${policy.name}`,
      });
    }

    return policy;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete policy' })
  @ApiResponse({ status: 200, description: 'Policy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiResponse({ status: 409, description: 'Policy is assigned to users and cannot be deleted' })
  async delete(@Param('id') id: string, @Request() req: AuthRequest) {
    // Get policy details for audit before deletion
    const policy = await this.policiesService.findOne(id);

    const result = await this.policiesService.delete(id);

    // Log audit
    await this.auditService.log({
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DELETE',
      resource: 'policies',
      resourceId: id,
      before: (policy as any).toObject(),
      description: `Deleted policy: ${policy.name} (${policy.policyNumber})`,
    });

    return result;
  }

}