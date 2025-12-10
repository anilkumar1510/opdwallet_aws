import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CugMaster, CugMasterDocument } from './schemas/cug-master.schema';
import { CreateCugDto, UpdateCugDto } from './dto/cug.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class CugsService {
  constructor(
    @InjectModel(CugMaster.name)
    private cugModel: Model<CugMasterDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Generate the next CUG ID automatically
   * Format: CUG001, CUG002, CUG003, etc.
   */
  async generateNextCugId(): Promise<string> {
    const lastCug = await this.cugModel
      .findOne({})
      .sort({ cugId: -1 })
      .select('cugId')
      .lean();

    if (!lastCug) {
      return 'CUG001';
    }

    // Extract the numeric part and increment
    const lastNum = parseInt(lastCug.cugId.replace('CUG', ''), 10);
    const nextNum = lastNum + 1;
    return `CUG${String(nextNum).padStart(3, '0')}`;
  }

  async create(createCugDto: CreateCugDto, createdBy?: string): Promise<CugMaster> {
    console.log('[CugsService] Creating CUG:', JSON.stringify(createCugDto, null, 2));
    console.log('[CugsService] Created by:', createdBy);

    // Auto-generate CUG ID
    const cugId = await this.generateNextCugId();
    console.log('[CugsService] Auto-generated CUG ID:', cugId);

    // Check if shortCode already exists (if provided)
    if (createCugDto.shortCode) {
      const existingWithCode = await this.cugModel.findOne({
        shortCode: createCugDto.shortCode.toUpperCase()
      });
      if (existingWithCode) {
        throw new ConflictException(`CUG with short code ${createCugDto.shortCode} already exists`);
      }
    }

    const cug = new this.cugModel({
      ...createCugDto,
      cugId,
      shortCode: createCugDto.shortCode?.toUpperCase(),
      createdBy,
    });

    console.log('[CugsService] Saving new CUG...');
    try {
      const saved = await cug.save();
      console.log('[CugsService] CUG saved successfully:', saved._id, 'with ID:', cugId);

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
        { shortCode: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
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
      .sort({ displayOrder: 1, companyName: 1 })
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
      .sort({ displayOrder: 1, companyName: 1 })
      .exec();

    console.log('[CugsService] Found active CUGs:', cugs.length);
    return cugs;
  }

  /**
   * Count active members assigned to a CUG
   * Note: Users don't have isActive field, so we count all users with this cugId
   */
  private async getActiveMemberCount(cugId: string): Promise<number> {
    console.log('[CugsService] Counting members for CUG ID:', cugId);

    const count = await this.userModel.countDocuments({
      cugId: cugId,
    });
    console.log('[CugsService] Member count for CUG:', count);
    return count;
  }

  /**
   * Count all members (active and inactive) assigned to a CUG
   */
  private async getTotalMemberCount(cugId: string): Promise<number> {
    console.log('[CugsService] Counting total members for CUG ID:', cugId);
    const count = await this.userModel.countDocuments({
      cugId: cugId,
    });
    console.log('[CugsService] Total member count:', count);
    return count;
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
    if (updateData.shortCode) {
      updateData.shortCode = updateData.shortCode.toUpperCase();

      // Check if shortCode is already used by another CUG
      const existingWithCode = await this.cugModel.findOne({
        shortCode: updateData.shortCode,
        _id: { $ne: id }
      });
      if (existingWithCode) {
        throw new ConflictException(`CUG with short code ${updateData.shortCode} already exists`);
      }
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

    // Only validate when trying to deactivate (isActive: true -> false)
    if (cug.isActive) {
      console.log('[CugsService] Checking for active members before deactivation');
      const activeMemberCount = await this.getActiveMemberCount(id);

      if (activeMemberCount > 0) {
        console.log('[CugsService] Cannot deactivate CUG with active members:', activeMemberCount);
        throw new ConflictException(
          `Cannot deactivate CUG "${cug.companyName}". It has ${activeMemberCount} active member(s) assigned. Please unassign all members before deactivating this CUG.`
        );
      }
    }

    cug.isActive = !cug.isActive;
    await cug.save();

    console.log('[CugsService] CUG active status toggled to:', cug.isActive);
    return cug;
  }

  async remove(id: string): Promise<void> {
    console.log('[CugsService] Removing CUG:', id);

    // Find the CUG first to get details for error message
    const cug = await this.cugModel.findById(id);
    if (!cug) {
      console.log('[CugsService] CUG not found for deletion');
      throw new NotFoundException(`CUG with ID ${id} not found`);
    }

    // Check for ANY members (active or inactive) before deletion
    console.log('[CugsService] Checking for members before deletion');
    const totalMemberCount = await this.getTotalMemberCount(id);

    if (totalMemberCount > 0) {
      console.log('[CugsService] Cannot delete CUG with members:', totalMemberCount);
      throw new ConflictException(
        `Cannot delete CUG "${cug.companyName}". It has ${totalMemberCount} member(s) assigned. Please unassign all members before deleting this CUG.`
      );
    }

    await this.cugModel.deleteOne({ _id: id });
    console.log('[CugsService] CUG removed successfully');
  }

  // Seed default CUGs
  async seedDefaultCugs(): Promise<void> {
    console.log('[CugsService] Seeding default CUGs...');

    const defaultCugs = [
      {
        cugId: 'CUG001',
        shortCode: 'GOOGLE',
        companyName: 'Google Inc.',
        employeeCount: '10000+',
        description: 'Google corporate group',
        isActive: true,
        displayOrder: 1,
      },
      {
        cugId: 'CUG002',
        shortCode: 'MICROSOFT',
        companyName: 'Microsoft Corporation',
        employeeCount: '10000+',
        description: 'Microsoft corporate group',
        isActive: true,
        displayOrder: 2,
      },
      {
        cugId: 'CUG003',
        shortCode: 'AMAZON',
        companyName: 'Amazon Inc.',
        employeeCount: '10000+',
        description: 'Amazon corporate group',
        isActive: true,
        displayOrder: 3,
      },
      {
        cugId: 'CUG004',
        shortCode: 'APPLE',
        companyName: 'Apple Inc.',
        employeeCount: '10000+',
        description: 'Apple corporate group',
        isActive: true,
        displayOrder: 4,
      },
      {
        cugId: 'CUG005',
        shortCode: 'META',
        companyName: 'Meta Platforms Inc.',
        employeeCount: '10000+',
        description: 'Meta corporate group',
        isActive: true,
        displayOrder: 5,
      },
      {
        cugId: 'CUG006',
        shortCode: 'NETFLIX',
        companyName: 'Netflix Inc.',
        employeeCount: '5000-10000',
        description: 'Netflix corporate group',
        isActive: true,
        displayOrder: 6,
      },
      {
        cugId: 'CUG007',
        shortCode: 'TESLA',
        companyName: 'Tesla Inc.',
        employeeCount: '10000+',
        description: 'Tesla corporate group',
        isActive: true,
        displayOrder: 7,
      },
      {
        cugId: 'CUG008',
        shortCode: 'IBM',
        companyName: 'IBM Corporation',
        employeeCount: '10000+',
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
          console.log(`✓ Seeded CUG: ${cugData.companyName}`);
        } else {
          console.log(`- CUG already exists: ${cugData.companyName}`);
        }
      } catch (error) {
        console.log(`✗ Error seeding CUG ${cugData.companyName}:`, error.message);
      }
    }

    console.log('[CugsService] Default CUGs seeded successfully');
  }
}