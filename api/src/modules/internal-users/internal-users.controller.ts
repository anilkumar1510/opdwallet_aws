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
import { InternalUsersService } from './internal-users.service';
import { CreateInternalUserDto } from './dto/create-internal-user.dto';
import { UpdateInternalUserDto } from './dto/update-internal-user.dto';
import { QueryInternalUserDto } from './dto/query-internal-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

/**
 * Internal Users Controller
 * Handles API endpoints for internal staff users
 * Endpoints: /internal-users/*
 */
@ApiTags('Internal Users')
@ApiBearerAuth()
@Controller('internal-users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternalUsersController {
  constructor(private readonly internalUsersService: InternalUsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new internal user (staff)' })
  @ApiResponse({ status: 201, description: 'Internal user created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Conflict - Email/Phone/Employee ID already exists' })
  async create(@Body() createInternalUserDto: CreateInternalUserDto, @Req() req: any) {
    const createdBy = req.user?.userId || req.user?.sub || 'system';
    return this.internalUsersService.create(createInternalUserDto, createdBy);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all internal users with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Internal users retrieved successfully' })
  async findAll(@Query() query: QueryInternalUserDto) {
    return this.internalUsersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get an internal user by ID' })
  @ApiResponse({ status: 200, description: 'Internal user retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Internal user not found' })
  async findOne(@Param('id') id: string) {
    return this.internalUsersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an internal user' })
  @ApiResponse({ status: 200, description: 'Internal user updated successfully' })
  @ApiResponse({ status: 404, description: 'Internal user not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Email/Phone already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateInternalUserDto: UpdateInternalUserDto,
    @Req() req: any,
  ) {
    const updatedBy = req.user?.userId || req.user?.sub || 'system';
    return this.internalUsersService.update(id, updateInternalUserDto, updatedBy);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an internal user' })
  @ApiResponse({ status: 200, description: 'Internal user deleted successfully' })
  @ApiResponse({ status: 404, description: 'Internal user not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete the last SUPER_ADMIN' })
  async remove(@Param('id') id: string) {
    return this.internalUsersService.remove(id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset internal user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'Internal user not found' })
  async resetPassword(@Param('id') id: string) {
    return this.internalUsersService.resetPassword(id);
  }
}
