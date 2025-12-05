import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PREDEFINED_CATEGORIES } from '../../common/constants/predefined-categories.constant';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(CategoryMaster.name)
    private categoryModel: Model<CategoryMasterDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, createdBy?: string): Promise<CategoryMaster> {
    // Check if category with same ID already exists
    const existing = await this.categoryModel.findOne({
      categoryId: createCategoryDto.categoryId.toUpperCase()
    });

    if (existing) {
      throw new ConflictException(`Category with ID ${createCategoryDto.categoryId} already exists`);
    }

    // The schema requires 'code' field, so we'll use categoryId for both
    const category = new this.categoryModel({
      ...createCategoryDto,
      categoryId: createCategoryDto.categoryId.toUpperCase(),
      code: createCategoryDto.categoryId.toUpperCase(), // Use categoryId as code
      createdBy,
    });

    try {
      const saved = await category.save();

      // Verify it was actually saved
      const verification = await this.categoryModel.findById(saved._id);
      if (!verification) {
        throw new Error('Category save verification failed');
      }

      return saved;
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: PaginationDto & {
    isActive?: boolean;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 100,
      isActive,
      search,
    } = query;

    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { categoryId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ displayOrder: 1, categoryId: 1 })
        .exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CategoryMaster> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    updatedBy?: string,
  ): Promise<CategoryMaster> {
    const existingCategory = await this.categoryModel.findById(id);

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // For predefined categories, only allow description and displayOrder updates
    if (existingCategory.isPredefined) {
      const { description, displayOrder } = updateCategoryDto;

      // Check if trying to update fields other than description and displayOrder
      const attemptedFields = Object.keys(updateCategoryDto);
      const allowedFields = ['description', 'displayOrder'];
      const disallowedFields = attemptedFields.filter(field => !allowedFields.includes(field));

      if (disallowedFields.length > 0) {
        throw new BadRequestException(
          `Cannot modify ${disallowedFields.join(', ')} for predefined categories. Only 'description' and 'displayOrder' can be updated.`
        );
      }

      // Update only description and displayOrder
      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(
          id,
          {
            description,
            displayOrder,
            updatedBy,
          },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return updatedCategory as CategoryMaster;
    }

    // For non-predefined categories, allow all updates
    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(
        id,
        {
          ...updateCategoryDto,
          updatedBy,
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updatedCategory as CategoryMaster;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Prevent deletion of predefined categories
    if (category.isPredefined) {
      throw new BadRequestException(
        'Cannot delete predefined category. Predefined categories are system-managed and cannot be removed.'
      );
    }

    await this.categoryModel.findByIdAndDelete(id);
  }

  async toggleActive(id: string, updatedBy?: string): Promise<CategoryMaster> {
    const category = await this.findOne(id);
    return this.update(
      id,
      { isActive: !category.isActive },
      updatedBy,
    );
  }

  async getAllCategoryIds(): Promise<string[]> {
    const categories = await this.categoryModel.find({ isActive: true }, 'categoryId').exec();
    return categories.map(cat => cat.categoryId);
  }

  /**
   * Seed predefined categories - clears existing categories and inserts predefined ones
   * This is a one-time migration endpoint
   * @deprecated Use upsertPredefinedCategories() for production deployments
   */
  async seedPredefinedCategories(): Promise<{ message: string; categories: CategoryMaster[] }> {
    console.log('[CategoriesService] Starting seed of predefined categories');

    // Delete all existing categories
    const deleteResult = await this.categoryModel.deleteMany({});
    console.log(`[CategoriesService] Deleted ${deleteResult.deletedCount} existing categories`);

    // Insert predefined categories
    const insertedCategories = await this.categoryModel.insertMany(PREDEFINED_CATEGORIES);
    console.log(`[CategoriesService] Inserted ${insertedCategories.length} predefined categories`);

    return {
      message: `Successfully seeded ${insertedCategories.length} predefined categories`,
      categories: insertedCategories,
    };
  }

  /**
   * Upsert predefined categories - safe for production use
   * Updates existing predefined categories and inserts missing ones
   * Preserves: displayOrder, isActive, custom categories
   * Updates: name, description, code, isAvailableOnline
   */
  async upsertPredefinedCategories(): Promise<{
    message: string;
    inserted: number;
    updated: number;
    skipped: number;
    categories: CategoryMaster[];
  }> {
    console.log('[CategoriesService] Starting upsert of predefined categories');

    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
    };
    const processedCategories: CategoryMaster[] = [];

    for (const predefinedCat of PREDEFINED_CATEGORIES) {
      try {
        // Check if category exists by categoryId
        const existing = await this.categoryModel.findOne({
          categoryId: predefinedCat.categoryId,
        });

        if (existing) {
          // Update existing category - preserve displayOrder and isActive
          console.log(`[CategoriesService] Updating existing category: ${predefinedCat.categoryId}`);

          const updated = await this.categoryModel.findByIdAndUpdate(
            existing._id,
            {
              name: predefinedCat.name,
              description: predefinedCat.description,
              code: predefinedCat.code,
              isAvailableOnline: predefinedCat.isAvailableOnline,
              isPredefined: true,
              // Preserve displayOrder and isActive from existing category
            },
            { new: true, runValidators: true },
          ).exec();

          if (updated) {
            processedCategories.push(updated as CategoryMaster);
            results.updated++;
            console.log(`[CategoriesService] Updated category: ${predefinedCat.categoryId}`);
          }
        } else {
          // Insert new predefined category
          console.log(`[CategoriesService] Inserting new category: ${predefinedCat.categoryId}`);

          const inserted = await this.categoryModel.create(predefinedCat);
          processedCategories.push(inserted as CategoryMaster);
          results.inserted++;
          console.log(`[CategoriesService] Inserted category: ${predefinedCat.categoryId}`);
        }
      } catch (error) {
        console.error(`[CategoriesService] Error processing category ${predefinedCat.categoryId}:`, error);
        results.skipped++;
      }
    }

    const message = `Upsert completed: ${results.inserted} inserted, ${results.updated} updated, ${results.skipped} skipped`;
    console.log(`[CategoriesService] ${message}`);

    return {
      message,
      inserted: results.inserted,
      updated: results.updated,
      skipped: results.skipped,
      categories: processedCategories,
    };
  }
}