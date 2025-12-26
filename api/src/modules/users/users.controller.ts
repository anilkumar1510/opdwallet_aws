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
  Patch,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AssignmentsService } from '../assignments/assignments.service';
import { AddressService } from './address.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assignmentsService: AssignmentsService,
    private readonly addressService: AddressService,
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TPA_ADMIN, UserRole.TPA_USER, UserRole.OPS_ADMIN, UserRole.OPS_USER)
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

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  delete(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.usersService.delete(id, req.user.userId);
  }

  // Address Management Endpoints
  @Get(':id/addresses')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get all addresses for a user' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  getUserAddresses(@Param('id') userId: string) {
    return this.addressService.getUserAddresses(new Types.ObjectId(userId));
  }

  @Post(':id/addresses')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Create a new address for a user' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createAddress(
    @Param('id') userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressService.createAddress(
      new Types.ObjectId(userId),
      createAddressDto,
    );
  }

  @Patch(':id/addresses/:addressId/default')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Set an address as default' })
  @ApiResponse({ status: 200, description: 'Default address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 409, description: 'Address does not belong to user' })
  setDefaultAddress(
    @Param('id') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.addressService.setDefaultAddress(
      new Types.ObjectId(userId),
      addressId,
    );
  }

  @Delete(':id/addresses/:addressId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 409, description: 'Address does not belong to user' })
  deleteAddress(
    @Param('id') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.addressService.deleteAddress(
      new Types.ObjectId(userId),
      addressId,
    );
  }
}