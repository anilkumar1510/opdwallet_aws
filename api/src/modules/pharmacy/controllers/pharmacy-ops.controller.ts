import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { PharmacyOrderService } from '../services/pharmacy-order.service';
import { PharmacyCartService } from '../services/pharmacy-cart.service';
import { PharmacyCatalogueService } from '../services/pharmacy-catalogue.service';
import { PharmacyPrescriptionService } from '../services/pharmacy-prescription.service';

/**
 * Stands in for the pharmacy partner, who does not exist as a real
 * integration. Steps 10-11 (confirmed -> processed) collapse into whatever
 * pay() already set; this is only step 12, marking delivery and raising the
 * real invoice.
 */
@Controller('ops/pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.SUPER_ADMIN)
export class PharmacyOpsController {
  constructor(
    private readonly orderService: PharmacyOrderService,
    private readonly cartService: PharmacyCartService,
    private readonly catalogue: PharmacyCatalogueService,
    private readonly prescriptions: PharmacyPrescriptionService,
  ) {}

  /** Step 4: what is waiting to be read and turned into a cart. */
  @Get('prescriptions/queue')
  async queue() {
    return { prescriptions: await this.prescriptions.queue() };
  }

  @Get('prescriptions/:prescriptionId')
  async prescription(@Param('prescriptionId') prescriptionId: string) {
    return this.prescriptions.findById(prescriptionId);
  }

  /**
   * The catalogue, for the adjudicator rather than the member.
   *
   * The sheet names a Tata 1mg catalogue and search here. There is no such
   * integration — not a line of it anywhere in this API — so this searches the
   * local medicine collection that has always stood in for it. Whoever wires
   * 1mg replaces this one call.
   */
  @Get('medicines')
  async medicines(@Param('search') _unused: string, @Request() req: any) {
    return { medicines: await this.catalogue.search(req.query?.search) };
  }

  /**
   * Step 4: build the cart on the member's behalf, and hand it to them.
   *
   * One call rather than an edit-then-push pair, because adjudication is a
   * single decision about the whole prescription: these medicines, these
   * quantities, and the member is told the moment it lands.
   */
  @Post('prescriptions/:prescriptionId/digitize')
  async digitize(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: any,
    @Body() body: { cartId: string; items: { medicineId: string; quantity: number }[] },
  ) {
    // The prescription is resolved BEFORE the cart is written: building first
    // meant a mistyped prescription id left a fully built cart behind with
    // nothing recording where it came from.
    await this.prescriptions.findById(prescriptionId);

    const cart = await this.cartService.buildCart(body.cartId, body.items ?? []);
    const prescription = await this.prescriptions.markDigitized(
      prescriptionId,
      cart.cartId,
      req.user?.userId ?? 'operations',
    );
    return { prescription, cart };
  }

  @Patch('orders/:orderId/deliver')
  async markDelivered(@Param('orderId') orderId: string) {
    return this.orderService.markDelivered(orderId);
  }
}
