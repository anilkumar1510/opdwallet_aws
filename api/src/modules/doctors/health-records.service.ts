import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DigitalPrescription,
  DigitalPrescriptionDocument,
} from './schemas/digital-prescription.schema';

@Injectable()
export class HealthRecordsService {
  constructor(
    @InjectModel(DigitalPrescription.name)
    private digitalPrescriptionModel: Model<DigitalPrescriptionDocument>,
  ) {}

  /**
   * Get comprehensive patient health records
   * Only accessible if doctor has/had appointment with patient
   */
  async getPatientRecords(patientId: string) {
    // Convert patientId to ObjectId
    const patientObjectId = new Types.ObjectId(patientId);

    // Fetch all prescriptions for this patient
    const prescriptions = await this.digitalPrescriptionModel
      .find({
        userId: patientObjectId,
        isActive: true,
      })
      .sort({ createdDate: -1 })
      .select(
        'prescriptionId doctorName doctorSpecialty createdDate diagnosis ' +
        'medicines labTests chiefComplaint clinicalFindings allergies ' +
        'medicalHistory vitals patientBloodGroup'
      )
      .lean();

    // Build consolidated patient info from most recent prescription
    const latestPrescription = prescriptions[0];
    const patient = latestPrescription ? {
      name: latestPrescription['patientName'] || 'Unknown',
      age: latestPrescription['patientAge'],
      gender: latestPrescription['patientGender'],
      bloodGroup: latestPrescription.patientBloodGroup,
      phone: latestPrescription['patientPhone'],
      address: latestPrescription['patientAddress'],
      // Consolidate allergies from all prescriptions
      allergies: this.consolidateAllergies(prescriptions),
      // Consolidate chronic conditions from medical history
      chronicConditions: this.consolidateConditions(prescriptions),
      // Get current medications from latest prescription
      currentMedications: latestPrescription.medicalHistory?.currentMedications || [],
    } : null;

    // Build consultation history from prescriptions
    const consultationHistory = prescriptions.map((prx: any) => ({
      prescriptionId: prx.prescriptionId,
      doctorName: prx.doctorName,
      specialty: prx.doctorSpecialty,
      date: prx.createdDate,
      chiefComplaint: prx.chiefComplaint,
      diagnosis: prx.diagnosis,
    }));

    return {
      patient,
      prescriptions: prescriptions.map((prx: any) => ({
        prescriptionId: prx.prescriptionId,
        doctorName: prx.doctorName,
        doctorSpecialty: prx.doctorSpecialty,
        date: prx.createdDate,
        diagnosis: prx.diagnosis,
        medicines: prx.medicines,
        labTests: prx.labTests,
        chiefComplaint: prx.chiefComplaint,
        clinicalFindings: prx.clinicalFindings,
        vitals: prx.vitals,
      })),
      consultationHistory,
      // Placeholders for future integration
      labReports: [],
      diagnosticReports: [],
    };
  }

  /**
   * Consolidate allergies from all patient prescriptions
   */
  private consolidateAllergies(prescriptions: any[]) {
    const allDrugAllergies = new Set<string>();
    const allFoodAllergies = new Set<string>();
    const allOtherAllergies = new Set<string>();
    let hasKnownAllergies = false;

    prescriptions.forEach((prx) => {
      if (prx.allergies) {
        if (prx.allergies.hasKnownAllergies) {
          hasKnownAllergies = true;
        }
        prx.allergies.drugAllergies?.forEach((a: string) => allDrugAllergies.add(a));
        prx.allergies.foodAllergies?.forEach((a: string) => allFoodAllergies.add(a));
        prx.allergies.otherAllergies?.forEach((a: string) => allOtherAllergies.add(a));
      }
    });

    return {
      hasKnownAllergies,
      drugAllergies: Array.from(allDrugAllergies),
      foodAllergies: Array.from(allFoodAllergies),
      otherAllergies: Array.from(allOtherAllergies),
    };
  }

  /**
   * Consolidate chronic conditions from medical history
   */
  private consolidateConditions(prescriptions: any[]) {
    const allConditions = new Set<string>();

    prescriptions.forEach((prx) => {
      if (prx.medicalHistory?.conditions) {
        prx.medicalHistory.conditions.forEach((c: string) => allConditions.add(c));
      }
    });

    return Array.from(allConditions);
  }
}
