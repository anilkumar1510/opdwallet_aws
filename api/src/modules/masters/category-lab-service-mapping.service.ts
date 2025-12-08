import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CategoryLabServiceMapping,
  CategoryLabServiceMappingDocument,
} from './schemas/category-lab-service-mapping.schema';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { LabService } from '../lab/schemas/lab-service.schema';
import { LabServiceWithMappingDto } from './dto/category-lab-service-mapping.dto';

@Injectable()
export class CategoryLabServiceMappingService {
  private readonly SUPPORTED_CATEGORIES = ['CAT003', 'CAT004']; // Diagnostic and Laboratory categories

  constructor(
    @InjectModel(CategoryLabServiceMapping.name)
    private mappingModel: Model<CategoryLabServiceMappingDocument>,
    @InjectModel(CategoryMaster.name)
    private categoryModel: Model<CategoryMasterDocument>,
    @InjectModel(LabService.name)
    private labServiceModel: Model<LabService>,
  ) {}

  /**
   * Get all lab services with their mapping status for a category
   */
  async getLabServicesForCategory(
    categoryId: string,
    labServiceCategories?: string[],
  ): Promise<LabServiceWithMappingDto[]> {
    console.log(`[CategoryLabServiceMappingService] Getting lab services for category: ${categoryId}`);

    // Validate category exists and is supported
    await this.validateCategory(categoryId);

    // Build query for lab services
    const query: any = { isActive: true };

    // Filter by lab service categories if provided
    if (labServiceCategories && labServiceCategories.length > 0) {
      query.category = { $in: labServiceCategories };
      console.log(`[CategoryLabServiceMappingService] Filtering by categories: ${labServiceCategories.join(', ')}`);
    }

    // Fetch lab services sorted by category and name
    const labServices = await this.labServiceModel
      .find(query)
      .sort({ category: 1, displayOrder: 1, name: 1 })
      .exec();

    console.log(`[CategoryLabServiceMappingService] Found ${labServices.length} active lab services`);

    // Fetch mappings for this category
    const mappings = await this.mappingModel
      .find({ categoryId: categoryId.toUpperCase() })
      .exec();

    console.log(`[CategoryLabServiceMappingService] Found ${mappings.length} existing mappings`);

    // Create mapping lookup for quick access
    const mappingMap = new Map(
      mappings.map((m) => [m.labServiceId.toString(), m.isEnabled]),
    );

    // Merge lab service data with mapping status
    const result = labServices.map((service) => ({
      _id: String(service._id),
      serviceId: service.serviceId,
      code: service.code,
      name: service.name,
      description: service.description,
      category: service.category,
      sampleType: service.sampleType,
      preparationInstructions: service.preparationInstructions,
      isActive: service.isActive,
      displayOrder: service.displayOrder,
      isEnabledForCategory: mappingMap.get(String(service._id)) || false,
    }));

    console.log(`[CategoryLabServiceMappingService] Returning ${result.length} lab services with mapping status`);
    return result;
  }

  /**
   * Toggle lab service mapping for a category
   */
  async toggleLabServiceMapping(
    categoryId: string,
    labServiceId: string,
    isEnabled: boolean,
    userId?: string,
  ): Promise<LabServiceWithMappingDto> {
    console.log(`[CategoryLabServiceMappingService] Toggle lab service mapping: ${categoryId} / ${labServiceId} -> ${isEnabled}`);

    // Validate inputs
    await this.validateCategory(categoryId);
    const labService = await this.validateLabService(labServiceId);

    const upperCategoryId = categoryId.toUpperCase();

    // Find existing mapping
    const existingMapping = await this.mappingModel.findOne({
      categoryId: upperCategoryId,
      labServiceId: labService._id,
    });

    if (existingMapping) {
      // Update existing mapping
      console.log(`[CategoryLabServiceMappingService] Updating existing mapping`);
      existingMapping.isEnabled = isEnabled;
      existingMapping.updatedBy = userId;
      await existingMapping.save();
    } else {
      // Create new mapping
      console.log(`[CategoryLabServiceMappingService] Creating new mapping`);
      await this.mappingModel.create({
        categoryId: upperCategoryId,
        labServiceId: labService._id,
        isEnabled,
        createdBy: userId,
      });
    }

    // Return lab service with updated mapping status
    return {
      _id: String(labService._id),
      serviceId: labService.serviceId,
      code: labService.code,
      name: labService.name,
      description: labService.description,
      category: labService.category,
      sampleType: labService.sampleType,
      preparationInstructions: labService.preparationInstructions,
      isActive: labService.isActive,
      displayOrder: labService.displayOrder,
      isEnabledForCategory: isEnabled,
    };
  }

  /**
   * Validate category exists and is supported for lab service mapping
   */
  private async validateCategory(categoryId: string): Promise<void> {
    const upperCategoryId = categoryId.toUpperCase();

    if (!this.SUPPORTED_CATEGORIES.includes(upperCategoryId)) {
      throw new BadRequestException(
        `Category ${categoryId} does not support lab service mapping. Only CAT004 is supported.`,
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
   * Validate lab service exists
   */
  private async validateLabService(labServiceId: string): Promise<any> {
    if (!Types.ObjectId.isValid(labServiceId)) {
      throw new BadRequestException(`Invalid lab service ID format: ${labServiceId}`);
    }

    const labService = await this.labServiceModel.findById(labServiceId);

    if (!labService) {
      throw new NotFoundException(`Lab service with ID ${labServiceId} not found`);
    }

    return labService;
  }
}
