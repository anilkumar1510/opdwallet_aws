import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosticCart, CartStatus, CartItem } from '../schemas/diagnostic-cart.schema';
import { DiagnosticPrescription } from '../schemas/diagnostic-prescription.schema';

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

export interface CreateCartDto {
  prescriptionId: string;
  items: Array<{
    serviceId: string;
    serviceName: string;
    serviceCode: string;
    category: string;
    description?: string;
  }>;
}

@Injectable()
export class DiagnosticCartService {
  constructor(
    @InjectModel(DiagnosticCart.name)
    private diagnosticCartModel: Model<DiagnosticCart>,
    @InjectModel(DiagnosticPrescription.name)
    private prescriptionModel: Model<DiagnosticPrescription>,
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

  async createCart(
    userId: Types.ObjectId,
    createCartDto: CreateCartDto,
    createdBy: string,
    selectedVendorIds?: string[],
  ): Promise<DiagnosticCart> {
    const cartId = `DIAG-CART-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Fetch prescription to get patient details
    const prescriptionObjectId = new Types.ObjectId(createCartDto.prescriptionId);
    const prescription = await this.prescriptionModel.findById(prescriptionObjectId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Convert item serviceIds to ObjectIds
    const items = createCartDto.items.map((item) => ({
      serviceId: new Types.ObjectId(item.serviceId),
      serviceName: item.serviceName,
      serviceCode: item.serviceCode,
      category: item.category,
      description: item.description,
    }));

    const cart = new this.diagnosticCartModel({
      cartId,
      prescriptionId: prescriptionObjectId,
      userId,
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      pincode: prescription.pincode,
      items,
      selectedVendorIds: selectedVendorIds
        ? selectedVendorIds.map((id) => new Types.ObjectId(id))
        : [],
      status: CartStatus.CREATED,
      createdBy,
    });

    return cart.save();
  }

  async findOne(cartId: string): Promise<DiagnosticCart> {
    // Try to find by cartId field first (string like "DIAG-CART-...")
    let cart = await this.diagnosticCartModel
      .findOne({ cartId })
      .populate('selectedVendorIds')
      .exec();

    // If not found and cartId looks like a MongoDB ObjectId, try finding by _id
    if (!cart && Types.ObjectId.isValid(cartId)) {
      cart = await this.diagnosticCartModel
        .findById(cartId)
        .populate('selectedVendorIds')
        .exec();
    }

    if (!cart) {
      throw new NotFoundException(`Cart ${cartId} not found`);
    }

    return cart;
  }

  async getCartById(cartId: string): Promise<DiagnosticCart> {
    // Try to find by cartId field first (string like "DIAG-CART-...")
    let cart = await this.diagnosticCartModel
      .findOne({ cartId })
      .populate('items.serviceId', 'name code category')
      .exec();

    // If not found and cartId looks like a MongoDB ObjectId, try finding by _id
    if (!cart && Types.ObjectId.isValid(cartId)) {
      cart = await this.diagnosticCartModel
        .findById(cartId)
        .populate('items.serviceId', 'name code category')
        .exec();
    }

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

  async markCartAsOrdered(cartId: string): Promise<DiagnosticCart> {
    const cart = await this.findOne(cartId);
    cart.status = CartStatus.ORDERED;
    return cart.save();
  }
}
