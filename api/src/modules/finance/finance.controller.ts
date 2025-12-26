import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CompletePaymentDto } from './dto/complete-payment.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { UserRole } from '@/common/constants/roles.enum';

@ApiTags('Finance')
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('claims/pending')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending payments (approved claims awaiting payment)' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'sortBy', type: String, required: false, example: 'approvedAt' })
  @ApiResponse({ status: 200, description: 'Pending payments retrieved successfully' })
  async getPendingPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.financeService.getPendingPayments(
      page ? +page : 1,
      limit ? +limit : 10,
      sortBy || 'approvedAt',
    );
  }

  @Get('claims/:claimId')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get claim details for payment processing' })
  @ApiResponse({ status: 200, description: 'Claim retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 400, description: 'Claim not approved for payment' })
  async getClaimForPayment(@Param('claimId') claimId: string) {
    return this.financeService.getClaimForPayment(claimId);
  }

  @Post('claims/:claimId/complete-payment')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete payment for approved claim' })
  @ApiResponse({ status: 200, description: 'Payment completed successfully' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  @ApiResponse({ status: 400, description: 'Invalid payment data or claim not approved' })
  async completePayment(
    @Param('claimId') claimId: string,
    @Body() completePaymentDto: CompletePaymentDto,
    @Request() req: any,
  ) {
    const financeUserName = req.user.name?.fullName || `${req.user.name?.firstName} ${req.user.name?.lastName}`;
    return this.financeService.completePayment(
      claimId,
      completePaymentDto,
      req.user.userId,
      financeUserName,
    );
  }

  @Get('payments/history')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get payment history' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'fromDate', type: Date, required: false })
  @ApiQuery({ name: 'toDate', type: Date, required: false })
  @ApiQuery({ name: 'paymentMode', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('paymentMode') paymentMode?: string,
  ) {
    return this.financeService.getPaymentHistory(
      page ? +page : 1,
      limit ? +limit : 10,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
      paymentMode,
    );
  }

  @Get('analytics/summary')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get finance analytics summary' })
  @ApiQuery({ name: 'fromDate', type: Date, required: false })
  @ApiQuery({ name: 'toDate', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'Finance analytics retrieved successfully' })
  async getFinanceAnalyticsSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.financeService.getFinanceAnalyticsSummary(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }
}
