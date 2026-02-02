import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DoctorSlot, DoctorSlotDocument } from './schemas/doctor-slot.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { CreateSlotConfigDto } from './dto/create-slot-config.dto';
import { UpdateSlotConfigDto } from './dto/update-slot-config.dto';
import { CounterService } from '../counters/counter.service';
import { DoctorCalendarService } from './doctor-calendar.service';
import { DoctorClinicAssignmentsService } from '../doctor-clinic-assignments/doctor-clinic-assignments.service';

@Injectable()
export class DoctorSlotsService {
  private readonly logger = new Logger(DoctorSlotsService.name);

  constructor(
    @InjectModel(DoctorSlot.name) private slotModel: Model<DoctorSlotDocument>,
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    private readonly counterService: CounterService,
    @Inject(forwardRef(() => DoctorCalendarService))
    private readonly calendarService: DoctorCalendarService,
    @Inject(forwardRef(() => DoctorClinicAssignmentsService))
    private readonly assignmentsService: DoctorClinicAssignmentsService,
  ) {}

  async create(createSlotDto: CreateSlotConfigDto): Promise<DoctorSlot> {
    const slotId = await this.counterService.generateSlotId();

    const slotData = {
      ...createSlotDto,
      slotId,
      isActive: createSlotDto.isActive !== undefined ? createSlotDto.isActive : true,
      maxAppointments: createSlotDto.maxAppointments || 20,
    };

    const slot = new this.slotModel(slotData);
    const savedSlot = await slot.save();

    // Auto-assign clinic to doctor if the schedule is active and has a clinicId
    if (savedSlot.isActive && savedSlot.clinicId && savedSlot.consultationType === 'IN_CLINIC') {
      try {
        await this.assignmentsService.assignClinic(
          savedSlot.doctorId,
          savedSlot.clinicId,
          'SYSTEM_AUTO_ASSIGN'
        );
        this.logger.log(`Auto-assigned clinic ${savedSlot.clinicId} to doctor ${savedSlot.doctorId} after schedule creation`);
      } catch (error) {
        // If clinic is already assigned or assignment fails, just log it (don't fail schedule creation)
        this.logger.warn(`Could not auto-assign clinic ${savedSlot.clinicId} to doctor ${savedSlot.doctorId}: ${error.message}`);
      }
    }

    return savedSlot;
  }

  async findAll(query?: any): Promise<any[]> {
    const filter: any = {};

    if (query?.doctorId) {
      filter.doctorId = query.doctorId;
    }

    if (query?.clinicId) {
      filter.clinicId = query.clinicId;
    }

    if (query?.dayOfWeek) {
      filter.dayOfWeek = query.dayOfWeek;
    }

    if (query?.consultationType) {
      filter.consultationType = query.consultationType;
    }

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    // STEP 1: Fetch slots based on filters
    const slots = await this.slotModel
      .find(filter)
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean()
      .exec();

    if (slots.length === 0) {
      return [];
    }

    // STEP 2: Collect unique clinic IDs
    const clinicIds = new Set<string>();
    slots.forEach(slot => {
      if (slot.clinicId) {
        clinicIds.add(slot.clinicId);
      }
    });

    // STEP 3: Batch fetch all clinics in ONE query (prevents N+1 problem)
    const clinicsArray = await this.clinicModel
      .find({ clinicId: { $in: Array.from(clinicIds) } })
      .select('clinicId name address.city')
      .lean()
      .exec();

    // STEP 4: Build clinic lookup map for O(1) access
    const clinicMap = new Map();
    clinicsArray.forEach(clinic => {
      clinicMap.set(clinic.clinicId, {
        clinicId: clinic.clinicId,
        name: clinic.name,
        city: clinic.address?.city || '',
      });
    });

    // STEP 5: Merge clinic data into slots
    let enrichedSlots = slots.map(slot => ({
      ...slot,
      clinic: clinicMap.get(slot.clinicId) || {
        clinicId: slot.clinicId,
        name: 'Unknown Clinic',
        city: '',
      },
    }));

    // STEP 6: Filter by clinic name if search query provided (backend search)
    if (query?.clinicName) {
      const searchLower = query.clinicName.toLowerCase();
      enrichedSlots = enrichedSlots.filter(slot =>
        slot.clinic.name.toLowerCase().includes(searchLower)
      );
    }

    return enrichedSlots;
  }

