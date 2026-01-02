import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosticPrescription, PrescriptionStatus, PrescriptionSource } from '../schemas/diagnostic-prescription.schema';

export interface CreateDiagnosticPrescriptionDto {
  userId: string;
  patientId: string;
  patientName: string;
  patientRelationship: string;
  prescriptionDate: Date;
  pincode: string;
  addressId?: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  source?: PrescriptionSource;
  healthRecordId?: string;
}

@Injectable()
export class DiagnosticPrescriptionService {
  constructor(
    @InjectModel(DiagnosticPrescription.name)
    private diagnosticPrescriptionModel: Model<DiagnosticPrescription>,
  ) {}

  async create(createDto: CreateDiagnosticPrescriptionDto): Promise<DiagnosticPrescription> {
    const prescriptionId = `DIAG-RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const prescription = new this.diagnosticPrescriptionModel({
      prescriptionId,
      userId: new Types.ObjectId(createDto.userId),
      patientId: createDto.patientId,
      patientName: createDto.patientName,
      patientRelationship: createDto.patientRelationship,
      prescriptionDate: createDto.prescriptionDate,
      pincode: createDto.pincode,
      addressId: createDto.addressId ? new Types.ObjectId(createDto.addressId) : undefined,
      source: createDto.source || PrescriptionSource.UPLOAD,
      healthRecordId: createDto.healthRecordId ? new Types.ObjectId(createDto.healthRecordId) : undefined,
      fileName: createDto.fileName,
      originalName: createDto.originalName,
      fileType: createDto.fileType,
      fileSize: createDto.fileSize,
      filePath: createDto.filePath,
      uploadedAt: new Date(),
      status: PrescriptionStatus.UPLOADED,
    });

    return prescription.save();
  }

  async findOne(prescriptionId: string): Promise<DiagnosticPrescription> {
    const prescription = await this.diagnosticPrescriptionModel.findOne({ prescriptionId });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }

    return prescription;
  }

  async findByUserId(userId: string): Promise<any[]> {
    // Use aggregation to join with diagnostic_orders and get order count
    const prescriptions = await this.diagnosticPrescriptionModel.aggregate([
      // Match user's prescriptions
      { $match: { userId: new Types.ObjectId(userId) } },

      // Sort by upload date (newest first)
      { $sort: { uploadedAt: -1 } },

      // Left join with diagnostic_orders to check if order exists
      {
        $lookup: {
          from: 'diagnostic_orders',
          localField: '_id',
          foreignField: 'prescriptionId',
          as: 'orders',
        },
      },

      // Add computed fields
      {
        $addFields: {
          hasOrder: { $gt: [{ $size: '$orders' }, 0] },
          orderCount: { $size: '$orders' },
        },
      },

      // Project fields needed for frontend
      {
        $project: {
          prescriptionId: 1,
          userId: 1,
          fileName: 1,
          filePath: 1,
          uploadedAt: 1,
          status: 1,
          source: 1,
          healthRecordId: 1,
          cartId: 1,
          hasOrder: 1,
          orderCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]).exec();

    return prescriptions;
  }

  async findByStatus(status: PrescriptionStatus): Promise<DiagnosticPrescription[]> {
    return this.diagnosticPrescriptionModel
      .find({ status })
      .sort({ uploadedAt: 1 })
      .exec();
  }

  async updateStatus(prescriptionId: string, status: PrescriptionStatus, digitizedBy?: string): Promise<DiagnosticPrescription> {
    const prescription = await this.findOne(prescriptionId);

    prescription.status = status;

    if (status === PrescriptionStatus.DIGITIZING) {
      prescription.digitizingStartedAt = new Date();
    }

    if (status === PrescriptionStatus.DIGITIZED && digitizedBy) {
      prescription.digitizedBy = digitizedBy;
      prescription.digitizedAt = new Date();
    }

    return prescription.save();
  }

  async linkCart(prescriptionId: string, cartId: string): Promise<DiagnosticPrescription> {
    const prescription = await this.findOne(prescriptionId);
    prescription.cartId = new Types.ObjectId(cartId);
    return prescription.save();
  }

  async addDelay(prescriptionId: string, reason: string): Promise<DiagnosticPrescription> {
    const prescription = await this.findOne(prescriptionId);
    prescription.status = PrescriptionStatus.DELAYED;
    prescription.delayReason = reason;
    return prescription.save();
  }
}
