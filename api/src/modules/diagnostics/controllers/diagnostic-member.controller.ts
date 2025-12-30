import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DiagnosticPrescriptionService, CreateDiagnosticPrescriptionDto } from '../services/diagnostic-prescription.service';
import { DiagnosticCartService } from '../services/diagnostic-cart.service';
import { DiagnosticOrderService, CreateDiagnosticOrderDto } from '../services/diagnostic-order.service';
import { DiagnosticVendorService } from '../services/diagnostic-vendor.service';
import { PrescriptionSource } from '../schemas/diagnostic-prescription.schema';
import { CancelledBy } from '../schemas/diagnostic-order.schema';

@Controller('member/diagnostics')
@UseGuards(JwtAuthGuard)
export class DiagnosticMemberController {
  constructor(
    private readonly prescriptionService: DiagnosticPrescriptionService,
    private readonly cartService: DiagnosticCartService,
    private readonly orderService: DiagnosticOrderService,
    private readonly vendorService: DiagnosticVendorService,
  ) {}

  // ============ PRESCRIPTION UPLOAD ============

  @Post('prescriptions/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPrescription(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Omit<CreateDiagnosticPrescriptionDto, 'fileName' | 'originalName' | 'fileType' | 'fileSize' | 'filePath'>,
    @Req() req: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const userId = req.user?.userId || req.user?.sub;

    const prescription = await this.prescriptionService.create({
      ...body,
      userId,
      fileName: file.filename,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      source: PrescriptionSource.UPLOAD,
    });

    return {
      success: true,
      message: 'Prescription uploaded successfully',
      data: prescription,
    };
  }

  @Post('prescriptions/submit-existing')
  async submitExistingPrescription(
    @Body() body: {
      healthRecordId: string;
      patientId: string;
      patientName: string;
      patientRelationship: string;
      pincode: string;
      prescriptionDate: Date;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || req.user?.sub;

    // Create a prescription record linking to health record
    const prescription = await this.prescriptionService.create({
      userId,
      patientId: body.patientId,
      patientName: body.patientName,
      patientRelationship: body.patientRelationship,
      pincode: body.pincode,
      prescriptionDate: body.prescriptionDate,
      fileName: `health-record-${body.healthRecordId}`,
      originalName: 'From Health Records',
      fileType: 'application/pdf',
      fileSize: 0,
      filePath: `/health-records/${body.healthRecordId}`,
      source: PrescriptionSource.HEALTH_RECORD,
      healthRecordId: body.healthRecordId,
    });

    return {
      success: true,
      message: 'Prescription submitted for digitization',
      data: prescription,
    };
  }

  @Get('prescriptions')
  async getMyPrescriptions(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const prescriptions = await this.prescriptionService.findByUserId(userId);

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

  // ============ CART MANAGEMENT ============

  @Get('carts')
  async getMyCarts(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const carts = await this.cartService.findByUserId(userId);

    return {
      success: true,
      data: carts,
    };
  }

  @Get('carts/:cartId')
  async getCart(@Param('cartId') cartId: string) {
    const cart = await this.cartService.findOne(cartId);

    return {
      success: true,
      data: cart,
    };
  }

  @Get('carts/:cartId/vendors/:vendorId/pricing')
  async getVendorPricingForCart(
    @Param('cartId') cartId: string,
    @Param('vendorId') vendorId: string,
  ) {
    const cart = await this.cartService.findOne(cartId);
    const pricing = await this.vendorService.getVendorPricing(vendorId);

    // Filter pricing to only cart items
    const cartServiceIds = cart.items.map((item) => item.serviceId.toString());
    const relevantPricing = pricing.filter((p: any) =>
      cartServiceIds.includes(p.serviceId.toString()),
    );

    return {
      success: true,
      data: relevantPricing,
    };
  }

  @Get('vendors/:vendorId/slots')
  async getVendorSlots(
    @Param('vendorId') vendorId: string,
    @Body() body: { pincode: string; date: string },
  ) {
    const slots = await this.vendorService.getAvailableSlots(
      vendorId,
      body.pincode,
      body.date,
    );

    return {
      success: true,
      data: slots,
    };
  }

  // ============ ORDER MANAGEMENT ============

  @Post('orders')
  async createOrder(
    @Body() createDto: Omit<CreateDiagnosticOrderDto, 'userId'>,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || req.user?.sub;

    const order = await this.orderService.create({
      ...createDto,
      userId,
    });

    // Link order to cart
    await this.cartService.linkOrder(createDto.cartId, order.orderId);

    // Book the slot if provided
    if (createDto.slotId) {
      await this.vendorService.bookSlot(createDto.slotId);
    }

    return {
      success: true,
      message: 'Order placed successfully',
      data: order,
    };
  }

  @Get('orders')
  async getMyOrders(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const orders = await this.orderService.findByUserId(userId);

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

  @Post('orders/:id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const order = await this.orderService.cancelOrder(id, body.reason, CancelledBy.MEMBER);

    // Release the slot if it was booked
    if (order.slotId) {
      await this.vendorService.releaseSlot(order.slotId.toString());
    }

    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }

  @Get('orders/:id/reports')
  async getOrderReports(@Param('id') id: string) {
    const order = await this.orderService.findOne(id);

    return {
      success: true,
      data: order.reports,
    };
  }
}
