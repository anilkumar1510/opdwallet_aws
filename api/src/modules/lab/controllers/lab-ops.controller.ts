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
import { LabVendorService } from '../services/lab-vendor.service';
import { DigitizePrescriptionDto } from '../dto/digitize-prescription.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { CancelLabPrescriptionDto } from '../dto/cancel-lab-prescription.dto';
import { PrescriptionStatus, CancelledBy } from '../schemas/lab-prescription.schema';
import { OrderStatus } from '../schemas/lab-order.schema';

@Controller('ops/lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class LabOpsController {
  constructor(
    private readonly prescriptionService: LabPrescriptionService,
    private readonly cartService: LabCartService,
    private readonly orderService: LabOrderService,
    private readonly vendorService: LabVendorService,
  ) {}

  // ============ PRESCRIPTION DIGITIZATION ============

  @Get('prescriptions/queue')
  async getPrescriptionsQueue(@Query('status') status?: PrescriptionStatus) {
    const prescriptions = status
      ? await this.prescriptionService.getPrescriptionsByStatus(status)
      : await this.prescriptionService.getPendingPrescriptions();

    return {
      success: true,
      data: prescriptions,
    };
  }

  @Get('prescriptions/:id')
  async getPrescriptionById(@Param('id') id: string, @Request() req: any) {
    console.log('🔍 [LAB-OPS] GET /ops/lab/prescriptions/:id called');
    console.log('🔍 [LAB-OPS] Prescription ID:', id);
    console.log('🔍 [LAB-OPS] User:', req.user);

    try {
      const prescription = await this.prescriptionService.getPrescriptionById(id);
      console.log('✅ [LAB-OPS] Prescription found:', prescription.prescriptionId);

      return {
        success: true,
        data: prescription,
      };
    } catch (error) {
      console.error('❌ [LAB-OPS] Error fetching prescription:', error.message);
      throw error;
    }
  }

  @Post('prescriptions/:id/eligible-vendors')
  async getEligibleVendors(
    @Param('id') id: string,
    @Body() body: { serviceIds: string[] },
  ) {
    console.log('🔍 [LAB-OPS] Getting eligible vendors for prescription:', id);

    const prescription = await this.prescriptionService.getPrescriptionById(id);
    const eligibleVendors = await this.vendorService.getEligibleVendors(
      body.serviceIds,
      prescription.pincode,
    );

    return {
      success: true,
      data: eligibleVendors,
    };
  }

  @Post('prescriptions/:id/digitize')
  async digitizePrescription(
    @Param('id') id: string,
    @Body() digitizeDto: DigitizePrescriptionDto,
    @Request() req: any,
  ) {
    console.log('🔍 [DIGITIZE] ==================== START ====================');
    console.log('🔍 [DIGITIZE] Prescription ID:', id);
    console.log('🔍 [DIGITIZE] DTO:', JSON.stringify(digitizeDto, null, 2));
    console.log('🔍 [DIGITIZE] User:', JSON.stringify(req.user, null, 2));

    try {
      // Update prescription status
      console.log('🔍 [DIGITIZE] Step 1: Updating prescription status to', digitizeDto.status);
      await this.prescriptionService.updatePrescriptionStatus(
        id,
        digitizeDto.status,
        digitizeDto.delayReason,
      );
      console.log('✅ [DIGITIZE] Prescription status updated successfully');

      // Create cart if status is DIGITIZED
      if (digitizeDto.status === PrescriptionStatus.DIGITIZED) {
        console.log('🔍 [DIGITIZE] Step 2: Fetching prescription details');
        const prescription = await this.prescriptionService.getPrescriptionById(id);
        console.log('✅ [DIGITIZE] Prescription fetched:', {
          prescriptionId: prescription.prescriptionId,
          userId: prescription.userId,
          patientName: prescription.patientName,
        });

        const opsUserId = req.user?.userId || req.user?.email || 'OPS_TEAM';
        console.log('🔍 [DIGITIZE] Step 3: Creating cart for user:', prescription.userId);
        console.log('🔍 [DIGITIZE] Cart data:', {
          userId: prescription.userId,
          prescriptionId: id,
          itemsCount: digitizeDto.items.length,
          items: digitizeDto.items,
          createdBy: opsUserId,
        });

        const cart = await this.cartService.createCart(
          prescription.userId,
          {
            prescriptionId: (prescription as unknown as { _id: any })._id.toString(),
            items: digitizeDto.items,
          },
          opsUserId,
          digitizeDto.selectedVendorIds,
        );
        console.log('✅ [DIGITIZE] Cart created successfully:', {
          cartId: cart.cartId,
          items: cart.items.length,
        });

        console.log('🔍 [DIGITIZE] ==================== SUCCESS ====================');
        return {
          success: true,
          message: 'Prescription digitized and cart created successfully',
          data: { prescription, cart },
        };
      }

      console.log('🔍 [DIGITIZE] ==================== END (NO CART) ====================');
      return {
        success: true,
        message: 'Prescription status updated successfully',
      };
    } catch (error) {
      console.error('❌ [DIGITIZE] ==================== ERROR ====================');
      console.error('❌ [DIGITIZE] Error type:', error.constructor.name);
      console.error('❌ [DIGITIZE] Error message:', error.message);
      console.error('❌ [DIGITIZE] Error stack:', error.stack);
      console.error('❌ [DIGITIZE] ==================== ERROR END ====================');
      throw error;
    }
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

  @Post('prescriptions/:id/cancel')
  async cancelPrescription(
    @Param('id') prescriptionId: string,
    @Body() cancelDto: CancelLabPrescriptionDto,
    @Request() req: any,
  ) {
    const cancelledPrescription = await this.prescriptionService.cancelPrescription(
      prescriptionId,
      cancelDto.reason,
      CancelledBy.OPERATIONS,
    );

    return {
      success: true,
      message: 'Prescription cancelled by operations',
      data: cancelledPrescription,
    };
  }

  // ============ ORDER MANAGEMENT ============

  @Get('orders')
  async getOrders(@Request() req: any, @Query('status') status?: OrderStatus) {
    console.log('🔍 [LAB-OPS] GET /ops/lab/orders called');
    console.log('🔍 [LAB-OPS] Status filter:', status);
    console.log('🔍 [LAB-OPS] User:', req.user);

    try {
      const orders = await this.orderService.getAllOrders(status);
      console.log('✅ [LAB-OPS] Orders found:', orders.length);

      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      console.error('❌ [LAB-OPS] Error fetching orders:', error.message);
      throw error;
    }
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
    @UploadedFile() file: any,
  ) {
    // Convert file path to API URL path
    // file.path can be 'uploads/lab-reports/filename.pdf' or './uploads/lab-reports/filename.pdf'
    // Convert to '/api/uploads/lab-reports/filename.pdf'
    const reportUrl = file.path.replace(/^(\.\/)?uploads\//, '/api/uploads/');

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

  @Post('orders/:orderId/cancel')
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
  ) {
    const order = await this.orderService.cancelOrder(orderId, body.reason);

    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }
}
