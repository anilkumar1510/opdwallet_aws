import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { QueryDoctorsDto } from './dto/query-doctors.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
  ) {}

  async findAll(query: QueryDoctorsDto): Promise<any[]> {
    const filter: any = { isActive: true };

    if (query.specialtyId) {
      filter.specialtyId = query.specialtyId;
    }

    if (query.city) {
      filter['clinics.city'] = new RegExp(query.city, 'i');
    }

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { specializations: new RegExp(query.search, 'i') },
        { 'clinics.name': new RegExp(query.search, 'i') },
      ];
    }

    if (query.type === 'ONLINE') {
      filter.availableOnline = true;
    } else if (query.type === 'OFFLINE') {
      filter.availableOffline = true;
    }

    const doctors = await this.doctorModel.find(filter).exec();

    return doctors.map(doctor => {
      const availability = this.calculateAvailability(doctor.availableSlots);
      return {
        ...doctor.toObject(),
        availableInMinutes: availability
      };
    });
  }

  private calculateAvailability(availableSlots: any[]): number | null {
    if (!availableSlots || availableSlots.length === 0) {
      return null;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todaySlots = availableSlots.find(daySlot => daySlot.date === today);

    if (!todaySlots || !todaySlots.slots || todaySlots.slots.length === 0) {
      return null;
    }

    let nearestMinutes: number | null = null;

    for (const slotTime of todaySlots.slots) {
      const [time, period] = slotTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);

      let slotHours = hours;
      if (period === 'PM' && hours !== 12) {
        slotHours += 12;
      } else if (period === 'AM' && hours === 12) {
        slotHours = 0;
      }

      const slotMinutes = slotHours * 60 + minutes;
      const diffMinutes = slotMinutes - currentTime;

      if (diffMinutes >= 0 && (nearestMinutes === null || diffMinutes < nearestMinutes)) {
        nearestMinutes = diffMinutes;
      }
    }

    return nearestMinutes;
  }

  async findOne(doctorId: string): Promise<Doctor | null> {
    return this.doctorModel.findOne({ doctorId, isActive: true }).exec();
  }

  async getAvailableSlots(doctorId: string, date?: string): Promise<any> {
    const doctor = await this.doctorModel.findOne({ doctorId, isActive: true }).exec();

    if (!doctor) {
      return null;
    }

    const transformedSlots = doctor.availableSlots.map(daySlot => ({
      date: daySlot.date,
      slots: daySlot.slots.map(timeStr => ({
        time: timeStr,
        available: true
      }))
    }));

    if (date) {
      const slot = transformedSlots.find(s => s.date === date);
      return slot || null;
    }

    return transformedSlots;
  }
}