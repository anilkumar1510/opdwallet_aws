import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceType, ServiceTypeDocument } from './schemas/service-type.schema';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto/service-type.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(ServiceType.name)
    private serviceTypeModel: Model<ServiceTypeDocument>,
    private categoriesService: CategoriesService,
  ) {}

  async create(createServiceTypeDto: CreateServiceTypeDto, createdBy?: string): Promise<ServiceType> {
    // Check if service type with same code already exists
    const existing = await this.serviceTypeModel.findOne({ code: createServiceTypeDto.code });
    if (existing) {
      throw new ConflictException(`Service type with code ${createServiceTypeDto.code} already exists`);
    }

    const serviceType = new this.serviceTypeModel({
      ...createServiceTypeDto,
      createdBy,
    });

    return serviceType.save();
  }

  async findAll(query: PaginationDto & {
    category?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      category,
      isActive,
      search,
    } = query;

    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.serviceTypeModel
        .find(filter)
        .sort({ category: 1, name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec(),
      this.serviceTypeModel.countDocuments(filter),
    ]);

    return {
      data,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ServiceType> {
    const serviceType = await this.serviceTypeModel.findById(id);
    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }
    return serviceType;
  }

  async findByCode(code: string): Promise<ServiceType> {
    const serviceType = await this.serviceTypeModel.findOne({ code });
    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }
    return serviceType;
  }

  async update(
    id: string,
    updateServiceTypeDto: UpdateServiceTypeDto,
    updatedBy?: string,
  ): Promise<ServiceType> {
    const serviceType = await this.serviceTypeModel.findByIdAndUpdate(
      id,
      {
        ...updateServiceTypeDto,
        updatedBy,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }

    return serviceType;
  }

  async remove(id: string): Promise<void> {
    const result = await this.serviceTypeModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Service type not found');
    }
  }

  async toggleActive(id: string, updatedBy?: string): Promise<ServiceType> {
    const serviceType = await this.findOne(id);
    return this.update(
      id,
      { isActive: !serviceType.isActive },
      updatedBy,
    );
  }

  async getCategories(): Promise<any[]> {
    // Fetch active categories from database and return their names
    const { data } = await this.categoriesService.findAll({
      limit: 100,
      page: 1,
      isActive: true
    });

    // Map categories to return name as both id and display name
    return data
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(category => ({
        id: category.name,  // Using name as the ID for mapping
        name: category.name
      }));
  }
}