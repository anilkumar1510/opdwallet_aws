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
    @Body() createPaymentDto: any,  // Use any to handle frontend payload
  ) {
    console.log('🔵 [PAYMENT CONTROLLER] POST /payments - Creating payment');
    console.log('🔵 [PAYMENT CONTROLLER] Request body:', JSON.stringify(createPaymentDto, null, 2));
    console.log('🔵 [PAYMENT CONTROLLER] User:', req.user?.email, req.user?.userId);

    try {
      // Use the userId from the authenticated user
      const userId = req.user.userId;

      // Map frontend fields to backend expectations
      let paymentType = createPaymentDto.paymentType;
      if (!Object.values(PaymentType).includes(paymentType)) {
        // Default to COPAY if invalid type
        paymentType = PaymentType.COPAY;
      }

      // Map frontend service types to backend enum
      let serviceType: ServiceType;
      const frontendServiceType = createPaymentDto.serviceType as string;

      if (frontendServiceType === 'ONLINE_CONSULTATION' ||
          frontendServiceType === 'consultation' ||
          frontendServiceType === 'APPOINTMENT' ||
          frontendServiceType === 'IN_CLINIC_APPOINTMENT') {
        serviceType = ServiceType.APPOINTMENT;
      } else if (frontendServiceType === 'DIAGNOSTIC') {
        serviceType = ServiceType.DIAGNOSTIC_ORDER;
      } else if (frontendServiceType === 'LAB') {
        serviceType = ServiceType.LAB_ORDER;
      } else if (frontendServiceType === 'AHC') {
        serviceType = ServiceType.AHC_ORDER;
      } else if (Object.values(ServiceType).includes(frontendServiceType as ServiceType)) {
        serviceType = frontendServiceType as ServiceType;
      } else {
        // Default to APPOINTMENT if invalid type
        serviceType = ServiceType.APPOINTMENT;
      }

      // For now, use a placeholder serviceId since the frontend doesn't always send it
      const serviceId = createPaymentDto.metadata?.serviceId ||
                       createPaymentDto.serviceId ||
                       new Types.ObjectId().toString();

      // Extract serviceReferenceId based on service type
      let serviceReferenceId = createPaymentDto.serviceReferenceId || createPaymentDto.paymentId;

      // For specific service types, extract reference from metadata
      if (!serviceReferenceId && createPaymentDto.metadata) {
        if (serviceType === ServiceType.AHC_ORDER && createPaymentDto.metadata.packageId) {
          serviceReferenceId = createPaymentDto.metadata.packageId;
        } else if (serviceType === ServiceType.LAB_ORDER && createPaymentDto.metadata.cartId) {
          serviceReferenceId = createPaymentDto.metadata.cartId;
        } else if (serviceType === ServiceType.DIAGNOSTIC_ORDER && createPaymentDto.metadata.cartId) {
          serviceReferenceId = createPaymentDto.metadata.cartId;
        }
      }

      // Fall back to generated reference if still not set
      if (!serviceReferenceId) {
        serviceReferenceId = `REF-${Date.now()}`;
      }

      const paymentData = {
        userId,
        amount: createPaymentDto.amount || 0,
        paymentType,
        serviceType,
        serviceId,
        serviceReferenceId,
        description: createPaymentDto.description || 'Payment Request',
        notes: createPaymentDto.metadata ? JSON.stringify(createPaymentDto.metadata) :
               createPaymentDto.notes || undefined,
      };

      console.log('🔵 [PAYMENT CONTROLLER] Processed payment data:', paymentData);

      const result = await this.paymentService.createPaymentRequest(paymentData);

      console.log('✅ [PAYMENT CONTROLLER] Payment created successfully:', result.paymentId);

      // Return the created payment with the frontend's expected format
      return {
        ...result.toObject ? result.toObject() : result,
        paymentId: result.paymentId,
        status: result.status || 'PENDING',
      };
    } catch (error) {
      console.error('❌ [PAYMENT CONTROLLER] Error creating payment:', error);
      console.error('❌ [PAYMENT CONTROLLER] Error stack:', error.stack);
      throw error;
    }
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
