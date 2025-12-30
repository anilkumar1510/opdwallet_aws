import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiagnosticMasterTest, DiagnosticMasterTestCategory } from '../schemas/diagnostic-master-test.schema';

export interface CreateDiagnosticMasterTestDto {
  standardName: string;
  code: string;
  category: DiagnosticMasterTestCategory;
  description?: string;
  synonyms?: string[];
}

@Injectable()
export class DiagnosticMasterTestService {
  constructor(
    @InjectModel(DiagnosticMasterTest.name)
    private diagnosticMasterTestModel: Model<DiagnosticMasterTest>,
  ) {}

  async create(createDto: CreateDiagnosticMasterTestDto): Promise<DiagnosticMasterTest> {
    const parameterId = `DIAG-MPARAM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if code already exists
    const existingTest = await this.diagnosticMasterTestModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingTest) {
      throw new ConflictException(`Diagnostic master test with code ${createDto.code} already exists`);
    }

    const masterTest = new this.diagnosticMasterTestModel({
      parameterId,
      standardName: createDto.standardName,
      code: createDto.code.toUpperCase(),
      category: createDto.category,
      description: createDto.description,
      synonyms: createDto.synonyms || [],
      isActive: true,
    });

    return masterTest.save();
  }

  async getById(parameterId: string): Promise<DiagnosticMasterTest> {
    const masterTest = await this.diagnosticMasterTestModel.findOne({ parameterId });

    if (!masterTest) {
      throw new NotFoundException(`Diagnostic master test ${parameterId} not found`);
    }

    return masterTest;
  }

  async getByCode(code: string): Promise<DiagnosticMasterTest | null> {
    return this.diagnosticMasterTestModel.findOne({ code: code.toUpperCase() });
  }

  async getAll(category?: DiagnosticMasterTestCategory): Promise<DiagnosticMasterTest[]> {
    const filter: any = { isActive: true };

    if (category) {
      filter.category = category;
    }

    return this.diagnosticMasterTestModel.find(filter).sort({ standardName: 1 }).exec();
  }

  async search(query: string): Promise<DiagnosticMasterTest[]> {
    return this.diagnosticMasterTestModel
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
    updateDto: Partial<CreateDiagnosticMasterTestDto>,
  ): Promise<DiagnosticMasterTest> {
    const masterTest = await this.getById(parameterId);

    if (updateDto.standardName) {
      masterTest.standardName = updateDto.standardName;
    }

    if (updateDto.code) {
      const existingTest = await this.diagnosticMasterTestModel.findOne({
        code: updateDto.code.toUpperCase(),
        parameterId: { $ne: parameterId },
      });

      if (existingTest) {
        throw new ConflictException(`Diagnostic master test with code ${updateDto.code} already exists`);
      }

      masterTest.code = updateDto.code.toUpperCase();
    }

    if (updateDto.category) {
      masterTest.category = updateDto.category;
    }

    if (updateDto.description !== undefined) {
      masterTest.description = updateDto.description;
    }

    if (updateDto.synonyms !== undefined) {
      masterTest.synonyms = updateDto.synonyms;
    }

    return masterTest.save();
  }

  async updateStatus(parameterId: string, isActive: boolean): Promise<DiagnosticMasterTest> {
    const masterTest = await this.getById(parameterId);
    masterTest.isActive = isActive;
    return masterTest.save();
  }

  async deactivate(parameterId: string): Promise<DiagnosticMasterTest> {
    return this.updateStatus(parameterId, false);
  }

  async activate(parameterId: string): Promise<DiagnosticMasterTest> {
    return this.updateStatus(parameterId, true);
  }
}
