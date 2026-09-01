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
  Res,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response } from 'express';
import { streamStoredFile } from '../../../common/helpers/stored-file.helper';
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
import { User, UserDocument } from '../../users/schemas/user.schema';
import { FamilyAccessHelper } from '@/common/helpers/family-access.helper';

@Controller('member/ahc')
@UseGuards(AuthGuard('jwt'))
export class AhcMemberController {
  /**
   * Whether `userId` owns this order.
   *
   * `getOrderByOrderId` does `.populate('userId', 'name phone')`, so `userId`
   * comes back as a DOCUMENT, not an id. The three call sites below all did
   * `order.userId.toString() !== userId`, which stringifies that document to
   * "[object Object]" and is therefore ALWAYS true — every member was refused
   * their own order, their own lab report and their own diagnostic report.
   *
   * Fixed here rather than by dropping the populate: `getOrderByOrderId` has
   * ten-plus callers, including the ops portal, which needs the populated name
   * and phone to display.
   */
  private ownedBy(order: { userId: unknown }, userId: string): boolean {
    const owner = order.userId as { _id?: unknown } | null;
    const ownerId = owner && typeof owner === 'object' && '_id' in owner ? owner._id : owner;
    return String(ownerId) === String(userId);
  }

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
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    /*
     * These were six `null`s behind a "TODO: Inject dependencies when module is
     * updated". The module HAS since been updated — every one of them is already
     * on the constructor above and used by other handlers in this same file
     * (`checkEligibility` passes `this.assignmentsService`, for instance). The
     * TODO outlived the work it described, and the nulls made this endpoint
     * throw a TypeError at `ahcPackageService.getPackageById()` for every
     * request that got past validation.
     *
     * `CopayCalculator` is a static utility, not an injectable — that is how
     * diagnostics and lab use it too.
     */
    const validation = await this.ahcOrderService.validateOrder(
      userId,
      validateDto,
      this.ahcPackageService,
      this.labVendorService,
      this.diagnosticVendorService,
      this.assignmentsService,
      this.planConfigService,
      CopayCalculator,
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

    // Verify family access if viewing another user's data
    if (viewingUserId) {
      await FamilyAccessHelper.verifyFamilyAccess(
        this.userModel,
        requestingUserId,
        userId,
      );
    }

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
    if (!this.ownedBy(order, userId)) {
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
    if (!this.ownedBy(order, userId)) {
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
    if (!this.ownedBy(order, userId)) {
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

  /**
   * Serves an AHC report file — patient-flows flow 8.
   *
   * The two routes above are named "download" but return JSON metadata; until
   * this existed nothing served the file, so the portal could say a report was
   * ready and offer no way to open it. These stream it.
   *
   * One route per leg, matching how the reports are stored — `labOrder.reports`
   * and `diagnosticOrder.reports` are separate arrays on the order.
   */
  @Get('reports/:orderId/lab/download')
  async downloadLabReportFile(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    await this.streamLatestReport(req, orderId, 'lab', res);
  }

  @Get('reports/:orderId/diagnostic/download')
  async downloadDiagnosticReportFile(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    await this.streamLatestReport(req, orderId, 'diagnostic', res);
  }

  /**
   * Shared by both legs. Serves the LATEST report, which is what the metadata
   * routes above already return — so the member opens the same file the screen
   * told them about, rather than a different one.
   */
  private async streamLatestReport(
    req: Request,
    orderId: string,
    leg: 'lab' | 'diagnostic',
    res: Response,
  ): Promise<void> {
    const order = await this.ahcOrderService.getOrderByOrderId(orderId);
    const userId = (req.user as any).userId;

    if (!this.ownedBy(order, userId)) {
      throw new ForbiddenException('This order belongs to another member');
    }

    const reports =
      leg === 'lab' ? order.labOrder?.reports : order.diagnosticOrder?.reports;

    if (!reports || reports.length === 0) {
      throw new NotFoundException(
        leg === 'lab' ? 'Lab report not uploaded yet' : 'Diagnostic report not uploaded yet',
      );
    }

    // Uploads are split by leg (`ahc.module.ts:48-50`), so the fallback lookup
    // has to be too — 'ahc-reports' alone would never find the file.
    streamStoredFile(
      res,
      reports[reports.length - 1],
      `ahc-reports/${leg}`,
      'Report file is missing',
    );
  }
}
