import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { InternalUser, InternalUserDocument } from '../internal-users/schemas/internal-user.schema';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { CounterService } from '../counters/counter.service';
import { CommonUserService } from '../users/common-user.service';
import { UserRole } from '@/common/constants/roles.enum';
import { RelationshipType } from '@/common/constants/status.enum';

/**
 * Members Service
 * Handles CRUD operations for external users (members)
 */
@Injectable()
export class MembersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InternalUser.name) private internalUserModel: Model<InternalUserDocument>,
    private counterService: CounterService,
    private commonUserService: CommonUserService,
  ) {}

  /**
   * Validate that email is unique across both collections
   */
  private async validateUniqueEmail(email: string, excludeId?: string): Promise<void> {
    await this.commonUserService.validateEmailUniqueness(
      this.userModel,
      this.internalUserModel,
      email,
      excludeId,
    );
  }

  /**
   * Validate that phone is unique across both collections
   */
  private async validateUniquePhone(phone: string, excludeId?: string): Promise<void> {
    await this.commonUserService.validatePhoneUniqueness(
      this.userModel,
      this.internalUserModel,
      phone,
      excludeId,
    );
  }

  /**
   * Validate unique fields for a new member
   */
  private async validateUniqueFields(createMemberDto: CreateMemberDto): Promise<void> {
    // Check UHID uniqueness (only in users collection)
    const existingUhid = await this.userModel.findOne({ uhid: createMemberDto.uhid }).lean();
    if (existingUhid) {
      throw new ConflictException('UHID already exists');
    }

    // Check Member ID uniqueness (only in users collection)
    const existingMemberId = await this.userModel
      .findOne({ memberId: createMemberDto.memberId })
      .lean();
    if (existingMemberId) {
      throw new ConflictException('Member ID already exists');
    }

    // Check email uniqueness (across both collections)
    await this.validateUniqueEmail(createMemberDto.email);

    // Extract phone number from object if needed before validation
    let phoneToValidate: string;
    if (typeof createMemberDto.phone === 'string') {
      phoneToValidate = createMemberDto.phone;
    } else if (createMemberDto.phone && typeof createMemberDto.phone === 'object' && 'number' in createMemberDto.phone) {
      phoneToValidate = createMemberDto.phone.number;
    } else {
      throw new ConflictException('Invalid phone number format');
    }

    // Check phone uniqueness (across both collections)
    await this.validateUniquePhone(phoneToValidate);
  }

  /**
   * Validate relationship logic for members
   */
  private async validateRelationship(createMemberDto: CreateMemberDto): Promise<void> {
    if (!createMemberDto.relationship) {
      console.log('⚠️ [MEMBER-CREATION] No relationship provided - skipping relationship validation');
      return;
    }

    console.log('🔍 [MEMBER-CREATION] Validating relationship:', createMemberDto.relationship);

    const isSelf =
      createMemberDto.relationship === 'REL001' ||
      createMemberDto.relationship === RelationshipType.SELF ||
      createMemberDto.relationship === 'SELF';

    if (isSelf) {
      console.log('✅ [MEMBER-CREATION] Relationship is SELF');
      if (createMemberDto.primaryMemberId) {
        console.error('❌ [MEMBER-CREATION] Primary Member ID should not be set for SELF');
        throw new BadRequestException('Primary Member ID should not be set for SELF relationship');
      }
      return;
    }

    console.log('🔍 [MEMBER-CREATION] Relationship is dependent, checking for primaryMemberId');
    if (!createMemberDto.primaryMemberId) {
      console.error('❌ [MEMBER-CREATION] Primary Member ID is required for dependents');
      throw new BadRequestException('Primary Member ID is required for dependents');
    }

    console.log('🔍 [MEMBER-CREATION] Validating primaryMemberId:', createMemberDto.primaryMemberId);
    const primaryMember = await this.userModel
      .findOne({
        memberId: createMemberDto.primaryMemberId,
        relationship: { $in: ['REL001', RelationshipType.SELF, 'SELF'] },
      })
      .lean();

    if (!primaryMember) {
      console.error('❌ [MEMBER-CREATION] Invalid Primary Member ID or member is not SELF');
      throw new BadRequestException('Invalid Primary Member ID or member is not SELF');
    }

    console.log('✅ [MEMBER-CREATION] Primary member validated successfully');
  }

  /**
   * Create a new member
   */
  async create(createMemberDto: CreateMemberDto, createdBy: string) {
    console.log('🔍 ==================== MEMBER CREATION START ====================');
    console.log('📦 Received DTO:', JSON.stringify(createMemberDto, null, 2));

    // Step 1: Validate unique fields
    console.log('🔍 [MEMBER-CREATION] Step 1: Validating unique fields...');
    await this.validateUniqueFields(createMemberDto);
    console.log('✅ [MEMBER-CREATION] Unique fields validated');

    // Step 2: Validate relationship
    console.log('🔍 [MEMBER-CREATION] Step 2: Validating relationship...');
    await this.validateRelationship(createMemberDto);
    console.log('✅ [MEMBER-CREATION] Relationship validated');

    // Step 3: Generate userId and hash password
    console.log('🔍 [MEMBER-CREATION] Step 3: Preparing member data...');
    const userId = await this.counterService.generateUserId();
    const password = createMemberDto.password || this.commonUserService.generateRandomPassword();
    const passwordHash = await this.commonUserService.hashPassword(password);
    const email = this.commonUserService.normalizeEmail(createMemberDto.email);

    // Extract phone number from object if needed
    let phone: string;
    if (typeof createMemberDto.phone === 'string') {
      phone = createMemberDto.phone;
    } else if (createMemberDto.phone && typeof createMemberDto.phone === 'object' && 'number' in createMemberDto.phone) {
      phone = (createMemberDto.phone as any).number;
      console.log('🔍 [MEMBER-CREATION] Extracted phone number from object:', phone);
    } else {
      console.error('❌ [MEMBER-CREATION] Invalid phone format:', createMemberDto.phone);
      throw new BadRequestException('Invalid phone number format');
    }

    console.log('✅ [MEMBER-CREATION] Member data prepared. Generated userId:', userId);

    // Step 4: Create member document
    console.log('🔍 [MEMBER-CREATION] Step 4: Creating member document...');
    const member = new this.userModel({
      ...createMemberDto,
      userId,
      email,
      phone, // Use extracted phone string instead of object
      role: UserRole.MEMBER, // Force role to MEMBER
      passwordHash,
      mustChangePassword: !createMemberDto.password,
      createdBy,
    });

    // Step 5: Save to database
    console.log('🔍 [MEMBER-CREATION] Step 5: Saving member to database...');
    const savedMember = await member.save();
    console.log('✅ [MEMBER-CREATION] Member saved successfully. MongoDB _id:', savedMember._id);

    // Remove password hash from response
    const { passwordHash: _, ...result } = savedMember.toObject();

    console.log('🔍 ==================== MEMBER CREATION SUCCESS ====================');
    console.log('✅ Created member:', {
      userId: result.userId,
      memberId: result.memberId,
      email: result.email,
      role: result.role,
    });

    return {
      ...result,
      tempPassword: !createMemberDto.password ? password : undefined,
    };
  }

  /**
   * Find all members with pagination and filtering
   */
  async findAll(query: QueryMemberDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const filter: any = {
      role: UserRole.MEMBER, // Only members
    };

    // Add search filter
    if (query.search) {
      const searchFilter = this.commonUserService.buildSearchFilter(query.search, [
        'uhid',
        'memberId',
      ]);
      Object.assign(filter, searchFilter);
    }

    // Add status filter
    if (query.status) {
      filter.status = query.status;
    }

    // Add relationship filter
    if (query.relationship) {
      filter.relationship = query.relationship;
    }

    // Add primary member filter
    if (query.primaryMemberId) {
      filter.primaryMemberId = query.primaryMemberId;
    }

    // Add CUG filter
    if (query.cugId) {
      filter.cugId = query.cugId;
    }

    const [members, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select(
          'userId memberId uhid name email phone role status relationship primaryMemberId cugId corporateName createdAt updatedAt',
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: members,
      meta: this.commonUserService.buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Find a member by ID
   */
  async findOne(id: string) {
    const member = await this.userModel
      .findById(id)
      .select('-passwordHash')
      .lean();

    if (!member || member.role !== UserRole.MEMBER) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  /**
   * Find dependents of a primary member
   */
  async findDependents(memberId: string) {
    const dependents = await this.userModel
      .find({
        primaryMemberId: memberId,
        role: UserRole.MEMBER,
      })
      .select('userId memberId uhid name email phone relationship status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return {
      data: dependents,
      count: dependents.length,
    };
  }

  /**
   * Update a member
   */
  async update(id: string, updateMemberDto: UpdateMemberDto, updatedBy: string) {
    const member = await this.userModel.findById(id);
    if (!member || member.role !== UserRole.MEMBER) {
      throw new NotFoundException('Member not found');
    }

    // Extract phone number from object if needed
    let phoneToUpdate: string | undefined;
    if (updateMemberDto.phone) {
      if (typeof updateMemberDto.phone === 'string') {
        phoneToUpdate = updateMemberDto.phone;
      } else if (updateMemberDto.phone && typeof updateMemberDto.phone === 'object' && 'number' in updateMemberDto.phone) {
        phoneToUpdate = (updateMemberDto.phone as any).number;
        console.log('🔍 [MEMBER-UPDATE] Extracted phone number from object:', phoneToUpdate);
      } else {
        console.error('❌ [MEMBER-UPDATE] Invalid phone format:', updateMemberDto.phone);
        throw new BadRequestException('Invalid phone number format');
      }
    }

    // Validate unique fields if being updated
    if (updateMemberDto.email && updateMemberDto.email !== member.email) {
      await this.validateUniqueEmail(updateMemberDto.email, id);
    }

    if (phoneToUpdate && phoneToUpdate !== member.phone) {
      await this.validateUniquePhone(phoneToUpdate, id);
    }

    // Update member with extracted phone
    const updateData = {
      ...updateMemberDto,
      ...(phoneToUpdate && { phone: phoneToUpdate }),
      updatedBy,
    };

    Object.assign(member, updateData);
    const updated = await member.save();

    const { passwordHash: _, ...result } = updated.toObject();
    return result;
  }

  /**
   * Delete a member
   */
  async remove(id: string) {
    const member = await this.userModel.findById(id);
    if (!member || member.role !== UserRole.MEMBER) {
      throw new NotFoundException('Member not found');
    }

    // Check if member has dependents
    const dependents = await this.userModel.countDocuments({ primaryMemberId: member.memberId });
    if (dependents > 0) {
      throw new BadRequestException(
        `Cannot delete member with ${dependents} dependent(s). Please delete or reassign dependents first.`,
      );
    }

    await this.userModel.findByIdAndDelete(id);

    return {
      message: 'Member deleted successfully',
    };
  }

  /**
   * Reset member password
   */
  async resetPassword(id: string) {
    const member = await this.userModel.findById(id);
    if (!member || member.role !== UserRole.MEMBER) {
      throw new NotFoundException('Member not found');
    }

    const tempPassword = this.commonUserService.generateRandomPassword();
    const passwordHash = await this.commonUserService.hashPassword(tempPassword);

    await this.userModel.findByIdAndUpdate(id, {
      passwordHash,
      mustChangePassword: true,
    });

    return {
      message: 'Password reset successfully',
      tempPassword,
    };
  }
}
