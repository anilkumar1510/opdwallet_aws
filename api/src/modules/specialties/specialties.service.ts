import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Specialty, SpecialtyDocument } from './schemas/specialty.schema';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectModel(Specialty.name) private specialtyModel: Model<SpecialtyDocument>,
  ) {}

  async findAll(): Promise<Specialty[]> {
    return this.specialtyModel
      .find({ isActive: true })
      .sort({ displayOrder: 1 })
      .exec();
  }

  async findOne(specialtyId: string): Promise<Specialty | null> {
    return this.specialtyModel.findOne({ specialtyId, isActive: true }).exec();
  }

  async findByCode(code: string): Promise<Specialty | null> {
    return this.specialtyModel.findOne({ code, isActive: true }).exec();
  }
}