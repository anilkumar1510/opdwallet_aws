import { Controller, Get, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from './wallet.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

interface AuthRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get('transactions')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get wallet transactions for logged-in member or family member' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User ID to fetch transactions for (must be in same family)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return (default: 15)' })
  @ApiResponse({ status: 200, description: 'Transactions fetched successfully' })
  async getTransactions(
    @Request() req: AuthRequest,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string
  ) {
    const targetUserId = userId || req.user.userId;
    const limitNum = limit ? parseInt(limit) : 15;

    // Verify family access
    await this.verifyFamilyAccess(req.user.userId, targetUserId);

    const transactions = await this.walletService.getWalletTransactions(targetUserId, limitNum);

    return {
      transactions,
      total: transactions.length,
      limit: limitNum
    };
  }

  @Get('balance')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get wallet balance for logged-in member or family member' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User ID to fetch balance for (must be in same family)' })
  @ApiResponse({ status: 200, description: 'Balance fetched successfully' })
  async getBalance(
    @Request() req: AuthRequest,
    @Query('userId') userId?: string
  ) {
    const targetUserId = userId || req.user.userId;

    // Verify family access
    await this.verifyFamilyAccess(req.user.userId, targetUserId);

    const wallet = await this.walletService.getUserWallet(targetUserId);
    const formattedWallet = this.walletService.formatWalletForFrontend(wallet);

    return formattedWallet;
  }

  private async verifyFamilyAccess(requestingUserId: string, targetUserId: string): Promise<void> {
    // If requesting own data, no verification needed
    if (requestingUserId === targetUserId) {
      return;
    }

    // Get requesting user
    const requestingUser = await this.userModel.findById(requestingUserId).select('relationship memberId');
    if (!requestingUser) {
      throw new ForbiddenException('User not found');
    }

    // Build list of allowed user IDs (self + dependents if primary member)
    const allowedUserIds: string[] = [requestingUserId];

    // If primary member (REL001 or legacy 'SELF'), they can access their dependents
    const isPrimaryMember = (requestingUser.relationship as string) === 'REL001' ||
                            (requestingUser.relationship as string) === 'SELF';

    if (isPrimaryMember) {
      const dependents = await this.userModel
        .find({
          primaryMemberId: requestingUser.memberId,
          relationship: { $nin: ['REL001', 'SELF'] }
        })
        .select('_id');

      allowedUserIds.push(...dependents.map(dep => (dep._id as any).toString()));
    }

    // Check if target user is in allowed list
    if (!allowedUserIds.includes(targetUserId)) {
      throw new ForbiddenException('You do not have access to this user\'s wallet');
    }
  }
}
