import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Specialty, SpecialtyDocument } from './schemas/specialty.schema';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

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

  async findAllForAdmin(): Promise<Specialty[]> {
    return this.specialtyModel
      .find()
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  async findOne(specialtyId: string): Promise<Specialty | null> {
    return this.specialtyModel.findOne({ specialtyId, isActive: true }).exec();
  }

  async findById(id: string): Promise<Specialty | null> {
    return this.specialtyModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<Specialty | null> {
    return this.specialtyModel.findOne({ code, isActive: true }).exec();
  }

  async create(createSpecialtyDto: CreateSpecialtyDto): Promise<Specialty> {
    // Check if code already exists
    const existing = await this.specialtyModel.findOne({
      code: createSpecialtyDto.code.toUpperCase()
    }).exec();

    if (existing) {
      throw new BadRequestException('Specialty with this code already exists');
    }

    // Generate specialtyId
    const specialtyId = await this.generateSpecialtyId();

    const specialty = new this.specialtyModel({
      ...createSpecialtyDto,
      code: createSpecialtyDto.code.toUpperCase(),
      specialtyId,
      isActive: createSpecialtyDto.isActive ?? true,
      displayOrder: createSpecialtyDto.displayOrder ?? 999,
    });

    return specialty.save();
  }

  async update(id: string, updateSpecialtyDto: UpdateSpecialtyDto): Promise<Specialty> {
    const specialty = await this.specialtyModel.findById(id).exec();

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    // If code is being updated, check if new code already exists
    if (updateSpecialtyDto.code && updateSpecialtyDto.code !== specialty.code) {
      const existing = await this.specialtyModel.findOne({
        code: updateSpecialtyDto.code.toUpperCase(),
        _id: { $ne: id }
      }).exec();

      if (existing) {
        throw new BadRequestException('Specialty with this code already exists');
      }
    }

    if (updateSpecialtyDto.code) {
      updateSpecialtyDto.code = updateSpecialtyDto.code.toUpperCase();
    }

    Object.assign(specialty, updateSpecialtyDto);
    return specialty.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.specialtyModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Specialty not found');
    }
  }

  async toggleActive(id: string): Promise<Specialty> {
    const specialty = await this.specialtyModel.findById(id).exec();

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    specialty.isActive = !specialty.isActive;
    return specialty.save();
  }

  private async generateSpecialtyId(): Promise<string> {
    const count = await this.specialtyModel.countDocuments().exec();
    const nextId = count + 1;
    return `SPEC${nextId.toString().padStart(3, '0')}`;
  }
}