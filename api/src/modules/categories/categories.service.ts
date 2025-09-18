import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, createdBy?: string): Promise<Category> {
    // Check if category with same ID already exists
    const existing = await this.categoryModel.findOne({
      categoryId: createCategoryDto.categoryId.toUpperCase()
    });

    if (existing) {
      throw new ConflictException(`Category with ID ${createCategoryDto.categoryId} already exists`);
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      categoryId: createCategoryDto.categoryId.toUpperCase(),
      createdBy,
    });

    return category.save();
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

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort({ displayOrder: 1, name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    return {
      data,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findByCategoryId(categoryId: string): Promise<Category> {
    const category = await this.categoryModel.findOne({
      categoryId: categoryId.toUpperCase()
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    updatedBy?: string,
  ): Promise<Category> {
    // Note: categoryId field cannot be updated (immutable in schema)
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      {
        ...updateCategoryDto,
        updatedBy,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async remove(id: string): Promise<void> {
    // Categories cannot be deleted as per requirement
    throw new BadRequestException('Categories cannot be deleted. You can only deactivate them.');
  }

  async toggleActive(id: string, updatedBy?: string): Promise<Category> {
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