import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DoctorClinicAssignment, DoctorClinicAssignmentDocument } from './schemas/doctor-clinic-assignment.schema';
import { Doctor, DoctorDocument } from '../doctors/schemas/doctor.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { DoctorSlot, DoctorSlotDocument } from '../doctor-slots/schemas/doctor-slot.schema';
import { CounterService } from '../counters/counter.service';

@Injectable()
export class DoctorClinicAssignmentsService {
  private readonly logger = new Logger(DoctorClinicAssignmentsService.name);

  constructor(
    @InjectModel(DoctorClinicAssignment.name)
    private assignmentModel: Model<DoctorClinicAssignmentDocument>,
    @InjectModel(Doctor.name)
    private doctorModel: Model<DoctorDocument>,
    @InjectModel(Clinic.name)
    private clinicModel: Model<ClinicDocument>,
    @InjectModel(DoctorSlot.name)
    private doctorSlotModel: Model<DoctorSlotDocument>,
    private counterService: CounterService,
  ) {}

  async getAssignedClinics(doctorId: string, activeOnly: boolean = true): Promise<Clinic[]> {
    const filter: any = { doctorId };
    if (activeOnly) {
      filter.isActive = true;
    }

    const assignments = await this.assignmentModel
      .find(filter)
      .exec();

    const clinicIds = assignments.map(a => a.clinicId);

    if (clinicIds.length === 0) {
      return [];
    }

    const clinicFilter: any = { clinicId: { $in: clinicIds } };
    if (activeOnly) {
      clinicFilter.isActive = true;
    }

    return this.clinicModel.find(clinicFilter).exec();
  }

  async assignClinic(doctorId: string, clinicId: string, assignedBy: string): Promise<DoctorClinicAssignment> {
    // Validate doctor exists and is active
    const doctor = await this.doctorModel.findOne({ doctorId }).exec();
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    if (!doctor.isActive) {
      throw new BadRequestException(`Doctor ${doctorId} is not active`);
    }

    // Validate clinic exists and is active
    const clinic = await this.clinicModel.findOne({ clinicId }).exec();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }
    if (!clinic.isActive) {
      throw new BadRequestException(`Clinic ${clinicId} is not active`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentModel
      .findOne({ doctorId, clinicId })
      .exec();

    if (existingAssignment) {
      if (existingAssignment.isActive) {
        throw new BadRequestException(`Clinic ${clinicId} is already assigned to doctor ${doctorId}`);
      }
      // Reactivate existing assignment
      existingAssignment.isActive = true;
      existingAssignment.assignedAt = new Date();
      existingAssignment.assignedBy = assignedBy;
      existingAssignment.updatedBy = assignedBy;
      return existingAssignment.save();
    }

    // Create new assignment
    const assignmentId = await this.counterService.generateAssignmentId();
    const assignment = new this.assignmentModel({
      assignmentId,
      doctorId,
      clinicId,
      isActive: true,
      assignedAt: new Date(),
      assignedBy,
      createdBy: assignedBy,
    });

    return assignment.save();
  }

  async unassignClinic(doctorId: string, clinicId: string, updatedBy: string): Promise<void> {
    const assignment = await this.assignmentModel
      .findOne({ doctorId, clinicId, isActive: true })
      .exec();

    if (!assignment) {
      throw new NotFoundException(`Assignment not found for doctor ${doctorId} and clinic ${clinicId}`);
    }

    // Check for active DoctorSlots at this clinic
    const activeSlotsCount = await this.doctorSlotModel
      .countDocuments({
        doctorId,
        clinicId,
        isActive: true,
      })
      .exec();

    if (activeSlotsCount > 0) {
      throw new BadRequestException(
        `Cannot unassign clinic. Doctor has ${activeSlotsCount} active schedule(s) at this clinic. ` +
        `Please deactivate all schedules at this clinic before unassigning.`
      );
    }

    // Soft delete
    assignment.isActive = false;
    assignment.updatedBy = updatedBy;
    await assignment.save();

    this.logger.log(`Unassigned clinic ${clinicId} from doctor ${doctorId} by ${updatedBy}`);
  }

  async syncClinicAssignments(
    doctorId: string,
    clinicIds: string[],
    assignedBy: string
  ): Promise<{ added: number; removed: number }> {
    // Validate doctor
    const doctor = await this.doctorModel.findOne({ doctorId }).exec();
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    if (!doctor.isActive) {
      throw new BadRequestException(`Doctor ${doctorId} is not active`);
    }

    // Get current assignments
    const currentAssignments = await this.assignmentModel
      .find({ doctorId, isActive: true })
      .exec();

    const currentClinicIds = new Set(currentAssignments.map(a => a.clinicId));
    const newClinicIds = new Set(clinicIds);

    let added = 0;
    let removed = 0;

    // Add new assignments
    for (const clinicId of newClinicIds) {
      if (!currentClinicIds.has(clinicId)) {
        try {
          await this.assignClinic(doctorId, clinicId, assignedBy);
          added++;
        } catch (error) {
          this.logger.error(`Failed to assign clinic ${clinicId}: ${error.message}`);
          throw error;
        }
      }
    }

    // Remove assignments not in new list
    for (const assignment of currentAssignments) {
      if (!newClinicIds.has(assignment.clinicId)) {
        try {
          await this.unassignClinic(doctorId, assignment.clinicId, assignedBy);
          removed++;
        } catch (error) {
          this.logger.error(`Failed to unassign clinic ${assignment.clinicId}: ${error.message}`);
          throw error;
        }
      }
    }

    this.logger.log(`Synced clinics for doctor ${doctorId}: ${added} added, ${removed} removed`);
    return { added, removed };
  }
}
