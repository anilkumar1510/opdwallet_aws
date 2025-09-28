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

  async findAll(query: QueryDoctorsDto): Promise<Doctor[]> {
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

    return this.doctorModel.find(filter).exec();
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