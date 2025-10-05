import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { LabPrescriptionService } from '../services/lab-prescription.service';
import { LabCartService } from '../services/lab-cart.service';
import { LabOrderService } from '../services/lab-order.service';
import { DigitizePrescriptionDto } from '../dto/digitize-prescription.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { PrescriptionStatus } from '../schemas/lab-prescription.schema';
import { OrderStatus } from '../schemas/lab-order.schema';

@Controller('ops/lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class LabOpsController {
  constructor(
    private readonly prescriptionService: LabPrescriptionService,
    private readonly cartService: LabCartService,
    private readonly orderService: LabOrderService,
  ) {}

  // ============ PRESCRIPTION DIGITIZATION ============

  @Get('prescriptions/queue')
  async getPrescriptionsQueue(@Query('status') status?: PrescriptionStatus) {
    const prescriptions = await this.prescriptionService.getPendingPrescriptions();

    return {
      success: true,
      data: prescriptions,
    };
  }

  @Get('prescriptions/:id')
  async getPrescriptionById(@Param('id') id: string) {
    const prescription = await this.prescriptionService.getPrescriptionById(id);

    return {
      success: true,
      data: prescription,
    };
  }

  @Post('prescriptions/:id/digitize')
  async digitizePrescription(
    @Param('id') id: string,
    @Body() digitizeDto: DigitizePrescriptionDto,
    @Request() req: any,
  ) {
    // Update prescription status
    await this.prescriptionService.updatePrescriptionStatus(
      id,
      digitizeDto.status,
      digitizeDto.delayReason,
    );

    // Create cart if status is DIGITIZED
    if (digitizeDto.status === PrescriptionStatus.DIGITIZED) {
      const prescription = await this.prescriptionService.getPrescriptionById(id);
      const opsUserId = req.user?.userId || req.user?.email || 'OPS_TEAM';

      const cart = await this.cartService.createCart(
        prescription.userId,
        {
          prescriptionId: id,
          items: digitizeDto.items,
        },
        opsUserId,
      );

      return {
        success: true,
        message: 'Prescription digitized and cart created successfully',
        data: { prescription, cart },
      };
    }

    return {
      success: true,
      message: 'Prescription status updated successfully',
    };
  }

  @Patch('prescriptions/:id/status')
  async updatePrescriptionStatus(
    @Param('id') id: string,
    @Body() body: { status: PrescriptionStatus; delayReason?: string },
  ) {
    const prescription = await this.prescriptionService.updatePrescriptionStatus(
      id,
      body.status,
      body.delayReason,
    );

    return {
      success: true,
      message: 'Prescription status updated successfully',
      data: prescription,
    };
  }

  // ============ ORDER MANAGEMENT ============

  @Get('orders')
  async getOrders(@Query('status') status?: OrderStatus) {
    const orders = await this.orderService.getAllOrders(status);

    return {
      success: true,
      data: orders,
    };
  }

  @Get('orders/:orderId')
  async getOrderById(@Param('orderId') orderId: string) {
    const order = await this.orderService.getOrderById(orderId);

    return {
      success: true,
      data: order,
    };
  }

  @Patch('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderService.updateOrderStatus(orderId, updateDto);

    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
    };
  }

  @Patch('orders/:orderId/confirm')
  async confirmOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.updateOrderStatus(orderId, {
      status: OrderStatus.CONFIRMED,
    });

    return {
      success: true,
      message: 'Order confirmed successfully',
      data: order,
    };
  }

  @Patch('orders/:orderId/collect')
  async markCollected(@Param('orderId') orderId: string) {
    const order = await this.orderService.updateOrderStatus(orderId, {
      status: OrderStatus.SAMPLE_COLLECTED,
    });

    return {
      success: true,
      message: 'Sample collection marked successfully',
      data: order,
    };
  }

  @Post('orders/:orderId/reports/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReport(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // In production, save file to disk/S3 and get URL
    const reportUrl = file.path; // or S3 URL

    const order = await this.orderService.updateOrderStatus(orderId, {
      status: OrderStatus.COMPLETED,
      reportUrl,
    });

    return {
      success: true,
      message: 'Report uploaded and order completed successfully',
      data: order,
    };
  }

  @Patch('orders/:orderId/complete')
  async completeOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.updateOrderStatus(orderId, {
      status: OrderStatus.COMPLETED,
    });

    return {
      success: true,
      message: 'Order completed successfully',
      data: order,
    };
  }
}
