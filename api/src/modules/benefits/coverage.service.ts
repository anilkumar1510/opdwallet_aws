import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BenefitCoverageMatrix, BenefitCoverageMatrixDocument } from './schemas/benefit-coverage-matrix.schema';
import { CategoryMaster, CategoryMasterDocument } from '../masters/schemas/category-master.schema';
import { ServiceType, ServiceTypeDocument } from '../masters/schemas/service-type.schema';
import { PlanVersion, PlanVersionDocument, PlanVersionStatus } from '../plan-versions/schemas/plan-version.schema';
import { UpdateCoverageDto } from './dto/update-coverage.dto';
import { BENEFIT_TO_CATEGORY, CATEGORY_KEYS, CategoryKey } from '@/common/constants/coverage.constants';

export interface CoverageMatrixResponse {
  planVersionId: string;
  categories: CategoryCoverage[];
  summary: CoverageSummary;
}

export interface CategoryCoverage {
  categoryId: string;
  code: string;
  name: string;
  services: ServiceCoverage[];
  servicesCount: number;
  enabledCount: number;
}

export interface ServiceCoverage {
  serviceCode: string;
  serviceName: string;
  categoryId: string;
  enabled: boolean;
  notes?: string;
  isVirtual: boolean;
}

export interface CoverageSummary {
  totalServices: number;
  enabledServices: number;
  disabledServices: number;
}

export interface CategoryInfo {
  categoryId: string;
  code: string;
  name: string;
  servicesCount: number;
}

@Injectable()
export class CoverageService {
  constructor(
    @InjectModel(BenefitCoverageMatrix.name)
    private coverageModel: Model<BenefitCoverageMatrixDocument>,
    @InjectModel(CategoryMaster.name)
    private categoryModel: Model<CategoryMasterDocument>,
    @InjectModel(ServiceType.name)
    private serviceTypeModel: Model<ServiceTypeDocument>,
    @InjectModel(PlanVersion.name)
    private planVersionModel: Model<PlanVersionDocument>,
  ) {}

  /**
   * Get enabled category IDs based on the plan version's benefit configuration
   */
  private async getEnabledCategoryIds(planVersion: PlanVersionDocument): Promise<CategoryKey[]> {
    const enabledCategories: CategoryKey[] = [];
    const benefits = (planVersion as any).benefits || {};

    // Map enabled benefits to their corresponding categories
    for (const [benefitKey, categoryKeys] of Object.entries(BENEFIT_TO_CATEGORY)) {
      if (benefits[benefitKey]?.isEnabled) {
        enabledCategories.push(...categoryKeys);
      }
    }

    return [...new Set(enabledCategories)]; // Remove duplicates
  }

