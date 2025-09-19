import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryMaster, CategoryMasterSchema } from './schemas/category-master.schema';
import { ServiceType, ServiceTypeSchema } from './schemas/service-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryMaster.name, schema: CategoryMasterSchema },
      { name: ServiceType.name, schema: ServiceTypeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MastersModule {}