import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VaccinationMasterParameter } from '../schemas/vaccination-master.schema';
import { CreateVaccinationMasterDto } from '../dto/create-vaccination-master.dto';
import { UpdateVaccinationMasterDto } from '../dto/update-vaccination-master.dto';

@Injectable()
export class VaccinationMasterService {
  constructor(
    @InjectModel(VaccinationMasterParameter.name)
    private vaccinationMasterModel: Model<VaccinationMasterParameter>,
  ) {}

  async create(createDto: CreateVaccinationMasterDto): Promise<VaccinationMasterParameter> {
    const parameterId = `VPARAM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if code already exists
    const existingParameter = await this.vaccinationMasterModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingParameter) {
      throw new ConflictException(`Vaccination master parameter with code ${createDto.code} already exists`);
    }

    const parameter = new this.vaccinationMasterModel({
      parameterId,
      standardName: createDto.standardName,
      code: createDto.code.toUpperCase(),
      category: 'VACCINATION', // Always set to VACCINATION
      description: createDto.description,
      synonyms: createDto.synonyms || [],
      vaccineType: createDto.vaccineType,
      targetDisease: createDto.targetDisease,
      isActive: true,
    });

    return parameter.save();
  }

  async getById(parameterId: string): Promise<VaccinationMasterParameter> {
    const parameter = await this.vaccinationMasterModel.findOne({ parameterId });

    if (!parameter) {
      throw new NotFoundException(`Vaccination master parameter ${parameterId} not found`);
    }

    return parameter;
  }

  async getByCode(code: string): Promise<VaccinationMasterParameter | null> {
    return this.vaccinationMasterModel.findOne({ code: code.toUpperCase() });
  }

  async getAll(): Promise<VaccinationMasterParameter[]> {
    return this.vaccinationMasterModel.find({ isActive: true }).sort({ standardName: 1 }).exec();
  }

  async search(query: string): Promise<VaccinationMasterParameter[]> {
    return this.vaccinationMasterModel
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
    updateDto: UpdateVaccinationMasterDto,
  ): Promise<VaccinationMasterParameter> {
    const parameter = await this.getById(parameterId);

    if (updateDto.standardName) {
      parameter.standardName = updateDto.standardName;
    }

    if (updateDto.code) {
      const existingParameter = await this.vaccinationMasterModel.findOne({
        code: updateDto.code.toUpperCase(),
        parameterId: { $ne: parameterId },
      });

      if (existingParameter) {
        throw new ConflictException(`Vaccination master parameter with code ${updateDto.code} already exists`);
      }

      parameter.code = updateDto.code.toUpperCase();
    }

    if (updateDto.description !== undefined) {
      parameter.description = updateDto.description;
    }

    if (updateDto.synonyms !== undefined) {
      parameter.synonyms = updateDto.synonyms;
    }

    if (updateDto.vaccineType !== undefined) {
      parameter.vaccineType = updateDto.vaccineType;
    }

    if (updateDto.targetDisease !== undefined) {
      parameter.targetDisease = updateDto.targetDisease;
    }

    if (updateDto.isActive !== undefined) {
      parameter.isActive = updateDto.isActive;
    }

    return parameter.save();
  }

  async updateStatus(parameterId: string, isActive: boolean): Promise<VaccinationMasterParameter> {
    const parameter = await this.getById(parameterId);
    parameter.isActive = isActive;
    return parameter.save();
  }

  async deactivate(parameterId: string): Promise<VaccinationMasterParameter> {
    return this.updateStatus(parameterId, false);
  }

  async activate(parameterId: string): Promise<VaccinationMasterParameter> {
    return this.updateStatus(parameterId, true);
  }
}
