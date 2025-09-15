import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
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
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('users/:userId/assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create assignment for user' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  @ApiResponse({ status: 404, description: 'User or Policy not found' })
  @ApiResponse({ status: 409, description: 'Active assignment already exists' })
  createAssignment(
    @Param('userId') userId: string,
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Request() req: AuthRequest,
  ) {
    return this.assignmentsService.createAssignment(
      userId,
      createAssignmentDto,
      req.user.userId,
    );
  }

  @Get('users/:userId/assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all assignments for a user' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  getUserAssignments(@Param('userId') userId: string) {
    return this.assignmentsService.getUserAssignments(userId);
  }

  @Get('member/assignments')
  @ApiOperation({ summary: 'Get current member assignments' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  getMemberAssignments(@Request() req: AuthRequest) {
    return this.assignmentsService.getMemberAssignments(req.user.userId);
  }

  @Put('assignments/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update assignment' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.updateAssignment(
      assignmentId,
      updateAssignmentDto,
    );
  }

  @Post('assignments/:assignmentId/end')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'End assignment' })
  @ApiResponse({ status: 200, description: 'Assignment ended successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  endAssignment(@Param('assignmentId') assignmentId: string) {
    return this.assignmentsService.endAssignment(assignmentId);
  }
}