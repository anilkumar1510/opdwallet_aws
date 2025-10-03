import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabCart, CartStatus } from '../schemas/lab-cart.schema';
import { CreateCartDto } from '../dto/create-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';

@Injectable()
export class LabCartService {
  constructor(
    @InjectModel(LabCart.name)
    private cartModel: Model<LabCart>,
  ) {}

  async createCart(
    userId: Types.ObjectId,
    createCartDto: CreateCartDto,
  ): Promise<LabCart> {
    const cartId = `CART-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const items = createCartDto.items.map(item => ({
      serviceId: new Types.ObjectId(item.serviceId),
      serviceName: item.serviceName,
      serviceCode: item.serviceCode,
      category: (item as any).category || 'PATHOLOGY',
    }));

    const cart = new this.cartModel({
      cartId,
      userId,
      prescriptionId: new Types.ObjectId(createCartDto.prescriptionId),
      items,
      status: CartStatus.CREATED,
    });

    return cart.save();
  }

  async getCartById(cartId: string): Promise<LabCart> {
    const cart = await this.cartModel
      .findOne({ cartId })
      .populate('items.serviceId', 'name code category')
      .exec();

    if (!cart) {
      throw new NotFoundException(`Cart ${cartId} not found`);
    }

    return cart;
  }

  async getCartByPrescription(prescriptionId: string): Promise<LabCart | null> {
    return this.cartModel
      .findOne({ prescriptionId: new Types.ObjectId(prescriptionId) })
      .populate('items.serviceId', 'name code category')
      .exec();
  }

  async getUserCarts(userId: Types.ObjectId): Promise<LabCart[]> {
    return this.cartModel
      .find({ userId })
      .populate('items.serviceId', 'name code category')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateCart(cartId: string, updateDto: UpdateCartDto): Promise<LabCart> {
    const cart = await this.getCartById(cartId);

    if (cart.status === CartStatus.ORDERED) {
      throw new BadRequestException('Cannot update cart that has been ordered');
    }

    if (updateDto.items) {
      cart.items = updateDto.items.map(item => ({
        serviceId: new Types.ObjectId(item.serviceId),
        serviceName: item.serviceName,
        serviceCode: item.serviceCode,
        category: (item as any).category || 'PATHOLOGY',
      }));
    }

    if (updateDto.status) {
      cart.status = updateDto.status;
    }

    return cart.save();
  }

  async markCartAsOrdered(cartId: string): Promise<LabCart> {
    const cart = await this.getCartById(cartId);

    if (cart.status === CartStatus.ORDERED) {
      throw new BadRequestException('Cart is already ordered');
    }

    cart.status = CartStatus.ORDERED;
    return cart.save();
  }

  async deleteCart(cartId: string): Promise<void> {
    const cart = await this.getCartById(cartId);

    if (cart.status === CartStatus.ORDERED) {
      throw new BadRequestException('Cannot delete cart that has been ordered');
    }

    await this.cartModel.deleteOne({ cartId });
  }
}
