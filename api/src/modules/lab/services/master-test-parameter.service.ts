import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MasterTestParameter, MasterTestCategory } from '../schemas/master-test-parameter.schema';

export interface CreateMasterTestParameterDto {
  standardName: string;
  code: string;
  category: MasterTestCategory;
  description?: string;
  synonyms?: string[];
}

@Injectable()
export class MasterTestParameterService {
  constructor(
    @InjectModel(MasterTestParameter.name)
    private masterTestParameterModel: Model<MasterTestParameter>,
  ) {}

  async create(createDto: CreateMasterTestParameterDto): Promise<MasterTestParameter> {
    const parameterId = `MPARAM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if code already exists
    const existingParameter = await this.masterTestParameterModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingParameter) {
      throw new ConflictException(`Master test parameter with code ${createDto.code} already exists`);
    }

    const parameter = new this.masterTestParameterModel({
      parameterId,
      standardName: createDto.standardName,
      code: createDto.code.toUpperCase(),
      category: createDto.category,
      description: createDto.description,
      synonyms: createDto.synonyms || [],
      isActive: true,
    });

    return parameter.save();
  }

  async getById(parameterId: string): Promise<MasterTestParameter> {
    const parameter = await this.masterTestParameterModel.findOne({ parameterId });

    if (!parameter) {
      throw new NotFoundException(`Master test parameter ${parameterId} not found`);
    }

    return parameter;
  }

  async getByCode(code: string): Promise<MasterTestParameter | null> {
    return this.masterTestParameterModel.findOne({ code: code.toUpperCase() });
  }

  async getAll(category?: MasterTestCategory): Promise<MasterTestParameter[]> {
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    return this.masterTestParameterModel.find(filter).sort({ standardName: 1 }).exec();
  }

  async search(query: string): Promise<MasterTestParameter[]> {
    return this.masterTestParameterModel
      .find({
        isActive: true,
        $or: [
          { standardName: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } },
          { synonyms: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ standardName: 1 })
      .limit(50)
      .exec();
  }

  async update(
    parameterId: string,
    updateDto: Partial<CreateMasterTestParameterDto>,
  ): Promise<MasterTestParameter> {
    const parameter = await this.getById(parameterId);

    if (updateDto.standardName) {
      parameter.standardName = updateDto.standardName;
    }

    if (updateDto.code) {
      const existingParameter = await this.masterTestParameterModel.findOne({
        code: updateDto.code.toUpperCase(),
        parameterId: { $ne: parameterId },
      });

      if (existingParameter) {
        throw new ConflictException(`Master test parameter with code ${updateDto.code} already exists`);
      }

      parameter.code = updateDto.code.toUpperCase();
    }

    if (updateDto.category) {
      parameter.category = updateDto.category;
    }

    if (updateDto.description !== undefined) {
      parameter.description = updateDto.description;
    }

    if (updateDto.synonyms !== undefined) {
      parameter.synonyms = updateDto.synonyms;
    }

    return parameter.save();
  }

  async updateStatus(parameterId: string, isActive: boolean): Promise<MasterTestParameter> {
    const parameter = await this.getById(parameterId);
    parameter.isActive = isActive;
    return parameter.save();
  }

  async deactivate(parameterId: string): Promise<MasterTestParameter> {
    return this.updateStatus(parameterId, false);
  }

  async activate(parameterId: string): Promise<MasterTestParameter> {
    return this.updateStatus(parameterId, true);
  }
}
