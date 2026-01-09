import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AhcPackageMemberService } from '../services/ahc-package-member.service';
import { AhcPackageService } from '../services/ahc-package.service';
import { AhcOrderService } from '../services/ahc-order.service';
import { CreateAhcOrderDto } from '../dto/create-ahc-order.dto';
import { ValidateAhcOrderDto } from '../dto/validate-ahc-order.dto';
import { AssignmentsService } from '../../assignments/assignments.service';
import { PlanConfigService } from '../../plan-config/plan-config.service';
import { LabVendorService } from '../../lab/services/lab-vendor.service';
import { DiagnosticVendorService } from '../../diagnostics/services/diagnostic-vendor.service';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionSummaryService } from '../../transactions/transaction-summary.service';
import { LabService } from '../../lab/schemas/lab-service.schema';
import { DiagnosticService } from '../../diagnostics/schemas/diagnostic-service.schema';
import { LabVendorSlot } from '../../lab/schemas/lab-vendor-slot.schema';
import { DiagnosticVendorSlot } from '../../diagnostics/schemas/diagnostic-vendor-slot.schema';
import { CopayCalculator } from '../../plan-config/utils/copay-calculator';

@Controller('member/ahc')
@UseGuards(AuthGuard('jwt'))
export class AhcMemberController {
  constructor(
    private readonly ahcPackageMemberService: AhcPackageMemberService,
    private readonly ahcPackageService: AhcPackageService,
    private readonly ahcOrderService: AhcOrderService,
    private readonly assignmentsService: AssignmentsService,
    private readonly planConfigService: PlanConfigService,
    private readonly labVendorService: LabVendorService,
    private readonly diagnosticVendorService: DiagnosticVendorService,
    private readonly walletService: WalletService,
    private readonly transactionSummaryService: TransactionSummaryService,
    @InjectModel(LabService.name) private labServiceModel: Model<LabService>,
    @InjectModel(DiagnosticService.name) private diagnosticServiceModel: Model<DiagnosticService>,
    @InjectModel(LabVendorSlot.name) private labSlotModel: Model<LabVendorSlot>,
    @InjectModel(DiagnosticVendorSlot.name) private diagnosticSlotModel: Model<DiagnosticVendorSlot>,
  ) {}

  /**
   * GET /api/member/ahc/package
   * Get AHC package assigned to member's policy
   */
  @Get('package')
  async getPackage(@Req() req: Request) {
    const userId = (req.user as any).userId;

    const packageData = await this.ahcPackageMemberService.getUserAhcPackage(
      userId,
      this.assignmentsService,
      this.planConfigService,
      this.labServiceModel,
      this.diagnosticServiceModel,
    );

    return {
      success: true,
      data: packageData,
    };
  }

  /**
   * GET /api/member/ahc/eligibility
   * Check if member can book AHC this policy year
   */
  @Get('eligibility')
  async checkEligibility(@Req() req: Request) {
    const userId = (req.user as any).userId;

    const eligibility = await this.ahcOrderService.checkEligibility(
      userId,
      this.assignmentsService,
    );

    return {
      success: true,
      data: eligibility,
    };
  }

  /**
   * GET /api/member/ahc/vendors/lab?pincode={pincode}
   * Get eligible lab vendors for AHC package
   */
  @Get('vendors/lab')
  async getEligibleLabVendors(
    @Req() req: Request,
    @Query('pincode') pincode: string,
  ) {
    const userId = (req.user as any).userId;

    if (!pincode) {
      return {
        success: false,
        error: 'Pincode is required',
      };
    }

    const vendors = await this.ahcPackageMemberService.getEligibleLabVendors(
      userId,
      pincode,
      this.assignmentsService,
      this.planConfigService,
      this.labVendorService,
      this.labServiceModel,
    );

    return {
      success: true,
      data: vendors,
    };
  }

  /**
   * GET /api/member/ahc/vendors/diagnostic?pincode={pincode}
   * Get eligible diagnostic vendors for AHC package
   */
  @Get('vendors/diagnostic')
  async getEligibleDiagnosticVendors(
    @Req() req: Request,
    @Query('pincode') pincode: string,
  ) {
    const userId = (req.user as any).userId;

    if (!pincode) {
      return {
        success: false,
        error: 'Pincode is required',
      };
    }

    const vendors = await this.ahcPackageMemberService.getEligibleDiagnosticVendors(
      userId,
      pincode,
      this.assignmentsService,
      this.planConfigService,
      this.diagnosticVendorService,
      this.diagnosticServiceModel,
    );

    return {
      success: true,
      data: vendors,
    };
  }

  /**
   * GET /api/member/ahc/vendors/lab/:vendorId/slots?pincode={pincode}&date={date}
   * Get available lab slots (reuse existing lab slot endpoint)
   * NOTE: This endpoint delegates to existing LabController
   */
  // Implementation: Reuse existing /api/member/lab/vendors/:vendorId/slots endpoint

  /**
   * GET /api/member/ahc/vendors/diagnostic/:vendorId/slots?pincode={pincode}&date={date}
   * Get available diagnostic slots (reuse existing diagnostic slot endpoint)
   * NOTE: This endpoint delegates to existing DiagnosticController
   */
  // Implementation: Reuse existing /api/member/diagnostics/vendors/:vendorId/slots endpoint

