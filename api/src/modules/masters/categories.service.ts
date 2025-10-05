import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

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
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Benefit component check removed - old architecture deleted

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
}