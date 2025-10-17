import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
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
} from '@nestjs/swagger';
import {
  TransactionServiceType,
  TransactionStatus,
  PaymentMethod,
} from './schemas/transaction-summary.schema';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionSummaryController {
  constructor(
    private readonly transactionService: TransactionSummaryService,
  ) {}

  @Get()
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions fetched' })
  getUserTransactions(
    @Request() req: AuthRequest,
    @Query('serviceType') serviceType?: TransactionServiceType,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('status') status?: TransactionStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.transactionService.getUserTransactions(req.user.userId, {
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
