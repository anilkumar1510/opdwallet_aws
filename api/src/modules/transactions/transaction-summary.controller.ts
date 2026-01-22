import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionSummaryService } from './transaction-summary.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  TransactionServiceType,
  TransactionStatus,
  PaymentMethod,
} from './schemas/transaction-summary.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { FamilyAccessHelper } from '@/common/helpers/family-access.helper';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionSummaryController {
  constructor(
    private readonly transactionService: TransactionSummaryService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get()
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions fetched' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User ID to fetch transactions for (family access verification applies)' })
  async getUserTransactions(
    @Request() req: AuthRequest,
    @Query('serviceType') serviceType?: TransactionServiceType,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('status') status?: TransactionStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('userId') userId?: string,
  ) {
    const requestingUserId = req.user.userId;

    // Determine target user ID
    const targetUserId = userId || requestingUserId;

    // Verify family access if viewing another user's data
    if (userId) {
      await FamilyAccessHelper.verifyFamilyAccess(
        this.userModel,
        requestingUserId,
        targetUserId,
      );
    }

    return this.transactionService.getUserTransactions(targetUserId, {
      serviceType,
      paymentMethod,
      status,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
  }

  @Get('summary')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get transaction summary statistics' })
  @ApiResponse({ status: 200, description: 'Transaction summary fetched' })
  getTransactionSummary(@Request() req: AuthRequest) {
    return this.transactionService.getTransactionSummary(req.user.userId);
  }

  @Get(':transactionId')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get transaction details by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details fetched' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransaction(@Param('transactionId') transactionId: string) {
    return this.transactionService.getTransaction(transactionId);
  }
}
