import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabOrder, OrderStatus, PaymentStatus } from '../schemas/lab-order.schema';
import { LabCart } from '../schemas/lab-cart.schema';
import { LabVendor } from '../schemas/lab-vendor.schema';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { LabCartService } from './lab-cart.service';
import { LabVendorService } from './lab-vendor.service';

@Injectable()
export class LabOrderService {
  constructor(
    @InjectModel(LabOrder.name)
    private orderModel: Model<LabOrder>,
    @InjectModel(LabCart.name)
    private cartModel: Model<LabCart>,
    @InjectModel(LabVendor.name)
    private vendorModel: Model<LabVendor>,
    private cartService: LabCartService,
    private vendorService: LabVendorService,
  ) {}

  async createOrder(
    userId: Types.ObjectId,
    createDto: CreateOrderDto,
  ): Promise<LabOrder> {
    // Get cart and validate
    const cart = await this.cartModel.findOne({ cartId: createDto.cartId });
    if (!cart) {
      throw new NotFoundException(`Cart ${createDto.cartId} not found`);
    }

    // Get vendor
    const vendor = await this.vendorModel.findOne({
      _id: new Types.ObjectId(createDto.vendorId)
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${createDto.vendorId} not found`);
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get pricing for all items
    const orderItems = [];
    for (const cartItem of cart.items) {
      const pricing = await this.vendorService.getPricingForService(
        createDto.vendorId,
        cartItem.serviceId.toString(),
      );

      if (!pricing) {
        throw new BadRequestException(
          `Pricing not found for service ${cartItem.serviceName}`,
        );
      }

      orderItems.push({
        serviceId: cartItem.serviceId,
        serviceName: cartItem.serviceName,
        serviceCode: cartItem.serviceCode,
        actualPrice: pricing.actualPrice,
        discountedPrice: pricing.discountedPrice,
      });
    }

    // Book slot if provided
    if (createDto.slotId) {
      await this.vendorService.bookSlot(createDto.slotId);
    }

    // Create order
    const order = new this.orderModel({
      orderId,
      userId,
      cartId: cart._id,
      prescriptionId: cart.prescriptionId,
      vendorId: new Types.ObjectId(createDto.vendorId),
      vendorName: vendor.name,
      items: orderItems,
      status: OrderStatus.PLACED,
      collectionType: createDto.collectionType,
      collectionAddress: createDto.collectionAddress,
      collectionDate: createDto.collectionDate,
      collectionTime: createDto.collectionTime,
      slotId: createDto.slotId ? new Types.ObjectId(createDto.slotId) : undefined,
      subtotal: createDto.subtotal,
      homeCollectionCharges: createDto.homeCollectionCharges ?? 0,
      discount: createDto.discount ?? 0,
      totalAmount: createDto.totalAmount,
      paymentInfo: {
        status: PaymentStatus.PENDING,
        amount: createDto.totalAmount,
      },
      notes: createDto.notes,
    });

    const savedOrder = await order.save();

    // Mark cart as ordered
    await this.cartService.markCartAsOrdered(createDto.cartId);

    return savedOrder;
  }

  async getOrderById(orderId: string): Promise<LabOrder> {
    const order = await this.orderModel
      .findOne({ orderId })
      .populate('vendorId', 'name code contactInfo')
      .populate('items.serviceId', 'name code category')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async getUserOrders(userId: Types.ObjectId): Promise<LabOrder[]> {
    return this.orderModel
      .find({ userId })
      .populate('vendorId', 'name code contactInfo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAllOrders(status?: OrderStatus): Promise<LabOrder[]> {
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    return this.orderModel
      .find(filter)
      .populate('vendorId', 'name code contactInfo')
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getVendorOrders(vendorId: string, status?: OrderStatus): Promise<LabOrder[]> {
    const filter: any = { vendorId: new Types.ObjectId(vendorId) };

    if (status) {
      filter.status = status;
    }

    return this.orderModel
      .find(filter)
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateOrderStatus(
    orderId: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<LabOrder> {
    const order = await this.getOrderById(orderId);

    order.status = updateDto.status;

    if (updateDto.reportUrl) {
      order.reportUrl = updateDto.reportUrl;
      order.reportUploadedAt = new Date();
    }

    if (updateDto.status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      order.cancellationReason = updateDto.cancellationReason;
    }

    if (updateDto.notes) {
      order.notes = updateDto.notes;
    }

    return order.save();
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string,
    paymentMethod?: string,
  ): Promise<LabOrder> {
    const order = await this.getOrderById(orderId);

    order.paymentInfo.status = paymentStatus;

    if (transactionId) {
      order.paymentInfo.transactionId = transactionId;
    }

    if (paymentMethod) {
      order.paymentInfo.paymentMethod = paymentMethod;
    }

    if (paymentStatus === PaymentStatus.COMPLETED) {
      order.paymentInfo.paidAt = new Date();
    }

    return order.save();
  }

  async cancelOrder(orderId: string, reason: string): Promise<LabOrder> {
    const order = await this.getOrderById(orderId);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    return order.save();
  }
}
