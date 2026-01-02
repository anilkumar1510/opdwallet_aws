import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DoctorUnavailability, DoctorUnavailabilityDocument } from './schemas/doctor-unavailability.schema';
import { CounterService } from '../counters/counter.service';

export interface CreateUnavailabilityDto {
  doctorId: string;
  startDate: Date | string;
  endDate: Date | string;
  startTime?: string;
  endTime?: string;
  type: string;
  reason?: string;
  isAllDay?: boolean;
  recurrence?: string;
  recurrenceEndDate?: Date | string;
  affectedClinicIds?: string[];
  notifyPatients?: boolean;
}

export interface UpdateUnavailabilityDto {
  startDate?: Date | string;
  endDate?: Date | string;
  startTime?: string;
  endTime?: string;
  type?: string;
  reason?: string;
  isAllDay?: boolean;
  recurrence?: string;
  recurrenceEndDate?: Date | string;
  affectedClinicIds?: string[];
  notifyPatients?: boolean;
}

@Injectable()
export class DoctorCalendarService {
  constructor(
    @InjectModel(DoctorUnavailability.name)
    private unavailabilityModel: Model<DoctorUnavailabilityDocument>,
    private readonly counterService: CounterService,
  ) {}

  async createUnavailability(dto: CreateUnavailabilityDto): Promise<DoctorUnavailability> {
    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Generate unique ID
    const unavailabilityId = await this.counterService.generateUnavailabilityId();

    const unavailability = new this.unavailabilityModel({
      unavailabilityId,
      doctorId: dto.doctorId,
      startDate,
      endDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      type: dto.type,
      reason: dto.reason,
      isAllDay: dto.isAllDay !== undefined ? dto.isAllDay : !dto.startTime,
      recurrence: dto.recurrence || 'NONE',
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
      affectedClinicIds: dto.affectedClinicIds || [],
      notifyPatients: dto.notifyPatients || false,
      isActive: true,
    });

    return unavailability.save();
  }

  async findAllByDoctor(
    doctorId: string,
    includeInactive = false,
  ): Promise<DoctorUnavailability[]> {
    const filter: any = { doctorId };

    if (!includeInactive) {
      filter.isActive = true;
    }

    return this.unavailabilityModel
      .find(filter)
      .sort({ startDate: 1 })
      .exec();
  }

  async findUpcomingByDoctor(doctorId: string): Promise<DoctorUnavailability[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.unavailabilityModel
      .find({
        doctorId,
        isActive: true,
        endDate: { $gte: today },
      })
      .sort({ startDate: 1 })
      .exec();
  }

  async findOne(unavailabilityId: string): Promise<DoctorUnavailabilityDocument> {
    const unavailability = await this.unavailabilityModel
      .findOne({ unavailabilityId })
      .exec();

    if (!unavailability) {
      throw new NotFoundException(`Unavailability with ID ${unavailabilityId} not found`);
    }

    return unavailability;
  }

  async update(
    unavailabilityId: string,
    updateDto: UpdateUnavailabilityDto,
  ): Promise<DoctorUnavailabilityDocument> {
    const unavailability = await this.findOne(unavailabilityId);

    // Validate dates if both are being updated
    if (updateDto.startDate && updateDto.endDate) {
      const startDate = new Date(updateDto.startDate);
      const endDate = new Date(updateDto.endDate);

      if (endDate < startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Update fields
    if (updateDto.startDate) unavailability.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) unavailability.endDate = new Date(updateDto.endDate);
    if (updateDto.startTime !== undefined) unavailability.startTime = updateDto.startTime;
    if (updateDto.endTime !== undefined) unavailability.endTime = updateDto.endTime;
    if (updateDto.type) unavailability.type = updateDto.type;
    if (updateDto.reason !== undefined) unavailability.reason = updateDto.reason;
    if (updateDto.isAllDay !== undefined) unavailability.isAllDay = updateDto.isAllDay;
    if (updateDto.recurrence) unavailability.recurrence = updateDto.recurrence;
    if (updateDto.recurrenceEndDate !== undefined) {
      unavailability.recurrenceEndDate = updateDto.recurrenceEndDate
        ? new Date(updateDto.recurrenceEndDate)
        : undefined;
    }
    if (updateDto.affectedClinicIds !== undefined) {
      unavailability.affectedClinicIds = updateDto.affectedClinicIds;
    }
    if (updateDto.notifyPatients !== undefined) {
      unavailability.notifyPatients = updateDto.notifyPatients;
    }

    return unavailability.save();
  }

  async delete(unavailabilityId: string): Promise<void> {
    const unavailability = await this.findOne(unavailabilityId);
    unavailability.isActive = false;
    await unavailability.save();
  }

  async remove(unavailabilityId: string): Promise<void> {
    const result = await this.unavailabilityModel
      .deleteOne({ unavailabilityId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Unavailability with ID ${unavailabilityId} not found`);
    }
  }

  /**
   * Check if a doctor is unavailable on a specific date/time
   * Used by slot generation service
   */
  async isUnavailable(
    doctorId: string,
    targetDate: Date | string,
    targetTime?: string,
    clinicId?: string,
  ): Promise<boolean> {
    const date = new Date(targetDate);
    date.setHours(0, 0, 0, 0);

    const query: any = {
      doctorId,
      isActive: true,
      startDate: { $lte: date },
      endDate: { $gte: date },
    };

    // If clinicId is provided, check if unavailability applies to this clinic
    // Empty affectedClinicIds means applies to all clinics
    if (clinicId) {
      query.$or = [
        { affectedClinicIds: { $size: 0 } },
        { affectedClinicIds: clinicId },
      ];
    }

    const unavailabilities = await this.unavailabilityModel.find(query).exec();

    if (unavailabilities.length === 0) {
      return false;
    }

    // If no time specified or any unavailability is all-day, return true
    if (!targetTime || unavailabilities.some(u => u.isAllDay)) {
      return true;
    }

    // Check time-specific unavailability
    for (const unavailability of unavailabilities) {
      if (unavailability.startTime && unavailability.endTime) {
        if (targetTime >= unavailability.startTime && targetTime < unavailability.endTime) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get unavailable dates for a doctor in a date range
   * Used for calendar display
   */
  async getUnavailableDates(
    doctorId: string,
    startDate: Date | string,
    endDate: Date | string,
    clinicId?: string,
  ): Promise<string[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const query: any = {
      doctorId,
      isActive: true,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    };

    if (clinicId) {
      query.$and = [
        {
          $or: [
            { affectedClinicIds: { $size: 0 } },
            { affectedClinicIds: clinicId },
          ],
        },
      ];
    }

    const unavailabilities = await this.unavailabilityModel.find(query).exec();

    // Collect all unavailable dates
    const unavailableDates = new Set<string>();

    unavailabilities.forEach(unavailability => {
      const current = new Date(unavailability.startDate);
      const uEnd = new Date(unavailability.endDate);

      while (current <= uEnd) {
        if (current >= start && current <= end) {
          unavailableDates.add(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return Array.from(unavailableDates).sort();
  }
}
