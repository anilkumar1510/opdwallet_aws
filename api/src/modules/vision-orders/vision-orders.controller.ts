import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVisionOrderDto } from './dto/create-vision-order.dto';
import { VisionOrdersService } from './vision-orders.service';
import { visionPrescriptionMulterConfig } from './config/vision-multer.config';

/**
 * The member's half of the vision journey — patient-flows flow 3, steps 3 and 4.
 *
 * Steps 5 to 14 are not here and never will be: the `Vision Backend` tab places
 * the checkout on Lenskart and the adjudication on Lenskart's Insurance
 * Dashboard. This platform's job ends when the member holds a coupon code.
 */
@Controller('member/vision')
@UseGuards(JwtAuthGuard)
export class VisionOrdersController {
  constructor(private readonly service: VisionOrdersService) {}

  @Get('partners')
  @ApiOperation({ summary: 'Empanelled vision partners the member can order from' })
  async partners() {
    const partners = await this.service.listPartners();
    return {
      success: true,
      data: partners.map((partner) => ({
        partnerId: partner.partnerId,
        name: partner.name,
        description: partner.description,
        modes: partner.modes,
      })),
    };
  }

  @Get('orders')
  @ApiOperation({ summary: "The member's vision orders, newest first" })
  async list(@Request() req: any) {
    return { success: true, data: await this.service.listForUser(req.user.userId) };
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'One vision order, with its coupon when issued' })
  async detail(@Param('orderId') orderId: string, @Request() req: any) {
    const order = await this.service.findOwned(orderId, req.user.userId);
    const partner = await this.service.partnerFor(order);
    return {
      success: true,
      // storeUrl comes from the partner record rather than the order: it is the
      // partner's URL, and a member holding an old order should still be sent
      // to the current one.
      data: { ...order.toObject(), storeUrl: partner?.storeUrl ?? null },
    };
  }

  @Post('orders')
  @ApiOperation({ summary: 'Start a vision order: partner, mode and what the order comes to' })
  async create(@Body() dto: CreateVisionOrderDto, @Request() req: any) {
    const order = await this.service.create({
      userId: req.user.userId,
      patientId: dto.patientId,
      patientName: dto.patientName,
      partnerId: dto.partnerId,
      mode: dto.mode,
      orderValue: dto.orderValue,
    });
    return { success: true, data: order };
  }

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'What the plan funds for an order of this value, before committing' })
  async quote(@Body() body: { orderValue: number; serviceCode?: string }, @Request() req: any) {
    if (!body?.orderValue || body.orderValue <= 0) {
      throw new BadRequestException('Tell us what the order comes to');
    }
    return {
      success: true,
      data: await this.service.quote(req.user.userId, body.orderValue, body.serviceCode),
    };
  }

  @Post('orders/:orderId/prescription')
  @ApiOperation({ summary: 'Upload the eye prescription. Required before submit' })
  @UseInterceptors(FileInterceptor('file', visionPrescriptionMulterConfig))
  async uploadPrescription(
    @Param('orderId') orderId: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No prescription file was uploaded');
    }
    const order = await this.service.attachPrescription(orderId, req.user.userId, file);
    return { success: true, data: order };
  }

  @Post('orders/:orderId/submit')
  @ApiOperation({ summary: 'Submit for validation and receive the coupon code' })
  async submit(@Param('orderId') orderId: string, @Request() req: any) {
    const order = await this.service.submit(orderId, req.user.userId);
    const partner = await this.service.partnerFor(order);
    return {
      success: true,
      data: {
        orderId: order.orderId,
        couponCode: order.couponCode,
        eligibleAmount: order.eligibleAmount,
        partnerName: order.partnerName,
        storeUrl: partner?.storeUrl ?? null,
      },
    };
  }

  @Post('orders/:orderId/used')
  @ApiOperation({ summary: 'Member confirms the coupon was spent; the reservation becomes a debit' })
  async markUsed(
    @Param('orderId') orderId: string,
    @Body() body: { orderValue?: number },
    @Request() req: any,
  ) {
    const order = await this.service.markUsed(orderId, req.user.userId, body?.orderValue);
    return { success: true, data: order };
  }

  @Post('orders/:orderId/cancel')
  @ApiOperation({ summary: 'Cancel a vision order, freeing the member to start another' })
  async cancel(
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const order = await this.service.cancel(orderId, req.user.userId, body?.reason);
    return { success: true, data: order };
  }
}
