import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabCart, CartStatus } from '../schemas/lab-cart.schema';
import { LabPrescription } from '../schemas/lab-prescription.schema';
import { CreateCartDto } from '../dto/create-cart.dto';
import { UpdateCartDto } from '../dto/update-cart.dto';

@Injectable()
export class LabCartService {
  constructor(
    @InjectModel(LabCart.name)
    private cartModel: Model<LabCart>,
    @InjectModel(LabPrescription.name)
    private prescriptionModel: Model<LabPrescription>,
  ) {}

  async createCart(
    userId: Types.ObjectId,
    createCartDto: CreateCartDto,
    createdBy: string,
    selectedVendorIds?: string[],
  ): Promise<LabCart> {
    console.log('🔍 [CART SERVICE] ==================== CREATE CART START ====================');
    console.log('🔍 [CART SERVICE] Input userId:', userId);
    console.log('🔍 [CART SERVICE] Input userId type:', typeof userId);
    console.log('🔍 [CART SERVICE] Input prescriptionId:', createCartDto.prescriptionId);
    console.log('🔍 [CART SERVICE] Input items:', JSON.stringify(createCartDto.items, null, 2));
    console.log('🔍 [CART SERVICE] Created by:', createdBy);

    try {
      const cartId = `CART-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      console.log('✅ [CART SERVICE] Generated cartId:', cartId);

      // Fetch prescription to get patient details
      console.log('🔍 [CART SERVICE] Converting prescriptionId to ObjectId:', createCartDto.prescriptionId);
      const prescriptionObjectId = new Types.ObjectId(createCartDto.prescriptionId);
      console.log('✅ [CART SERVICE] Prescription ObjectId:', prescriptionObjectId);

      console.log('🔍 [CART SERVICE] Fetching prescription from database...');
      const prescription = await this.prescriptionModel.findById(prescriptionObjectId);

      if (!prescription) {
        console.error('❌ [CART SERVICE] Prescription not found for ID:', createCartDto.prescriptionId);
        throw new NotFoundException('Prescription not found');
      }
      console.log('✅ [CART SERVICE] Prescription found:', {
        prescriptionId: prescription.prescriptionId,
        patientId: prescription.patientId,
        patientName: prescription.patientName,
      });

      console.log('🔍 [CART SERVICE] Converting item serviceIds to ObjectIds...');
      const items = createCartDto.items.map((item, index) => {
        console.log(`🔍 [CART SERVICE] Item ${index + 1}: serviceId = ${item.serviceId} (type: ${typeof item.serviceId})`);
        const serviceObjectId = new Types.ObjectId(item.serviceId);
        console.log(`✅ [CART SERVICE] Item ${index + 1}: converted to ObjectId = ${serviceObjectId}`);
        return {
          serviceId: serviceObjectId,
          serviceName: item.serviceName,
          serviceCode: item.serviceCode,
          category: (item as any).category || 'PATHOLOGY',
        };
      });
      console.log('✅ [CART SERVICE] All items converted successfully');

      console.log('🔍 [CART SERVICE] Creating cart document...');
      const cart = new this.cartModel({
        cartId,
        userId,
        prescriptionId: prescriptionObjectId,
        patientId: prescription.patientId,
        patientName: prescription.patientName,
        pincode: prescription.pincode,
        items,
        selectedVendorIds: selectedVendorIds ? selectedVendorIds.map(id => new Types.ObjectId(id)) : [],
        status: CartStatus.CREATED,
        createdBy,
      });
      console.log('✅ [CART SERVICE] Cart document created in memory');

      console.log('🔍 [CART SERVICE] Saving cart to database...');
      const savedCart = await cart.save();
      console.log('✅ [CART SERVICE] Cart saved successfully:', {
        cartId: savedCart.cartId,
        itemsCount: savedCart.items.length,
      });

      console.log('🔍 [CART SERVICE] ==================== CREATE CART SUCCESS ====================');
      return savedCart;
    } catch (error) {
      console.error('❌ [CART SERVICE] ==================== CREATE CART ERROR ====================');
      console.error('❌ [CART SERVICE] Error type:', error.constructor.name);
      console.error('❌ [CART SERVICE] Error message:', error.message);
      console.error('❌ [CART SERVICE] Error stack:', error.stack);
      console.error('❌ [CART SERVICE] ==================== ERROR END ====================');
      throw error;
    }
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
