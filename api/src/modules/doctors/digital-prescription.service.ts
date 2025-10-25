import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DigitalPrescription,
  DigitalPrescriptionDocument,
} from './schemas/digital-prescription.schema';
import { Medicine, MedicineDocument } from './schemas/medicine.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { CreateDigitalPrescriptionDto, UpdateDigitalPrescriptionDto } from './dto/create-digital-prescription.dto';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class DigitalPrescriptionService {
  constructor(
    @InjectModel(DigitalPrescription.name)
    private digitalPrescriptionModel: Model<DigitalPrescriptionDocument>,
    @InjectModel(Medicine.name)
    private medicineModel: Model<MedicineDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async createDigitalPrescription(
    createDto: CreateDigitalPrescriptionDto,
    doctorId: string,
    doctorName: string,
    doctorQualification?: string,
    doctorRegistrationNumber?: string,
  ): Promise<DigitalPrescriptionDocument> {
    // Verify appointment exists and belongs to this doctor
    const appointment = await this.appointmentModel.findOne({
      _id: new Types.ObjectId(createDto.appointmentId),
      doctorId,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found or does not belong to this doctor');
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await this.digitalPrescriptionModel.findOne({
      appointmentId: new Types.ObjectId(createDto.appointmentId),
      isActive: true,
    });

    if (existingPrescription) {
      throw new BadRequestException('Prescription already exists for this appointment');
    }

    // Generate prescription ID
    const prescriptionId = `DPRESC-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // Create digital prescription
    const prescription = new this.digitalPrescriptionModel({
      prescriptionId,
      appointmentId: new Types.ObjectId(createDto.appointmentId),
      doctorId,
      doctorName,
      doctorQualification,
      doctorRegistrationNumber,
      userId: appointment.userId,
      patientName: appointment.patientName,
      chiefComplaint: createDto.chiefComplaint,
      clinicalFindings: createDto.clinicalFindings,
      diagnosis: createDto.diagnosis,
      medicines: createDto.medicines || [],
      labTests: createDto.labTests || [],
      followUpDate: createDto.followUpDate ? new Date(createDto.followUpDate) : undefined,
      followUpInstructions: createDto.followUpInstructions,
      generalInstructions: createDto.generalInstructions,
      precautions: createDto.precautions,
      dietaryAdvice: createDto.dietaryAdvice,
      prescriptionType: 'DIGITAL',
      pdfGenerated: false,
      createdDate: new Date(),
      isActive: true,
    });

    const savedPrescription = await prescription.save();

    // Update appointment to link prescription
    await this.appointmentModel.updateOne(
      { _id: new Types.ObjectId(createDto.appointmentId) },
      {
        $set: {
          prescriptionId: savedPrescription.prescriptionId,
          hasPrescription: true,
        },
      },
    );

    return savedPrescription;
  }

  async updateDigitalPrescription(
    prescriptionId: string,
    updateDto: UpdateDigitalPrescriptionDto,
    doctorId: string,
  ): Promise<DigitalPrescriptionDocument> {
    const prescription = await this.digitalPrescriptionModel.findOne({
      prescriptionId,
      doctorId,
      isActive: true,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Update fields
    if (updateDto.chiefComplaint !== undefined) prescription.chiefComplaint = updateDto.chiefComplaint;
    if (updateDto.clinicalFindings !== undefined) prescription.clinicalFindings = updateDto.clinicalFindings;
    if (updateDto.diagnosis !== undefined) prescription.diagnosis = updateDto.diagnosis;
    if (updateDto.medicines !== undefined) prescription.medicines = updateDto.medicines;
    if (updateDto.labTests !== undefined) prescription.labTests = updateDto.labTests;
    if (updateDto.followUpDate !== undefined) prescription.followUpDate = new Date(updateDto.followUpDate);
    if (updateDto.followUpInstructions !== undefined) prescription.followUpInstructions = updateDto.followUpInstructions;
    if (updateDto.generalInstructions !== undefined) prescription.generalInstructions = updateDto.generalInstructions;
    if (updateDto.precautions !== undefined) prescription.precautions = updateDto.precautions;
    if (updateDto.dietaryAdvice !== undefined) prescription.dietaryAdvice = updateDto.dietaryAdvice;

    // Reset PDF if medicines or diagnosis changed
    if (updateDto.medicines || updateDto.diagnosis) {
      prescription.pdfGenerated = false;
      prescription.pdfPath = undefined;
      prescription.pdfFileName = undefined;
    }

    return await prescription.save();
  }

  async getDoctorDigitalPrescriptions(
    doctorId: string,
    page = 1,
    limit = 20,
  ): Promise<{ prescriptions: DigitalPrescriptionDocument[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      this.digitalPrescriptionModel
        .find({ doctorId, isActive: true })
        .sort({ createdDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.digitalPrescriptionModel.countDocuments({ doctorId, isActive: true }),
    ]);

    return {
      prescriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDigitalPrescriptionById(
    prescriptionId: string,
    doctorId: string,
  ): Promise<DigitalPrescriptionDocument> {
    const prescription = await this.digitalPrescriptionModel.findOne({
      prescriptionId,
      doctorId,
      isActive: true,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async deleteDigitalPrescription(prescriptionId: string, doctorId: string): Promise<void> {
    const prescription = await this.digitalPrescriptionModel.findOne({
      prescriptionId,
      doctorId,
      isActive: true,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Soft delete
    await this.digitalPrescriptionModel.updateOne(
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
  }

  // Member methods
  async getMemberDigitalPrescriptions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ prescriptions: DigitalPrescriptionDocument[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      this.digitalPrescriptionModel
        .find({ userId: new Types.ObjectId(userId), isActive: true })
        .populate({
          path: 'appointmentId',
          select: 'appointmentId appointmentNumber appointmentType appointmentDate timeSlot clinicName clinicAddress specialty consultationFee status',
        })
        .sort({ createdDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.digitalPrescriptionModel.countDocuments({ userId: new Types.ObjectId(userId), isActive: true }),
    ]);

    return {
      prescriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberDigitalPrescriptionById(
    prescriptionId: string,
    userId: string,
  ): Promise<DigitalPrescriptionDocument> {
    const prescription = await this.digitalPrescriptionModel.findOne({
      prescriptionId,
      userId: new Types.ObjectId(userId),
      isActive: true,
    }).populate({
      path: 'appointmentId',
      select: 'appointmentId appointmentNumber appointmentType appointmentDate timeSlot clinicName clinicAddress specialty consultationFee status',
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  // Medicine search/autocomplete
  async searchMedicines(query: string, limit = 20): Promise<MedicineDocument[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const medicines = await this.medicineModel
      .find({
        $or: [
          { genericName: { $regex: query, $options: 'i' } },
          { brandNames: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      })
      .limit(limit)
      .exec();

    return medicines;
  }

  // Seed medicine database (admin function)
  async seedMedicineDatabase(medicines: any[]): Promise<number> {
    try {
      const bulkOps = medicines.map(med => ({
        updateOne: {
          filter: { genericName: med.genericName },
          update: {
            $set: {
              genericName: med.genericName,
              brandNames: med.brandNames || [],
              manufacturer: med.manufacturer,
              composition: med.composition,
              form: med.form,
              strength: med.strength,
              searchText: `${med.genericName} ${(med.brandNames || []).join(' ')}`,
              isActive: true,
            },
          },
          upsert: true,
        },
      }));

      const result = await this.medicineModel.bulkWrite(bulkOps);
      return result.upsertedCount + result.modifiedCount;
    } catch (error) {
      throw new BadRequestException('Failed to seed medicine database: ' + error.message);
    }
  }
}
