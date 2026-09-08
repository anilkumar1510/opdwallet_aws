import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Response,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PharmacyCatalogueService } from '../services/pharmacy-catalogue.service';
import { PharmacyCartService } from '../services/pharmacy-cart.service';
import { PharmacyOrderService } from '../services/pharmacy-order.service';
import { PharmacyPrescriptionService } from '../services/pharmacy-prescription.service';
import { pharmacyPrescriptionMulterConfig } from '../config/pharmacy-multer.config';
import { CreateCartDto } from '../dto/create-cart.dto';
import { ReduceCartItemDto } from '../dto/reduce-cart-item.dto';
import { CreateOrderDto } from '../dto/create-order.dto';

@Controller('member/pharmacy')
@UseGuards(JwtAuthGuard)
export class PharmacyMemberController {
  constructor(
    private readonly catalogue: PharmacyCatalogueService,
    private readonly cartService: PharmacyCartService,
    private readonly orderService: PharmacyOrderService,
    private readonly prescriptions: PharmacyPrescriptionService,
    private readonly configService: ConfigService,
  ) {}

  /*
   * The catalogue search and the add-to-cart route that used to live here are
   * gone. Flow 5 is prescription led: "the member uploads a prescription and
   * the adjudicator builds the cart. The member can only reduce that cart,
   * never add to it." A member who could still search and add would be putting
   * medicines into a cart nobody had checked against their policy.
   *
   * The catalogue itself is unchanged — the adjudicator searches it from the
   * ops surface, which is where the choosing now happens.
   */

  /** Step 2: upload a prescription. The only thing the member submits. */
  @Post('prescriptions/upload')
  @UseInterceptors(FileInterceptor('file', pharmacyPrescriptionMulterConfig))
  async uploadPrescription(
    @Request() req: any,
    @UploadedFile() file: any,
    @Body() body: { patientId: string; patientName: string },
  ) {
    return this.prescriptions.upload(req.user.userId, body, file);
  }

  /** Step 2's other half: one already in the member's health records. */
  @Post('prescriptions/submit-existing')
  async submitExistingPrescription(
    @Request() req: any,
    @Body() body: { patientId: string; patientName: string; healthRecordId: string; fileName?: string },
  ) {
    return this.prescriptions.submitExisting(req.user.userId, body);
  }

  /** Step 3: the member's own prescriptions and where each one has got to. */
  @Get('prescriptions')
  async listPrescriptions(@Request() req: any) {
    return { prescriptions: await this.prescriptions.listForMember(req.user.userId) };
  }

  @Get('prescriptions/:prescriptionId')
  async getPrescription(@Request() req: any, @Param('prescriptionId') prescriptionId: string) {
    return this.prescriptions.findOwned(prescriptionId, req.user.userId);
  }

  @Post('prescriptions/:prescriptionId/cancel')
  async cancelPrescription(
    @Request() req: any,
    @Param('prescriptionId') prescriptionId: string,
    @Body('reason') reason?: string,
  ) {
    return this.prescriptions.cancel(prescriptionId, req.user.userId, reason);
  }

