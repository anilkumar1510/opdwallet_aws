import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BenefitCoverageMatrixController } from './benefit-coverage-matrix.controller';
import { BenefitCoverageMatrixService } from './benefit-coverage-matrix.service';
import {
  BenefitCoverageMatrix,
  BenefitCoverageMatrixSchema,
} from './schemas/benefit-coverage-matrix.schema';
import { Policy, PolicySchema } from '../policies/schemas/policy.schema';
import { PlanVersion, PlanVersionSchema } from '../plan-versions/schemas/plan-version.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { ServiceType, ServiceTypeSchema } from '../services/schemas/service-type.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BenefitCoverageMatrix.name, schema: BenefitCoverageMatrixSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: PlanVersion.name, schema: PlanVersionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: 'Service', schema: ServiceTypeSchema },
    ]),
    AuditModule,
  ],
  controllers: [BenefitCoverageMatrixController],
  providers: [BenefitCoverageMatrixService],
  exports: [BenefitCoverageMatrixService],
})
export class BenefitCoverageMatrixModule {}