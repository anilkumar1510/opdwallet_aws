import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestNameAlias } from '../schemas/test-name-alias.schema';

export interface CreateTestNameAliasDto {
  masterParameterId: string;
  vendorId: string;
  vendorTestName: string;
  vendorTestCode?: string;
}

export interface BulkCreateTestNameAliasDto {
  vendorId: string;
  aliases: Array<{
    masterParameterId: string;
    vendorTestName: string;
    vendorTestCode?: string;
  }>;
}

@Injectable()
export class TestNameAliasService {
  constructor(
    @InjectModel(TestNameAlias.name)
    private testNameAliasModel: Model<TestNameAlias>,
  ) {}

  async create(createDto: CreateTestNameAliasDto): Promise<TestNameAlias> {
    const aliasId = `ALIAS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if this vendor already has this test name
    const existingAlias = await this.testNameAliasModel.findOne({
      vendorId: new Types.ObjectId(createDto.vendorId),
      vendorTestName: createDto.vendorTestName,
    });

    if (existingAlias) {
      throw new ConflictException(
        `Vendor already has a test named "${createDto.vendorTestName}"`
      );
    }

    const alias = new this.testNameAliasModel({
      aliasId,
      masterParameterId: new Types.ObjectId(createDto.masterParameterId),
      vendorId: new Types.ObjectId(createDto.vendorId),
      vendorTestName: createDto.vendorTestName,
      vendorTestCode: createDto.vendorTestCode,
      isActive: true,
    });

    return alias.save();
  }

  async bulkCreate(bulkDto: BulkCreateTestNameAliasDto): Promise<TestNameAlias[]> {
    const vendorObjectId = new Types.ObjectId(bulkDto.vendorId);
    const results: TestNameAlias[] = [];
    const errors: string[] = [];

    for (const aliasData of bulkDto.aliases) {
      try {
        // Check if alias already exists
        const existingAlias = await this.testNameAliasModel.findOne({
          vendorId: vendorObjectId,
          vendorTestName: aliasData.vendorTestName,
        });

        if (existingAlias) {
          errors.push(`Duplicate test name: ${aliasData.vendorTestName}`);
          continue;
        }

        const aliasId = `ALIAS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const alias = new this.testNameAliasModel({
          aliasId,
          masterParameterId: new Types.ObjectId(aliasData.masterParameterId),
          vendorId: vendorObjectId,
          vendorTestName: aliasData.vendorTestName,
          vendorTestCode: aliasData.vendorTestCode,
          isActive: true,
        });

        const savedAlias = await alias.save();
        results.push(savedAlias);
      } catch (error) {
        errors.push(`Error creating alias for ${aliasData.vendorTestName}: ${error.message}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new ConflictException(`All aliases failed: ${errors.join(', ')}`);
    }

    return results;
  }

  async getVendorAliases(vendorId: string): Promise<TestNameAlias[]> {
    return this.testNameAliasModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        isActive: true
      })
      .populate('masterParameterId')
      .sort({ vendorTestName: 1 })
      .exec();
  }

  async findByVendorAndTestName(vendorId: string, testName: string): Promise<TestNameAlias | null> {
    return this.testNameAliasModel
      .findOne({
        vendorId: new Types.ObjectId(vendorId),
        vendorTestName: { $regex: new RegExp(`^${testName}$`, 'i') },
        isActive: true,
      })
      .populate('masterParameterId')
      .exec();
  }

  async searchByVendor(vendorId: string, query: string): Promise<TestNameAlias[]> {
    return this.testNameAliasModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        isActive: true,
        $or: [
          { vendorTestName: { $regex: query, $options: 'i' } },
          { vendorTestCode: { $regex: query, $options: 'i' } },
        ],
      })
      .populate('masterParameterId')
      .sort({ vendorTestName: 1 })
      .limit(50)
      .exec();
  }

  async update(aliasId: string, updateDto: Partial<CreateTestNameAliasDto>): Promise<TestNameAlias> {
    const alias = await this.testNameAliasModel.findOne({ aliasId });

    if (!alias) {
      throw new NotFoundException(`Test name alias ${aliasId} not found`);
    }

    if (updateDto.masterParameterId) {
      alias.masterParameterId = new Types.ObjectId(updateDto.masterParameterId);
    }

    if (updateDto.vendorTestName) {
      // Check for conflicts
      const existingAlias = await this.testNameAliasModel.findOne({
        vendorId: alias.vendorId,
        vendorTestName: updateDto.vendorTestName,
        aliasId: { $ne: aliasId },
      });

      if (existingAlias) {
        throw new ConflictException(
          `Vendor already has a test named "${updateDto.vendorTestName}"`
        );
      }

      alias.vendorTestName = updateDto.vendorTestName;
    }

    if (updateDto.vendorTestCode !== undefined) {
      alias.vendorTestCode = updateDto.vendorTestCode;
    }

    return alias.save();
  }

  async delete(aliasId: string): Promise<void> {
    const alias = await this.testNameAliasModel.findOne({ aliasId });

    if (!alias) {
      throw new NotFoundException(`Test name alias ${aliasId} not found`);
    }

    alias.isActive = false;
    await alias.save();
  }

  async deleteByVendor(vendorId: string): Promise<void> {
    await this.testNameAliasModel.updateMany(
      { vendorId: new Types.ObjectId(vendorId) },
      { isActive: false }
    );
  }
}