  /**
   * POST /api/member/pharmacy/prescriptions/:prescriptionId/demo-build-cart
   *
   * Step 4 performed by the member, for demonstrations only.
   *
   * An adjudicator reads the prescription and builds the cart — that is the
   * whole shape of this flow, and it is deliberately somebody else's job. On a
   * demo database nobody is sitting in that queue, so a prescription is
   * uploaded and then nothing ever happens: no cart, no notification, no
   * checkout, and the remaining eleven steps cannot be shown at all.
   *
   * Builds from the covered catalogue and calls the same cart-building method
   * the ops route calls, so nothing is bypassed but the human judgement about
   * WHICH medicines the prescription actually asks for. Refused outside
   * development, and scoped to the caller's own prescription.
   */
  @Post('prescriptions/:prescriptionId/demo-build-cart')
  async demoBuildCart(
    @Request() req: any,
    @Param('prescriptionId') prescriptionId: string,
    @Body() body: { cartId?: string },
  ) {
    if (this.configService.get<string>('nodeEnv') !== 'development') {
      throw new ForbiddenException('Our team builds your cart from your prescription');
    }

    const prescription = await this.prescriptions.findOwned(prescriptionId, req.user.userId);
    const cart = await this.cartService.getOrCreateCart(
      req.user.userId,
      prescription.patientId,
      prescription.patientName,
      prescription.prescriptionId,
    );

    // A stand-in adjudicator takes the first few covered medicines. A real one
    // reads the prescription; this one cannot, and the screen says so.
    const catalogue = await this.catalogue.search(undefined);
    const items = catalogue
      .filter((medicine: any) => medicine.inStock)
      .slice(0, 3)
      // Three of each: a prescription says how many, and a cart of ones leaves
      // the member's only control — reduce — with nothing to show but a
      // disappearing line.
      .map((medicine: any) => ({ medicineId: medicine.medicineId, quantity: 3 }));

    const built = await this.cartService.buildCart(cart.cartId, items);
    await this.prescriptions.markDigitized(prescriptionId, built.cartId, 'demonstration');
    return { cart: built, prescriptionId };
  }

  @Post('carts')
  async createCart(@Request() req: any, @Body() dto: CreateCartDto) {
    const cart = await this.cartService.getOrCreateCart(
      req.user.userId,
      dto.patientId,
      dto.patientName,
      dto.prescriptionFileName,
    );
    return cart;
  }

  /** Step 5: the member comes back to the cart that was built for them. */
  @Get('carts/open')
  async openCart(@Request() req: any, @Query('patientId') patientId: string) {
    if (!patientId) return null;
    return this.cartService.findOpenCart(req.user.userId, patientId);
  }

  @Get('carts/:cartId')
  async getCart(@Request() req: any, @Param('cartId') cartId: string) {
    return this.cartService.getCart(cartId, req.user.userId);
  }

  /** Step 8: reduce a quantity. Raising one is refused by the service. */
  @Patch('carts/:cartId/items/:medicineId')
  async reduceItem(
    @Request() req: any,
    @Param('cartId') cartId: string,
    @Param('medicineId') medicineId: string,
    @Body() dto: ReduceCartItemDto,
  ) {
    return this.cartService.reduceItem(cartId, req.user.userId, medicineId, dto.quantity);
  }

  @Delete('carts/:cartId/items/:medicineId')
  async removeItem(
    @Request() req: any,
    @Param('cartId') cartId: string,
    @Param('medicineId') medicineId: string,
  ) {
    return this.cartService.removeItem(cartId, req.user.userId, medicineId);
  }

  /** Steps 4-6: cart on hold, adjudicated, member notified — all in one call. */
  @Post('orders')
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.userId, dto.cartId, dto.deliveryAddress);
  }

  @Get('orders')
  async listOrders(@Request() req: any) {
    return { orders: await this.orderService.getUserOrders(req.user.userId) };
  }

  @Get('orders/:orderId')
  async getOrder(@Request() req: any, @Param('orderId') orderId: string) {
    return this.orderService.getOrder(orderId, req.user.userId);
  }

  /** Step 8: pay against the breakdown adjudication fixed. */
  @Post('orders/:orderId/pay')
  async pay(@Request() req: any, @Param('orderId') orderId: string) {
    return this.orderService.pay(orderId, req.user.userId);
  }

  @Post('orders/:orderId/cancel')
  async cancel(@Request() req: any, @Param('orderId') orderId: string, @Body('reason') reason: string) {
    return this.orderService.cancel(orderId, req.user.userId, reason || 'Cancelled by member');
  }

  @Get('orders/:orderId/invoice')
  async getInvoice(@Request() req: any, @Param('orderId') orderId: string, @Response() res: any) {
    const filePath = await this.orderService.getInvoicePath(orderId, req.user.userId);
    res.sendFile(filePath);
  }
}
