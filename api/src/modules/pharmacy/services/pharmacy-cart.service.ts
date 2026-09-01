import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PharmacyCart, PharmacyCartDocument, PharmacyCartStatus } from '../schemas/pharmacy-cart.schema';
import { PharmacyCatalogueService } from './pharmacy-catalogue.service';

@Injectable()
export class PharmacyCartService {
  constructor(
    @InjectModel(PharmacyCart.name) private cartModel: Model<PharmacyCartDocument>,
    private catalogue: PharmacyCatalogueService,
  ) {}

  /** One open cart per member at a time — reuses it rather than creating duplicates. */
  async getOrCreateCart(
    userId: string,
    patientId: string,
    patientName: string,
    prescriptionFileName?: string,
  ): Promise<PharmacyCartDocument> {
    const existing = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      patientId,
      status: PharmacyCartStatus.CREATED,
    });
    if (existing) return existing;

    const cartId = `PHCART-${Date.now()}`;
    return this.cartModel.create({
      cartId,
      userId: new Types.ObjectId(userId),
      patientId,
      patientName,
      prescriptionFileName,
      items: [],
      status: PharmacyCartStatus.CREATED,
    });
  }

  async getCart(cartId: string, userId: string): Promise<PharmacyCartDocument> {
    const cart = await this.cartModel.findOne({ cartId, userId: new Types.ObjectId(userId) });
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  async addItem(cartId: string, userId: string, medicineId: string, quantity: number): Promise<PharmacyCartDocument> {
    if (quantity < 1) throw new BadRequestException('Quantity must be at least 1');
    const cart = await this.getCart(cartId, userId);
    if (cart.status !== PharmacyCartStatus.CREATED) {
      throw new BadRequestException('This cart has already been submitted');
    }
    const medicine = await this.catalogue.findById(medicineId);
    if (!medicine) throw new NotFoundException('Medicine not found');
    if (!medicine.inStock) throw new BadRequestException('This medicine is out of stock');

    const existingItem = cart.items.find((item) => item.medicineId === medicineId);
    if (existingItem) {
      existingItem.quantity = quantity;
    } else {
      cart.items.push({
        medicineId: medicine.medicineId,
        name: medicine.name,
        price: medicine.price,
        quantity,
        requiresPrescription: medicine.requiresPrescription,
      });
    }
    return cart.save();
  }

  async removeItem(cartId: string, userId: string, medicineId: string): Promise<PharmacyCartDocument> {
    const cart = await this.getCart(cartId, userId);
    cart.items = cart.items.filter((item) => item.medicineId !== medicineId);
    return cart.save();
  }
}
