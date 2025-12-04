import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CounterService } from '../counters/counter.service';
import { ConfigService } from '@nestjs/config';
import { RelationshipType } from '@/common/constants/status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private counterService: CounterService,
    private configService: ConfigService,
  ) {}

  private async validateUniqueFields(createUserDto: CreateUserDto): Promise<void> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email.toLowerCase() },
        { phone: createUserDto.phone },
        { uhid: createUserDto.uhid },
        { memberId: createUserDto.memberId },
      ],
    }).lean();

    if (!existingUser) {
      return;
    }

    const field = this.getDuplicateField(existingUser, createUserDto);
    throw new ConflictException(`${field} already exists`);
  }

  private getDuplicateField(existingUser: any, createUserDto: CreateUserDto): string {
    if (existingUser.email === createUserDto.email.toLowerCase()) return 'Email';
    if (existingUser.phone === createUserDto.phone) return 'Phone';
    if (existingUser.uhid === createUserDto.uhid) return 'UHID';
    if (existingUser.memberId === createUserDto.memberId) return 'Member ID';
    return 'Field';
  }

  private async validateRelationship(createUserDto: CreateUserDto): Promise<void> {
    // If relationship is not provided, skip validation (it's optional now)
    if (!createUserDto.relationship) {
      console.log('⚠️ [USER-CREATION] No relationship provided - skipping relationship validation');
      return;
    }

    console.log('🔍 [USER-CREATION] Validating relationship:', createUserDto.relationship);

    const isSelf = createUserDto.relationship === 'REL001' ||
                   createUserDto.relationship === RelationshipType.SELF ||
                   createUserDto.relationship === 'SELF';

    if (isSelf) {
      console.log('✅ [USER-CREATION] Relationship is SELF');
      if (createUserDto.primaryMemberId) {
        console.error('❌ [USER-CREATION] Primary Member ID should not be set for SELF');
        throw new BadRequestException('Primary Member ID should not be set for SELF relationship');
      }
      return;
    }

    console.log('🔍 [USER-CREATION] Relationship is dependent, checking for primaryMemberId');
    if (!createUserDto.primaryMemberId) {
      console.error('❌ [USER-CREATION] Primary Member ID is required for dependents');
      throw new BadRequestException('Primary Member ID is required for dependents');
    }

    console.log('🔍 [USER-CREATION] Validating primaryMemberId:', createUserDto.primaryMemberId);
    const primaryMember = await this.userModel.findOne({
      memberId: createUserDto.primaryMemberId,
      relationship: { $in: ['REL001', RelationshipType.SELF, 'SELF'] }
    }).lean();

    if (!primaryMember) {
      console.error('❌ [USER-CREATION] Invalid Primary Member ID or member is not SELF');
      throw new BadRequestException('Invalid Primary Member ID or member is not SELF');
    }

    console.log('✅ [USER-CREATION] Primary member validated successfully');
  }

  private async prepareUserData(createUserDto: CreateUserDto, createdBy: string) {
    const userId = await this.counterService.generateUserId();
    const password = createUserDto.password || this.generateRandomPassword();
    const rounds = this.configService.get<number>('bcrypt.rounds') || 12;
    const passwordHash = await bcrypt.hash(password, rounds);

    return {
      userId,
      password,
      passwordHash,
      email: createUserDto.email.toLowerCase(),
      mustChangePassword: !createUserDto.password,
      createdBy,
    };
  }

  async create(createUserDto: CreateUserDto, createdBy: string) {
    console.log('🔍 ==================== USER CREATION START ====================');
    console.log('📦 Received DTO:', JSON.stringify(createUserDto, null, 2));
    console.log('📋 DTO Fields Present:');
    console.log('  - uhid:', createUserDto.uhid);
    console.log('  - memberId:', createUserDto.memberId);
    console.log('  - email:', createUserDto.email);
    console.log('  - phone:', createUserDto.phone);
    console.log('  - relationship:', createUserDto.relationship || '(undefined)');
    console.log('  - primaryMemberId:', createUserDto.primaryMemberId || '(undefined)');
    console.log('  - role:', createUserDto.role);
    console.log('  - name:', JSON.stringify(createUserDto.name));
    console.log('  - createdBy:', createdBy);

    console.log('🔍 [USER-CREATION] Step 1: Validating unique fields...');
    await this.validateUniqueFields(createUserDto);
    console.log('✅ [USER-CREATION] Unique fields validated');

    console.log('🔍 [USER-CREATION] Step 2: Validating relationship...');
    await this.validateRelationship(createUserDto);
    console.log('✅ [USER-CREATION] Relationship validated');

    console.log('🔍 [USER-CREATION] Step 3: Preparing user data...');
    const { userId, password, passwordHash, email, mustChangePassword, createdBy: creator } =
      await this.prepareUserData(createUserDto, createdBy);
    console.log('✅ [USER-CREATION] User data prepared. Generated userId:', userId);

    console.log('🔍 [USER-CREATION] Step 4: Creating user document...');
    const user = new this.userModel({
      ...createUserDto,
      userId,
      email,
      passwordHash,
      mustChangePassword,
      createdBy: creator,
    });

    console.log('🔍 [USER-CREATION] Step 5: Saving user to database...');
    const savedUser = await user.save();
    console.log('✅ [USER-CREATION] User saved successfully. MongoDB _id:', savedUser._id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = savedUser.toObject();

    console.log('🔍 ==================== USER CREATION SUCCESS ====================');
    console.log('✅ Created user:', {
      userId: result.userId,
      memberId: result.memberId,
      email: result.email,
      role: result.role,
      relationship: result.relationship || '(not set)',
    });

    return {
      ...result,
      tempPassword: !createUserDto.password ? password : undefined,
    };
  }

  async findAll(query: QueryUserDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { 'name.firstName': { $regex: query.search, $options: 'i' } },
        { 'name.lastName': { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { uhid: { $regex: query.search, $options: 'i' } },
        { memberId: { $regex: query.search, $options: 'i' } },
        { employeeId: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('userId memberId uhid employeeId name email phone role status createdAt updatedAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: users,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private buildUniqueFieldConditions(user: any, updateUserDto: UpdateUserDto): any[] {
    const conditions: any[] = [];

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      conditions.push({ email: updateUserDto.email.toLowerCase() });
    }
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      conditions.push({ phone: updateUserDto.phone });
    }
    if (updateUserDto.uhid && updateUserDto.uhid !== user.uhid) {
      conditions.push({ uhid: updateUserDto.uhid });
    }
    if (updateUserDto.memberId && updateUserDto.memberId !== user.memberId) {
      conditions.push({ memberId: updateUserDto.memberId });
    }

    return conditions;
  }

  private async validateUniqueFieldsForUpdate(id: string, user: any, updateUserDto: UpdateUserDto): Promise<void> {
    const hasUniqueFields = updateUserDto.email || updateUserDto.phone ||
                            updateUserDto.uhid || updateUserDto.memberId;

    if (!hasUniqueFields) {
      return;
    }

    const orConditions = this.buildUniqueFieldConditions(user, updateUserDto);

    if (orConditions.length === 0) {
      return;
    }

    const existingUser = await this.userModel.findOne({
      $or: orConditions,
      _id: { $ne: id },
    }).lean();

    if (existingUser) {
      throw new ConflictException('Duplicate value found');
    }
  }

  private validateRelationshipUpdate(user: any, updateUserDto: UpdateUserDto): void {
    if (!updateUserDto.relationship) {
      return;
    }

    const isSelf = updateUserDto.relationship === 'REL001' ||
                   updateUserDto.relationship === RelationshipType.SELF ||
                   updateUserDto.relationship === 'SELF';

    if (isSelf) {
      if (updateUserDto.primaryMemberId || user.primaryMemberId) {
        throw new BadRequestException(
          'Primary Member ID should not be set for SELF relationship. Please remove it.'
        );
      }
    } else {
      if (!updateUserDto.primaryMemberId && !user.primaryMemberId) {
        throw new BadRequestException('Primary Member ID is required for dependents');
      }
    }
  }

  private prepareUpdateData(updateUserDto: UpdateUserDto, updatedBy: string): any {
    const updateData: any = {
      ...updateUserDto,
      ...(updateUserDto.email && { email: updateUserDto.email.toLowerCase() }),
      updatedBy,
      updatedAt: new Date(),
    };

    if (updateUserDto.name?.firstName && updateUserDto.name?.lastName) {
      updateData.name = {
        ...updateUserDto.name,
        fullName: `${updateUserDto.name.firstName} ${updateUserDto.name.lastName}`,
      };
    }

    return updateData;
  }

  async update(id: string, updateUserDto: UpdateUserDto, updatedBy: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.validateUniqueFieldsForUpdate(id, user, updateUserDto);
    this.validateRelationshipUpdate(user, updateUserDto);

    const updateData = this.prepareUpdateData(updateUserDto, updatedBy);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    ).select('-passwordHash');

    return updatedUser;
  }

  async resetPassword(id: string, resetBy: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tempPassword = this.generateRandomPassword();
    const rounds = this.configService.get<number>('bcrypt.rounds') || 12;
    const passwordHash = await bcrypt.hash(tempPassword, rounds);

    await this.userModel.findByIdAndUpdate(id, {
      passwordHash,
      mustChangePassword: true,
      updatedBy: resetBy,
      updatedAt: new Date(),
    });

    return {
      message: 'Password reset successfully',
      tempPassword: `${tempPassword.substring(0, 3)}****${tempPassword.substring(9)}`,
    };
  }

  async setPassword(id: string, newPassword: string, setBy: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rounds = this.configService.get<number>('bcrypt.rounds') || 12;
    const passwordHash = await bcrypt.hash(newPassword, rounds);

    await this.userModel.findByIdAndUpdate(id, {
      passwordHash,
      mustChangePassword: false,
      updatedBy: setBy,
      updatedAt: new Date(),
    });

    return {
      message: 'Password set successfully',
    };
  }

  async getDependents(primaryMemberId: string) {
    const dependents = await this.userModel
      .find({
        primaryMemberId,
        relationship: { $nin: ['REL001', RelationshipType.SELF, 'SELF'] }
      })
      .select('-passwordHash')
      .sort({ createdAt: 1 })
      .lean();

    return dependents;
  }

  async getUserWithDependents(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let dependents: any[] = [];
    const isSelf = user.relationship === 'REL001' ||
                   user.relationship === RelationshipType.SELF ||
                   user.relationship === 'SELF';

    if (isSelf) {
      // If this is a primary member, fetch their dependents
      dependents = await this.getDependents(user.memberId);
    }

    return {
      user,
      dependents,
    };
  }

  async delete(id: string, _deletedBy: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.findByIdAndDelete(id);

    return {
      message: 'User deleted successfully',
    };
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}