import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosticPrescription, PrescriptionStatus, PrescriptionSource } from '../schemas/diagnostic-prescription.schema';
import { User } from '../../users/schemas/user.schema';

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
  notes?: string;
}

export interface UploadDiagnosticPrescriptionDto {
  patientId: string;
  patientName: string;
  patientRelationship: string;
  prescriptionDate: string;
  pincode: string;
  addressId?: string;
  notes?: string;
}

@Injectable()
export class DiagnosticPrescriptionService {
  constructor(
    @InjectModel(DiagnosticPrescription.name)
    private diagnosticPrescriptionModel: Model<DiagnosticPrescription>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async uploadPrescription(
    userId: Types.ObjectId,
    uploadDto: UploadDiagnosticPrescriptionDto,
    file: any,
  ): Promise<DiagnosticPrescription> {
    const prescriptionId = `DIAG-RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const prescription = new this.diagnosticPrescriptionModel({
      prescriptionId,
      userId,
      patientId: uploadDto.patientId,
      patientName: uploadDto.patientName,
      patientRelationship: uploadDto.patientRelationship,
      prescriptionDate: new Date(uploadDto.prescriptionDate),
      addressId: uploadDto.addressId ? new Types.ObjectId(uploadDto.addressId) : undefined,
      pincode: uploadDto.pincode,
      fileName: file.filename,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      status: PrescriptionStatus.UPLOADED,
      uploadedAt: new Date(),
      notes: uploadDto.notes,
      source: PrescriptionSource.UPLOAD,
    });

    return prescription.save();
  }

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

  async submitExistingPrescription(
    userId: Types.ObjectId,
    healthRecordId: string,
    prescriptionType: 'DIGITAL' | 'PDF',
    patientId: string,
    patientName: string,
    patientRelationship: string,
    pincode: string,
    prescriptionDate: Date,
  ): Promise<DiagnosticPrescription> {
    const prescriptionId = `DIAG-RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Fetch user's pincode if not provided
    let userPincode = pincode;
    if (!userPincode || userPincode.trim() === '') {
      const user = await this.userModel.findById(userId).exec();
      if (user && user.address && user.address.pincode) {
        userPincode = user.address.pincode;
      } else {
        userPincode = '000000';
      }
    }

    // Initialize with placeholder values
    let fileData = {
      fileName: `health-record-${healthRecordId}`,
      filePath: `/health-records/${healthRecordId}`,
      fileSize: 0,
      fileType: 'application/pdf',
      originalName: 'From Health Records',
    };

    // Fetch from appropriate collection based on prescriptionType
    if (prescriptionType === 'DIGITAL') {
      const digitalPrescription: any = await this.diagnosticPrescriptionModel.db
        .model('DigitalPrescription')
        .findById(healthRecordId)
        .select('pdfGenerated pdfPath pdfFileName')
        .lean();

      if (digitalPrescription && digitalPrescription.pdfGenerated && digitalPrescription.pdfPath) {
        fileData.fileName = digitalPrescription.pdfFileName || `prescription-${healthRecordId}.pdf`;
        // Remove /app/ prefix from absolute path to get relative path for static file serving
        fileData.filePath = digitalPrescription.pdfPath.replace(/^\/app\//, '');
        fileData.originalName = digitalPrescription.pdfFileName || 'Digital Prescription';
      }
    } else if (prescriptionType === 'PDF') {
      const doctorPrescription: any = await this.diagnosticPrescriptionModel.db
        .model('DoctorPrescription')
        .findById(healthRecordId)
        .select('fileName filePath fileSize')
        .lean();

      if (doctorPrescription && doctorPrescription.filePath) {
        fileData.fileName = doctorPrescription.fileName;
        // Remove /app/ prefix if present
        fileData.filePath = doctorPrescription.filePath.replace(/^\/app\//, '');
        fileData.fileSize = doctorPrescription.fileSize || 0;
        fileData.originalName = doctorPrescription.fileName;
      }
    }

    const prescription = new this.diagnosticPrescriptionModel({
      prescriptionId,
      userId,
      patientId,
      patientName,
      patientRelationship,
      prescriptionDate,
      pincode: userPincode,
      source: PrescriptionSource.HEALTH_RECORD,
      healthRecordId: new Types.ObjectId(healthRecordId),
      fileName: fileData.fileName,
      originalName: fileData.originalName,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize,
      filePath: fileData.filePath,
      status: PrescriptionStatus.UPLOADED,
      uploadedAt: new Date(),
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

  async findByUserId(userId: string): Promise<DiagnosticPrescription[]> {
    return this.diagnosticPrescriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ uploadedAt: -1 })
      .exec();
  }

  async findByStatus(status: PrescriptionStatus): Promise<DiagnosticPrescription[]> {
    return this.diagnosticPrescriptionModel
      .find({ status })
      .populate('userId', 'name phone email')
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
