import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CategorySpecialtyMapping,
  CategorySpecialtyMappingDocument,
} from './schemas/category-specialty-mapping.schema';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { Specialty, SpecialtyDocument } from '../specialties/schemas/specialty.schema';
import { SpecialtyWithMappingDto } from './dto/category-specialty-mapping.dto';

@Injectable()
export class CategorySpecialtyMappingService {
  private readonly SUPPORTED_CATEGORIES = ['CAT001', 'CAT005'];

  constructor(
    @InjectModel(CategorySpecialtyMapping.name)
    private mappingModel: Model<CategorySpecialtyMappingDocument>,
    @InjectModel(CategoryMaster.name)
    private categoryModel: Model<CategoryMasterDocument>,
    @InjectModel(Specialty.name)
    private specialtyModel: Model<SpecialtyDocument>,
  ) {}

  /**
   * Get all specialties with their mapping status for a category
   */
  async getSpecialtiesForCategory(
    categoryId: string,
  ): Promise<SpecialtyWithMappingDto[]> {
    console.log(`[CategorySpecialtyMappingService] Getting specialties for category: ${categoryId}`);

    // Validate category exists and is supported
    await this.validateCategory(categoryId);

    // Fetch all active specialties sorted by displayOrder
    const specialties = await this.specialtyModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .exec();

    console.log(`[CategorySpecialtyMappingService] Found ${specialties.length} active specialties`);

    // Fetch mappings for this category
    const mappings = await this.mappingModel
      .find({ categoryId: categoryId.toUpperCase() })
      .exec();

    console.log(`[CategorySpecialtyMappingService] Found ${mappings.length} existing mappings`);

    // Create mapping lookup for quick access
    const mappingMap = new Map(
      mappings.map((m) => [m.specialtyId.toString(), m.isEnabled]),
    );

    // Merge specialty data with mapping status
    const result = specialties.map((specialty) => ({
      _id: String(specialty._id),
      specialtyId: specialty.specialtyId,
      code: specialty.code,
      name: specialty.name,
      description: specialty.description,
      icon: specialty.icon,
      isActive: specialty.isActive,
      displayOrder: specialty.displayOrder,
      isEnabledForCategory: mappingMap.get(String(specialty._id)) || false,
    }));

    console.log(`[CategorySpecialtyMappingService] Returning ${result.length} specialties with mapping status`);
    return result;
  }

  /**
   * Toggle specialty mapping for a category
   */
  async toggleSpecialtyMapping(
    categoryId: string,
    specialtyId: string,
    isEnabled: boolean,
    userId?: string,
  ): Promise<SpecialtyWithMappingDto> {
    console.log(`[CategorySpecialtyMappingService] Toggle specialty mapping: ${categoryId} / ${specialtyId} -> ${isEnabled}`);

    // Validate inputs
    await this.validateCategory(categoryId);
    const specialty = await this.validateSpecialty(specialtyId);

    const upperCategoryId = categoryId.toUpperCase();

    // Find existing mapping
    const existingMapping = await this.mappingModel.findOne({
      categoryId: upperCategoryId,
      specialtyId: specialty._id,
    });

    if (existingMapping) {
      // Update existing mapping
      console.log(`[CategorySpecialtyMappingService] Updating existing mapping`);
      existingMapping.isEnabled = isEnabled;
      existingMapping.updatedBy = userId;
      await existingMapping.save();
    } else {
      // Create new mapping
      console.log(`[CategorySpecialtyMappingService] Creating new mapping`);
      await this.mappingModel.create({
        categoryId: upperCategoryId,
        specialtyId: specialty._id,
        isEnabled,
        createdBy: userId,
      });
    }

    // Return specialty with updated mapping status
    return {
      _id: String(specialty._id),
      specialtyId: specialty.specialtyId,
      code: specialty.code,
      name: specialty.name,
      description: specialty.description,
      icon: specialty.icon,
      isActive: specialty.isActive,
      displayOrder: specialty.displayOrder,
      isEnabledForCategory: isEnabled,
    };
  }

  /**
   * Validate category exists and is supported for specialty mapping
   */
  private async validateCategory(categoryId: string): Promise<void> {
    const upperCategoryId = categoryId.toUpperCase();

    if (!this.SUPPORTED_CATEGORIES.includes(upperCategoryId)) {
      throw new BadRequestException(
        `Category ${categoryId} does not support specialty mapping. Only CAT001 and CAT005 are supported.`,
      );
    }

    const category = await this.categoryModel.findOne({
      categoryId: upperCategoryId,
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  /**
   * Validate specialty exists
   */
  private async validateSpecialty(specialtyId: string): Promise<SpecialtyDocument> {
    if (!Types.ObjectId.isValid(specialtyId)) {
      throw new BadRequestException(`Invalid specialty ID format: ${specialtyId}`);
    }

    const specialty = await this.specialtyModel.findById(specialtyId);

    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${specialtyId} not found`);
    }

    return specialty;
  }
}
