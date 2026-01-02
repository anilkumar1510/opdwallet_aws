import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrescriptionTemplate, PrescriptionTemplateDocument } from './schemas/prescription-template.schema';
import { CounterService } from '../counters/counter.service';
import { MedicineItem, LabTestItem } from './schemas/digital-prescription.schema';

export interface CreateTemplateDto {
  doctorId: string;
  templateName: string;
  description?: string;
  diagnosis?: string;
  medicines?: MedicineItem[];
  labTests?: LabTestItem[];
  generalInstructions?: string;
  dietaryAdvice?: string;
  precautions?: string;
}

export interface UpdateTemplateDto {
  templateName?: string;
  description?: string;
  diagnosis?: string;
  medicines?: MedicineItem[];
  labTests?: LabTestItem[];
  generalInstructions?: string;
  dietaryAdvice?: string;
  precautions?: string;
}

@Injectable()
export class PrescriptionTemplateService {
  constructor(
    @InjectModel(PrescriptionTemplate.name)
    private templateModel: Model<PrescriptionTemplateDocument>,
    private readonly counterService: CounterService,
  ) {}

  async create(dto: CreateTemplateDto): Promise<PrescriptionTemplate> {
    // Check if template name already exists for this doctor
    const existing = await this.templateModel.findOne({
      doctorId: dto.doctorId,
      templateName: dto.templateName,
      isActive: true,
    });

    if (existing) {
      throw new BadRequestException('A template with this name already exists');
    }

    const templateId = await this.counterService.generateTemplateId();

    const template = new this.templateModel({
      templateId,
      doctorId: dto.doctorId,
      templateName: dto.templateName,
      description: dto.description,
      diagnosis: dto.diagnosis,
      medicines: dto.medicines || [],
      labTests: dto.labTests || [],
      generalInstructions: dto.generalInstructions,
      dietaryAdvice: dto.dietaryAdvice,
      precautions: dto.precautions,
      isActive: true,
      usageCount: 0,
    });

    return template.save();
  }

  async findAllByDoctor(doctorId: string): Promise<PrescriptionTemplate[]> {
    return this.templateModel
      .find({ doctorId, isActive: true })
      .sort({ usageCount: -1, templateName: 1 })
      .exec();
  }

  async findOne(templateId: string, doctorId: string): Promise<PrescriptionTemplateDocument> {
    const template = await this.templateModel.findOne({
      templateId,
      doctorId,
      isActive: true,
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(
    templateId: string,
    doctorId: string,
    dto: UpdateTemplateDto,
  ): Promise<PrescriptionTemplate> {
    const template = await this.findOne(templateId, doctorId);

    // Check if new name conflicts with existing template
    if (dto.templateName && dto.templateName !== template.templateName) {
      const existing = await this.templateModel.findOne({
        doctorId,
        templateName: dto.templateName,
        isActive: true,
        templateId: { $ne: templateId },
      });

      if (existing) {
        throw new BadRequestException('A template with this name already exists');
      }
    }

    Object.assign(template, dto);
    return template.save();
  }

  async delete(templateId: string, doctorId: string): Promise<void> {
    const template = await this.findOne(templateId, doctorId);
    template.isActive = false;
    await template.save();
  }

  async incrementUsage(templateId: string, doctorId: string): Promise<void> {
    await this.templateModel.updateOne(
      { templateId, doctorId },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date() },
      },
    );
  }
}
