import { Controller, Get, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from './wallet.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Assignment, AssignmentDocument } from '../assignments/schemas/assignment.schema';
import { PlanConfig, PlanConfigDocument } from '../plan-config/schemas/plan-config.schema';
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
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(PlanConfig.name) private planConfigModel: Model<PlanConfigDocument>,
  ) {}

  @Get('transactions')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get wallet transactions for logged-in member or family member with filtering' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User ID to fetch transactions for (must be in same family)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return (default: 15)' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Transaction types (comma-separated): DEBIT,CREDIT,REFUND,ADJUSTMENT,INITIALIZATION' })
  @ApiQuery({ name: 'categoryCode', required: false, type: String, description: 'Category codes (comma-separated)' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Start date (ISO format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'End date (ISO format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'minAmount', required: false, type: Number, description: 'Minimum transaction amount' })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number, description: 'Maximum transaction amount' })
  @ApiQuery({ name: 'serviceType', required: false, type: String, description: 'Service types (comma-separated)' })
  @ApiQuery({ name: 'includeReversed', required: false, type: String, description: 'Include reversed transactions (true/false, default: true)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field: date or amount (default: date)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order: asc or desc (default: desc)' })
  @ApiResponse({ status: 200, description: 'Transactions fetched successfully' })
  async getTransactions(
    @Request() req: AuthRequest,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('categoryCode') categoryCode?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('serviceType') serviceType?: string,
    @Query('includeReversed') includeReversed?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string
  ) {
    const targetUserId = userId || req.user.userId;
    const limitNum = limit ? parseInt(limit) : 15;

    // Verify family access
    await this.verifyFamilyAccess(req.user.userId, targetUserId);

    // Build filters object
    const filters: any = {};

    // Parse transaction types
    if (type) {
      filters.types = type.split(',').map(t => t.trim()).filter(t => t);
    }

    // Parse category codes
    if (categoryCode) {
      filters.categoryCodes = categoryCode.split(',').map(c => c.trim()).filter(c => c);
    }

    // Parse date range
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }
    if (dateTo) {
      // Set to end of day for dateTo
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filters.dateTo = endDate;
    }

    // Parse amount range
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min) && min >= 0) {
        filters.minAmount = min;
      }
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max) && max >= 0) {
        filters.maxAmount = max;
      }
    }

    // Parse service types
    if (serviceType) {
      filters.serviceTypes = serviceType.split(',').map(s => s.trim()).filter(s => s);
    }

    // Parse includeReversed
    if (includeReversed !== undefined) {
      filters.includeReversed = includeReversed === 'true';
    }

    // Parse sort options
    if (sortBy === 'amount') {
      filters.sortBy = 'amount';
    } else {
      filters.sortBy = 'createdAt'; // default
    }

    if (sortOrder === 'asc') {
      filters.sortOrder = 'asc';
    } else {
      filters.sortOrder = 'desc'; // default
    }

    const transactions = await this.walletService.getWalletTransactions(
      targetUserId,
      filters,
      limitNum
    );

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

    // Fetch plan config for this user
    let planConfig = null;
    if (wallet && wallet.policyAssignmentId) {
      // Get assignment to find policyId
      const assignment = await this.assignmentModel
        .findById(wallet.policyAssignmentId)
        .select('policyId')
        .lean()
        .exec();

      if (assignment) {
        // Get current plan config for this policy
        planConfig = await this.planConfigModel
          .findOne({
            policyId: assignment.policyId,
            isCurrent: true,
          })
          .select('benefits wallet memberConfigs')
          .lean()
          .exec();

        // If user is a dependent, get their member-specific config
        if (planConfig && planConfig.memberConfigs) {
          const user = await this.userModel
            .findById(targetUserId)
            .select('relationship')
            .lean()
            .exec();

          if (user && user.relationship && user.relationship !== 'REL001' && user.relationship !== 'SELF') {
            const memberConfig = planConfig.memberConfigs[user.relationship as string];
            if (memberConfig && !memberConfig.inheritFromPrimary) {
              // Use member-specific config
              planConfig = {
                benefits: memberConfig.benefits || planConfig.benefits,
                wallet: memberConfig.wallet || planConfig.wallet,
              };
            }
          }
        }
      }
    }

    const formattedWallet = this.walletService.formatWalletForFrontend(wallet as any, planConfig);

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
