import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanConfig, PlanConfigSchema } from './schemas/plan-config.schema';
import { Assignment, AssignmentSchema } from '../assignments/schemas/assignment.schema';
import { Specialty, SpecialtySchema } from '../specialties/schemas/specialty.schema';
import { CategorySpecialtyMapping, CategorySpecialtyMappingSchema } from '../masters/schemas/category-specialty-mapping.schema';
import { LabService, LabServiceSchema } from '../lab/schemas/lab-service.schema';
import { CategoryLabServiceMapping, CategoryLabServiceMappingSchema } from '../masters/schemas/category-lab-service-mapping.schema';
import { ServiceMaster, ServiceMasterSchema } from '../masters/schemas/service-master.schema';
import { PlanConfigController } from './plan-config.controller';
import { PlanConfigService } from './plan-config.service';
import { PolicyServicesConfigController } from './policy-services-config.controller';
import { MemberServicesController } from './member-services.controller';
import { PolicyServicesConfigService } from './policy-services-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanConfig.name, schema: PlanConfigSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Specialty.name, schema: SpecialtySchema },
      { name: CategorySpecialtyMapping.name, schema: CategorySpecialtyMappingSchema },
      { name: LabService.name, schema: LabServiceSchema },
      { name: CategoryLabServiceMapping.name, schema: CategoryLabServiceMappingSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
    ]),
  ],
  controllers: [
    PlanConfigController,
    PolicyServicesConfigController,
    MemberServicesController,
  ],
  providers: [
    PlanConfigService,
    PolicyServicesConfigService,
  ],
  exports: [
    PlanConfigService,
    PolicyServicesConfigService,
  ],
})
export class PlanConfigModule {}