import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CategoryLabServiceMapping,
  CategoryLabServiceMappingDocument,
} from './schemas/category-lab-service-mapping.schema';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { LabService } from '../lab/schemas/lab-service.schema';
import { DiagnosticService } from '../diagnostics/schemas/diagnostic-service.schema';
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
    @InjectModel(DiagnosticService.name)
    private diagnosticServiceModel: Model<DiagnosticService>,
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

    const isDiagnostic = categoryId.toUpperCase() === 'CAT003';

    // Build query for lab services
    const query: any = { isActive: true };

    // Filter by lab service categories if provided
    if (labServiceCategories && labServiceCategories.length > 0) {
      query.category = { $in: labServiceCategories };
      console.log(`[CategoryLabServiceMappingService] Filtering by categories: ${labServiceCategories.join(', ')}`);
    }

    // Fetch services sorted by category and name (use diagnostic or lab based on category)
    const services = isDiagnostic
      ? await this.diagnosticServiceModel
          .find(query)
          .sort({ category: 1, displayOrder: 1, name: 1 })
          .exec()
      : await this.labServiceModel
          .find(query)
          .sort({ category: 1, displayOrder: 1, name: 1 })
          .exec();

    console.log(`[CategoryLabServiceMappingService] Found ${services.length} active ${isDiagnostic ? 'diagnostic' : 'lab'} services`);

    // Fetch mappings for this category
    const mappings = await this.mappingModel
      .find({ categoryId: categoryId.toUpperCase() })
      .exec();

    console.log(`[CategoryLabServiceMappingService] Found ${mappings.length} existing mappings`);

    // Create mapping lookup for quick access
    const mappingMap = new Map(
      mappings.map((m) => [m.labServiceId.toString(), m.isEnabled]),
    );

    // Merge service data with mapping status
    const result = services.map((service) => ({
      _id: String(service._id),
      serviceId: service.serviceId,
      code: service.code,
      name: service.name,
      description: service.description,
      category: service.category,
      sampleType: isDiagnostic ? undefined : (service as any).sampleType,
      preparationInstructions: isDiagnostic ? undefined : (service as any).preparationInstructions,
      isActive: service.isActive,
      displayOrder: service.displayOrder,
      isEnabledForCategory: mappingMap.get(String(service._id)) || false,
    }));

    console.log(`[CategoryLabServiceMappingService] Returning ${result.length} ${isDiagnostic ? 'diagnostic' : 'lab'} services with mapping status`);
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
    const isDiagnostic = categoryId.toUpperCase() === 'CAT003';
    const service = await this.validateService(labServiceId, isDiagnostic);

    const upperCategoryId = categoryId.toUpperCase();

    // Find existing mapping
    const existingMapping = await this.mappingModel.findOne({
      categoryId: upperCategoryId,
      labServiceId: service._id,
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
        labServiceId: service._id,
        isEnabled,
        createdBy: userId,
      });
    }

    // Return service with updated mapping status
    return {
      _id: String(service._id),
      serviceId: service.serviceId,
      code: service.code,
      name: service.name,
      description: service.description,
      category: service.category,
      sampleType: isDiagnostic ? undefined : (service as any).sampleType,
      preparationInstructions: isDiagnostic ? undefined : (service as any).preparationInstructions,
      isActive: service.isActive,
      displayOrder: service.displayOrder,
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
   * Validate service exists (lab or diagnostic)
   */
  private async validateService(serviceId: string, isDiagnostic: boolean): Promise<any> {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException(`Invalid service ID format: ${serviceId}`);
    }

    const service = isDiagnostic
      ? await this.diagnosticServiceModel.findById(serviceId)
      : await this.labServiceModel.findById(serviceId);

    if (!service) {
      throw new NotFoundException(`${isDiagnostic ? 'Diagnostic' : 'Lab'} service with ID ${serviceId} not found`);
    }

    return service;
  }

  /**
   * Validate lab service exists (deprecated - kept for backward compatibility)
   */
  private async validateLabService(labServiceId: string): Promise<any> {
    return this.validateService(labServiceId, false);
  }
}
