import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoverageService } from './coverage.service';
import { BenefitCoverageMatrix, BenefitCoverageMatrixSchema } from './schemas/benefit-coverage-matrix.schema';
import { MastersModule } from '../masters/masters.module';
import { PlanVersion, PlanVersionSchema } from '../plan-versions/schemas/plan-version.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BenefitCoverageMatrix.name, schema: BenefitCoverageMatrixSchema },
      { name: PlanVersion.name, schema: PlanVersionSchema },
    ]),
    MastersModule,
  ],
  controllers: [],
  providers: [CoverageService],
  exports: [CoverageService],
})
export class BenefitsModule {}