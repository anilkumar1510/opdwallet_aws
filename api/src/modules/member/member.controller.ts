import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { MemberService } from './member.service';
import { AddressService } from '../users/address.service';
import { CreateAddressDto } from '../users/dto/create-address.dto';
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Types } from 'mongoose';

@ApiTags('member')
@Controller('member')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly addressService: AddressService,
  ) {}

  @Get('profile')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get member profile with family members' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getProfile(@Request() req: AuthRequest) {
    return this.memberService.getProfile(req.user.userId);
  }

  @Get('family')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get family members' })
  @ApiResponse({ status: 200, description: 'Family members fetched successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getFamilyMembers(@Request() req: AuthRequest) {
    return this.memberService.getFamilyMembers(req.user.userId);
  }

  @Patch('profile')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Update member profile (email/mobile)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  updateProfile(@Request() req: AuthRequest, @Body() updateProfileDto: UpdateProfileDto) {
    return this.memberService.updateProfile(req.user.userId, updateProfileDto);
  }

  // Address Management
  @Get('addresses')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get all addresses for logged-in member' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  async getAddresses(@Request() req: AuthRequest) {
    console.log('[ADDRESS-API] ========== GET ADDRESSES REQUEST ==========');
    console.log('[ADDRESS-API] User from JWT:', req.user);
    console.log('[ADDRESS-API] UserId:', req.user.userId);
    console.log('[ADDRESS-API] UserId type:', typeof req.user.userId);

    try {
      const userIdObj = new Types.ObjectId(req.user.userId);
      console.log('[ADDRESS-API] Converted to ObjectId:', userIdObj);
      console.log('[ADDRESS-API] Calling addressService.getUserAddresses...');

      const addresses = await this.addressService.getUserAddresses(userIdObj);
      console.log('[ADDRESS-API] ✅ Addresses retrieved:', addresses);
      console.log('[ADDRESS-API] Number of addresses:', addresses?.length);

      const response = {
        success: true,
        data: addresses,
      };
      console.log('[ADDRESS-API] Returning formatted response:', response);
      console.log('[ADDRESS-API] ========== GET ADDRESSES COMPLETE ==========');

      return response;
    } catch (error) {
      console.error('[ADDRESS-API] ❌ ERROR in getAddresses:');
      console.error('[ADDRESS-API] Error type:', error?.constructor?.name);
      console.error('[ADDRESS-API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[ADDRESS-API] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.log('[ADDRESS-API] ========== GET ADDRESSES FAILED ==========');
      throw error;
    }
  }

  @Post('addresses')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Create a new address for logged-in member' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createAddress(
    @Request() req: AuthRequest,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    console.log('[ADDRESS-API] ========== CREATE ADDRESS REQUEST ==========');
    console.log('[ADDRESS-API] User from JWT:', req.user);
    console.log('[ADDRESS-API] UserId:', req.user.userId);
    console.log('[ADDRESS-API] UserId type:', typeof req.user.userId);
    console.log('[ADDRESS-API] Request body (DTO):', JSON.stringify(createAddressDto, null, 2));
    console.log('[ADDRESS-API] DTO fields:', {
      addressType: createAddressDto.addressType,
      addressLine1: createAddressDto.addressLine1,
      addressLine2: createAddressDto.addressLine2,
      city: createAddressDto.city,
      state: createAddressDto.state,
      pincode: createAddressDto.pincode,
      landmark: createAddressDto.landmark,
      isDefault: createAddressDto.isDefault,
    });

    try {
      console.log('[ADDRESS-API] Converting userId to ObjectId...');
      const userIdObj = new Types.ObjectId(req.user.userId);
      console.log('[ADDRESS-API] Converted userId to ObjectId:', userIdObj);
      console.log('[ADDRESS-API] ObjectId string representation:', userIdObj.toString());

      console.log('[ADDRESS-API] Calling addressService.createAddress...');
      const result = await this.addressService.createAddress(
        userIdObj,
        createAddressDto,
      );

      console.log('[ADDRESS-API] ✅ Address created successfully!');
      console.log('[ADDRESS-API] Result:', JSON.stringify(result, null, 2));

      const response = {
        success: true,
        data: result,
        message: 'Address created successfully',
      };
      console.log('[ADDRESS-API] Returning formatted response:', response);
      console.log('[ADDRESS-API] ========== CREATE ADDRESS COMPLETE ==========');

      return response;
    } catch (error) {
      console.error('[ADDRESS-API] ❌ ERROR in createAddress:');
      console.error('[ADDRESS-API] Error type:', error?.constructor?.name);
      console.error('[ADDRESS-API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[ADDRESS-API] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[ADDRESS-API] Full error object:', error);
      console.log('[ADDRESS-API] ========== CREATE ADDRESS FAILED ==========');
      throw error;
    }
  }

  @Patch('addresses/:addressId/default')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Set an address as default' })
  @ApiResponse({ status: 200, description: 'Default address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 409, description: 'Address does not belong to user' })
  setDefaultAddress(
    @Request() req: AuthRequest,
    @Param('addressId') addressId: string,
  ) {
    return this.addressService.setDefaultAddress(
      new Types.ObjectId(req.user.userId),
      addressId,
    );
  }

  @Delete('addresses/:addressId')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 409, description: 'Address does not belong to user' })
  deleteAddress(
    @Request() req: AuthRequest,
    @Param('addressId') addressId: string,
  ) {
    return this.addressService.deleteAddress(
      new Types.ObjectId(req.user.userId),
      addressId,
    );
  }
}