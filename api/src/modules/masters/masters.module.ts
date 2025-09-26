import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryMaster, CategoryMasterSchema } from './schemas/category-master.schema';
import { ServiceMaster, ServiceMasterSchema } from './schemas/service-master.schema';
import { RelationshipMaster, RelationshipMasterSchema } from './schemas/relationship-master.schema';
import { CugMaster, CugMasterSchema } from './schemas/cug-master.schema';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesMigrationController } from './services-migration.controller';
import { RelationshipsController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';
import { CugsController } from './cugs.controller';
import { CugsService } from './cugs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryMaster.name, schema: CategoryMasterSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
      { name: RelationshipMaster.name, schema: RelationshipMasterSchema },
      { name: CugMaster.name, schema: CugMasterSchema },
    ]),
  ],
  controllers: [CategoriesController, ServicesController, ServicesMigrationController, RelationshipsController, CugsController],
  providers: [CategoriesService, ServicesService, RelationshipsService, CugsService],
  exports: [MongooseModule, CategoriesService, ServicesService, RelationshipsService, CugsService],
})
export class MastersModule {}