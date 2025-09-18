import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';

describe('BenefitCoverageMatrix (e2e)', () => {
  let app: INestApplication;
  const mockAuthGuard = {
    canActivate: () => true
  };
  const mockRolesGuard = {
    canActivate: () => true
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/admin/benefit-coverage-matrix/:policyId/:planVersion (GET)', () => {
    it('should return coverage matrix for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('policyId');
          expect(res.body).toHaveProperty('planVersion');
          expect(res.body).toHaveProperty('rows');
        });
    });

    it('should return 404 for non-existent matrix', () => {
      return request(app.getHttpServer())
        .get('/api/admin/benefit-coverage-matrix/invalid/v0.0')
        .expect(404);
    });
  });

  describe('/api/admin/benefit-coverage-matrix/:policyId/:planVersion (PUT)', () => {
    const updateDto = {
      rows: [
        {
          categoryId: 'CAT001',
          serviceCode: 'SVC001',
          enabled: true,
          notes: 'Test note'
        },
        {
          categoryId: 'CAT002',
          enabled: false
        }
      ]
    };

    it('should update coverage matrix for DRAFT version', () => {
      return request(app.getHttpServer())
        .put('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rows');
          expect(Array.isArray(res.body.rows)).toBe(true);
        });
    });

    it('should validate row structure', () => {
      const invalidDto = {
        rows: [
          {
            categoryId: 'INVALID', // Should start with CAT
            enabled: true
          }
        ]
      };

      return request(app.getHttpServer())
        .put('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .send(invalidDto)
        .expect(400);
    });

    it('should validate service code format', () => {
      const invalidDto = {
        rows: [
          {
            categoryId: 'CAT001',
            serviceCode: '123', // Invalid format
            enabled: true
          }
        ]
      };

      return request(app.getHttpServer())
        .put('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .send(invalidDto)
        .expect(400);
    });

    it('should require enabled field', () => {
      const invalidDto = {
        rows: [
          {
            categoryId: 'CAT001'
            // Missing enabled field
          }
        ]
      };

      return request(app.getHttpServer())
        .put('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/api/admin/benefit-coverage-matrix/:policyId/:planVersion (DELETE)', () => {
    it('should delete coverage matrix', () => {
      return request(app.getHttpServer())
        .delete('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Coverage matrix deleted successfully');
        });
    });
  });

  describe('/api/member/benefit-coverage-matrix/:policyId/:planVersion (GET)', () => {
    it('should return coverage matrix for member', () => {
      return request(app.getHttpServer())
        .get('/api/member/benefit-coverage-matrix/policy123/v1.0')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('policyId');
          expect(res.body).toHaveProperty('planVersion');
          expect(res.body).toHaveProperty('rows');
        });
    });

    it('should not allow member to update coverage matrix', () => {
      const updateDto = {
        rows: [
          {
            categoryId: 'CAT001',
            enabled: true
          }
        ]
      };

      return request(app.getHttpServer())
        .put('/api/member/benefit-coverage-matrix/policy123/v1.0')
        .send(updateDto)
        .expect(404); // Endpoint should not exist for members
    });
  });

  describe('Coverage Matrix with Normalized Data', () => {
    it('should return normalized data with category and service names', () => {
      return request(app.getHttpServer())
        .get('/api/admin/benefit-coverage-matrix/policy123/v1.0/normalized')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rows');
          if (res.body.rows.length > 0) {
            const firstRow = res.body.rows[0];
            expect(firstRow).toHaveProperty('categoryName');
            if (firstRow.serviceCode) {
              expect(firstRow).toHaveProperty('serviceName');
            }
          }
        });
    });
  });

  describe('Validation Tests', () => {
    it('should validate maximum notes length', () => {
      const longNotesDto = {
        rows: [
          {
            categoryId: 'CAT001',
            enabled: true,
            notes: 'x'.repeat(1001) // Exceeds 1000 char limit
          }
        ]
      };

      return request(app.getHttpServer())
        .put('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .send(longNotesDto)
        .expect(400);
    });

    it('should handle empty rows array', () => {
      const emptyDto = {
        rows: []
      };

      return request(app.getHttpServer())
        .put('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .send(emptyDto)
        .expect(200); // Empty rows should be allowed
    });

    it('should validate duplicate rows', () => {
      const duplicateDto = {
        rows: [
          {
            categoryId: 'CAT001',
            serviceCode: 'SVC001',
            enabled: true
          },
          {
            categoryId: 'CAT001',
            serviceCode: 'SVC001', // Duplicate
            enabled: false
          }
        ]
      };

      return request(app.getHttpServer())
        .put('/api/admin/benefit-coverage-matrix/policy123/v1.0')
        .send(duplicateDto)
        .expect(400);
    });
  });
});