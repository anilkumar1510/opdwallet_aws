import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CoverageService } from './coverage.service';
import { Model } from 'mongoose';
import { BenefitCoverageMatrix } from './schemas/benefit-coverage-matrix.schema';
import { CategoryMaster } from '../masters/schemas/category-master.schema';
import { ServiceMaster } from '../masters/schemas/service-master.schema';
import { PlanVersion } from '../plan-versions/schemas/plan-version.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CATEGORY_KEYS } from '@/common/constants/coverage.constants';

describe('CoverageService', () => {
  let service: CoverageService;
  let coverageMatrixModel: Model<BenefitCoverageMatrix>;
  let categoryMasterModel: Model<CategoryMaster>;
  let serviceMasterModel: Model<ServiceMaster>;
  let planVersionModel: Model<PlanVersion>;

  const mockCategoryMasters = [
    {
      categoryId: 'CONSULTATION',
      code: 'CAT001',
      name: 'Consultation Services',
      isActive: true
    },
    {
      categoryId: 'PHARMACY',
      code: 'CAT002',
      name: 'Pharmacy Services',
      isActive: true
    },
  ];

  const mockServiceMasters = [
    {
      serviceCode: 'CON001',
      serviceName: 'General Consultation',
      categoryId: 'CONSULTATION',
      isActive: true
    },
    {
      serviceCode: 'CON002',
      serviceName: 'Specialist Consultation',
      categoryId: 'CONSULTATION',
      isActive: true
    },
    {
      serviceCode: 'PHA001',
      serviceName: 'Essential Drugs',
      categoryId: 'PHARMACY',
      isActive: true
    },
  ];

  const mockCoverageMatrix = [
    {
      planVersionId: 'planVersion123',
      categoryId: 'CONSULTATION',
      serviceCode: 'CON001',
      enabled: true,
      notes: 'Covered',
    },
  ];

  const mockPlanVersion = {
    _id: 'planVersion123',
    policyId: 'policy123',
    version: 1,
    status: 'DRAFT',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoverageService,
        {
          provide: getModelToken(BenefitCoverageMatrix.name),
          useValue: {
            find: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockCoverageMatrix),
            }),
            findOne: jest.fn(),
            create: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteMany: jest.fn(),
            bulkWrite: jest.fn(),
          },
        },
        {
          provide: getModelToken(CategoryMaster.name),
          useValue: {
            find: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockCategoryMasters),
            }),
          },
        },
        {
          provide: getModelToken(ServiceMaster.name),
          useValue: {
            find: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockServiceMasters),
            }),
          },
        },
        {
          provide: getModelToken(PlanVersion.name),
          useValue: {
            findById: jest.fn().mockResolvedValue(mockPlanVersion),
          },
        },
      ],
    }).compile();

    service = module.get<CoverageService>(CoverageService);
    coverageMatrixModel = module.get<Model<BenefitCoverageMatrix>>(
      getModelToken(BenefitCoverageMatrix.name),
    );
    categoryMasterModel = module.get<Model<CategoryMaster>>(
      getModelToken(CategoryMaster.name),
    );
    serviceMasterModel = module.get<Model<ServiceMaster>>(
      getModelToken(ServiceMaster.name),
    );
    planVersionModel = module.get<Model<PlanVersion>>(
      getModelToken(PlanVersion.name),
    );
  });

  describe('getCoverageMatrix', () => {
    it('should return coverage matrix with virtual rows', async () => {
      const result = await service.getCoverageMatrix('planVersion123');

      expect(result.planVersionId).toBe('planVersion123');
      expect(result.categories).toHaveLength(2); // 2 categories
      expect(result.summary).toBeDefined();
      expect(result.summary.totalServices).toBe(3);
      expect(result.summary.enabledServices).toBe(1); // Only CON001 is enabled
      expect(result.summary.disabledServices).toBe(2);
    });

    it('should filter by categoryId', async () => {
      const result = await service.getCoverageMatrix(
        'planVersion123',
        'CONSULTATION',
      );

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].categoryId).toBe('CONSULTATION');
      expect(result.categories[0].services).toHaveLength(2);
    });

    it('should filter by search query', async () => {
      const result = await service.getCoverageMatrix(
        'planVersion123',
        undefined,
        'General',
      );

      expect(result.summary.totalServices).toBe(1);
      const consultationCategory = result.categories.find(
        c => c.categoryId === 'CONSULTATION'
      );
      expect(consultationCategory?.services).toHaveLength(1);
      expect(consultationCategory?.services[0].serviceName).toContain('General');
    });

    it('should filter by enabledOnly', async () => {
      const result = await service.getCoverageMatrix(
        'planVersion123',
        undefined,
        undefined,
        true,
      );

      expect(result.summary.totalServices).toBe(1);
      expect(result.summary.enabledServices).toBe(1);
    });

    it('should mark non-configured services as virtual', async () => {
      const result = await service.getCoverageMatrix('planVersion123');

      const consultationCategory = result.categories.find(
        c => c.categoryId === 'CONSULTATION'
      );

      const con001 = consultationCategory?.services.find(s => s.serviceCode === 'CON001');
      const con002 = consultationCategory?.services.find(s => s.serviceCode === 'CON002');

      expect(con001?.isVirtual).toBe(false); // Has database record
      expect(con002?.isVirtual).toBe(true);  // Virtual row
    });
  });

  describe('getCategoriesForPlanVersion', () => {
    it('should return categories with service counts', async () => {
      const result = await service.getCategoriesForPlanVersion('planVersion123');

      expect(result).toHaveLength(2);
      expect(result[0].categoryId).toBe('CONSULTATION');
      expect(result[0].servicesCount).toBe(2);
      expect(result[1].categoryId).toBe('PHARMACY');
      expect(result[1].servicesCount).toBe(1);
    });
  });

  describe('updateCoverageMatrix', () => {
    it('should update coverage matrix for DRAFT version', async () => {
      const updateDto = {
        items: [
          {
            categoryId: 'CONSULTATION',
            serviceCode: 'CON002',
            enabled: true,
            notes: 'Now covered',
          },
        ],
      };

      jest.spyOn(coverageMatrixModel, 'bulkWrite').mockResolvedValueOnce({} as any);

      await service.updateCoverageMatrix('planVersion123', updateDto);

      expect(planVersionModel.findById).toHaveBeenCalledWith('planVersion123');
      expect(coverageMatrixModel.bulkWrite).toHaveBeenCalled();
    });

    it('should throw error for non-DRAFT version', async () => {
      const publishedVersion = { ...mockPlanVersion, status: 'PUBLISHED' };
      jest.spyOn(planVersionModel, 'findById').mockResolvedValueOnce(publishedVersion as any);

      const updateDto = {
        items: [
          {
            categoryId: 'CONSULTATION',
            serviceCode: 'CON002',
            enabled: true,
          },
        ],
      };

      await expect(
        service.updateCoverageMatrix('planVersion123', updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for non-existent plan version', async () => {
      jest.spyOn(planVersionModel, 'findById').mockResolvedValueOnce(null);

      const updateDto = {
        items: [
          {
            categoryId: 'CONSULTATION',
            serviceCode: 'CON002',
            enabled: true,
          },
        ],
      };

      await expect(
        service.updateCoverageMatrix('planVersion123', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkEnableServices', () => {
    it('should enable all services in specified categories', async () => {
      jest.spyOn(coverageMatrixModel, 'bulkWrite').mockResolvedValueOnce({} as any);

      await service.bulkEnableServices('planVersion123', ['CONSULTATION']);

      expect(planVersionModel.findById).toHaveBeenCalledWith('planVersion123');
      expect(coverageMatrixModel.bulkWrite).toHaveBeenCalled();

      const bulkWriteCall = (coverageMatrixModel.bulkWrite as jest.Mock).mock.calls[0][0];
      expect(bulkWriteCall).toHaveLength(2); // 2 services in CONSULTATION category
      expect(bulkWriteCall[0].updateOne.update.$set.enabled).toBe(true);
    });
  });

  describe('bulkDisableServices', () => {
    it('should disable all services in specified categories', async () => {
      jest.spyOn(coverageMatrixModel, 'bulkWrite').mockResolvedValueOnce({} as any);

      await service.bulkDisableServices('planVersion123', ['CONSULTATION']);

      expect(planVersionModel.findById).toHaveBeenCalledWith('planVersion123');
      expect(coverageMatrixModel.bulkWrite).toHaveBeenCalled();

      const bulkWriteCall = (coverageMatrixModel.bulkWrite as jest.Mock).mock.calls[0][0];
      expect(bulkWriteCall).toHaveLength(2); // 2 services in CONSULTATION category
      expect(bulkWriteCall[0].updateOne.update.$set.enabled).toBe(false);
    });
  });

  describe('getCoverageReadiness', () => {
    it('should return readiness status for all categories', async () => {
      const result = await service.getCoverageReadiness('planVersion123');

      expect(result.isReady).toBe(false); // Not all services are configured
      expect(result.categories).toHaveLength(2);

      const consultationCategory = result.categories.find(
        c => c.categoryId === 'CONSULTATION'
      );
      expect(consultationCategory?.configured).toBe(1);
      expect(consultationCategory?.total).toBe(2);
      expect(consultationCategory?.percentage).toBe(50);
    });

    it('should return isReady true when all services are configured', async () => {
      // Mock all services as configured
      const allConfigured = [
        ...mockCoverageMatrix,
        {
          planVersionId: 'planVersion123',
          categoryId: 'CONSULTATION',
          serviceCode: 'CON002',
          enabled: false,
        },
        {
          planVersionId: 'planVersion123',
          categoryId: 'PHARMACY',
          serviceCode: 'PHA001',
          enabled: true,
        },
      ];

      jest.spyOn(coverageMatrixModel, 'find').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(allConfigured),
      } as any);

      const result = await service.getCoverageReadiness('planVersion123');

      expect(result.isReady).toBe(true);
      expect(result.overallPercentage).toBe(100);
    });
  });
});