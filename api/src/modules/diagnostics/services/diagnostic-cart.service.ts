import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosticCart, CartStatus, CartItem } from '../schemas/diagnostic-cart.schema';

export interface CreateDiagnosticCartDto {
  prescriptionId: string;
  userId: string;
  patientId: string;
  patientName: string;
  pincode: string;
  items: CartItem[];
  selectedVendorIds: string[];
  createdBy: string;
}

@Injectable()
export class DiagnosticCartService {
  constructor(
    @InjectModel(DiagnosticCart.name)
    private diagnosticCartModel: Model<DiagnosticCart>,
  ) {}

  async create(createDto: CreateDiagnosticCartDto): Promise<DiagnosticCart> {
    const cartId = `DIAG-CART-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const cart = new this.diagnosticCartModel({
      cartId,
      prescriptionId: new Types.ObjectId(createDto.prescriptionId),
      userId: new Types.ObjectId(createDto.userId),
      patientId: createDto.patientId,
      patientName: createDto.patientName,
      pincode: createDto.pincode,
      items: createDto.items,
      selectedVendorIds: createDto.selectedVendorIds.map((id) => new Types.ObjectId(id)),
      status: CartStatus.CREATED,
      createdBy: createDto.createdBy,
    });

    return cart.save();
  }

  async findOne(cartId: string): Promise<DiagnosticCart> {
    const cart = await this.diagnosticCartModel
      .findOne({ cartId })
      .populate('selectedVendorIds')
      .exec();

    if (!cart) {
      throw new NotFoundException(`Cart ${cartId} not found`);
    }

    return cart;
  }

  async findByUserId(userId: string): Promise<DiagnosticCart[]> {
    return this.diagnosticCartModel
      .find({
        userId: new Types.ObjectId(userId),
        status: { $in: [CartStatus.CREATED, CartStatus.REVIEWED] },
      })
      .populate('selectedVendorIds')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPrescriptionId(prescriptionId: string): Promise<DiagnosticCart | null> {
    return this.diagnosticCartModel
      .findOne({ prescriptionId: new Types.ObjectId(prescriptionId) })
      .populate('selectedVendorIds')
      .exec();
  }

  async updateStatus(cartId: string, status: CartStatus): Promise<DiagnosticCart> {
    const cart = await this.findOne(cartId);
    cart.status = status;
    return cart.save();
  }

  async displayToMember(cartId: string): Promise<DiagnosticCart> {
    const cart = await this.findOne(cartId);
    cart.displayedToMemberAt = new Date();
    return cart.save();
  }

  async linkOrder(cartId: string, orderId: string): Promise<DiagnosticCart> {
    const cart = await this.findOne(cartId);
    cart.orderId = new Types.ObjectId(orderId);
    cart.status = CartStatus.ORDERED;
    return cart.save();
  }
}
