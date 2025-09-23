import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(CategoryMaster.name)
    private categoryModel: Model<CategoryMasterDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, createdBy?: string): Promise<CategoryMaster> {
    console.log('[CategoriesService] Creating category:', JSON.stringify(createCategoryDto, null, 2));
    console.log('[CategoriesService] Created by:', createdBy);

    // Check if category with same ID already exists
    const existing = await this.categoryModel.findOne({
      categoryId: createCategoryDto.categoryId.toUpperCase()
    });

    if (existing) {
      console.log('[CategoriesService] Category already exists:', existing.categoryId);
      throw new ConflictException(`Category with ID ${createCategoryDto.categoryId} already exists`);
    }

    // The schema requires 'code' field, so we'll use categoryId for both
    const category = new this.categoryModel({
      ...createCategoryDto,
      categoryId: createCategoryDto.categoryId.toUpperCase(),
      code: createCategoryDto.categoryId.toUpperCase(), // Use categoryId as code
      createdBy,
    });

    console.log('[CategoriesService] Saving new category...');
    try {
      const saved = await category.save();
      console.log('[CategoriesService] Category saved successfully:', saved._id);

      // Verify it was actually saved
      const verification = await this.categoryModel.findById(saved._id);
      if (!verification) {
        console.error('[CategoriesService] ERROR: Category not found after save!');
        throw new Error('Category save verification failed');
      }
      console.log('[CategoriesService] Verified category exists in DB');

      return saved;
    } catch (error) {
      console.error('[CategoriesService] Save error:', error);
      throw error;
    }
  }

  async findAll(query: PaginationDto & {
    isActive?: boolean;
    search?: string;
  }) {
    console.log('🔍🔍🔍 [CategoriesService.findAll] START 🔍🔍🔍');
    console.log('[CategoriesService.findAll] Incoming query:', JSON.stringify(query, null, 2));
    console.log('[CategoriesService.findAll] Model name:', this.categoryModel.modelName);
    console.log('[CategoriesService.findAll] Collection name:', this.categoryModel.collection.name);

    const {
      page = 1,
      limit = 100,
      isActive,
      search,
    } = query;

    console.log('[CategoriesService.findAll] Parsed params:', { page, limit, isActive, search });

    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
      console.log('[CategoriesService.findAll] Adding isActive filter:', isActive);
    }

    if (search) {
      filter.$or = [
        { categoryId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
      console.log('[CategoriesService.findAll] Adding search filter:', search);
    }

    console.log('[CategoriesService.findAll] Final filter:', JSON.stringify(filter, null, 2));

    const skip = (page - 1) * limit;
    console.log('[CategoriesService.findAll] Skip/Limit:', { skip, limit });

    // First, let's check what's in the database directly
    const allDocsInDb = await this.categoryModel.find({}).exec();
    console.log('[CategoriesService.findAll] ALL DOCS IN DB (no filter):', allDocsInDb.length);
    console.log('[CategoriesService.findAll] ALL CATEGORY IDs IN DB:', allDocsInDb.map(c => ({
      id: c._id,
      categoryId: c.categoryId,
      name: c.name,
      isActive: c.isActive
    })));

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ displayOrder: 1, categoryId: 1 })
        .exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    console.log(`[CategoriesService.findAll] Query results: Found ${data.length} categories, total count: ${total}`);
    console.log('[CategoriesService.findAll] Categories returned:');
    data.forEach((cat, idx) => {
      console.log(`  [${idx}] ID: ${cat._id}, CategoryID: ${cat.categoryId}, Name: ${cat.name}, Active: ${cat.isActive}, Order: ${cat.displayOrder}`);
    });

    const result = {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    console.log('[CategoriesService.findAll] Returning result structure:', {
      dataCount: result.data.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages
    });
    console.log('🔍🔍🔍 [CategoriesService.findAll] END 🔍🔍🔍');

    return result;
  }

  async findOne(id: string): Promise<CategoryMaster> {
    console.log('[CategoriesService] Finding category by ID:', id);

    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      console.log('[CategoriesService] Category not found:', id);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    console.log('[CategoriesService] Found category:', category.categoryId);
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    updatedBy?: string,
  ): Promise<CategoryMaster> {
    console.log('[CategoriesService] Updating category:', id);
    console.log('[CategoriesService] Update data:', JSON.stringify(updateCategoryDto, null, 2));

    const category = await this.categoryModel
      .findByIdAndUpdate(
        id,
        {
          ...updateCategoryDto,
          updatedBy,
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!category) {
      console.log('[CategoriesService] Category not found for update:', id);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    console.log('[CategoriesService] Category updated successfully');
    return category;
  }

  async remove(id: string): Promise<void> {
    console.log('[CategoriesService] Removing category:', id);

    const category = await this.categoryModel.findById(id);

    if (!category) {
      console.log('[CategoriesService] Category not found for deletion:', id);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Benefit component check removed - old architecture deleted
    console.log('[CategoriesService] Benefit component check skipped - old architecture removed');

    await this.categoryModel.findByIdAndDelete(id);
    console.log('[CategoriesService] Category deleted successfully');
  }

  async toggleActive(id: string, updatedBy?: string): Promise<CategoryMaster> {
    console.log('[CategoriesService] Toggling active status for category:', id);

    const category = await this.findOne(id);
    return this.update(
      id,
      { isActive: !category.isActive },
      updatedBy,
    );
  }

  async getAllCategoryIds(): Promise<string[]> {
    console.log('[CategoriesService] Getting all category IDs');

    const categories = await this.categoryModel.find({ isActive: true }, 'categoryId').exec();
    const ids = categories.map(cat => cat.categoryId);

    console.log('[CategoriesService] Found category IDs:', ids);
    return ids;
  }
}