import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
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

@ApiTags('assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign policy to user' })
  @ApiResponse({ status: 201, description: 'Policy assigned successfully' })
  @ApiResponse({ status: 409, description: 'User already assigned to this policy' })
  @ApiResponse({ status: 400, description: 'Invalid userId or policyId format' })
  async createAssignment(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Request() req: any,
  ) {
    console.log('🔵 [ASSIGNMENTS CONTROLLER] POST /assignments');
    console.log('🔵 [ASSIGNMENTS CONTROLLER] Request body:', createAssignmentDto);
    console.log('🔵 [ASSIGNMENTS CONTROLLER] User:', req.user?.email);

    try {
      const result = await this.assignmentsService.createAssignment(
        createAssignmentDto,
        req.user?.userId,
      );
      console.log('✅ [ASSIGNMENTS CONTROLLER] Assignment created:', result.assignmentId);
      return result;
    } catch (error) {
      console.error('❌ [ASSIGNMENTS CONTROLLER] Error creating assignment:', error);
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all assignments with pagination' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  async getAllAssignments(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    console.log('🔵 [ASSIGNMENTS CONTROLLER] GET /assignments');
    return this.assignmentsService.getAllAssignments(
      parseInt(page),
      parseInt(limit),
    );
  }


  @Get('policy/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get assignments for a specific policy' })
  @ApiResponse({ status: 200, description: 'Policy assignments retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid policyId format' })
  async getPolicyAssignments(@Param('policyId') policyId: string) {
    console.log('🔵 [ASSIGNMENTS CONTROLLER] GET /assignments/policy/' + policyId);
    return this.assignmentsService.getPolicyAssignments(policyId);
  }

  @Get('my-policy')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get current user policy configuration with copay details' })
  @ApiResponse({ status: 200, description: 'User policy configuration retrieved' })
  @ApiResponse({ status: 404, description: 'No active policy assignment found' })
  async getMyPolicyConfig(@Request() req: any) {
    console.log('🔵 [ASSIGNMENTS CONTROLLER] GET /assignments/my-policy for user:', req.user?.userId, req.user?.email);

    try {
      // Get user's active assignments
      const assignments = await this.assignmentsService.getUserAssignments(req.user.userId);
      console.log('🔵 [ASSIGNMENTS CONTROLLER] User assignments found:', assignments?.length || 0);

      if (!assignments || assignments.length === 0) {
        console.log('⚠️ [ASSIGNMENTS CONTROLLER] No active assignments found for user');
        throw new NotFoundException('No active policy assignment found for user');
      }

      // Get the first active assignment (assuming one policy per user)
      const activeAssignment = assignments[0];
      console.log('🔵 [ASSIGNMENTS CONTROLLER] Active assignment:', {
        assignmentId: activeAssignment.assignmentId,
        policyId: activeAssignment.policyId?.toString(),
        planVersionOverride: activeAssignment.planVersionOverride
      });

      // Get the plan configuration for this policy
      const planConfig = await this.assignmentsService.getPolicyConfigForUser(
        activeAssignment.policyId.toString(),
        activeAssignment.planVersionOverride
      );

      console.log('🔵 [ASSIGNMENTS CONTROLLER] Plan config retrieved:', JSON.stringify(planConfig, null, 2));

      // Extract copay from plan config
      const copayConfig = planConfig?.currentVersion?.copay || {
        percentage: 20, // Default fallback
        mode: 'PERCENT',
        value: 20
      };

      console.log('🔵 [ASSIGNMENTS CONTROLLER] Copay config:', copayConfig);

      const response = {
        policyId: activeAssignment.policyId,
        assignmentId: activeAssignment.assignmentId,
        effectiveFrom: activeAssignment.effectiveFrom,
        effectiveTo: activeAssignment.effectiveTo,
        copay: copayConfig,
        walletEnabled: planConfig?.currentVersion?.wallet ? true : true, // Default to enabled
        planConfig: planConfig?.currentVersion
      };

      console.log('✅ [ASSIGNMENTS CONTROLLER] Returning policy config:', JSON.stringify(response, null, 2));

      return response;
    } catch (error) {
      console.error('❌ [ASSIGNMENTS CONTROLLER] Error getting my-policy:', error);
      throw error;
    }
  }

  @Get('search-primary-members')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Search primary members assigned to a policy' })
  @ApiResponse({ status: 200, description: 'Primary members found' })
  @ApiResponse({ status: 400, description: 'Invalid policyId or search query' })
  async searchPrimaryMembers(
    @Query('policyId') policyId: string,
    @Query('search') search: string,
  ) {
    console.log('🔵 [ASSIGNMENTS CONTROLLER] GET /assignments/search-primary-members');
    console.log('🔵 [ASSIGNMENTS CONTROLLER] policyId:', policyId, 'search:', search);
    return this.assignmentsService.searchPrimaryMembers(policyId, search);
  }

  @Delete(':assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove assignment (deactivate)' })
  @ApiResponse({ status: 200, description: 'Assignment removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async removeAssignment(
    @Param('assignmentId') assignmentId: string,
    @Request() req: any,
  ) {
    console.log('🔵 [ASSIGNMENTS CONTROLLER] DELETE /assignments/' + assignmentId);
    return this.assignmentsService.removeAssignment(
      assignmentId,
      req.user?.userId,
    );
  }

  @Delete('user/:userId/policy/:policyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Unassign policy from user' })
  @ApiResponse({ status: 200, description: 'Policy unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Invalid userId or policyId format' })
  async unassignPolicyFromUser(
    @Param('userId') userId: string,
    @Param('policyId') policyId: string,
    @Request() req: any,
  ) {
    console.log('🔵 [ASSIGNMENTS CONTROLLER] DELETE /assignments/user/' + userId + '/policy/' + policyId);
    return this.assignmentsService.unassignPolicyFromUser(
      userId,
      policyId,
      req.user?.userId,
    );
  }
}