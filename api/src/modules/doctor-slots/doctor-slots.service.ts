import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DoctorSlot, DoctorSlotDocument } from './schemas/doctor-slot.schema';
import { CreateSlotConfigDto } from './dto/create-slot-config.dto';
import { UpdateSlotConfigDto } from './dto/update-slot-config.dto';

@Injectable()
export class DoctorSlotsService {
  constructor(
    @InjectModel(DoctorSlot.name) private slotModel: Model<DoctorSlotDocument>,
  ) {}

  async create(createSlotDto: CreateSlotConfigDto): Promise<DoctorSlot> {
    const counter = await this.getNextSlotNumber();
    const slotId = `SL${String(counter).padStart(5, '0')}`;

    const slotData = {
      ...createSlotDto,
      slotId,
      isActive: createSlotDto.isActive !== undefined ? createSlotDto.isActive : true,
      maxAppointments: createSlotDto.maxAppointments || 20,
    };

    const slot = new this.slotModel(slotData);
    return slot.save();
  }

  async findAll(query?: any): Promise<DoctorSlot[]> {
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

    return this.slotModel.find(filter).sort({ dayOfWeek: 1, startTime: 1 }).exec();
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
    return slot.save();
  }

  async deactivate(slotId: string): Promise<DoctorSlot> {
    const slot = await this.slotModel.findOne({ slotId });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    slot.isActive = false;
    return slot.save();
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

      timeSlots.push({
        startTime: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`,
        endTime: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`,
        duration: slot.slotDuration,
        fee: slot.consultationFee,
        consultationType: slot.consultationType,
        available: true,
      });

      currentMinutes += slot.slotDuration;
    }

    return timeSlots;
  }

  private async getNextSlotNumber(): Promise<number> {
    const lastSlot = await this.slotModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastSlot) {
      return 1;
    }

    const lastNumber = parseInt(lastSlot.slotId.replace('SL', ''));
    return lastNumber + 1;
  }
}