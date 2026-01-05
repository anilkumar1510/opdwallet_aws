import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabPrescription, PrescriptionStatus, ServiceType, PrescriptionSource } from '../schemas/lab-prescription.schema';
import { UploadPrescriptionDto } from '../dto/upload-prescription.dto';
import { User } from '../../users/schemas/user.schema';

@Injectable()
export class LabPrescriptionService {
  constructor(
    @InjectModel(LabPrescription.name)
    private prescriptionModel: Model<LabPrescription>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async uploadPrescription(
    userId: Types.ObjectId,
    uploadDto: UploadPrescriptionDto,
    file: any,
  ): Promise<LabPrescription> {
    const prescriptionId = `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const prescription = new this.prescriptionModel({
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
    });

    return prescription.save();
  }

  async submitExistingPrescription(
    userId: Types.ObjectId,
    healthRecordId: string,
    patientId: string,
    patientName: string,
    patientRelationship: string,
    pincode: string,
    prescriptionDate: Date,
  ): Promise<LabPrescription> {
    const prescriptionId = `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Fetch user's pincode if not provided
    let userPincode = pincode;
    if (!userPincode || userPincode.trim() === '') {
      const user = await this.userModel.findById(userId).exec();
      if (user && user.address && user.address.pincode) {
        userPincode = user.address.pincode;
      } else {
        // Use a placeholder if user doesn't have pincode
        userPincode = '000000';
      }
    }

    const prescription = new this.prescriptionModel({
      prescriptionId,
      userId,
      patientId,
      patientName,
      patientRelationship,
      prescriptionDate,
      pincode: userPincode,
      serviceType: ServiceType.LAB,
      source: PrescriptionSource.HEALTH_RECORD,
      healthRecordId: new Types.ObjectId(healthRecordId),
      fileName: `health-record-${healthRecordId}`,
      originalName: 'From Health Records',
      fileType: 'application/pdf',
      fileSize: 0,
      filePath: `/health-records/${healthRecordId}`,
      status: PrescriptionStatus.UPLOADED,
      uploadedAt: new Date(),
    });

    return prescription.save();
  }

  async getPrescriptionById(prescriptionId: string): Promise<LabPrescription> {
    const prescription = await this.prescriptionModel.findOne({ prescriptionId });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }

    return prescription;
  }

  async getUserPrescriptions(userId: Types.ObjectId): Promise<any[]> {
    // Use aggregation to join with lab_orders and get order count
    const prescriptions = await this.prescriptionModel.aggregate([
      // Match user's prescriptions
      { $match: { userId } },

      // Sort by upload date (newest first)
      { $sort: { uploadedAt: -1 } },

      // Left join with lab_orders to check if order exists
      {
        $lookup: {
          from: 'lab_orders',
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
          patientId: 1,
          patientName: 1,
          patientRelationship: 1,
          pincode: 1,
          fileName: 1,
          filePath: 1,
          uploadedAt: 1,
          status: 1,
          serviceType: 1,
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

    // For prescriptions from health records, populate the source prescription to get lab tests
    for (const prescription of prescriptions) {
      if (prescription.source === 'HEALTH_RECORD' && prescription.healthRecordId) {
        // Try to populate from DigitalPrescription first
        const digitalPrescription = await this.prescriptionModel.db
          .model('DigitalPrescription')
          .findById(prescription.healthRecordId)
          .select('labTests doctorName prescriptionDate patientName')
          .lean();

        if (digitalPrescription) {
          prescription.labTests = (digitalPrescription as any).labTests || [];
          prescription.doctorName = (digitalPrescription as any).doctorName;
          prescription.prescriptionDate = (digitalPrescription as any).prescriptionDate;
        } else {
          // Try DoctorPrescription (PDF)
          const pdfPrescription = await this.prescriptionModel.db
            .model('DoctorPrescription')
            .findById(prescription.healthRecordId)
            .select('doctorName prescriptionDate diagnosis notes')
            .lean();

          if (pdfPrescription) {
            prescription.labTests = []; // PDF prescriptions don't have structured lab tests
            prescription.doctorName = (pdfPrescription as any).doctorName;
            prescription.prescriptionDate = (pdfPrescription as any).prescriptionDate;
          }
        }
      }
    }

    return prescriptions;
  }

  async getPendingPrescriptions(): Promise<LabPrescription[]> {
    return this.prescriptionModel
      .find({ status: PrescriptionStatus.UPLOADED })
      .populate('userId', 'name phone email')
      .sort({ uploadedAt: 1 })
      .exec();
  }

  async getPrescriptionsByStatus(status?: PrescriptionStatus): Promise<LabPrescription[]> {
    const query = status ? { status } : {};
    return this.prescriptionModel
      .find(query)
      .populate('userId', 'name phone email')
      .sort({ uploadedAt: -1 })
      .exec();
  }

  async updatePrescriptionStatus(
    prescriptionId: string,
    status: PrescriptionStatus,
    delayReason?: string,
  ): Promise<LabPrescription> {
    const prescription = await this.getPrescriptionById(prescriptionId);

    prescription.status = status;

    if (status === PrescriptionStatus.DIGITIZING) {
      prescription.digitizingStartedAt = new Date();
    }

    if (status === PrescriptionStatus.DIGITIZED) {
      prescription.digitizedAt = new Date();
    }

    if (status === PrescriptionStatus.DELAYED) {
      if (!delayReason) {
        throw new BadRequestException('Delay reason is required for DELAYED status');
      }
      prescription.delayReason = delayReason;
    }

    return prescription.save();
  }

  async deletePrescription(prescriptionId: string): Promise<void> {
    const result = await this.prescriptionModel.deleteOne({ prescriptionId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }
  }
}
