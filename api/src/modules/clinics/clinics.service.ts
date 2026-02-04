import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Clinic, ClinicDocument } from './schemas/clinic.schema';
import { DoctorSlot, DoctorSlotDocument } from '../doctor-slots/schemas/doctor-slot.schema';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { CounterService } from '../counters/counter.service';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    @InjectModel(DoctorSlot.name) private doctorSlotModel: Model<DoctorSlotDocument>,
    private readonly counterService: CounterService,
  ) {}

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const clinicId = await this.counterService.generateClinicId();

    const clinicData = {
      ...createClinicDto,
      clinicId,
      isActive: createClinicDto.isActive !== undefined ? createClinicDto.isActive : true,
    };

    const clinic = new this.clinicModel(clinicData);
    return clinic.save();
  }

  async findAll(query?: any): Promise<any> {
    const page = parseInt(query?.page || '1');
    const limit = parseInt(query?.limit || '20');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query?.city) {
      filter['address.city'] = new RegExp(query.city, 'i');
    }

    if (query?.state) {
      filter['address.state'] = new RegExp(query.state, 'i');
    }

    if (query?.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { 'address.city': new RegExp(query.search, 'i') },
      ];
    }

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const [clinics, total] = await Promise.all([
      this.clinicModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.clinicModel.countDocuments(filter),
    ]);

    return {
      data: clinics,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(clinicId: string): Promise<Clinic> {
    const clinic = await this.clinicModel.findOne({ clinicId }).exec();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }
    return clinic;
  }

  async update(clinicId: string, updateClinicDto: UpdateClinicDto): Promise<Clinic> {
    const clinic = await this.clinicModel.findOne({ clinicId });
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    Object.assign(clinic, updateClinicDto);
    return clinic.save();
  }

  async activate(clinicId: string): Promise<Clinic> {
    const clinic = await this.clinicModel.findOne({ clinicId });
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    clinic.isActive = true;
    return clinic.save();
  }

  async deactivate(clinicId: string): Promise<Clinic> {
    const clinic = await this.clinicModel.findOne({ clinicId });
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Check for active doctor schedules
    const activeDoctorSlots = await this.doctorSlotModel.countDocuments({
      clinicId,
      isActive: true
    });

    if (activeDoctorSlots > 0) {
      throw new BadRequestException(
        `Cannot deactivate clinic. There are ${activeDoctorSlots} active doctor schedule(s) assigned to this clinic. Please deactivate all doctor schedules first.`
      );
    }

    clinic.isActive = false;
    return clinic.save();
  }

  async remove(clinicId: string): Promise<void> {
    const result = await this.clinicModel.deleteOne({ clinicId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }
  }
}