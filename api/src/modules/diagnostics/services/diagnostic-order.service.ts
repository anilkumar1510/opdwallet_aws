import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DiagnosticOrder,
  OrderStatus,
  CollectionType,
  PaymentStatus,
  CancelledBy,
  OrderItem,
  CollectionAddress,
} from '../schemas/diagnostic-order.schema';

export interface CreateDiagnosticOrderDto {
  userId: string;
  cartId: string;
  prescriptionId: string;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  collectionType: CollectionType;
  collectionAddress?: CollectionAddress;
  appointmentDate?: string;
  appointmentTime?: string;
  slotId?: string;
  totalActualPrice: number;
  totalDiscountedPrice: number;
  homeCollectionCharges: number;
  finalAmount: number;
}

@Injectable()
export class DiagnosticOrderService {
  constructor(
    @InjectModel(DiagnosticOrder.name)
    private diagnosticOrderModel: Model<DiagnosticOrder>,
  ) {}

  async create(createDto: CreateDiagnosticOrderDto): Promise<DiagnosticOrder> {
    const orderId = `DIAG-ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = new this.diagnosticOrderModel({
      orderId,
      userId: new Types.ObjectId(createDto.userId),
      cartId: new Types.ObjectId(createDto.cartId),
      prescriptionId: new Types.ObjectId(createDto.prescriptionId),
      vendorId: new Types.ObjectId(createDto.vendorId),
      vendorName: createDto.vendorName,
      items: createDto.items,
      status: OrderStatus.PLACED,
      collectionType: createDto.collectionType,
      collectionAddress: createDto.collectionAddress,
      appointmentDate: createDto.appointmentDate,
      appointmentTime: createDto.appointmentTime,
      slotId: createDto.slotId ? new Types.ObjectId(createDto.slotId) : undefined,
      totalActualPrice: createDto.totalActualPrice,
      totalDiscountedPrice: createDto.totalDiscountedPrice,
      homeCollectionCharges: createDto.homeCollectionCharges,
      finalAmount: createDto.finalAmount,
      paymentStatus: PaymentStatus.COMPLETED,
      placedAt: new Date(),
      reports: [],
    });

    return order.save();
  }

  async findOne(orderId: string): Promise<DiagnosticOrder> {
    const order = await this.diagnosticOrderModel.findOne({ orderId });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async findByUserId(userId: string): Promise<DiagnosticOrder[]> {
    return this.diagnosticOrderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(filters?: { status?: OrderStatus }): Promise<DiagnosticOrder[]> {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    return this.diagnosticOrderModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(orderId: string, status: OrderStatus, confirmedBy?: string): Promise<DiagnosticOrder> {
    const order = await this.findOne(orderId);

    order.status = status;

    if (status === OrderStatus.CONFIRMED) {
      order.confirmedAt = new Date();
      order.confirmedBy = confirmedBy;
    }

    if (status === OrderStatus.SCHEDULED) {
      order.scheduledAt = new Date();
    }

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    return order.save();
  }

  async cancelOrder(orderId: string, reason: string, cancelledBy: CancelledBy): Promise<DiagnosticOrder> {
    const order = await this.findOne(orderId);

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy;
    order.cancellationReason = reason;

    return order.save();
  }

  async uploadReport(
    orderId: string,
    fileName: string,
    originalName: string,
    filePath: string,
    uploadedBy: string,
  ): Promise<DiagnosticOrder> {
    const order = await this.findOne(orderId);

    order.reports.push({
      fileName,
      originalName,
      filePath,
      uploadedAt: new Date(),
      uploadedBy,
    });

    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.SCHEDULED) {
      order.status = OrderStatus.COMPLETED;
      order.completedAt = new Date();
    }

    return order.save();
  }

  async findByVendorId(vendorId: string): Promise<DiagnosticOrder[]> {
    return this.diagnosticOrderModel
      .find({ vendorId: new Types.ObjectId(vendorId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
