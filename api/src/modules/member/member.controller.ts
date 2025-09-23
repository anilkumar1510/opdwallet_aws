import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { MemberService } from './member.service';
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

@ApiTags('member')
@Controller('member')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

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
}