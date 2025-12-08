import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanConfig, PlanConfigDocument } from './schemas/plan-config.schema';
import { Assignment, AssignmentDocument } from '../assignments/schemas/assignment.schema';
import { Specialty, SpecialtyDocument } from '../specialties/schemas/specialty.schema';
import { CategorySpecialtyMapping, CategorySpecialtyMappingDocument } from '../masters/schemas/category-specialty-mapping.schema';
import { LabService } from '../lab/schemas/lab-service.schema';
import { CategoryLabServiceMapping, CategoryLabServiceMappingDocument } from '../masters/schemas/category-lab-service-mapping.schema';
import { ServiceMaster, ServiceMasterDocument } from '../masters/schemas/service-master.schema';

@Injectable()
export class PolicyServicesConfigService {
  private readonly SPECIALTY_CATEGORIES = ['CAT001', 'CAT005'];
  private readonly LAB_CATEGORIES = ['CAT003', 'CAT004'];
  private readonly SERVICE_TYPE_CATEGORIES = ['CAT006', 'CAT007', 'CAT008'];
  private readonly LAB_SERVICE_CATEGORIES = {
    CAT003: ['RADIOLOGY', 'ENDOSCOPY'], // Diagnostic
    CAT004: ['PATHOLOGY', 'CARDIOLOGY', 'OTHER'], // Laboratory
  };

