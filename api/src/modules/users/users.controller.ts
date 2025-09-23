import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AssignmentsService } from '../assignments/assignments.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate field value' })
  create(@Body() createUserDto: CreateUserDto, @Request() req: AuthRequest) {
    return this.usersService.create(createUserDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthRequest,
  ) {
    return this.usersService.update(id, updateUserDto, req.user.userId);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resetPassword(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.usersService.resetPassword(id, req.user.userId);
  }

  @Post(':id/set-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set user password' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  setPassword(
    @Param('id') id: string,
    @Body('password') password: string,
    @Request() req: AuthRequest,
  ) {
    return this.usersService.setPassword(id, password, req.user.userId);
  }

  @Get(':id/dependents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TPA, UserRole.OPS)
  @ApiOperation({ summary: 'Get user dependents' })
  @ApiResponse({ status: 200, description: 'Dependents fetched successfully' })
  getDependents(@Param('id') id: string) {
    return this.usersService.getUserWithDependents(id);
  }

  @Get(':id/assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get assignments for a specific user' })
  @ApiResponse({ status: 200, description: 'User assignments retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid userId format' })
  getUserAssignments(@Param('id') userId: string) {
    return this.assignmentsService.getUserAssignments(userId);
  }
}