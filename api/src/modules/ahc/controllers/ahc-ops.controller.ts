import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AhcOrderService } from '../services/ahc-order.service';
import { AhcOrderStatus, CancelledBy } from '../schemas/ahc-order.schema';
import { CancelAhcOrderDto } from '../dto/cancel-ahc-order.dto';

@Controller('ops/ahc')
@UseGuards(AuthGuard('jwt'))
export class AhcOpsController {
  constructor(private readonly ahcOrderService: AhcOrderService) {}

  /**
   * GET /api/ops/ahc/orders?status={status}
   * Get all AHC orders with optional status filter
   */
  @Get('orders')
  async getAllOrders(@Query('status') status?: AhcOrderStatus) {
    const filter = status ? { status } : undefined;
    const orders = await this.ahcOrderService.getAllOrders(filter);

    // Transform orders to include vendor names, patient names, and flatten items
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      const userObj = orderObj.userId as any;

      // Extract patient name
      const patientName = userObj?.name?.fullName ||
                          `${userObj?.name?.firstName || ''} ${userObj?.name?.lastName || ''}`.trim() ||
                          'N/A';

      // Extract vendor names from nested objects
      const labVendorName = (orderObj.labOrder?.vendorId as any)?.name || orderObj.labOrder?.vendorName || 'N/A';
      const diagnosticVendorName = (orderObj.diagnosticOrder?.vendorId as any)?.name || orderObj.diagnosticOrder?.vendorName || 'N/A';

      // Flatten items arrays for operations portal
      const labItems = orderObj.labOrder?.items || [];
      const diagnosticItems = orderObj.diagnosticOrder?.items || [];
      const labReports = orderObj.labOrder?.reports || [];
      const diagnosticReports = orderObj.diagnosticOrder?.reports || [];

      return {
        ...orderObj,
        patientName,
        labVendorName,
        diagnosticVendorName,
        labItems,
        diagnosticItems,
        labReports,
        diagnosticReports,
      };
    });

    return {
      success: true,
      data: transformedOrders,
    };
  }

  /**
   * GET /api/ops/ahc/orders/:orderId
   * Get specific order details
   */
  @Get('orders/:orderId')
  async getOrderDetails(@Param('orderId') orderId: string) {
    const order = await this.ahcOrderService.getOrderByOrderId(orderId);

    return {
      success: true,
      data: order,
    };
  }

  /**
   * PATCH /api/ops/ahc/orders/:orderId/complete-collection
   * Mark collection complete (status: PLACED → CONFIRMED)
   */
  @Patch('orders/:orderId/complete-collection')
  @HttpCode(HttpStatus.OK)
  async markCollectionComplete(
    @Req() req: Request,
    @Param('orderId') orderId: string,
  ) {
    const operatorId = (req.user as any).userId;
    const operatorName = (req.user as any).name || 'Operations Team';

    const order = await this.ahcOrderService.markCollectionComplete(
      orderId,
      operatorName,
    );

    return {
      success: true,
      message: 'Collection marked as complete',
      data: order,
    };
  }

  /**
   * POST /api/ops/ahc/orders/:orderId/reports/upload
   * Upload lab and/or diagnostic reports (dual upload in single request)
   *
   * Form fields:
   * - labReport: File (optional)
   * - diagnosticReport: File (optional)
   *
   * At least one file must be provided
   */
  @Post('orders/:orderId/reports/upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'labReport', maxCount: 1 },
      { name: 'diagnosticReport', maxCount: 1 },
    ]),
  )
  @HttpCode(HttpStatus.OK)
  async uploadReports(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @UploadedFiles()
    files: {
      labReport?: Express.Multer.File[];
      diagnosticReport?: Express.Multer.File[];
    },
  ) {
    const operatorId = (req.user as any).userId;
    const operatorName = (req.user as any).name || 'Operations Team';

    // Validate that at least one file was uploaded
    const hasLabReport = files?.labReport && files.labReport.length > 0;
    const hasDiagnosticReport =
      files?.diagnosticReport && files.diagnosticReport.length > 0;

    if (!hasLabReport && !hasDiagnosticReport) {
      return {
        success: false,
        error: 'At least one report (lab or diagnostic) must be uploaded',
      };
    }

    // Upload both reports in single operation
    const labFile = hasLabReport && files.labReport ? files.labReport[0] : undefined;
    const diagnosticFile = hasDiagnosticReport && files.diagnosticReport
      ? files.diagnosticReport[0]
      : undefined;

    const order = await this.ahcOrderService.uploadBothReports(
      orderId,
      labFile,
      diagnosticFile,
      operatorName,
    );

    return {
      success: true,
      message: 'Reports uploaded successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        labReportUploaded: order.labOrder.reports.length > 0,
        diagnosticReportUploaded: order.diagnosticOrder.reports.length > 0,
        completedAt: order.completedAt,
      },
    };
  }

  /**
   * POST /api/ops/ahc/orders/:orderId/reports/upload-lab
   * Upload only lab report (alternative endpoint)
   */
  @Post('orders/:orderId/reports/upload-lab')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'labReport', maxCount: 1 }]))
  @HttpCode(HttpStatus.OK)
  async uploadLabReport(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @UploadedFiles() files: { labReport?: Express.Multer.File[] },
  ) {
    const operatorName = (req.user as any).name || 'Operations Team';

    if (!files?.labReport || files.labReport.length === 0) {
      return {
        success: false,
        error: 'Lab report file is required',
      };
    }

    const order = await this.ahcOrderService.uploadLabReport(
      orderId,
      files.labReport[0],
      operatorName,
    );

    return {
      success: true,
      message: 'Lab report uploaded successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        labReportUploaded: true,
        completedAt: order.completedAt,
      },
    };
  }

  /**
   * POST /api/ops/ahc/orders/:orderId/reports/upload-diagnostic
   * Upload only diagnostic report (alternative endpoint)
   */
  @Post('orders/:orderId/reports/upload-diagnostic')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'diagnosticReport', maxCount: 1 }]),
  )
  @HttpCode(HttpStatus.OK)
  async uploadDiagnosticReport(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @UploadedFiles() files: { diagnosticReport?: Express.Multer.File[] },
  ) {
    const operatorName = (req.user as any).name || 'Operations Team';

    if (!files?.diagnosticReport || files.diagnosticReport.length === 0) {
      return {
        success: false,
        error: 'Diagnostic report file is required',
      };
    }

    const order = await this.ahcOrderService.uploadDiagnosticReport(
      orderId,
      files.diagnosticReport[0],
      operatorName,
    );

    return {
      success: true,
      message: 'Diagnostic report uploaded successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        diagnosticReportUploaded: true,
        completedAt: order.completedAt,
      },
    };
  }

  /**
   * POST /api/ops/ahc/orders/:orderId/cancel
   * Cancel order with reason
   */
  @Post('orders/:orderId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() cancelDto: CancelAhcOrderDto,
  ) {
    const order = await this.ahcOrderService.cancelOrder(
      orderId,
      cancelDto.reason,
      CancelledBy.OPERATIONS,
    );

    return {
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason,
      },
    };
  }

  /**
   * PATCH /api/ops/ahc/orders/:orderId/status
   * Update order status (manual override)
   */
  @Patch('orders/:orderId/status')
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: { status: AhcOrderStatus },
  ) {
    const operatorName = (req.user as any).name || 'Operations Team';

    const order = await this.ahcOrderService.updateOrderStatus(
      orderId,
      body.status,
      operatorName,
    );

    return {
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
      },
    };
  }
}
