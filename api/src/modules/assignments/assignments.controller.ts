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
import { CopayResolver } from '../plan-config/utils/copay-resolver';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@ApiTags('assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

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
    console.log('🔵 [MY-POLICY] ========== GET /assignments/my-policy START ==========');
    console.log('🔵 [MY-POLICY] User:', req.user?.userId, req.user?.email, 'MemberID:', req.user?.memberId);

    try {
      // Step 1: Get user's relationship for member-specific copay config
      let userRelationship: string | null = null;
      try {
        const user = await this.userModel.findById(req.user.userId).select('relationship').lean() as { relationship?: string } | null;
        if (user && user.relationship) {
          userRelationship = user.relationship;
          console.log('✅ [MY-POLICY] User relationship found:', userRelationship);
        } else {
          console.log('⚠️ [MY-POLICY] No relationship found for user');
        }
      } catch (userError) {
        console.error('❌ [MY-POLICY] Failed to fetch user relationship:', userError.message);
      }

      // Step 2: Get user's active assignments
      const assignments = await this.assignmentsService.getUserAssignments(req.user.userId);
      console.log('🔵 [MY-POLICY] User assignments found:', assignments?.length || 0);

      if (!assignments || assignments.length === 0) {
        console.log('❌ [MY-POLICY] No active assignments found for user');
        throw new NotFoundException('No active policy assignment found for user. Please contact your administrator to assign a policy.');
      }

      // Step 3: Get the first active assignment (assuming one policy per user)
      const activeAssignment = assignments[0];
      console.log('✅ [MY-POLICY] Active assignment:', {
        assignmentId: activeAssignment.assignmentId,
        policyId: activeAssignment.policyId?.toString(),
        planVersionOverride: activeAssignment.planVersionOverride
      });

      // Step 4: Get the plan configuration for this policy
      const planConfig = await this.assignmentsService.getPolicyConfigForUser(
        activeAssignment.policyId.toString(),
        activeAssignment.planVersionOverride
      );

      console.log('📄 [MY-POLICY] Plan config retrieved:', planConfig ? 'YES' : 'NO');
      if (planConfig?.currentVersion) {
        const currentVer = planConfig.currentVersion as any; // Type assertion for dynamic schema
        console.log('📄 [MY-POLICY] Plan config structure:', JSON.stringify({
          hasWallet: !!currentVer.wallet,
          hasMemberConfigs: !!currentVer.memberConfigs,
          memberConfigKeys: currentVer.memberConfigs ? Object.keys(currentVer.memberConfigs) : []
        }, null, 2));
      }

      // Step 5: ✅ FIX - Use CopayResolver to get copay from correct location (wallet.copay)
      console.log('💰 [MY-POLICY FIX] Using CopayResolver to resolve copay config...');
      const copayConfig = CopayResolver.resolve(planConfig?.currentVersion, userRelationship);
      const copaySource = CopayResolver.getSource(planConfig?.currentVersion, userRelationship);

      console.log('📄 [MY-POLICY] Copay source:', copaySource);
      console.log('📄 [MY-POLICY] Resolved copay config:', JSON.stringify(copayConfig, null, 2));

      // Convert to frontend-expected format
      const formattedCopay = copayConfig ? {
        percentage: copayConfig.mode === 'PERCENT' ? copayConfig.value : (copayConfig.value / 1) * 100,
        mode: copayConfig.mode,
        value: copayConfig.value
      } : null;

      console.log('📄 [MY-POLICY] Formatted copay for frontend:', JSON.stringify(formattedCopay, null, 2));

      const response = {
        policyId: activeAssignment.policyId,
        assignmentId: activeAssignment.assignmentId,
        effectiveFrom: activeAssignment.effectiveFrom,
        effectiveTo: activeAssignment.effectiveTo,
        copay: formattedCopay,
        copaySource: copaySource, // Add source for debugging
        walletEnabled: planConfig?.currentVersion?.wallet ? true : true,
        planConfig: planConfig?.currentVersion
      };

      console.log('✅✅ [MY-POLICY] ========== RETURNING POLICY CONFIG ==========');
      console.log('✅✅ [MY-POLICY] Response:', JSON.stringify(response, null, 2));
      console.log('✅✅ [MY-POLICY] ========== GET /assignments/my-policy END ==========');

      return response;
    } catch (error) {
      console.error('❌❌ [MY-POLICY] ========== ERROR ==========');
      console.error('❌❌ [MY-POLICY] Error name:', error.name);
      console.error('❌❌ [MY-POLICY] Error message:', error.message);
      console.error('❌❌ [MY-POLICY] Error stack:', error.stack);
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