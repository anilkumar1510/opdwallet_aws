import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

interface AuthRequest extends Request {
  user: {
    userId: string;
    role: string;
    name?: { fullName?: string };
  };
}

@ApiTags('operations')
@Controller('ops/members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS, UserRole.SUPER_ADMIN)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get operations dashboard statistics (Operations users only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully', type: DashboardStatsDto })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.operationsService.getDashboardStats();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search members (Operations users only)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Members found successfully' })
  async searchMembers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;

    return this.operationsService.searchMembers(search, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member details with wallet and policy info (Operations users only)' })
  @ApiParam({ name: 'id', description: 'User MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Member details fetched successfully' })
  async getMemberDetails(@Param('id') id: string) {
    return this.operationsService.getMemberDetails(id);
  }

  @Post(':id/wallet/topup')
  @ApiOperation({ summary: 'Top-up member wallet (Operations users only, primary members only)' })
  @ApiParam({ name: 'id', description: 'User MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Wallet topped up successfully' })
  async topupWallet(
    @Param('id') id: string,
    @Body() topupWalletDto: TopupWalletDto,
    @Request() req: AuthRequest,
  ) {
    const processedByName = req.user.name?.fullName || 'Operations User';

    return this.operationsService.topupMemberWallet(
      id,
      topupWalletDto.amount,
      topupWalletDto.categoryCode,
      topupWalletDto.notes,
      req.user.userId,
      processedByName,
    );
  }
}
