import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiagnosticService, DiagnosticServiceCategory } from '../schemas/diagnostic-service.schema';

export interface CreateDiagnosticServiceDto {
  name: string;
  code: string;
  category: DiagnosticServiceCategory;
  description?: string;
  bodyPart?: string;
  requiresContrast?: boolean;
  preparationInstructions?: string;
}

@Injectable()
export class DiagnosticServiceService {
  constructor(
    @InjectModel(DiagnosticService.name)
    private diagnosticServiceModel: Model<DiagnosticService>,
  ) {}

  async createService(createDto: CreateDiagnosticServiceDto): Promise<DiagnosticService> {
    const serviceId = `DIAG-SVC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if service code already exists
    const existingService = await this.diagnosticServiceModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingService) {
      throw new ConflictException(`Diagnostic service with code ${createDto.code} already exists`);
    }

    const service = new this.diagnosticServiceModel({
      serviceId,
      name: createDto.name,
      code: createDto.code.toUpperCase(),
      category: createDto.category,
      description: createDto.description,
      bodyPart: createDto.bodyPart,
      requiresContrast: createDto.requiresContrast || false,
      preparationInstructions: createDto.preparationInstructions,
      isActive: true,
    });

    return service.save();
  }

  async getServiceById(serviceId: string): Promise<DiagnosticService> {
    const service = await this.diagnosticServiceModel.findOne({ serviceId });

    if (!service) {
      throw new NotFoundException(`Diagnostic service ${serviceId} not found`);
    }

    return service;
  }

  async getServiceByCode(code: string): Promise<DiagnosticService | null> {
    return this.diagnosticServiceModel.findOne({ code: code.toUpperCase() });
  }

  async getAllServices(category?: DiagnosticServiceCategory): Promise<DiagnosticService[]> {
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    return this.diagnosticServiceModel.find(filter).sort({ name: 1 }).exec();
  }

  async searchServices(query: string): Promise<DiagnosticService[]> {
    return this.diagnosticServiceModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } },
          { bodyPart: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ name: 1 })
      .limit(50)
      .exec();
  }

  async updateService(
    serviceId: string,
    updateDto: Partial<CreateDiagnosticServiceDto>,
  ): Promise<DiagnosticService> {
    const service = await this.getServiceById(serviceId);

    if (updateDto.name) {
      service.name = updateDto.name;
    }

    if (updateDto.code) {
      const existingService = await this.diagnosticServiceModel.findOne({
        code: updateDto.code.toUpperCase(),
        serviceId: { $ne: serviceId },
      });

      if (existingService) {
        throw new ConflictException(`Diagnostic service with code ${updateDto.code} already exists`);
      }

      service.code = updateDto.code.toUpperCase();
    }

    if (updateDto.category) {
      service.category = updateDto.category;
    }

    if (updateDto.description !== undefined) {
      service.description = updateDto.description;
    }

    if (updateDto.bodyPart !== undefined) {
      service.bodyPart = updateDto.bodyPart;
    }

    if (updateDto.requiresContrast !== undefined) {
      service.requiresContrast = updateDto.requiresContrast;
    }

    if (updateDto.preparationInstructions !== undefined) {
      service.preparationInstructions = updateDto.preparationInstructions;
    }

    return service.save();
  }

  async deactivateService(serviceId: string): Promise<DiagnosticService> {
    const service = await this.getServiceById(serviceId);
    service.isActive = false;
    return service.save();
  }

  async activateService(serviceId: string): Promise<DiagnosticService> {
    const service = await this.getServiceById(serviceId);
    service.isActive = true;
    return service.save();
  }
}
