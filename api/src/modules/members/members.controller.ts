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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AssignmentsService } from '../assignments/assignments.service';

/**
 * Members Controller
 * Handles API endpoints for external users (members)
 * Endpoints: /members/*
 */
@ApiTags('Members')
@ApiBearerAuth()
@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new member' })
  @ApiResponse({ status: 201, description: 'Member created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Conflict - Email/Phone/UHID/Member ID already exists' })
  async create(@Body() createMemberDto: CreateMemberDto, @Req() req: any) {
    const createdBy = req.user?.userId || req.user?.sub || 'system';
    return this.membersService.create(createMemberDto, createdBy);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TPA_ADMIN,
    UserRole.TPA_USER,
    UserRole.OPS_ADMIN,
    UserRole.OPS_USER,
  )
  @ApiOperation({ summary: 'Get all members with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  async findAll(@Query() query: QueryMemberDto) {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TPA_ADMIN,
    UserRole.TPA_USER,
    UserRole.OPS_ADMIN,
    UserRole.OPS_USER,
  )
  @ApiOperation({ summary: 'Get a member by ID' })
  @ApiResponse({ status: 200, description: 'Member retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Get(':id/dependents')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TPA_ADMIN,
    UserRole.TPA_USER,
    UserRole.OPS_ADMIN,
    UserRole.OPS_USER,
  )
  @ApiOperation({ summary: 'Get all dependents of a primary member' })
  @ApiResponse({ status: 200, description: 'Dependents retrieved successfully' })
  async findDependents(@Param('id') id: string) {
    // First get the member to get their memberId
    const member = await this.membersService.findOne(id);
    return this.membersService.findDependents((member as any).memberId);
  }

  @Get(':id/assignments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TPA_ADMIN,
    UserRole.TPA_USER,
    UserRole.OPS_ADMIN,
    UserRole.OPS_USER,
  )
  @ApiOperation({ summary: 'Get policy assignments for a member' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid userId format' })
  async getMemberAssignments(@Param('id') userId: string) {
    return this.assignmentsService.getUserAssignments(userId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a member' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Email/Phone already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Req() req: any,
  ) {
    const updatedBy = req.user?.userId || req.user?.sub || 'system';
    return this.membersService.update(id, updateMemberDto, updatedBy);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a member' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete member with dependents' })
  async remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset member password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async resetPassword(@Param('id') id: string) {
    return this.membersService.resetPassword(id);
  }
}