  constructor(
    @InjectModel(PlanConfig.name)
    private planConfigModel: Model<PlanConfigDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Specialty.name)
    private specialtyModel: Model<SpecialtyDocument>,
    @InjectModel(CategorySpecialtyMapping.name)
    private categorySpecialtyMappingModel: Model<CategorySpecialtyMappingDocument>,
    @InjectModel(LabService.name)
    private labServiceModel: Model<LabService>,
    @InjectModel(CategoryLabServiceMapping.name)
    private categoryLabServiceMappingModel: Model<CategoryLabServiceMappingDocument>,
    @InjectModel(ServiceMaster.name)
    private serviceMasterModel: Model<ServiceMasterDocument>,
  ) {}

  /**
   * Get available services for a category (admin: returns pool of services for selection)
   */
  async getAvailableServicesForCategory(categoryId: string): Promise<any> {
    const upperCategoryId = categoryId.toUpperCase();
    console.log(`[PolicyServicesConfigService] Getting available services for category: ${upperCategoryId}`);

    if (this.SPECIALTY_CATEGORIES.includes(upperCategoryId)) {
      return this.getAvailableSpecialties(upperCategoryId);
    } else if (this.LAB_CATEGORIES.includes(upperCategoryId)) {
      return this.getAvailableLabCategories(upperCategoryId);
    } else if (this.SERVICE_TYPE_CATEGORIES.includes(upperCategoryId)) {
      return this.getAvailableServiceTypes(upperCategoryId);
    } else {
      throw new BadRequestException(`Category ${categoryId} does not support service-level configuration`);
    }
  }

  /**
   * Get available specialties for CAT001 or CAT005 (based on category mappings)
   */
  private async getAvailableSpecialties(categoryId: string): Promise<any[]> {
    console.log(`[PolicyServicesConfigService] Getting specialties for ${categoryId}`);

    // Fetch all active specialties
    const specialties = await this.specialtyModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean()
      .exec();

    // Fetch mappings for this category
    const mappings = await this.categorySpecialtyMappingModel
      .find({ categoryId, isEnabled: true })
      .lean()
      .exec();

    // Create mapping set for quick lookup
    const enabledSpecialtyIds = new Set(
      mappings.map((m) => m.specialtyId.toString())
    );

    // Filter only specialties that are enabled for this category
    const availableSpecialties = specialties
      .filter((s) => enabledSpecialtyIds.has(s._id.toString()))
      .map((s) => ({
        _id: s._id.toString(),
        specialtyId: s.specialtyId,
        code: s.code,
        name: s.name,
        description: s.description,
        icon: s.icon,
        displayOrder: s.displayOrder,
      }));

    console.log(`[PolicyServicesConfigService] Found ${availableSpecialties.length} available specialties`);
    return availableSpecialties;
  }

  /**
   * Get available lab service categories for CAT003 or CAT004 (broad categories only)
   */
  private async getAvailableLabCategories(categoryId: string): Promise<any[]> {
    console.log(`[PolicyServicesConfigService] Getting lab categories for ${categoryId}`);

    const allowedCategories = (this.LAB_SERVICE_CATEGORIES as any)[categoryId] || [];

    const result = allowedCategories.map((category: string) => {
      const categoryInfo = this.getLabCategoryInfo(category);
      return {
        category,
        name: categoryInfo.name,
        description: categoryInfo.description,
        icon: categoryInfo.icon,
      };
    });

    console.log(`[PolicyServicesConfigService] Returning ${result.length} lab categories`);
    return result;
  }

  /**
   * Get friendly info for lab categories
   */
  private getLabCategoryInfo(category: string): any {
    const categoryMap: any = {
      RADIOLOGY: {
        name: 'Radiology',
        description: 'X-rays, CT scans, MRI, ultrasound, and imaging services',
        icon: '🩻',
      },
      ENDOSCOPY: {
        name: 'Endoscopy',
        description: 'Endoscopy procedures and related diagnostic tests',
        icon: '🔬',
      },
      PATHOLOGY: {
        name: 'Pathology',
        description: 'Blood tests, urinalysis, biopsy, and laboratory tests',
        icon: '🧪',
      },
      CARDIOLOGY: {
        name: 'Cardiology',
        description: 'ECG, echo, stress test, and cardiac diagnostics',
        icon: '❤️',
      },
      OTHER: {
        name: 'Other Tests',
        description: 'Additional diagnostic and laboratory services',
        icon: '🔬',
      },
    };

    return categoryMap[category] || { name: category, description: '', icon: '📋' };
  }

  /**
   * Get available service types for CAT006, CAT007, or CAT008 (only created services)
   */
  private async getAvailableServiceTypes(categoryId: string): Promise<any[]> {
    console.log(`[PolicyServicesConfigService] Getting service types for ${categoryId}`);

    const services = await this.serviceMasterModel
      .find({ category: categoryId, isActive: true })
      .sort({ code: 1 })
      .lean()
      .exec();

    const result = services.map((s) => ({
      _id: s._id.toString(),
      code: s.code,
      name: s.name,
      description: s.description,
    }));

    console.log(`[PolicyServicesConfigService] Found ${result.length} service types`);
    return result;
  }

  /**
   * Update service configuration for a benefit (admin: save service selections)
   */
  async updateServiceConfiguration(
    policyId: string,
    version: number,
    categoryId: string,
    serviceIds: string[],
    userId: string,
  ): Promise<any> {
    const upperCategoryId = categoryId.toUpperCase();
    console.log(`[PolicyServicesConfigService] Updating service config for ${policyId} v${version} - ${upperCategoryId}`);
    console.log(`[PolicyServicesConfigService] Service IDs:`, serviceIds);

    // Fetch plan config
    const planConfig = await this.planConfigModel.findOne({
      policyId: new Types.ObjectId(policyId),
      version,
      status: 'DRAFT',
    });

    if (!planConfig) {
      throw new NotFoundException('Plan configuration not found or not in DRAFT status');
    }

    // Get the benefit key (CAT001, CAT002, etc. or dental, vision, wellness)
    const benefitKey = this.getBenefitKey(upperCategoryId);

    if (!(planConfig.benefits as any)[benefitKey]) {
      throw new BadRequestException(`Benefit ${benefitKey} is not configured in this policy`);
    }

    // Validate and convert service IDs based on category type
    if (this.SPECIALTY_CATEGORIES.includes(upperCategoryId)) {
      // Convert to ObjectIds and validate
      const objectIds = await this.validateAndConvertSpecialtyIds(serviceIds, upperCategoryId);
      (planConfig.benefits as any)[benefitKey].allowedSpecialties = objectIds;
    } else if (this.LAB_CATEGORIES.includes(upperCategoryId)) {
      // Validate lab categories are in allowed list
      const validatedCategories = this.validateLabCategories(serviceIds, upperCategoryId);
      (planConfig.benefits as any)[benefitKey].allowedLabServiceCategories = validatedCategories;
    } else if (this.SERVICE_TYPE_CATEGORIES.includes(upperCategoryId)) {
      // Validate service codes exist
      const validatedCodes = await this.validateServiceCodes(serviceIds, upperCategoryId);
      (planConfig.benefits as any)[benefitKey].allowedServiceCodes = validatedCodes;
    } else {
      throw new BadRequestException(`Category ${categoryId} does not support service-level configuration`);
    }

    planConfig.updatedBy = userId;
    await planConfig.save();

    console.log(`[PolicyServicesConfigService] Service configuration updated successfully`);
    return {
      success: true,
      message: 'Service configuration updated successfully',
      categoryId: upperCategoryId,
      servicesCount: serviceIds.length,
    };
  }

  /**
   * Get member's allowed services based on their policy configuration
   */
  async getMemberAllowedServices(userId: string, categoryId: string): Promise<any[]> {
    const upperCategoryId = categoryId.toUpperCase();
    console.log(`[PolicyServicesConfigService] Getting allowed services for user ${userId} in category ${upperCategoryId}`);

    // Get user's active policy assignment
    const assignment = await this.assignmentModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isActive: true,
        effectiveFrom: { $lte: new Date() },
        effectiveTo: { $gte: new Date() },
      })
      .lean()
      .exec();

    if (!assignment) {
      throw new NotFoundException('No active policy assignment found for this user');
    }

    // Debug: Check ALL plan configs for this policy (try both ObjectId and string)
    const policyIdString = assignment.policyId.toString();
    const allConfigs = await this.planConfigModel
      .find({
        $or: [
          { policyId: assignment.policyId },
          { policyId: policyIdString }
        ]
      })
      .select('version status isCurrent policyId')
      .lean()
      .exec();

    console.log('[PolicyServicesConfigService] ALL plan configs for policy:', allConfigs);
    console.log('[PolicyServicesConfigService] Searched for policyId:', assignment.policyId, 'or', policyIdString);

    // Get current plan config for the policy (try both ObjectId and string)
    const planConfig = await this.planConfigModel
      .findOne({
        $or: [
          { policyId: assignment.policyId },
          { policyId: policyIdString }
        ],
        isCurrent: true,
        status: 'PUBLISHED',
      })
      .lean()
      .exec();

    if (!planConfig) {
      console.log('[PolicyServicesConfigService] No published plan config found');
      console.log('[PolicyServicesConfigService] Query was: policyId =', assignment.policyId, ', isCurrent = true, status = PUBLISHED');
      throw new NotFoundException('No published plan configuration found for this policy');
    }

    console.log('[PolicyServicesConfigService] Found plan config:', {
      policyId: planConfig.policyId,
      version: planConfig.version,
      status: planConfig.status,
    });

    // Get benefit key
    const benefitKey = this.getBenefitKey(upperCategoryId);
    const benefit = (planConfig.benefits as any)[benefitKey];

    console.log('[PolicyServicesConfigService] Benefit key:', benefitKey);
    console.log('[PolicyServicesConfigService] Benefit data:', {
      exists: !!benefit,
      enabled: benefit?.enabled,
      allowedSpecialties: benefit?.allowedSpecialties,
      allowedSpecialtiesLength: benefit?.allowedSpecialties?.length,
    });

    if (!benefit || !benefit.enabled) {
      console.log('[PolicyServicesConfigService] Benefit not enabled or not found');
      return []; // Benefit not enabled, return empty
    }

    // Check if there are service restrictions
    if (this.SPECIALTY_CATEGORIES.includes(upperCategoryId)) {
      console.log('[PolicyServicesConfigService] Fetching specialties for category');
      const result = await this.getMemberAllowedSpecialties(benefit, upperCategoryId);
      console.log('[PolicyServicesConfigService] Specialties result count:', result.length);
      return result;
    } else if (this.LAB_CATEGORIES.includes(upperCategoryId)) {
      return this.getMemberAllowedLabCategories(benefit, upperCategoryId);
    } else if (this.SERVICE_TYPE_CATEGORIES.includes(upperCategoryId)) {
      return this.getMemberAllowedServiceTypes(benefit, upperCategoryId);
    }

    return [];
  }

  /**
   * Get member's allowed specialties
   */
  private async getMemberAllowedSpecialties(benefit: any, categoryId: string): Promise<any[]> {
    const allowedSpecialties = benefit.allowedSpecialties;

    // If undefined or null, return all category-mapped specialties (unrestricted)
    if (!allowedSpecialties) {
      return this.getAvailableSpecialties(categoryId);
    }

    // If empty array, return no specialties (fully restricted)
    if (Array.isArray(allowedSpecialties) && allowedSpecialties.length === 0) {
      return [];
    }

    // Return only allowed specialties
    const specialties = await this.specialtyModel
      .find({
        _id: { $in: allowedSpecialties },
        isActive: true,
      })
      .sort({ displayOrder: 1, name: 1 })
      .lean()
      .exec();

    return specialties.map((s) => ({
      _id: s._id.toString(),
      specialtyId: s.specialtyId,
      code: s.code,
      name: s.name,
      description: s.description,
      icon: s.icon,
      displayOrder: s.displayOrder,
    }));
  }

  /**
   * Get member's allowed lab categories
   */
  private async getMemberAllowedLabCategories(benefit: any, categoryId: string): Promise<any[]> {
    const allowedCategories = benefit.allowedLabServiceCategories;

    // If undefined or null, return all categories (unrestricted)
    if (!allowedCategories) {
      return this.getAvailableLabCategories(categoryId);
    }

    // If empty array, return no categories (fully restricted)
    if (Array.isArray(allowedCategories) && allowedCategories.length === 0) {
      return [];
    }

    // Return only allowed categories with their info
    return allowedCategories.map((category: string) => {
      const categoryInfo = this.getLabCategoryInfo(category);
      return {
        category,
        name: categoryInfo.name,
        description: categoryInfo.description,
        icon: categoryInfo.icon,
      };
    });
  }

  /**
   * Get member's allowed service types
   */
  private async getMemberAllowedServiceTypes(benefit: any, categoryId: string): Promise<any[]> {
    const allowedServiceCodes = benefit.allowedServiceCodes;

    // If undefined or null, return all service types (unrestricted)
    if (!allowedServiceCodes) {
      return this.getAvailableServiceTypes(categoryId);
    }

    // If empty array, return no services (fully restricted)
    if (Array.isArray(allowedServiceCodes) && allowedServiceCodes.length === 0) {
      return [];
    }

    // Return only allowed service types
    const services = await this.serviceMasterModel
      .find({
        code: { $in: allowedServiceCodes },
        category: categoryId,
        isActive: true,
      })
      .sort({ code: 1 })
      .lean()
      .exec();

    return services.map((s) => ({
      _id: s._id.toString(),
      code: s.code,
      name: s.name,
      description: s.description,
    }));
  }

  /**
   * Validate service access for a member (before booking/claiming)
   */
  async validateServiceAccess(
    userId: string,
    categoryId: string,
    serviceId: string,
  ): Promise<boolean> {
    console.log(`[PolicyServicesConfigService] Validating service access: user=${userId}, category=${categoryId}, service=${serviceId}`);

    const allowedServices = await this.getMemberAllowedServices(userId, categoryId);

    // Check if service is in allowed list
    if (this.SPECIALTY_CATEGORIES.includes(categoryId.toUpperCase())) {
      return allowedServices.some((s) => s._id === serviceId);
    } else if (this.LAB_CATEGORIES.includes(categoryId.toUpperCase())) {
      return allowedServices.some((s) => s.category === serviceId);
    } else if (this.SERVICE_TYPE_CATEGORIES.includes(categoryId.toUpperCase())) {
      return allowedServices.some((s) => s.code === serviceId);
    }

    return false;
  }

  /**
   * Helper: Get benefit key for a category ID
   */
  private getBenefitKey(categoryId: string): string {
    const keyMap = {
      CAT001: 'CAT001',
      CAT002: 'CAT002',
      CAT003: 'CAT003',
      CAT004: 'CAT004',
      CAT005: 'CAT005',
      CAT006: 'dental',
      CAT007: 'vision',
      CAT008: 'wellness',
    };

    return (keyMap as any)[categoryId] || categoryId;
  }

  /**
   * Validate and convert specialty IDs to ObjectIds
   */
  private async validateAndConvertSpecialtyIds(
    serviceIds: string[],
    categoryId: string,
  ): Promise<Types.ObjectId[]> {
    const objectIds: Types.ObjectId[] = [];

    for (const id of serviceIds) {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid specialty ID format: ${id}`);
      }

      const specialty = await this.specialtyModel.findById(id).lean().exec();
      if (!specialty) {
        throw new NotFoundException(`Specialty with ID ${id} not found`);
      }

      // Verify specialty is mapped to this category
      const mapping = await this.categorySpecialtyMappingModel
        .findOne({
          categoryId,
          specialtyId: new Types.ObjectId(id),
          isEnabled: true,
        })
        .lean()
        .exec();

      if (!mapping) {
        throw new BadRequestException(
          `Specialty ${specialty.name} is not mapped to category ${categoryId}`
        );
      }

      objectIds.push(new Types.ObjectId(id));
    }

    return objectIds;
  }

  /**
   * Validate lab categories are in allowed list
   */
  private validateLabCategories(categories: string[], categoryId: string): string[] {
    const allowedCategories = (this.LAB_SERVICE_CATEGORIES as any)[categoryId] || [];

    for (const category of categories) {
      if (!allowedCategories.includes(category)) {
        throw new BadRequestException(
          `Lab category ${category} is not valid for ${categoryId}. ` +
          `Allowed categories: ${allowedCategories.join(', ')}`
        );
      }
    }

    return categories;
  }

  /**
   * Validate service codes exist and belong to the category
   */
  private async validateServiceCodes(codes: string[], categoryId: string): Promise<string[]> {
    const validatedCodes: string[] = [];

    for (const code of codes) {
      const service = await this.serviceMasterModel
        .findOne({ code: code.toUpperCase(), category: categoryId })
        .lean()
        .exec();

      if (!service) {
        throw new NotFoundException(
          `Service with code ${code} not found in category ${categoryId}`
        );
      }

      validatedCodes.push(code.toUpperCase());
    }

    return validatedCodes;
  }
}
