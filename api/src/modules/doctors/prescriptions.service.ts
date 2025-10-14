import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DoctorPrescription,
  DoctorPrescriptionDocument,
} from './schemas/doctor-prescription.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { UploadPrescriptionDto } from './dto/upload-prescription.dto';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectModel(DoctorPrescription.name)
    private prescriptionModel: Model<DoctorPrescriptionDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async uploadPrescription(
    uploadDto: UploadPrescriptionDto,
    doctorId: string,
    doctorName: string,
    file: any,
  ): Promise<DoctorPrescriptionDocument> {
    // Verify appointment exists and belongs to this doctor
    const appointment = await this.appointmentModel.findOne({
      _id: new Types.ObjectId(uploadDto.appointmentId),
      doctorId,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found or does not belong to this doctor');
    }

    // Use appointment's doctor name if provided name is 'Unknown Doctor' or empty
    if (!doctorName || doctorName === 'Unknown Doctor') {
      doctorName = appointment.doctorName || 'Unknown Doctor';
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await this.prescriptionModel.findOne({
      appointmentId: new Types.ObjectId(uploadDto.appointmentId),
      isActive: true,
    });

    if (existingPrescription) {
      // Delete old file
      if (existsSync(existingPrescription.filePath)) {
        await unlink(existingPrescription.filePath);
      }
      // Mark as inactive
      await this.prescriptionModel.updateOne(
        { _id: existingPrescription._id },
        { isActive: false },
      );
    }

    // Generate prescription ID
    const prescriptionId = `PRESC-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // Create new prescription
    const prescription = new this.prescriptionModel({
      prescriptionId,
      appointmentId: new Types.ObjectId(uploadDto.appointmentId),
      doctorId,
      doctorName,
      userId: appointment.userId,
      patientName: appointment.patientName,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      uploadDate: new Date(),
      diagnosis: uploadDto.diagnosis,
      notes: uploadDto.notes,
      isActive: true,
    });

    const savedPrescription = await prescription.save();

    // Update appointment to link prescription (use string prescriptionId, not ObjectId)
    await this.appointmentModel.updateOne(
      { _id: new Types.ObjectId(uploadDto.appointmentId) },
      {
        $set: {
          prescriptionId: savedPrescription.prescriptionId,
          hasPrescription: true,
        },
      },
    );

    return savedPrescription;
  }

  async getDoctorPrescriptions(
    doctorId: string,
    page = 1,
    limit = 20,
  ): Promise<{ prescriptions: DoctorPrescriptionDocument[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      this.prescriptionModel
        .find({ doctorId, isActive: true })
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.prescriptionModel.countDocuments({ doctorId, isActive: true }),
    ]);

    return {
      prescriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPrescriptionById(
    prescriptionId: string,
    doctorId: string,
  ): Promise<DoctorPrescriptionDocument> {
    const prescription = await this.prescriptionModel.findOne({
      prescriptionId,
      doctorId,
      isActive: true,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async deletePrescription(prescriptionId: string, doctorId: string): Promise<void> {
    const prescription = await this.prescriptionModel.findOne({
      prescriptionId,
      doctorId,
      isActive: true,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Soft delete
    await this.prescriptionModel.updateOne(
      { _id: prescription._id },
      { isActive: false },
    );

    // Update appointment
    await this.appointmentModel.updateOne(
      { _id: prescription.appointmentId },
      {
        $unset: { prescriptionId: '' },
        $set: { hasPrescription: false },
      },
    );

    // Delete physical file
    if (existsSync(prescription.filePath)) {
      await unlink(prescription.filePath);
    }
  }

  // Member methods
  async getMemberPrescriptions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ prescriptions: DoctorPrescriptionDocument[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      this.prescriptionModel
        .find({ userId: new Types.ObjectId(userId), isActive: true })
        .populate({
          path: 'appointmentId',
          select: 'appointmentId appointmentNumber appointmentType appointmentDate timeSlot clinicName clinicAddress specialty consultationFee status',
        })
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.prescriptionModel.countDocuments({ userId: new Types.ObjectId(userId), isActive: true }),
    ]);

    return {
      prescriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberPrescriptionById(
    prescriptionId: string,
    userId: string,
  ): Promise<DoctorPrescriptionDocument> {
    const prescription = await this.prescriptionModel.findOne({
      prescriptionId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }
}
