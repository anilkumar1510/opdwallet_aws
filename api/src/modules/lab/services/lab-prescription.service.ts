import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabPrescription, PrescriptionStatus } from '../schemas/lab-prescription.schema';
import { UploadPrescriptionDto } from '../dto/upload-prescription.dto';

@Injectable()
export class LabPrescriptionService {
  constructor(
    @InjectModel(LabPrescription.name)
    private prescriptionModel: Model<LabPrescription>,
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

  async getPrescriptionById(prescriptionId: string): Promise<LabPrescription> {
    const prescription = await this.prescriptionModel.findOne({ prescriptionId });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }

    return prescription;
  }

  async getUserPrescriptions(userId: Types.ObjectId): Promise<LabPrescription[]> {
    return this.prescriptionModel
      .find({ userId })
      .sort({ uploadedAt: -1 })
      .exec();
  }

  async getPendingPrescriptions(): Promise<LabPrescription[]> {
    return this.prescriptionModel
      .find({ status: PrescriptionStatus.UPLOADED })
      .sort({ uploadedAt: 1 })
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
