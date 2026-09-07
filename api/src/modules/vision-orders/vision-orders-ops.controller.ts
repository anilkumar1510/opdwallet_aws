import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { VisionOrdersService } from './vision-orders.service';

/**
 * Operations' half of the vision journey.
 *
 * The partner reports what was ordered, and until an integration exists a
 * person reads it off the Lenskart Insurance Dashboard and records it here —
 * which is what the `Vision Backend` tab already describes Partner Operations
 * doing. When a callback is built it calls the same service method and nothing
 * downstream changes.
 *
 * Deliberately NOT on the member controller. The order value decides the copay
 * and how much of the member's benefit is consumed, so it must not be theirs to
 * assert about their own order.
 */
@Controller('ops/vision')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class VisionOrdersOpsController {
  constructor(private readonly service: VisionOrdersService) {}

  @Get('orders/awaiting-report')
  @ApiOperation({ summary: 'Coupons issued and still waiting on the partner to report an order' })
  async awaitingReport() {
    return { success: true, data: await this.service.awaitingReport() };
  }

  @Post('orders/:orderId/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Record the partner's reported order value; builds the cart and settles the split",
  })
  async report(
    @Param('orderId') orderId: string,
    @Body() body: { orderValue: number; partnerOrderId?: string; serviceCode?: string },
  ) {
    const order = await this.service.recordPartnerOrder(orderId, body);
    return { success: true, data: order };
  }
}
