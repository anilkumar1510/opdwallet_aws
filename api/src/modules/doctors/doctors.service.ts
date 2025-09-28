import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

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

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { specializations: new RegExp(query.search, 'i') },
      ];
    }

    const doctors = await this.doctorModel.find(filter).exec();

    return doctors.map(doctor => doctor.toObject());
  }

  async findOne(doctorId: string): Promise<Doctor | null> {
    return this.doctorModel.findOne({ doctorId, isActive: true }).exec();
  }

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const counter = await this.getNextDoctorNumber();
    const doctorId = `DOC${counter}`;

    const doctorData = {
      ...createDoctorDto,
      doctorId,
      isActive: true,
      rating: 0,
      reviewCount: 0,
    };

    const doctor = new this.doctorModel(doctorData);
    return doctor.save();
  }

  async update(doctorId: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ doctorId });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    Object.assign(doctor, updateDoctorDto);
    return doctor.save();
  }

  async activate(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ doctorId });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    doctor.isActive = true;
    return doctor.save();
  }

  async deactivate(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ doctorId });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    doctor.isActive = false;
    return doctor.save();
  }

  private async getNextDoctorNumber(): Promise<number> {
    const lastDoctor = await this.doctorModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastDoctor) {
      return 10001;
    }

    const lastNumber = parseInt(lastDoctor.doctorId.replace('DOC', ''));
    return lastNumber + 1;
  }
}