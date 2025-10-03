import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LabService, LabServiceCategory } from '../schemas/lab-service.schema';

export interface CreateLabServiceDto {
  name: string;
  code: string;
  category: LabServiceCategory;
  description?: string;
}

@Injectable()
export class LabServiceService {
  constructor(
    @InjectModel(LabService.name)
    private labServiceModel: Model<LabService>,
  ) {}

  async createService(createDto: CreateLabServiceDto): Promise<LabService> {
    const serviceId = `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if service code already exists
    const existingService = await this.labServiceModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingService) {
      throw new ConflictException(`Service with code ${createDto.code} already exists`);
    }

    const service = new this.labServiceModel({
      serviceId,
      name: createDto.name,
      code: createDto.code.toUpperCase(),
      category: createDto.category,
      description: createDto.description,
      isActive: true,
    });

    return service.save();
  }

  async getServiceById(serviceId: string): Promise<LabService> {
    const service = await this.labServiceModel.findOne({ serviceId });

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    return service;
  }

  async getServiceByCode(code: string): Promise<LabService | null> {
    return this.labServiceModel.findOne({ code: code.toUpperCase() });
  }

  async getAllServices(category?: LabServiceCategory): Promise<LabService[]> {
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    return this.labServiceModel.find(filter).sort({ name: 1 }).exec();
  }

  async searchServices(query: string): Promise<LabService[]> {
    return this.labServiceModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ name: 1 })
      .limit(50)
      .exec();
  }

  async updateService(
    serviceId: string,
    updateDto: Partial<CreateLabServiceDto>,
  ): Promise<LabService> {
    const service = await this.getServiceById(serviceId);

    if (updateDto.name) {
      service.name = updateDto.name;
    }

    if (updateDto.code) {
      const existingService = await this.labServiceModel.findOne({
        code: updateDto.code.toUpperCase(),
        serviceId: { $ne: serviceId },
      });

      if (existingService) {
        throw new ConflictException(`Service with code ${updateDto.code} already exists`);
      }

      service.code = updateDto.code.toUpperCase();
    }

    if (updateDto.category) {
      service.category = updateDto.category;
    }

    if (updateDto.description !== undefined) {
      service.description = updateDto.description;
    }

    return service.save();
  }

  async deactivateService(serviceId: string): Promise<LabService> {
    const service = await this.getServiceById(serviceId);
    service.isActive = false;
    return service.save();
  }

  async activateService(serviceId: string): Promise<LabService> {
    const service = await this.getServiceById(serviceId);
    service.isActive = true;
    return service.save();
  }
}
