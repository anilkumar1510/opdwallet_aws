import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
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
import { PaymentStatus, ServiceType, PaymentType } from './schemas/payment.schema';
import { Types } from 'mongoose';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get(':paymentId')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get payment details by payment ID' })
  @ApiResponse({ status: 200, description: 'Payment details fetched' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPayment(paymentId);
  }

  @Get()
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Payment history fetched' })
  getUserPayments(
    @Request() req: AuthRequest,
    @Query('status') status?: PaymentStatus,
    @Query('serviceType') serviceType?: ServiceType,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.paymentService.getUserPayments(req.user.userId, {
      status,
      serviceType,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
  }

  @Get('summary/stats')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Get payment summary statistics' })
  @ApiResponse({ status: 200, description: 'Payment summary fetched' })
  getPaymentSummary(@Request() req: AuthRequest) {
    return this.paymentService.getPaymentSummary(req.user.userId);
  }

  @Post()
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Create a new payment request' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async createPayment(
    @Request() req: AuthRequest,
    @Body() createPaymentDto: {
      amount: number;
      paymentType: PaymentType;
      serviceType: ServiceType;
      serviceReferenceId?: string;
      description: string;
      patientId?: string;
      metadata?: Record<string, any>;
    },
  ) {
    // Use the userId from the authenticated user
    const userId = req.user.userId;

    // For now, use a placeholder serviceId since the frontend doesn't always send it
    // In production, this should be linked to actual service records
    const serviceId = createPaymentDto.metadata?.serviceId ||
                     new Types.ObjectId().toString();

    return this.paymentService.createPaymentRequest({
      userId,
      amount: createPaymentDto.amount,
      paymentType: createPaymentDto.paymentType,
      serviceType: createPaymentDto.serviceType,
      serviceId,
      serviceReferenceId: createPaymentDto.serviceReferenceId || `REF-${Date.now()}`,
      description: createPaymentDto.description,
      notes: createPaymentDto.metadata ? JSON.stringify(createPaymentDto.metadata) : undefined,
    });
  }

  @Post(':paymentId/mark-paid')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Mark payment as paid (dummy gateway)' })
  @ApiResponse({ status: 200, description: 'Payment marked as paid' })
  @ApiResponse({ status: 400, description: 'Payment already completed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  markAsPaid(
    @Param('paymentId') paymentId: string,
    @Request() req: AuthRequest,
  ) {
    return this.paymentService.markAsPaid(paymentId, req.user.userId);
  }

  @Post(':paymentId/cancel')
  @Roles(UserRole.MEMBER)
  @ApiOperation({ summary: 'Cancel a payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel payment' })
  cancelPayment(
    @Param('paymentId') paymentId: string,
    @Request() req: AuthRequest,
    @Body('reason') reason?: string,
  ) {
    return this.paymentService.cancelPayment(
      paymentId,
      req.user.userId,
      reason,
    );
  }
}