  /**
   * POST /api/member/ahc/orders/validate
   * Validate order and calculate payment breakdown
   */
  @Post('orders/validate')
  @HttpCode(HttpStatus.OK)
  async validateOrder(
    @Req() req: Request,
    @Body() validateDto: ValidateAhcOrderDto,
  ) {
    const userId = (req.user as any).userId;

    // TODO: Inject dependencies when module is updated
    const ahcPackageService = null; // AhcPackageService
    const labVendorService = null; // this.labVendorService
    const diagnosticVendorService = null; // this.diagnosticVendorService
    const assignmentsService = null; // this.assignmentsService
    const planConfigService = null; // this.planConfigService
    const copayCalculator = null; // this.copayCalculator

    const validation = await this.ahcOrderService.validateOrder(
      userId,
      validateDto,
      ahcPackageService,
      labVendorService,
      diagnosticVendorService,
      assignmentsService,
      planConfigService,
      copayCalculator,
    );

    return {
      success: true,
      data: validation,
    };
  }

  /**
   * POST /api/member/ahc/orders
   * Create AHC order (called after payment success)
   */
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Req() req: Request,
    @Body() createDto: CreateAhcOrderDto,
  ) {
    const userId = (req.user as any).userId;

    // Create slot service wrappers
    const labSlotService = {
      bookSlot: async (slotId: string) => {
        await this.labSlotModel.updateOne(
          { slotId },
          { $set: { isBooked: true, bookedAt: new Date() } }
        );
      }
    };

    const diagnosticSlotService = {
      bookSlot: async (slotId: string) => {
        await this.diagnosticSlotModel.updateOne(
          { slotId },
          { $set: { isBooked: true, bookedAt: new Date() } }
        );
      }
    };

    const order = await this.ahcOrderService.createOrder(
      userId,
      createDto,
      this.ahcPackageService,
      this.labVendorService,
      this.diagnosticVendorService,
      labSlotService,
      diagnosticSlotService,
      this.assignmentsService,
      this.planConfigService,
      this.walletService,
      this.transactionSummaryService,
      CopayCalculator,
    );

    return {
      success: true,
      message: 'AHC order created successfully',
      data: order,
    };
  }

  /**
   * GET /api/member/ahc/orders
   * Get member's AHC orders
   * Query param: userId (supports viewingUserId for family members)
   */
  @Get('orders')
  async getUserOrders(
    @Req() req: Request,
    @Query('userId') viewingUserId?: string,
  ) {
    const requestingUserId = (req.user as any).userId;
    const userId = viewingUserId || requestingUserId;

    const orders = await this.ahcOrderService.getUserOrders(userId);

    // Transform orders to include patientName as string and clean up userId
    const transformedOrders = orders.map(order => {
      const orderObj = order as any;  // Already plain object from lean()
      const userObj = orderObj.userId as any;

      // Extract patient name from nested name object
      const patientName = userObj?.name?.fullName ||
                          `${userObj?.name?.firstName || ''} ${userObj?.name?.lastName || ''}`.trim() ||
                          'N/A';

      // Ensure reports arrays are properly included
      const labOrder = {
        ...orderObj.labOrder,
        reports: orderObj.labOrder?.reports || [],
      };

      const diagnosticOrder = {
        ...orderObj.diagnosticOrder,
        reports: orderObj.diagnosticOrder?.reports || [],
      };

      return {
        ...orderObj,
        userId: userObj?._id || orderObj.userId,  // Convert back to ID string
        patientName,
        labOrder,
        diagnosticOrder,
      };
    });

    return {
      success: true,
      data: transformedOrders,
    };
  }

  /**
   * GET /api/member/ahc/orders/:orderId
   * Get specific order details
   */
  @Get('orders/:orderId')
  async getOrderDetails(
    @Req() req: Request,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.ahcOrderService.getOrderByOrderId(orderId);

    // Verify user has access to this order
    const userId = (req.user as any).userId;
    if (order.userId.toString() !== userId) {
      return {
        success: false,
        error: 'Unauthorized access to order',
      };
    }

    return {
      success: true,
      data: order,
    };
  }

  /**
   * GET /api/member/ahc/reports/:orderId/lab
   * Download lab report (if uploaded)
   */
  @Get('reports/:orderId/lab')
  async downloadLabReport(
    @Req() req: Request,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.ahcOrderService.getOrderByOrderId(orderId);

    // Verify user has access
    const userId = (req.user as any).userId;
    if (order.userId.toString() !== userId) {
      return {
        success: false,
        error: 'Unauthorized access to report',
      };
    }

    if (!order.labOrder.reports || order.labOrder.reports.length === 0) {
      return {
        success: false,
        error: 'Lab report not uploaded yet',
      };
    }

    // Return latest report
    const latestReport = order.labOrder.reports[order.labOrder.reports.length - 1];

    return {
      success: true,
      data: {
        fileName: latestReport.fileName,
        originalName: latestReport.originalName,
        filePath: latestReport.filePath,
        uploadedAt: latestReport.uploadedAt,
      },
    };
  }

  /**
   * GET /api/member/ahc/reports/:orderId/diagnostic
   * Download diagnostic report (if uploaded)
   */
  @Get('reports/:orderId/diagnostic')
  async downloadDiagnosticReport(
    @Req() req: Request,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.ahcOrderService.getOrderByOrderId(orderId);

    // Verify user has access
    const userId = (req.user as any).userId;
    if (order.userId.toString() !== userId) {
      return {
        success: false,
        error: 'Unauthorized access to report',
      };
    }

    if (!order.diagnosticOrder.reports || order.diagnosticOrder.reports.length === 0) {
      return {
        success: false,
        error: 'Diagnostic report not uploaded yet',
      };
    }

    // Return latest report
    const latestReport = order.diagnosticOrder.reports[order.diagnosticOrder.reports.length - 1];

    return {
      success: true,
      data: {
        fileName: latestReport.fileName,
        originalName: latestReport.originalName,
        filePath: latestReport.filePath,
        uploadedAt: latestReport.uploadedAt,
      },
    };
  }
}
