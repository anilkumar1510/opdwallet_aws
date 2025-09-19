import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { WalletRulesService } from './wallet-rules.service';
import { UpdateWalletRulesDto } from './dto/wallet-rules.dto';
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

@ApiTags('wallet-rules')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletRulesController {
  constructor(private readonly walletRulesService: WalletRulesService) {}

  // Admin endpoints
  @Get('admin/policies/:policyId/plan-versions/:version/wallet-rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get wallet rules for a plan version (Admin)' })
  @ApiResponse({ status: 200, description: 'Wallet rules retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Policy or plan version not found' })
  async getWalletRules(
    @Param('policyId') policyId: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    const rules = await this.walletRulesService.getWalletRules(policyId, version);
    // Return empty object instead of null to avoid JSON parse errors on frontend
    return rules || {};
  }

  @Put('admin/policies/:policyId/plan-versions/:version/wallet-rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update wallet rules for a plan version (Admin)' })
  @ApiResponse({ status: 200, description: 'Wallet rules updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or validation error' })
  @ApiResponse({ status: 403, description: 'Cannot edit published plan version' })
  @ApiResponse({ status: 404, description: 'Policy or plan version not found' })
  async updateWalletRules(
    @Param('policyId') policyId: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() dto: UpdateWalletRulesDto,
    @Request() req: AuthRequest,
  ) {
    return this.walletRulesService.updateWalletRules(
      policyId,
      version,
      dto,
      {
        ...req.user,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    );
  }

  // Member endpoints
  @Get('member/wallet-rules')
  @ApiOperation({ summary: 'Get wallet rules for current member' })
  @ApiResponse({ status: 200, description: 'Wallet rules retrieved successfully' })
  async getMemberWalletRules(
    @Request() req: AuthRequest,
  ) {
    return this.walletRulesService.getMemberWalletRules(req.user.userId);
  }
}