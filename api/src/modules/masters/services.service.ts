import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceMaster, ServiceMasterDocument } from './schemas/service-master.schema';
import { CategoryMaster, CategoryMasterDocument } from './schemas/category-master.schema';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(ServiceMaster.name) private serviceModel: Model<ServiceMasterDocument>,
    @InjectModel(CategoryMaster.name) private categoryModel: Model<CategoryMasterDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto, userId?: string) {
    try {
      const existingService = await this.serviceModel.findOne({
        code: createServiceDto.code.toUpperCase()
      });

      if (existingService) {
        throw new ConflictException(`Service with code ${createServiceDto.code} already exists`);
      }

      // Validate category exists in category master
      const categoryExists = await this.categoryModel.findOne({
        categoryId: createServiceDto.category.toUpperCase(),
        isActive: true
      });

      if (!categoryExists) {
        throw new BadRequestException(`Category ${createServiceDto.category} does not exist or is inactive`);
      }

      const service = new this.serviceModel({
        ...createServiceDto,
        code: createServiceDto.code.toUpperCase(),
        category: createServiceDto.category.toUpperCase(),
        createdBy: userId,
      });

      return await service.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new ConflictException(`Service with code ${createServiceDto.code} already exists`);
      }
      throw error;
    }
  }

  async findAll(query: PaginationDto & {
    isActive?: boolean;
    search?: string;
    category?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      isActive,
      search,
      category
    } = query;

    const filter: any = {};

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

    if (category) {
      filter.category = category.toUpperCase();
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.serviceModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ code: 1 })
        .lean(),
      this.serviceModel.countDocuments(filter),
    ]);

    // Enrich data with category names
    const enrichedData = await Promise.all(
      data.map(async (service) => {
        const category = await this.categoryModel.findOne({
          categoryId: service.category,
          isActive: true
        }).lean();

        return {
          ...service,
          categoryName: category?.name || service.category
        };
      })
    );

    return {
      data: enrichedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const service = await this.serviceModel.findById(id).lean();
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async findByCode(code: string) {
    const service = await this.serviceModel.findOne({ code: code.toUpperCase() }).lean();
    if (!service) {
      throw new NotFoundException(`Service with code ${code} not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, userId?: string) {
    // Validate category exists if category is being updated
    if (updateServiceDto.category) {
      const categoryExists = await this.categoryModel.findOne({
        categoryId: updateServiceDto.category.toUpperCase(),
        isActive: true
      });

      if (!categoryExists) {
        throw new BadRequestException(`Category ${updateServiceDto.category} does not exist or is inactive`);
      }
    }

    const service = await this.serviceModel.findByIdAndUpdate(
      id,
      {
        ...updateServiceDto,
        ...(updateServiceDto.category && { category: updateServiceDto.category.toUpperCase() }),
        updatedBy: userId,
      },
      { new: true }
    );

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async remove(id: string) {
    const service = await this.serviceModel.findByIdAndDelete(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async toggleActive(id: string, userId?: string) {
    const service = await this.serviceModel.findById(id);
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    service.isActive = !service.isActive;
    await service.save();

    return service;
  }

  async getAllServiceCodes() {
    return this.serviceModel
      .find({ isActive: true })
      .select('code name category')
      .sort({ code: 1 })
      .lean();
  }

  async getServicesByCategory(category: string) {
    return this.serviceModel
      .find({
        category: category.toUpperCase(),
        isActive: true
      })
      .select('code name description')
      .sort({ code: 1 })
      .lean();
  }
}