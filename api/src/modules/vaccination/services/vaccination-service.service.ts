import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VaccinationService } from '../schemas/vaccination-service.schema';
import { CreateVaccinationServiceDto } from '../dto/create-vaccination-service.dto';
import { UpdateVaccinationServiceDto } from '../dto/update-vaccination-service.dto';

@Injectable()
export class VaccinationServiceService {
  constructor(
    @InjectModel(VaccinationService.name)
    private vaccinationServiceModel: Model<VaccinationService>,
  ) {}

  async createService(createDto: CreateVaccinationServiceDto): Promise<VaccinationService> {
    const serviceId = `VSVC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if service code already exists
    const existingService = await this.vaccinationServiceModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingService) {
      throw new ConflictException(`Vaccination service with code ${createDto.code} already exists`);
    }

    const service = new this.vaccinationServiceModel({
      serviceId,
      name: createDto.name,
      code: createDto.code.toUpperCase(),
      category: 'VACCINATION', // Always set to VACCINATION
      description: createDto.description,
      vaccineType: createDto.vaccineType,
      manufacturer: createDto.manufacturer,
      dosesRequired: createDto.dosesRequired,
      doseIntervalDays: createDto.doseIntervalDays,
      ageGroup: createDto.ageGroup,
      administrationRoute: createDto.administrationRoute,
      storageRequirements: createDto.storageRequirements,
      contraindications: createDto.contraindications,
      isActive: true,
    });

    return service.save();
  }

  async getServiceById(serviceId: string): Promise<VaccinationService> {
    const service = await this.vaccinationServiceModel.findOne({ serviceId });

    if (!service) {
      throw new NotFoundException(`Vaccination service ${serviceId} not found`);
    }

    return service;
  }

  async getServiceByCode(code: string): Promise<VaccinationService | null> {
    return this.vaccinationServiceModel.findOne({ code: code.toUpperCase() });
  }

  async getAllServices(): Promise<VaccinationService[]> {
    return this.vaccinationServiceModel.find().sort({ name: 1 }).exec();
  }

  async searchServices(query: string): Promise<VaccinationService[]> {
    return this.vaccinationServiceModel
      .find({
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
    updateDto: UpdateVaccinationServiceDto,
  ): Promise<VaccinationService> {
    const service = await this.getServiceById(serviceId);

    if (updateDto.name) {
      service.name = updateDto.name;
    }

    if (updateDto.code) {
      const existingService = await this.vaccinationServiceModel.findOne({
        code: updateDto.code.toUpperCase(),
        serviceId: { $ne: serviceId },
      });

      if (existingService) {
        throw new ConflictException(`Vaccination service with code ${updateDto.code} already exists`);
      }

      service.code = updateDto.code.toUpperCase();
    }

    if (updateDto.description !== undefined) {
      service.description = updateDto.description;
    }

    if (updateDto.vaccineType !== undefined) {
      service.vaccineType = updateDto.vaccineType;
    }

    if (updateDto.manufacturer !== undefined) {
      service.manufacturer = updateDto.manufacturer;
    }

    if (updateDto.dosesRequired !== undefined) {
      service.dosesRequired = updateDto.dosesRequired;
    }

    if (updateDto.doseIntervalDays !== undefined) {
      service.doseIntervalDays = updateDto.doseIntervalDays;
    }

    if (updateDto.ageGroup !== undefined) {
      service.ageGroup = updateDto.ageGroup;
    }

    if (updateDto.administrationRoute !== undefined) {
      service.administrationRoute = updateDto.administrationRoute;
    }

    if (updateDto.storageRequirements !== undefined) {
      service.storageRequirements = updateDto.storageRequirements;
    }

    if (updateDto.contraindications !== undefined) {
      service.contraindications = updateDto.contraindications;
    }

    if (updateDto.isActive !== undefined) {
      service.isActive = updateDto.isActive;
    }

    return service.save();
  }

  async deactivateService(serviceId: string): Promise<VaccinationService> {
    const service = await this.getServiceById(serviceId);
    service.isActive = false;
    return service.save();
  }

  async activateService(serviceId: string): Promise<VaccinationService> {
    const service = await this.getServiceById(serviceId);
    service.isActive = true;
    return service.save();
  }
}
