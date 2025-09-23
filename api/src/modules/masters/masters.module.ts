import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryMaster, CategoryMasterSchema } from './schemas/category-master.schema';
import { ServiceMaster, ServiceMasterSchema } from './schemas/service-master.schema';
import { RelationshipMaster, RelationshipMasterSchema } from './schemas/relationship-master.schema';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesMigrationController } from './services-migration.controller';
import { RelationshipsController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryMaster.name, schema: CategoryMasterSchema },
      { name: ServiceMaster.name, schema: ServiceMasterSchema },
      { name: RelationshipMaster.name, schema: RelationshipMasterSchema },
    ]),
  ],
  controllers: [CategoriesController, ServicesController, ServicesMigrationController, RelationshipsController],
  providers: [CategoriesService, ServicesService, RelationshipsService],
  exports: [MongooseModule, CategoriesService, ServicesService, RelationshipsService],
})
export class MastersModule {}