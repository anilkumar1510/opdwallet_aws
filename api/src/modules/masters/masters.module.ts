import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { CategoryMaster, CategoryMasterSchema } from './schemas/category-master.schema';
import { ServiceMaster, ServiceMasterSchema } from './schemas/service-master.schema';
import { RelationshipMaster, RelationshipMasterSchema } from './schemas/relationship-master.schema';
import { CugMaster, CugMasterSchema } from './schemas/cug-master.schema';
import { CategorySpecialtyMapping, CategorySpecialtyMappingSchema } from './schemas/category-specialty-mapping.schema';
import { CategoryLabServiceMapping, CategoryLabServiceMappingSchema } from './schemas/category-lab-service-mapping.schema';
import { Specialty, SpecialtySchema } from '../specialties/schemas/specialty.schema';
import { LabService, LabServiceSchema } from '../lab/schemas/lab-service.schema';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesMigrationController } from './services-migration.controller';
import { RelationshipsController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';
import { CugsController } from './cugs.controller';
import { CugsService } from './cugs.service';
import { CategorySpecialtyMappingController } from './category-specialty-mapping.controller';
import { CategorySpecialtyMappingService } from './category-specialty-mapping.service';
import { CategoryLabServiceMappingController } from './category-lab-service-mapping.controller';
import { CategoryLabServiceMappingService } from './category-lab-service-mapping.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryMaster.name, schema: CategoryMasterSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
      { name: RelationshipMaster.name, schema: RelationshipMasterSchema },
      { name: CugMaster.name, schema: CugMasterSchema },
      { name: CategorySpecialtyMapping.name, schema: CategorySpecialtyMappingSchema },
      { name: CategoryLabServiceMapping.name, schema: CategoryLabServiceMappingSchema },
      { name: Specialty.name, schema: SpecialtySchema },
      { name: LabService.name, schema: LabServiceSchema },
    ]),
    CacheModule.register({
      ttl: 60, // seconds
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [
    CategoriesController,
    ServicesController,
    ServicesMigrationController,
    RelationshipsController,
    CugsController,
    CategorySpecialtyMappingController,
    CategoryLabServiceMappingController,
  ],
  providers: [
    CategoriesService,
    ServicesService,
    RelationshipsService,
    CugsService,
    CategorySpecialtyMappingService,
    CategoryLabServiceMappingService,
  ],
  exports: [
    MongooseModule,
    CategoriesService,
    ServicesService,
    RelationshipsService,
    CugsService,
    CategorySpecialtyMappingService,
    CategoryLabServiceMappingService,
  ],
})
export class MastersModule {}