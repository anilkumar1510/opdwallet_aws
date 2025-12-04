import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CugMaster, CugMasterDocument } from './schemas/cug-master.schema';
import { CreateCugDto, UpdateCugDto } from './dto/cug.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CugsService {
  constructor(
    @InjectModel(CugMaster.name)
    private cugModel: Model<CugMasterDocument>,
  ) {}

  async create(createCugDto: CreateCugDto, createdBy?: string): Promise<CugMaster> {
    console.log('[CugsService] Creating CUG:', JSON.stringify(createCugDto, null, 2));
    console.log('[CugsService] Created by:', createdBy);

    // Check if CUG with same ID already exists
    const existing = await this.cugModel.findOne({
      cugId: createCugDto.cugId.toUpperCase()
    });

    if (existing) {
      console.log('[CugsService] CUG already exists:', existing.cugId);
      throw new ConflictException(`CUG with ID ${createCugDto.cugId} already exists`);
    }

    const cug = new this.cugModel({
      ...createCugDto,
      cugId: createCugDto.cugId.toUpperCase(),
      code: createCugDto.code.toUpperCase(),
      createdBy,
    });

    console.log('[CugsService] Saving new CUG...');
    try {
      const saved = await cug.save();
      console.log('[CugsService] CUG saved successfully:', saved._id);

      // Verify it was actually saved
      const verification = await this.cugModel.findById(saved._id);
      if (!verification) {
        console.error('[CugsService] ERROR: CUG not found after save!');
        throw new Error('CUG save verification failed');
      }
      console.log('[CugsService] Verified CUG exists in DB');

      return saved;
    } catch (error) {
      console.error('[CugsService] Save error:', error);
      throw error;
    }
  }

  async findAll(query: PaginationDto & {
    isActive?: boolean;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      isActive,
      search,
    } = query;

    console.log('[CugsService] Finding all CUGs with query:', { page, limit, isActive, search });

    // Build filter
    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { cugId: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    console.log('[CugsService] Using filter:', JSON.stringify(filter, null, 2));

    // Count documents
    const total = await this.cugModel.countDocuments(filter);
    console.log('[CugsService] Total documents matching filter:', total);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    // Execute query with pagination
    const data = await this.cugModel
      .find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    console.log('[CugsService] Found CUGs:', data.length);

    return {
      data,
      total,
      page,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }

  async findAllActive(): Promise<CugMaster[]> {
    console.log('[CugsService] Finding all active CUGs');
    const cugs = await this.cugModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .exec();

    console.log('[CugsService] Found active CUGs:', cugs.length);
    return cugs;
  }

  async findOne(id: string): Promise<CugMaster> {
    console.log('[CugsService] Finding CUG by ID:', id);
    const cug = await this.cugModel.findById(id);
    if (!cug) {
      console.log('[CugsService] CUG not found');
      throw new NotFoundException(`CUG with ID ${id} not found`);
    }
    console.log('[CugsService] Found CUG:', cug.cugId);
    return cug;
  }

  async update(id: string, updateCugDto: UpdateCugDto, updatedBy?: string): Promise<CugMaster> {
    console.log('[CugsService] Updating CUG:', id, JSON.stringify(updateCugDto, null, 2));

    const updateData: any = { ...updateCugDto };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    const cug = await this.cugModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!cug) {
      console.log('[CugsService] CUG not found for update');
      throw new NotFoundException(`CUG with ID ${id} not found`);
    }

    console.log('[CugsService] CUG updated successfully');
    return cug;
  }

  async toggleActive(id: string): Promise<CugMaster> {
    console.log('[CugsService] Toggling active status for CUG:', id);

    const cug = await this.cugModel.findById(id);
    if (!cug) {
      console.log('[CugsService] CUG not found for toggle');
      throw new NotFoundException(`CUG with ID ${id} not found`);
    }

    cug.isActive = !cug.isActive;
    await cug.save();

    console.log('[CugsService] CUG active status toggled to:', cug.isActive);
    return cug;
  }

  async remove(id: string): Promise<void> {
    console.log('[CugsService] Removing CUG:', id);

    const result = await this.cugModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      console.log('[CugsService] CUG not found for deletion');
      throw new NotFoundException(`CUG with ID ${id} not found`);
    }

    console.log('[CugsService] CUG removed successfully');
  }

  // Seed default CUGs
  async seedDefaultCugs(): Promise<void> {
    console.log('[CugsService] Seeding default CUGs...');

    const defaultCugs = [
      {
        cugId: 'CUG001',
        code: 'GOOGLE',
        name: 'Google Inc.',
        description: 'Google corporate group',
        isActive: true,
        displayOrder: 1,
      },
      {
        cugId: 'CUG002',
        code: 'MICROSOFT',
        name: 'Microsoft Corporation',
        description: 'Microsoft corporate group',
        isActive: true,
        displayOrder: 2,
      },
      {
        cugId: 'CUG003',
        code: 'AMAZON',
        name: 'Amazon Inc.',
        description: 'Amazon corporate group',
        isActive: true,
        displayOrder: 3,
      },
      {
        cugId: 'CUG004',
        code: 'APPLE',
        name: 'Apple Inc.',
        description: 'Apple corporate group',
        isActive: true,
        displayOrder: 4,
      },
      {
        cugId: 'CUG005',
        code: 'META',
        name: 'Meta Platforms Inc.',
        description: 'Meta corporate group',
        isActive: true,
        displayOrder: 5,
      },
      {
        cugId: 'CUG006',
        code: 'NETFLIX',
        name: 'Netflix Inc.',
        description: 'Netflix corporate group',
        isActive: true,
        displayOrder: 6,
      },
      {
        cugId: 'CUG007',
        code: 'TESLA',
        name: 'Tesla Inc.',
        description: 'Tesla corporate group',
        isActive: true,
        displayOrder: 7,
      },
      {
        cugId: 'CUG008',
        code: 'IBM',
        name: 'IBM Corporation',
        description: 'IBM corporate group',
        isActive: true,
        displayOrder: 8,
      }
    ];

    for (const cugData of defaultCugs) {
      try {
        const existing = await this.cugModel.findOne({ cugId: cugData.cugId });
        if (!existing) {
          const cug = new this.cugModel(cugData);
          await cug.save();
          console.log(`✓ Seeded CUG: ${cugData.name}`);
        } else {
          console.log(`- CUG already exists: ${cugData.name}`);
        }
      } catch (error) {
        console.log(`✗ Error seeding CUG ${cugData.name}:`, error.message);
      }
    }

    console.log('[CugsService] Default CUGs seeded successfully');
  }
}