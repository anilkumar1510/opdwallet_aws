import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { InternalUser, InternalUserDocument } from './schemas/internal-user.schema';
import { CreateInternalUserDto } from './dto/create-internal-user.dto';
import { UpdateInternalUserDto } from './dto/update-internal-user.dto';
import { QueryInternalUserDto } from './dto/query-internal-user.dto';
import { CounterService } from '../counters/counter.service';
import { CommonUserService } from '../users/common-user.service';
import { UserRole } from '@/common/constants/roles.enum';

/**
 * Internal Users Service
 * Handles CRUD operations for internal staff users
 */
@Injectable()
export class InternalUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InternalUser.name) private internalUserModel: Model<InternalUserDocument>,
    private counterService: CounterService,
    private commonUserService: CommonUserService,
  ) {}

  /**
   * Validate unique fields for a new internal user
   */
  private async validateUniqueFields(
    createInternalUserDto: CreateInternalUserDto,
  ): Promise<void> {
    // Check Employee ID uniqueness (only in internal_users collection)
    const existingEmployeeId = await this.internalUserModel
      .findOne({ employeeId: createInternalUserDto.employeeId })
      .lean();
    if (existingEmployeeId) {
      throw new ConflictException('Employee ID already exists');
    }

    // Check email uniqueness (across both collections)
    await this.commonUserService.validateEmailUniqueness(
      this.userModel,
      this.internalUserModel,
      createInternalUserDto.email,
    );

    // Check phone uniqueness (across both collections)
    await this.commonUserService.validatePhoneUniqueness(
      this.userModel,
      this.internalUserModel,
      createInternalUserDto.phone,
    );
  }

  /**
   * Validate that role is not MEMBER or DOCTOR
   */
  private validateRole(role: UserRole): void {
    if (role === UserRole.MEMBER || role === UserRole.DOCTOR) {
      throw new BadRequestException(
        'Internal users cannot have MEMBER or DOCTOR role. Use Members service for external users.',
      );
    }
  }

  /**
   * Create a new internal user
   */
  async create(createInternalUserDto: CreateInternalUserDto, createdBy: string) {
    console.log('🔍 ==================== INTERNAL USER CREATION START ====================');
    console.log('📦 Received DTO:', JSON.stringify(createInternalUserDto, null, 2));

    // Step 1: Validate role
    console.log('🔍 [INTERNAL-USER-CREATION] Step 1: Validating role...');
    this.validateRole(createInternalUserDto.role);
    console.log('✅ [INTERNAL-USER-CREATION] Role validated');

    // Step 2: Validate unique fields
    console.log('🔍 [INTERNAL-USER-CREATION] Step 2: Validating unique fields...');
    await this.validateUniqueFields(createInternalUserDto);
    console.log('✅ [INTERNAL-USER-CREATION] Unique fields validated');

    // Step 3: Generate userId and hash password
    console.log('🔍 [INTERNAL-USER-CREATION] Step 3: Preparing internal user data...');
    const userId = await this.counterService.generateUserId();
    const password =
      createInternalUserDto.password || this.commonUserService.generateRandomPassword();
    const passwordHash = await this.commonUserService.hashPassword(password);
    const email = this.commonUserService.normalizeEmail(createInternalUserDto.email);

    console.log('✅ [INTERNAL-USER-CREATION] Internal user data prepared. Generated userId:', userId);

    // Step 4: Create internal user document
    console.log('🔍 [INTERNAL-USER-CREATION] Step 4: Creating internal user document...');
    const internalUser = new this.internalUserModel({
      ...createInternalUserDto,
      userId,
      email,
      passwordHash,
      mustChangePassword: !createInternalUserDto.password,
      userType: 'internal',
      createdBy,
    });

    // Step 5: Save to database
    console.log('🔍 [INTERNAL-USER-CREATION] Step 5: Saving internal user to database...');
    const savedUser = await internalUser.save();
    console.log(
      '✅ [INTERNAL-USER-CREATION] Internal user saved successfully. MongoDB _id:',
      savedUser._id,
    );

    // Remove password hash from response
    const { passwordHash: _, ...result } = savedUser.toObject();

    console.log('🔍 ==================== INTERNAL USER CREATION SUCCESS ====================');
    console.log('✅ Created internal user:', {
      userId: result.userId,
      employeeId: result.employeeId,
      email: result.email,
      role: result.role,
    });

    return {
      ...result,
      tempPassword: !createInternalUserDto.password ? password : undefined,
    };
  }

  /**
   * Find all internal users with pagination and filtering
   */
  async findAll(query: QueryInternalUserDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Add search filter
    if (query.search) {
      const searchFilter = this.commonUserService.buildSearchFilter(query.search, ['employeeId']);
      Object.assign(filter, searchFilter);
    }

    // Add role filter
    if (query.role) {
      filter.role = query.role;
    }

    // Add status filter
    if (query.status) {
      filter.status = query.status;
    }

    // Add department filter
    if (query.department) {
      filter.department = query.department;
    }

    const [users, total] = await Promise.all([
      this.internalUserModel
        .find(filter)
        .select(
          'userId employeeId name email phone role status department designation reportingTo mfaEnabled lastLoginAt createdAt updatedAt',
        )
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.internalUserModel.countDocuments(filter),
    ]);

    return {
      data: users,
      meta: this.commonUserService.buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Find an internal user by ID
   */
  async findOne(id: string) {
    const user = await this.internalUserModel.findById(id).select('-passwordHash').lean();

    if (!user) {
      throw new NotFoundException('Internal user not found');
    }

    return user;
  }

  /**
   * Update an internal user
   */
  async update(id: string, updateInternalUserDto: UpdateInternalUserDto, updatedBy: string) {
    const user = await this.internalUserModel.findById(id);
    if (!user) {
      throw new NotFoundException('Internal user not found');
    }

    // Validate role if being updated
    if (updateInternalUserDto.role) {
      this.validateRole(updateInternalUserDto.role);
    }

    // Validate employeeId uniqueness if being updated
    if (updateInternalUserDto.employeeId && updateInternalUserDto.employeeId !== user.employeeId) {
      const existingEmployeeId = await this.internalUserModel
        .findOne({ employeeId: updateInternalUserDto.employeeId, _id: { $ne: id } })
        .lean();
      if (existingEmployeeId) {
        throw new ConflictException('Employee ID already exists');
      }
    }

    // Validate unique fields if being updated
    if (updateInternalUserDto.email && updateInternalUserDto.email !== user.email) {
      await this.commonUserService.validateEmailUniqueness(
        this.userModel,
        this.internalUserModel,
        updateInternalUserDto.email,
        id,
      );
    }

    if (updateInternalUserDto.phone) {
      const currentPhone =
        typeof user.phone === 'object' ? user.phone.number : user.phone;
      const newPhone =
        typeof updateInternalUserDto.phone === 'object'
          ? updateInternalUserDto.phone.number
          : updateInternalUserDto.phone;

      if (newPhone !== currentPhone) {
        await this.commonUserService.validatePhoneUniqueness(
          this.userModel,
          this.internalUserModel,
          updateInternalUserDto.phone,
          id,
        );
      }
    }

    // Update user
    Object.assign(user, updateInternalUserDto, { updatedBy });
    const updated = await user.save();

    const { passwordHash: _, ...result } = updated.toObject();
    return result;
  }

  /**
   * Delete an internal user
   */
  async remove(id: string) {
    const user = await this.internalUserModel.findById(id);
    if (!user) {
      throw new NotFoundException('Internal user not found');
    }

    // Prevent deletion of SUPER_ADMIN if it's the last one
    if (user.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await this.internalUserModel.countDocuments({
        role: UserRole.SUPER_ADMIN,
      });
      if (superAdminCount === 1) {
        throw new BadRequestException('Cannot delete the last SUPER_ADMIN user');
      }
    }

    await this.internalUserModel.findByIdAndDelete(id);

    return {
      message: 'Internal user deleted successfully',
    };
  }

  /**
   * Reset internal user password
   */
  async resetPassword(id: string) {
    const user = await this.internalUserModel.findById(id);
    if (!user) {
      throw new NotFoundException('Internal user not found');
    }

    const tempPassword = this.commonUserService.generateRandomPassword();
    const passwordHash = await this.commonUserService.hashPassword(tempPassword);

    await this.internalUserModel.findByIdAndUpdate(id, {
      passwordHash,
      mustChangePassword: true,
    });

    return {
      message: 'Password reset successfully',
      tempPassword,
    };
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
    await this.internalUserModel.findOneAndUpdate(
      { userId },
      {
        lastLoginAt: new Date(),
        lastLoginIP: ipAddress,
      },
    );
  }
}