  async findOne(slotId: string): Promise<DoctorSlot> {
    const slot = await this.slotModel.findOne({ slotId }).exec();
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }
    return slot;
  }

  async findByDoctor(doctorId: string): Promise<DoctorSlot[]> {
    return this.slotModel.find({ doctorId, isActive: true }).sort({ dayOfWeek: 1, startTime: 1 }).exec();
  }

  async findByClinic(clinicId: string): Promise<DoctorSlot[]> {
    return this.slotModel.find({ clinicId, isActive: true }).sort({ dayOfWeek: 1, startTime: 1 }).exec();
  }

  async findByDoctorAndDay(doctorId: string, dayOfWeek: string): Promise<DoctorSlot[]> {
    return this.slotModel.find({ doctorId, dayOfWeek, isActive: true }).sort({ startTime: 1 }).exec();
  }

  async update(slotId: string, updateSlotDto: UpdateSlotConfigDto): Promise<DoctorSlot> {
    const slot = await this.slotModel.findOne({ slotId });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    Object.assign(slot, updateSlotDto);
    return slot.save();
  }

  async activate(slotId: string): Promise<DoctorSlot> {
    const slot = await this.slotModel.findOne({ slotId });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    slot.isActive = true;
    const savedSlot = await slot.save();

    // Auto-assign clinic to doctor when activating a schedule
    if (savedSlot.clinicId && savedSlot.consultationType === 'IN_CLINIC') {
      try {
        await this.assignmentsService.assignClinic(
          savedSlot.doctorId,
          savedSlot.clinicId,
          'SYSTEM_AUTO_ASSIGN'
        );
        this.logger.log(`Auto-assigned clinic ${savedSlot.clinicId} to doctor ${savedSlot.doctorId} after schedule activation`);
      } catch (error) {
        // If clinic is already assigned, just log it
        this.logger.warn(`Could not auto-assign clinic ${savedSlot.clinicId} to doctor ${savedSlot.doctorId}: ${error.message}`);
      }
    }

    return savedSlot;
  }

  async deactivate(slotId: string): Promise<DoctorSlot> {
    const slot = await this.slotModel.findOne({ slotId });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    const doctorId = slot.doctorId;
    const clinicId = slot.clinicId;

    slot.isActive = false;
    const savedSlot = await slot.save();

    // Auto-unassign clinic if no active schedules remain for this doctor-clinic combination
    if (clinicId && savedSlot.consultationType === 'IN_CLINIC') {
      const remainingActiveSlots = await this.slotModel.countDocuments({
        doctorId,
        clinicId,
        isActive: true,
      });

      if (remainingActiveSlots === 0) {
        try {
          await this.assignmentsService.unassignClinic(doctorId, clinicId, 'SYSTEM_AUTO_UNASSIGN');
          this.logger.log(`Auto-unassigned clinic ${clinicId} from doctor ${doctorId} as no active schedules remain`);
        } catch (error) {
          // If unassignment fails, just log it
          this.logger.warn(`Could not auto-unassign clinic ${clinicId} from doctor ${doctorId}: ${error.message}`);
        }
      }
    }

    return savedSlot;
  }

  async remove(slotId: string): Promise<void> {
    const result = await this.slotModel.deleteOne({ slotId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }
  }

  async blockDate(slotId: string, date: string): Promise<DoctorSlot> {
    const slot = await this.slotModel.findOne({ slotId });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    if (!slot.blockedDates) {
      slot.blockedDates = [];
    }

    if (!slot.blockedDates.includes(date)) {
      slot.blockedDates.push(date);
    }

    return slot.save();
  }

  async unblockDate(slotId: string, date: string): Promise<DoctorSlot> {
    const slot = await this.slotModel.findOne({ slotId });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    if (slot.blockedDates) {
      slot.blockedDates = slot.blockedDates.filter(d => d !== date);
    }

    return slot.save();
  }

  async generateTimeSlots(slotId: string, targetDate: string): Promise<any[]> {
    const slot = await this.findOne(slotId);

    if (!slot.isActive) {
      throw new BadRequestException('Slot configuration is not active');
    }

    if (slot.blockedDates && slot.blockedDates.includes(targetDate)) {
      return [];
    }

    if (slot.validFrom && new Date(targetDate) < new Date(slot.validFrom)) {
      return [];
    }

    if (slot.validUntil && new Date(targetDate) > new Date(slot.validUntil)) {
      return [];
    }

    // Check if doctor is unavailable on this date
    const isUnavailable = await this.calendarService.isUnavailable(
      slot.doctorId,
      targetDate,
      undefined, // Check entire day first
      slot.clinicId,
    );

    if (isUnavailable) {
      // If entirely unavailable for the day, return empty slots
      return [];
    }

    const date = new Date(targetDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    if (slot.dayOfWeek !== dayOfWeek) {
      return [];
    }

    const timeSlots = [];
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + slot.slotDuration <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMinute = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + slot.slotDuration;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMinute = slotEndMinutes % 60;

      const startTime = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`;

      // Check if this specific time is unavailable
      const isTimeUnavailable = await this.calendarService.isUnavailable(
        slot.doctorId,
        targetDate,
        startTime,
        slot.clinicId,
      );

      if (!isTimeUnavailable) {
        timeSlots.push({
          startTime,
          endTime: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`,
          duration: slot.slotDuration,
          fee: slot.consultationFee,
          consultationType: slot.consultationType,
          available: true,
        });
      }

      currentMinutes += slot.slotDuration;
    }

    return timeSlots;
  }
}