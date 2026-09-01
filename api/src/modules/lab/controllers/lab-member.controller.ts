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
  ForbiddenException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiQuery } from '@nestjs/swagger';
import { streamStoredFile } from '../../../common/helpers/stored-file.helper';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { SubmitExistingPrescriptionDto } from '../dto/submit-existing-prescription.dto';
import { CancelLabPrescriptionDto } from '../dto/cancel-lab-prescription.dto';
import { CancelledBy } from '../schemas/lab-prescription.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { FamilyAccessHelper } from '@/common/helpers/family-access.helper';

@Controller('member/lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER)
export class LabMemberController {
  constructor(
    private readonly prescriptionService: LabPrescriptionService,
    private readonly cartService: LabCartService,
    private readonly vendorService: LabVendorService,
    private readonly orderService: LabOrderService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
    @Body() dto: SubmitExistingPrescriptionDto,
  ) {
    console.log('[LAB CONTROLLER] Received DTO:', JSON.stringify(dto, null, 2));
    console.log('[LAB CONTROLLER] prescriptionType field:', dto.prescriptionType);

    const userId = new Types.ObjectId(req.user.userId);

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
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User ID to fetch prescriptions for (family access verification applies)' })
  async getPrescriptions(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const requestingUserId = req.user.userId;

    // Determine target user ID
    const targetUserId = userId || requestingUserId;

    // Verify family access if viewing another user's data
    if (userId) {
      await FamilyAccessHelper.verifyFamilyAccess(
        this.userModel,
        requestingUserId,
        targetUserId,
      );
    }

    const targetUserObjectId = new Types.ObjectId(targetUserId);
    const prescriptions = await this.prescriptionService.getUserPrescriptions(targetUserObjectId);

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

  @Post('prescriptions/:id/cancel')
  async cancelPrescription(
    @Param('id') prescriptionId: string,
    @Body() cancelDto: CancelLabPrescriptionDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    // Get prescription and verify ownership
    const prescription = await this.prescriptionService.getPrescriptionById(prescriptionId);

    if (prescription.userId.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own prescriptions');
    }

    const cancelledPrescription = await this.prescriptionService.cancelPrescription(
      prescriptionId,
      cancelDto.reason,
      CancelledBy.MEMBER,
    );

    return {
      success: true,
      message: 'Prescription cancelled successfully',
      data: cancelledPrescription,
    };
  }

  // ============ CART APIS ============

  @Get('carts')
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User ID to fetch carts for (family access verification applies)' })
  async getCarts(@Request() req: any, @Query('userId') userId?: string) {
    const requestingUserId = req.user.userId;

    // Determine target user ID
    const targetUserId = userId || requestingUserId;

    // Verify family access if viewing another user's data
    if (userId) {
      await FamilyAccessHelper.verifyFamilyAccess(
        this.userModel,
        requestingUserId,
        targetUserId,
      );
    }

    const targetUserObjectId = new Types.ObjectId(targetUserId);
    const carts = await this.cartService.getUserCarts(targetUserObjectId);

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
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User ID to fetch orders for (family access verification applies)' })
  async getUserOrders(@Request() req: any, @Query('userId') userId?: string) {
    const requestingUserId = req.user.userId;

    // Determine target user ID
    const targetUserId = userId || requestingUserId;

    // Verify family access if viewing another user's data
    if (userId) {
      await FamilyAccessHelper.verifyFamilyAccess(
        this.userModel,
        requestingUserId,
        targetUserId,
      );
    }

    const targetUserObjectId = new Types.ObjectId(targetUserId);
    const orders = await this.orderService.getUserOrders(targetUserObjectId);

    return {
      success: true,
      data: orders,
    };
  }

  @Get('orders/:orderId')
  async getOrderById(@Param('orderId') orderId: string, @Request() req: any) {
    const order = await this.orderService.getOrderById(orderId);

    // This took no userId, so any authenticated member could read any other
    // member's order — the tests ordered, the vendor, the amounts. Same check
    // `cancelPrescription` above already makes.
    if (order.userId.toString() !== req.user.userId) {
      throw new ForbiddenException('This order belongs to another member');
    }

    return {
      success: true,
      data: order,
    };
  }

  /**
   * Serves one report file — patient-flows flow 7, step 15, pathology side.
   *
   * Lab orders carry `reports` in the order payload already, so no list
   * endpoint is needed; what was missing was any way to open one. Radiology has
   * the same route on `member/diagnostics`.
   *
   * The report is addressed by its own `_id` and the path comes off that
   * record, never off the URL. See `streamStoredFile`.
   */
  @Get('orders/:orderId/reports/:reportId/download')
  async downloadReport(
    @Param('orderId') orderId: string,
    @Param('reportId') reportId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const order = await this.orderService.getOrderById(orderId);

    if (order.userId.toString() !== req.user.userId) {
      throw new ForbiddenException('This order belongs to another member');
    }

    const report = ((order as any).reports ?? []).find(
      (item: any) => item?._id?.toString() === reportId,
    );

    if (!report) {
      throw new NotFoundException('Report not found on this order');
    }

    streamStoredFile(res, report, 'lab-reports', 'Report file is missing');
  }
}
