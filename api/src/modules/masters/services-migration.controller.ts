import { Controller, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceMaster, ServiceMasterDocument } from './schemas/service-master.schema';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/constants/roles.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesMigrationController {
  constructor(
    @InjectModel(ServiceMaster.name) private serviceModel: Model<ServiceMasterDocument>,
    @InjectModel(CategoryMaster.name) private categoryModel: Model<CategoryMasterDocument>,
  ) {}

  @Post('migrate-invalid-services')
  @Roles(UserRole.SUPER_ADMIN)
  async migrateInvalidServices() {
    console.log('🔧 Starting migration of invalid service categories...');

    // Get the first available active category
    const firstCategory = await this.categoryModel.findOne(
      { isActive: true },
      null,
      { sort: { displayOrder: 1, categoryId: 1 } }
    );

    if (!firstCategory) {
      return {
        success: false,
        message: 'No active categories found. Please create at least one category first.',
        updated: 0
      };
    }

    console.log(`✅ Found first category: ${firstCategory.categoryId} (${firstCategory.name})`);

    // Find services with invalid categories
    const invalidServices = await this.serviceModel.find({
      category: 'CONSULTATION SERVICES'
    });

    console.log(`🔍 Found ${invalidServices.length} services with invalid category "CONSULTATION SERVICES"`);

    if (invalidServices.length === 0) {
      return {
        success: true,
        message: 'No services need migration',
        updated: 0
      };
    }

    // Update services to use the first valid category
    const result = await this.serviceModel.updateMany(
      { category: 'CONSULTATION SERVICES' },
      {
        $set: {
          category: firstCategory.categoryId,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} services to use category: ${firstCategory.categoryId}`);

    // Verify the update
    const remainingInvalid = await this.serviceModel.countDocuments({
      category: 'CONSULTATION SERVICES'
    });

    return {
      success: remainingInvalid === 0,
      message: remainingInvalid === 0
        ? `Successfully migrated ${result.modifiedCount} services to category: ${firstCategory.categoryId} (${firstCategory.name})`
        : `Migration partially completed. ${remainingInvalid} services still have invalid categories`,
      updated: result.modifiedCount,
      migratedTo: {
        categoryId: firstCategory.categoryId,
        categoryName: firstCategory.name
      }
    };
  }
}