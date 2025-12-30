import {
  Controller,
  Post,
  Get,
  Delete,
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
import { LabVendorService } from '../services/lab-vendor.service';
import { LabOrderService } from '../services/lab-order.service';
import { UploadPrescriptionDto } from '../dto/upload-prescription.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ValidateLabOrderDto } from '../dto/validate-lab-order.dto';
import { Types } from 'mongoose';

@Controller('member/lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER)
export class LabMemberController {
  constructor(
    private readonly prescriptionService: LabPrescriptionService,
    private readonly cartService: LabCartService,
    private readonly vendorService: LabVendorService,
    private readonly orderService: LabOrderService,
  ) {}

  // ============ PRESCRIPTION APIS ============

  @Post('prescriptions/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPrescription(
    @Request() req: any,
    @UploadedFile() file: any,
    @Body() uploadDto: UploadPrescriptionDto,
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
    @Request() req: any,
    @Body() body: {
      healthRecordId: string;
      patientId: string;
      patientName: string;
      patientRelationship: string;
      pincode: string;
      prescriptionDate: string;
    },
  ) {
    const userId = new Types.ObjectId(req.user.userId);

    const prescription = await this.prescriptionService.submitExistingPrescription(
      userId,
      body.healthRecordId,
      body.patientId,
      body.patientName,
      body.patientRelationship,
      body.pincode,
      new Date(body.prescriptionDate),
    );

    return {
      success: true,
      message: 'Prescription submitted for digitization',
      data: prescription,
    };
  }

  @Get('prescriptions')
  async getPrescriptions(@Request() req: any, @Query('status') status?: string) {
    const userId = new Types.ObjectId(req.user.userId);
    const prescriptions = await this.prescriptionService.getUserPrescriptions(userId);

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

  // ============ CART APIS ============

  @Get('carts')
  async getCarts(@Request() req: any) {
    const userId = new Types.ObjectId(req.user.userId);
    const carts = await this.cartService.getUserCarts(userId);

    return {
      success: true,
      data: carts,
    };
  }

  @Get('carts/active')
  async getActiveCarts(@Request() req: any) {
    const userId = new Types.ObjectId(req.user.userId);
    const carts = await this.cartService.getUserCarts(userId);

    return {
      success: true,
      data: carts,
    };
  }

  @Get('carts/:cartId')
  async getCartById(@Param('cartId') cartId: string) {
    const cart = await this.cartService.getCartById(cartId);

    return {
      success: true,
      data: cart,
    };
  }

  @Get('carts/:cartId/vendors')
  async getCartVendors(@Param('cartId') cartId: string) {
    console.log('🔍 [LAB-MEMBER] Getting vendors for cart:', cartId);

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
    const serviceIds = cart.items.map(item => item.serviceId);

    // Get vendor details with pricing for selected vendors
    const vendors = await this.vendorService.getSelectedVendorsForCart(
      cart.selectedVendorIds,
      serviceIds,
    );

    console.log('✅ [LAB-MEMBER] Found vendors:', vendors.length);

    return {
      success: true,
      data: vendors,
    };
  }

  @Delete('carts/:cartId')
  async deleteCart(@Param('cartId') cartId: string) {
    await this.cartService.deleteCart(cartId);

    return {
      success: true,
      message: 'Cart deleted successfully',
    };
  }

  // ============ VENDOR & SLOT APIS ============

  @Get('vendors/available')
  async getAvailableVendors(@Query('pincode') pincode: string) {
    const vendors = await this.vendorService.getVendorsByPincode(pincode);

    return {
      success: true,
      data: vendors,
    };
  }

  @Get('vendors/:vendorId/pricing')
  async getVendorPricing(@Param('vendorId') vendorId: string) {
    const pricing = await this.vendorService.getVendorPricing(vendorId);

    return {
      success: true,
      data: pricing,
    };
  }

  @Get('vendors/:vendorId/slots')
  async getAvailableSlots(
    @Param('vendorId') vendorId: string,
    @Query('pincode') pincode: string,
    @Query('date') date: string,
  ) {
    const slots = await this.vendorService.getAvailableSlots(vendorId, pincode, date);

    return {
      success: true,
      data: slots,
    };
  }

  // ============ ORDER APIS ============

  @Post('orders/validate')
  async validateOrder(@Request() req: any, @Body() validateDto: ValidateLabOrderDto) {
    const userId = req.user.userId;
    console.log('[LabMemberController] POST /api/member/lab/orders/validate - User:', userId);
    return this.orderService.validateOrder(userId, validateDto);
  }

  @Post('orders')
  async createOrder(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    const userId = new Types.ObjectId(req.user.userId);
    const order = await this.orderService.createOrder(userId, createOrderDto);

    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }

  @Get('orders')
  async getUserOrders(@Request() req: any) {
    const userId = new Types.ObjectId(req.user.userId);
    const orders = await this.orderService.getUserOrders(userId);

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
}
