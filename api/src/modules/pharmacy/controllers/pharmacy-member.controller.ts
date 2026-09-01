import { Body, Controller, Delete, Get, Param, Post, Query, Request, Response, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PharmacyCatalogueService } from '../services/pharmacy-catalogue.service';
import { PharmacyCartService } from '../services/pharmacy-cart.service';
import { PharmacyOrderService } from '../services/pharmacy-order.service';
import { CreateCartDto } from '../dto/create-cart.dto';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { CreateOrderDto } from '../dto/create-order.dto';

@Controller('member/pharmacy')
@UseGuards(JwtAuthGuard)
export class PharmacyMemberController {
  constructor(
    private readonly catalogue: PharmacyCatalogueService,
    private readonly cartService: PharmacyCartService,
    private readonly orderService: PharmacyOrderService,
  ) {}

  /** Step 3: search and add medicines. */
  @Get('medicines')
  async searchMedicines(@Query('search') search?: string) {
    return { medicines: await this.catalogue.search(search) };
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

  @Get('carts/:cartId')
  async getCart(@Request() req: any, @Param('cartId') cartId: string) {
    return this.cartService.getCart(cartId, req.user.userId);
  }

  @Post('carts/:cartId/items')
  async addItem(@Request() req: any, @Param('cartId') cartId: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(cartId, req.user.userId, dto.medicineId, dto.quantity);
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
