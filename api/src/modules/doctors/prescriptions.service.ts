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
    filterUsed = false,
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

    // Only filter if requested (for lab booking prescription selector)
    if (filterUsed) {
      // Filter out prescriptions that already have lab_prescriptions created
      const labPrescriptionModel = this.prescriptionModel.db.model('LabPrescription');
      const usedPrescriptions = await labPrescriptionModel
        .find({
          userId: new Types.ObjectId(userId),
          source: 'HEALTH_RECORD',
          healthRecordId: { $exists: true },
        })
        .select('healthRecordId')
        .lean();

      const usedHealthRecordIds = new Set(
        usedPrescriptions.map((p: any) => p.healthRecordId.toString()),
      );

      // Filter out already-used prescriptions
      const availablePrescriptions = prescriptions.filter(
        (p) => !usedHealthRecordIds.has((p._id as Types.ObjectId).toString()),
      );

      return {
        prescriptions: availablePrescriptions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Return all prescriptions without filtering
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
    console.log('\n========== GET MEMBER PRESCRIPTION BY ID ==========');
    console.log('[PRESCRIPTION-SERVICE] Timestamp:', new Date().toISOString());
    console.log('[PRESCRIPTION-SERVICE] Input prescriptionId:', prescriptionId);
    console.log('[PRESCRIPTION-SERVICE] Input prescriptionId type:', typeof prescriptionId);
    console.log('[PRESCRIPTION-SERVICE] Input userId:', userId);
    console.log('[PRESCRIPTION-SERVICE] Input userId type:', typeof userId);

    const userIdObj = new Types.ObjectId(userId);
    console.log('[PRESCRIPTION-SERVICE] Converted userId to ObjectId:', userIdObj.toString());

    const query = {
      prescriptionId,
      userId: userIdObj,
      isActive: true,
    };
    console.log('[PRESCRIPTION-SERVICE] Query:', JSON.stringify(query, null, 2));

    const prescription = await this.prescriptionModel.findOne(query);

    console.log('[PRESCRIPTION-SERVICE] Query result:', prescription ? 'FOUND' : 'NOT FOUND');

    if (prescription) {
      console.log('[PRESCRIPTION-SERVICE] ✅ Prescription Details:');
      console.log('[PRESCRIPTION-SERVICE] - _id:', prescription._id?.toString());
      console.log('[PRESCRIPTION-SERVICE] - prescriptionId:', prescription.prescriptionId);
      console.log('[PRESCRIPTION-SERVICE] - appointmentId:', prescription.appointmentId?.toString());
      console.log('[PRESCRIPTION-SERVICE] - userId:', prescription.userId?.toString());
      console.log('[PRESCRIPTION-SERVICE] - doctorId:', prescription.doctorId);
      console.log('[PRESCRIPTION-SERVICE] - doctorName:', prescription.doctorName);
      console.log('[PRESCRIPTION-SERVICE] - patientName:', prescription.patientName);
      console.log('[PRESCRIPTION-SERVICE] - fileName:', prescription.fileName);
      console.log('[PRESCRIPTION-SERVICE] - filePath:', prescription.filePath);
      console.log('[PRESCRIPTION-SERVICE] - isActive:', prescription.isActive);
      console.log('[PRESCRIPTION-SERVICE] - uploadDate:', prescription.uploadDate);
      console.log('========== PRESCRIPTION FOUND ==========\n');
      return prescription;
    }

    // If not found, do a broader search to help debug
    console.log('[PRESCRIPTION-SERVICE] ❌ Prescription not found with query');
    console.log('[PRESCRIPTION-SERVICE] Attempting broader search for debugging...');

    const allPrescriptionsForUser = await this.prescriptionModel.find({
      userId: userIdObj,
      isActive: true,
    }).limit(10);
    console.log('[PRESCRIPTION-SERVICE] Total active prescriptions for user:', allPrescriptionsForUser.length);

    if (allPrescriptionsForUser.length > 0) {
      console.log('[PRESCRIPTION-SERVICE] User has these prescriptionIds:');
      allPrescriptionsForUser.forEach((p, i) => {
        console.log(`[PRESCRIPTION-SERVICE]   ${i + 1}. ${p.prescriptionId} (Appointment: ${p.appointmentId?.toString()})`);
      });
    }

    const prescriptionByIdOnly = await this.prescriptionModel.findOne({
      prescriptionId,
      isActive: true,
    });

    if (prescriptionByIdOnly) {
      console.log('[PRESCRIPTION-SERVICE] ⚠️  Prescription EXISTS but belongs to different user:');
      console.log('[PRESCRIPTION-SERVICE] - Expected userId:', userIdObj.toString());
      console.log('[PRESCRIPTION-SERVICE] - Actual userId:', prescriptionByIdOnly.userId?.toString());
      console.log('[PRESCRIPTION-SERVICE] - PatientName:', prescriptionByIdOnly.patientName);
    } else {
      console.log('[PRESCRIPTION-SERVICE] Prescription does not exist in database at all');
    }

    console.log('========== PRESCRIPTION NOT FOUND ==========\n');
    throw new NotFoundException('Prescription not found');
  }
}
