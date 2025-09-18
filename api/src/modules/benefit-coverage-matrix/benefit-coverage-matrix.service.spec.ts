import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BenefitCoverageMatrixService } from './benefit-coverage-matrix.service';
import { BenefitCoverageMatrix } from './schemas/benefit-coverage-matrix.schema';
import { PlanVersionService } from '../plan-version/plan-version.service';
import { CategoryService } from '../category/category.service';
import { ServiceService } from '../service/service.service';
import { AuditService } from '../audit/audit.service';
import { PlanVersionStatus } from '../plan-version/schemas/plan-version.schema';

describe('BenefitCoverageMatrixService', () => {
  let service: BenefitCoverageMatrixService;
  let model: Model<BenefitCoverageMatrix>;
  let planVersionService: PlanVersionService;
  let categoryService: CategoryService;
  let serviceService: ServiceService;
  let auditService: AuditService;

  const mockMatrix = {
    _id: 'matrix123',
    policyId: 'policy123',
    planVersion: 'v1.0',
    rows: [
      {
        categoryId: 'CAT001',
        serviceCode: 'SVC001',
        enabled: true,
        notes: 'Test note'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue(this)
  };

  const mockPlanVersion = {
    _id: 'version123',
    policyId: 'policy123',
    planVersion: 'v1.0',
    status: PlanVersionStatus.DRAFT
  };

  const mockCategory = {
    _id: 'CAT001',
    categoryId: 'CAT001',
    name: 'Test Category',
    active: true
  };

  const mockService = {
    _id: 'service123',
    serviceCode: 'SVC001',
    name: 'Test Service',
    categoryId: 'CAT001'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BenefitCoverageMatrixService,
        {
          provide: getModelToken(BenefitCoverageMatrix.name),
          useValue: {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            find: jest.fn(),
            deleteOne: jest.fn(),
            create: jest.fn(),
            exec: jest.fn()
          }
        },
        {
          provide: PlanVersionService,
          useValue: {
            findOne: jest.fn()
          }
        },
        {
          provide: CategoryService,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn()
          }
        },
        {
          provide: ServiceService,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn()
          }
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<BenefitCoverageMatrixService>(BenefitCoverageMatrixService);
    model = module.get<Model<BenefitCoverageMatrix>>(getModelToken(BenefitCoverageMatrix.name));
    planVersionService = module.get<PlanVersionService>(PlanVersionService);
    categoryService = module.get<CategoryService>(CategoryService);
    serviceService = module.get<ServiceService>(ServiceService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('findOne', () => {
    it('should return a coverage matrix', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMatrix)
      } as any);

      const result = await service.findOne('policy123', 'v1.0');
      expect(result).toEqual(mockMatrix);
      expect(model.findOne).toHaveBeenCalledWith({
        policyId: 'policy123',
        planVersion: 'v1.0'
      });
    });
  });

  describe('update', () => {
    it('should update coverage matrix for DRAFT plan version', async () => {
      jest.spyOn(planVersionService, 'findOne').mockResolvedValue(mockPlanVersion as any);
      jest.spyOn(categoryService, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(serviceService, 'findOne').mockResolvedValue(mockService as any);
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMatrix)
      } as any);

      const updateDto = {
        rows: [
          {
            categoryId: 'CAT001',
            serviceCode: 'SVC001',
            enabled: true,
            notes: 'Updated note'
          }
        ]
      };

      const result = await service.update(
        'policy123',
        'v1.0',
        updateDto,
        { id: 'user123', email: 'test@test.com', roles: ['ADMIN'] }
      );

      expect(result).toEqual(mockMatrix);
      expect(planVersionService.findOne).toHaveBeenCalledWith('policy123', 'v1.0');
      expect(categoryService.findOne).toHaveBeenCalledWith('CAT001');
      expect(serviceService.findOne).toHaveBeenCalledWith('SVC001');
    });

    it('should throw ForbiddenException for PUBLISHED plan version', async () => {
      const publishedVersion = { ...mockPlanVersion, status: PlanVersionStatus.PUBLISHED };
      jest.spyOn(planVersionService, 'findOne').mockResolvedValue(publishedVersion as any);

      const updateDto = {
        rows: [
          {
            categoryId: 'CAT001',
            serviceCode: 'SVC001',
            enabled: true
          }
        ]
      };

      await expect(
        service.update('policy123', 'v1.0', updateDto, { id: 'user123', email: 'test@test.com', roles: ['ADMIN'] })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent plan version', async () => {
      jest.spyOn(planVersionService, 'findOne').mockResolvedValue(null);

      const updateDto = {
        rows: [
          {
            categoryId: 'CAT001',
            enabled: true
          }
        ]
      };

      await expect(
        service.update('policy123', 'v1.0', updateDto, { id: 'user123', email: 'test@test.com', roles: ['ADMIN'] })
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate category exists and is active', async () => {
      jest.spyOn(planVersionService, 'findOne').mockResolvedValue(mockPlanVersion as any);
      jest.spyOn(categoryService, 'findOne').mockResolvedValue(null);

      const updateDto = {
        rows: [
          {
            categoryId: 'CAT999',
            enabled: true
          }
        ]
      };

      await expect(
        service.update('policy123', 'v1.0', updateDto, { id: 'user123', email: 'test@test.com', roles: ['ADMIN'] })
      ).rejects.toThrow('Category CAT999 not found or inactive');
    });

    it('should validate service belongs to category', async () => {
      jest.spyOn(planVersionService, 'findOne').mockResolvedValue(mockPlanVersion as any);
      jest.spyOn(categoryService, 'findOne').mockResolvedValue(mockCategory as any);
      jest.spyOn(serviceService, 'findOne').mockResolvedValue({
        ...mockService,
        categoryId: 'CAT002'
      } as any);

      const updateDto = {
        rows: [
          {
            categoryId: 'CAT001',
            serviceCode: 'SVC001',
            enabled: true
          }
        ]
      };

      await expect(
        service.update('policy123', 'v1.0', updateDto, { id: 'user123', email: 'test@test.com', roles: ['ADMIN'] })
      ).rejects.toThrow('Service SVC001 does not belong to category CAT001');
    });
  });

  describe('findWithNormalized', () => {
    it('should return normalized coverage matrix with category and service names', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMatrix)
      } as any);
      jest.spyOn(categoryService, 'find').mockResolvedValue([mockCategory] as any);
      jest.spyOn(serviceService, 'find').mockResolvedValue([mockService] as any);

      const result = await service.findWithNormalized('policy123', 'v1.0');

      expect(result.rows[0]).toHaveProperty('categoryName', 'Test Category');
      expect(result.rows[0]).toHaveProperty('serviceName', 'Test Service');
    });

    it('should handle rows without service codes', async () => {
      const matrixWithoutService = {
        ...mockMatrix,
        rows: [
          {
            categoryId: 'CAT001',
            enabled: true,
            notes: 'Category only'
          }
        ]
      };

      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(matrixWithoutService)
      } as any);
      jest.spyOn(categoryService, 'find').mockResolvedValue([mockCategory] as any);
      jest.spyOn(serviceService, 'find').mockResolvedValue([] as any);

      const result = await service.findWithNormalized('policy123', 'v1.0');

      expect(result.rows[0]).toHaveProperty('categoryName', 'Test Category');
      expect(result.rows[0]).not.toHaveProperty('serviceName');
    });
  });

  describe('delete', () => {
    it('should delete coverage matrix and log audit', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMatrix)
      } as any);
      jest.spyOn(model, 'deleteOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
      } as any);

      await service.delete(
        'policy123',
        'v1.0',
        { id: 'user123', email: 'test@test.com', roles: ['ADMIN'] }
      );

      expect(model.deleteOne).toHaveBeenCalledWith({
        policyId: 'policy123',
        planVersion: 'v1.0'
      });
      expect(auditService.log).toHaveBeenCalled();
    });
  });
});