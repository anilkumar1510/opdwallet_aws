import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DiagnosticPrescriptionService, CreateDiagnosticPrescriptionDto } from '../services/diagnostic-prescription.service';
import { DiagnosticCartService } from '../services/diagnostic-cart.service';
import { DiagnosticOrderService, CreateDiagnosticOrderDto } from '../services/diagnostic-order.service';
import { DiagnosticVendorService } from '../services/diagnostic-vendor.service';
import { PrescriptionSource, CancelledBy as PrescriptionCancelledBy } from '../schemas/diagnostic-prescription.schema';
import { ValidateDiagnosticOrderDto } from '../dto/validate-diagnostic-order.dto';
import { CancelledBy } from '../schemas/diagnostic-order.schema';
import { UploadDiagnosticPrescriptionDto } from '../dto/upload-diagnostic-prescription.dto';
import { SubmitExistingDiagnosticPrescriptionDto } from '../dto/submit-existing-prescription.dto';
import { CancelDiagnosticPrescriptionDto } from '../dto/cancel-diagnostic-prescription.dto';

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
    @Request() req: any,
    @UploadedFile() file: any,
    @Body() uploadDto: UploadDiagnosticPrescriptionDto,
  ) {
    const userId = new Types.ObjectId(req.user.userId);

    const prescription = await this.prescriptionService.uploadPrescription(
      userId,
      uploadDto,
      file,
    );

    return {
      success: true,
      message: 'Prescription uploaded successfully',
      data: prescription,
    };
  }

  @Post('prescriptions/submit-existing')
  async submitExistingPrescription(
    @Body() dto: SubmitExistingDiagnosticPrescriptionDto,
    @Req() req: any,
  ) {
    const userId = new Types.ObjectId(req.user?.userId || req.user?.sub);

    const prescription = await this.prescriptionService.submitExistingPrescription(
      userId,
      dto.healthRecordId,
      dto.prescriptionType as 'DIGITAL' | 'PDF',
      dto.patientId,
      dto.patientName,
      dto.patientRelationship,
      dto.pincode,
      new Date(dto.prescriptionDate),
    );

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

  @Post('prescriptions/:id/cancel')
  async cancelPrescription(
    @Param('id') prescriptionId: string,
    @Body() cancelDto: CancelDiagnosticPrescriptionDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    // Get prescription and verify ownership
    const prescription = await this.prescriptionService.findOne(prescriptionId);

    if (prescription.userId.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own prescriptions');
    }

    const cancelledPrescription = await this.prescriptionService.cancelPrescription(
      prescriptionId,
      cancelDto.reason,
      PrescriptionCancelledBy.MEMBER,
    );

    return {
      success: true,
      message: 'Prescription cancelled successfully',
      data: cancelledPrescription,
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

  @Get('carts/:cartId/vendors')
  async getCartVendors(@Param('cartId') cartId: string) {
    // Get cart to access selectedVendorIds and items
    const cart = await this.cartService.getCartById(cartId);

    if (!cart.selectedVendorIds || cart.selectedVendorIds.length === 0) {
      return {
        success: true,
        message: 'No vendors selected for this cart yet',
        data: [],
      };
    }

    // Extract service IDs from cart items
    const serviceIds = cart.items.map((item) => item.serviceId);

    // Get vendor details with pricing for selected vendors
    const vendors = await this.vendorService.getSelectedVendorsForCart(
      cart.selectedVendorIds,
      serviceIds,
    );

    return {
      success: true,
      data: vendors,
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
    @Query('pincode') pincode: string,
    @Query('date') date: string,
  ) {
    const slots = await this.vendorService.getAvailableSlots(
      vendorId,
      pincode,
      date,
    );

    return {
      success: true,
      data: slots,
    };
  }

  // ============ ORDER MANAGEMENT ============

  @Post('orders/validate')
  async validateOrder(@Request() req: any, @Body() validateDto: ValidateDiagnosticOrderDto) {
    const userId = req.user.userId;
    console.log('[DiagnosticMemberController] POST /api/member/diagnostics/orders/validate - User:', userId);
    return this.orderService.validateOrder(userId, validateDto);
  }

  @Post('orders')
  async createOrder(
    @Body() createDto: Omit<CreateDiagnosticOrderDto, 'userId'>,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || req.user?.sub;

    // Service handles all the fetching and transformations
    const order = await this.orderService.create({
      ...createDto,
      userId,
    });

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
