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
}