  /**
   * Get coverage matrix with virtual rows for all services
   */
  async getCoverageMatrix(
    planVersionId: string,
    categoryId?: string,
    searchQuery?: string,
    enabledOnly?: boolean,
  ): Promise<CoverageMatrixResponse> {
    // Get plan version to check enabled benefits
    const planVersion = await this.planVersionModel.findById(planVersionId);
    if (!planVersion) {
      throw new NotFoundException('Plan version not found');
    }

    // Get enabled categories based on benefit configuration
    const enabledCategoryIds = await this.getEnabledCategoryIds(planVersion);

    // Build query for categories
    const categoryQuery: any = {
      isActive: true,
      categoryId: { $in: enabledCategoryIds },
    };
    if (categoryId) {
      categoryQuery.categoryId = categoryId;
    }

    // Get active categories that are enabled via benefits
    const categories = await this.categoryModel
      .find(categoryQuery)
      .sort({ displayOrder: 1 });

    // Get all active services for enabled categories
    const serviceQuery: any = {
      categoryId: { $in: categories.map(c => c.categoryId) },
      isActive: true,
    };

    // Apply search filter
    if (searchQuery) {
      serviceQuery.$or = [
        { serviceCode: { $regex: searchQuery, $options: 'i' } },
        { serviceName: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const services = await this.serviceTypeModel
      .find(serviceQuery)
      .sort({ categoryId: 1, displayOrder: 1 });

    // Get existing coverage configuration
    const existingCoverage = await this.coverageModel.find({
      policyId: (planVersion as any).policyId,
      planVersion: (planVersion as any).planVersion,
    });

    // Create a map for quick lookup
    const coverageMap = new Map(
      existingCoverage.map(cov => [`${(cov as any).categoryId}-${(cov as any).serviceCode}`, cov])
    );

    // Build response with virtual rows
    const categoryCoverages: CategoryCoverage[] = [];
    let totalEnabledServices = 0;

    for (const category of categories) {
      const categoryServices = services.filter(s => s.categoryId === category.categoryId);
      const serviceCoverages: ServiceCoverage[] = [];
      let categoryEnabledCount = 0;

      for (const service of categoryServices) {
        const coverageKey = `${category.categoryId}-${service.serviceCode}`;
        const coverage = coverageMap.get(coverageKey);
        const isEnabled = (coverage as any)?.enabled || false;

        if (isEnabled) {
          categoryEnabledCount++;
          totalEnabledServices++;
        }

        // Apply enabled filter if needed
        if (!enabledOnly || isEnabled) {
          serviceCoverages.push({
            serviceCode: service.serviceCode,
            serviceName: service.serviceName,
            categoryId: category.categoryId,
            enabled: isEnabled,
            notes: (coverage as any)?.notes,
            isVirtual: !coverage, // Mark as virtual if no db record
          });
        }
      }

      // Only include category if it has services after filtering
      if (serviceCoverages.length > 0) {
        categoryCoverages.push({
          categoryId: category.categoryId,
          code: category.code,
          name: category.name,
          services: serviceCoverages,
          servicesCount: categoryServices.length,
          enabledCount: categoryEnabledCount,
        });
      }
    }

    const totalServices = services.length;

    return {
      planVersionId,
      categories: categoryCoverages,
      summary: {
        totalServices,
        enabledServices: totalEnabledServices,
        disabledServices: totalServices - totalEnabledServices,
      },
    };
  }

  /**
   * Get list of categories for dropdown
   */
  async getCategoriesForPlanVersion(planVersionId: string): Promise<CategoryInfo[]> {
    // Get plan version to check enabled benefits
    const planVersion = await this.planVersionModel.findById(planVersionId);
    if (!planVersion) {
      throw new NotFoundException('Plan version not found');
    }

    // Get enabled categories based on benefit configuration
    const enabledCategoryIds = await this.getEnabledCategoryIds(planVersion);

    // Get active categories that are enabled via benefits
    const categories = await this.categoryModel
      .find({
        isActive: true,
        categoryId: { $in: enabledCategoryIds },
      })
      .sort({ displayOrder: 1 });

    // Count services for each category
    const categoryInfos: CategoryInfo[] = [];
    for (const category of categories) {
      const servicesCount = await this.serviceTypeModel.countDocuments({
        categoryId: category.categoryId,
        isActive: true,
      });

      categoryInfos.push({
        categoryId: category.categoryId,
        code: category.code,
        name: category.name,
        servicesCount,
      });
    }

    return categoryInfos;
  }

  /**
   * Update coverage matrix (bulk upsert)
   */
  async updateCoverageMatrix(
    planVersionId: string,
    updateDto: UpdateCoverageDto,
    updatedBy: string,
  ) {
    // Validate plan version exists and is DRAFT
    const planVersion = await this.planVersionModel.findById(planVersionId);
    if (!planVersion) {
      throw new NotFoundException('Plan version not found');
    }

    if (planVersion.status !== PlanVersionStatus.DRAFT) {
      throw new ConflictException('Can only update coverage for DRAFT plan versions');
    }

    const { items } = updateDto;
    const policyId = (planVersion as any).policyId;
    const versionNumber = (planVersion as any).planVersion;

    // Validate all items before processing
    for (const item of items) {
      // Verify category exists
      const category = await this.categoryModel.findOne({
        categoryId: item.categoryId,
        isActive: true,
      });
      if (!category) {
        throw new NotFoundException(`Category ${item.categoryId} not found`);
      }

      // Verify service exists and belongs to the category
      const service = await this.serviceTypeModel.findOne({
        serviceCode: item.serviceCode,
        categoryId: item.categoryId,
        isActive: true,
      });
      if (!service) {
        throw new NotFoundException(`Service ${item.serviceCode} not found in category ${item.categoryId}`);
      }
    }

    // Process each service update
    const results = [];
    for (const item of items) {
      const result = await this.coverageModel.findOneAndUpdate(
        {
          policyId,
          planVersion: versionNumber,
          categoryId: item.categoryId,
          serviceCode: item.serviceCode,
        },
        {
          $set: {
            enabled: item.enabled,
            notes: item.notes,
            updatedBy,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            policyId,
            planVersion: versionNumber,
            categoryId: item.categoryId,
            serviceCode: item.serviceCode,
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        },
      );
      results.push(result);
    }

    // Return refreshed coverage matrix
    return this.getCoverageMatrix(planVersionId);
  }

  /**
   * Bulk enable/disable services for specific categories
   */
  async bulkUpdateCategoryServices(
    planVersionId: string,
    categoryIds: string[],
    enabled: boolean,
    updatedBy: string,
  ) {
    // Validate plan version exists and is DRAFT
    const planVersion = await this.planVersionModel.findById(planVersionId);
    if (!planVersion) {
      throw new NotFoundException('Plan version not found');
    }

    if (planVersion.status !== PlanVersionStatus.DRAFT) {
      throw new ConflictException('Can only update coverage for DRAFT plan versions');
    }

    const policyId = (planVersion as any).policyId;
    const versionNumber = (planVersion as any).planVersion;

    // Get all services for the specified categories
    const services = await this.serviceTypeModel.find({
      categoryId: { $in: categoryIds },
      isActive: true,
    });

    // Update all services
    const updates = [];
    for (const service of services) {
      const result = await this.coverageModel.findOneAndUpdate(
        {
          policyId,
          planVersion: versionNumber,
          categoryId: service.categoryId,
          serviceCode: service.serviceCode,
        },
        {
          $set: {
            enabled,
            updatedBy,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            policyId,
            planVersion: versionNumber,
            categoryId: service.categoryId,
            serviceCode: service.serviceCode,
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        },
      );
      updates.push(result);
    }

    return {
      message: `Services ${enabled ? 'enabled' : 'disabled'} successfully`,
      updatedCount: updates.length,
      categoryIds,
    };
  }

  /**
   * Check coverage readiness for a plan version
   * Returns detailed check results for readiness panel
   */
  async checkCoverageReadiness(planVersionId: string) {
    const planVersion = await this.planVersionModel.findById(planVersionId);
    if (!planVersion) {
      return {
        key: 'coverage',
        ok: false,
        message: 'Plan version not found',
      };
    }

    const policyId = (planVersion as any).policyId;
    const versionNumber = (planVersion as any).planVersion;

    // Get enabled categories based on benefit configuration
    const enabledCategoryIds = await this.getEnabledCategoryIds(planVersion);

    if (enabledCategoryIds.length === 0) {
      // No benefits enabled, so coverage is not required
      return {
        key: 'coverage',
        ok: true,
        message: 'No benefits enabled requiring coverage',
      };
    }

    // Check if each enabled category has at least one enabled service
    const missingCategories: string[] = [];

    for (const categoryId of enabledCategoryIds) {
      const enabledServices = await this.coverageModel.countDocuments({
        policyId,
        planVersion: versionNumber,
        categoryId,
        enabled: true,
      });

      if (enabledServices === 0) {
        missingCategories.push(categoryId);
      }
    }

    if (missingCategories.length > 0) {
      return {
        key: 'coverage.enabledForEnabledComponents',
        ok: false,
        message: `Coverage required for: ${missingCategories.join(', ')}`,
        details: missingCategories.map(categoryId => ({ categoryId })),
      };
    }

    return {
      key: 'coverage',
      ok: true,
      message: 'Coverage properly configured',
    };
  }
}