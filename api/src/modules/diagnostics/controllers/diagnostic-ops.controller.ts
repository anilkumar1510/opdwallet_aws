import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { DiagnosticPrescriptionService } from '../services/diagnostic-prescription.service';
import { DiagnosticCartService, CreateDiagnosticCartDto } from '../services/diagnostic-cart.service';
import { DiagnosticOrderService } from '../services/diagnostic-order.service';
import { DiagnosticVendorService } from '../services/diagnostic-vendor.service';
import { PrescriptionStatus, CancelledBy as PrescriptionCancelledBy } from '../schemas/diagnostic-prescription.schema';
import { OrderStatus, CancelledBy } from '../schemas/diagnostic-order.schema';
import { CancelDiagnosticPrescriptionDto } from '../dto/cancel-diagnostic-prescription.dto';

@Controller('ops/diagnostics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class DiagnosticOpsController {
  constructor(
    private readonly prescriptionService: DiagnosticPrescriptionService,
    private readonly cartService: DiagnosticCartService,
    private readonly orderService: DiagnosticOrderService,
    private readonly vendorService: DiagnosticVendorService,
  ) {}

  // ============ PRESCRIPTION MANAGEMENT ============

  @Get('prescriptions/queue')
  async getPrescriptionQueue(@Query('status') status?: PrescriptionStatus) {
    let prescriptions;

    if (status) {
      prescriptions = await this.prescriptionService.findByStatus(status);
    } else {
      prescriptions = await this.prescriptionService.findByStatus(PrescriptionStatus.UPLOADED);
    }

    return {
      success: true,
      data: prescriptions,
    };
  }

  @Get('prescriptions/:id')
  async getPrescription(@Param('id') id: string) {
    const prescription = await this.prescriptionService.findOne(id);

    return {
      success: true,
      data: prescription,
    };
  }

  @Post('prescriptions/:id/eligible-vendors')
  async getEligibleVendors(
    @Param('id') id: string,
    @Body() body: { serviceIds: string[] },
  ) {
    console.log('🔍 [DIAGNOSTIC-OPS] Getting eligible vendors for prescription:', id);

    const prescription = await this.prescriptionService.findOne(id);
    const eligibleVendors = await this.vendorService.getEligibleVendors(
      body.serviceIds,
      prescription.pincode,
    );

    return {
      success: true,
      data: eligibleVendors,
    };
  }

  @Patch('prescriptions/:id/status')
  async updatePrescriptionStatus(
    @Param('id') id: string,
    @Body() body: { status: PrescriptionStatus },
    @Req() req: any,
  ) {
    const digitizedBy = req.user?.userId || req.user?.sub || 'system';
    const prescription = await this.prescriptionService.updateStatus(id, body.status, digitizedBy);

    return {
      success: true,
      message: 'Prescription status updated successfully',
      data: prescription,
    };
  }

  @Post('prescriptions/:id/delay')
  async delayPrescription(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const prescription = await this.prescriptionService.addDelay(id, body.reason);

    return {
      success: true,
      message: 'Prescription marked as delayed',
      data: prescription,
    };
  }

  @Post('prescriptions/:id/cancel')
  async cancelPrescription(
    @Param('id') prescriptionId: string,
    @Body() cancelDto: CancelDiagnosticPrescriptionDto,
    @Req() req: any,
  ) {
    const cancelledPrescription = await this.prescriptionService.cancelPrescription(
      prescriptionId,
      cancelDto.reason,
      PrescriptionCancelledBy.OPERATIONS,
    );

    return {
      success: true,
      message: 'Prescription cancelled by operations',
      data: cancelledPrescription,
    };
  }

  // ============ CART MANAGEMENT (Digitization) ============

  @Post('prescriptions/:id/digitize')
  async digitizePrescription(
    @Param('id') id: string,
    @Body() digitizeDto: { status: PrescriptionStatus; items?: any[]; selectedVendorIds?: string[]; delayReason?: string },
    @Req() req: any,
  ) {
    const createdBy = req.user?.userId || req.user?.sub || 'system';

    // Update prescription status
    await this.prescriptionService.updateStatus(id, digitizeDto.status, createdBy);

    // Create cart if status is DIGITIZED
    if (digitizeDto.status === PrescriptionStatus.DIGITIZED && digitizeDto.items) {
      // Fetch the prescription first to get MongoDB _id and userId
      const prescription = await this.prescriptionService.findOne(id);

      // Create cart with digitized items
      const cart = await this.cartService.createCart(
        prescription.userId,
        {
          prescriptionId: (prescription as unknown as { _id: any })._id.toString(),
          items: digitizeDto.items,
        },
        createdBy,
        digitizeDto.selectedVendorIds,
      );

      // Link cart to prescription (use cart's MongoDB _id, not cartId string)
      await this.prescriptionService.linkCart(id, (cart as unknown as { _id: any })._id.toString());

      return {
        success: true,
        message: 'Prescription digitized and cart created successfully',
        data: { prescription, cart },
      };
    }

    // Handle delayed status
    if (digitizeDto.status === PrescriptionStatus.DELAYED && digitizeDto.delayReason) {
      await this.prescriptionService.addDelay(id, digitizeDto.delayReason);
    }

    return {
      success: true,
      message: 'Prescription status updated successfully',
    };
  }

  @Patch('carts/:cartId/display')
  async displayCartToMember(@Param('cartId') cartId: string) {
    const cart = await this.cartService.displayToMember(cartId);

    return {
      success: true,
      message: 'Cart displayed to member successfully',
      data: cart,
    };
  }

  // ============ ORDER MANAGEMENT ============

  @Get('orders')
  async getOrders(@Query('status') status?: OrderStatus) {
    const orders = await this.orderService.findAll(status ? { status } : undefined);

    return {
      success: true,
      data: orders,
    };
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    const order = await this.orderService.findOne(id);

    return {
      success: true,
      data: order,
    };
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
    @Req() req: any,
  ) {
    const confirmedBy = req.user?.userId || req.user?.sub || 'system';
    const order = await this.orderService.updateStatus(id, body.status, confirmedBy);

    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
    };
  }

  @Patch('orders/:id/confirm')
  async confirmOrder(@Param('id') id: string, @Req() req: any) {
    const confirmedBy = req.user?.userId || req.user?.sub || 'system';
    const order = await this.orderService.updateStatus(id, OrderStatus.CONFIRMED, confirmedBy);

    return {
      success: true,
      message: 'Order confirmed successfully',
      data: order,
    };
  }

  @Patch('orders/:id/collect')
  async markCollected(@Param('id') id: string, @Req() req: any) {
    const confirmedBy = req.user?.userId || req.user?.sub || 'system';
    const order = await this.orderService.updateStatus(id, OrderStatus.SCHEDULED, confirmedBy);

    return {
      success: true,
      message: 'Service scheduled successfully',
      data: order,
    };
  }

  @Post('orders/:id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const order = await this.orderService.cancelOrder(id, body.reason, CancelledBy.OPERATIONS);

    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }

  @Post('orders/:id/report')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReport(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const uploadedBy = req.user?.userId || req.user?.sub || 'system';

    const order = await this.orderService.uploadReport(
      id,
      file.filename,
      file.originalname,
      file.path,
      uploadedBy,
    );

    return {
      success: true,
      message: 'Report uploaded successfully',
      data: order,
    };
  }
}
