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

  async create(createUserDto: CreateUserDto, createdBy: string) {
    // Validate unique fields
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email.toLowerCase() },
        { phone: createUserDto.phone },
        { uhid: createUserDto.uhid },
        { memberId: createUserDto.memberId },
        ...(createUserDto.employeeId
          ? [{ employeeId: createUserDto.employeeId }]
          : []),
      ],
    }).lean();

    if (existingUser) {
      const field = existingUser.email === createUserDto.email.toLowerCase()
        ? 'Email'
        : existingUser.phone === createUserDto.phone
        ? 'Phone'
        : existingUser.uhid === createUserDto.uhid
        ? 'UHID'
        : existingUser.memberId === createUserDto.memberId
        ? 'Member ID'
        : 'Employee ID';
      throw new ConflictException(`${field} already exists`);
    }

    // Validate relationship logic
    if (createUserDto.relationship !== RelationshipType.SELF) {
      if (!createUserDto.primaryMemberId) {
        throw new BadRequestException(
          'Primary Member ID is required for dependents',
        );
      }
      const primaryMember = await this.userModel.findOne({
        memberId: createUserDto.primaryMemberId,
        relationship: RelationshipType.SELF,
      }).lean();
      if (!primaryMember) {
        throw new BadRequestException(
          'Invalid Primary Member ID or member is not SELF',
        );
      }
    }

    // Generate userId
    const userId = await this.counterService.generateUserId();

    // Hash password or generate random one
    const password = createUserDto.password || this.generateRandomPassword();
    const rounds = this.configService.get<number>('bcrypt.rounds') || 12;
    const passwordHash = await bcrypt.hash(password, rounds);

    const user = new this.userModel({
      ...createUserDto,
      userId,
      email: createUserDto.email.toLowerCase(),
      passwordHash,
      mustChangePassword: !createUserDto.password,
      createdBy,
    });

    const savedUser = await user.save();
    const { passwordHash: _, ...result } = savedUser.toObject();

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
        .select('userId memberId uhid employeeId name email phone role relationship status primaryMemberId createdAt updatedAt')
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

  async update(id: string, updateUserDto: UpdateUserDto, updatedBy: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for unique constraint violations
    if (updateUserDto.email || updateUserDto.phone || updateUserDto.uhid ||
        updateUserDto.memberId || updateUserDto.employeeId) {
      const orConditions = [];
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        orConditions.push({ email: updateUserDto.email.toLowerCase() });
      }
      if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
        orConditions.push({ phone: updateUserDto.phone });
      }
      if (updateUserDto.uhid && updateUserDto.uhid !== user.uhid) {
        orConditions.push({ uhid: updateUserDto.uhid });
      }
      if (updateUserDto.memberId && updateUserDto.memberId !== user.memberId) {
        orConditions.push({ memberId: updateUserDto.memberId });
      }
      if (updateUserDto.employeeId && updateUserDto.employeeId !== user.employeeId) {
        orConditions.push({ employeeId: updateUserDto.employeeId });
      }

      if (orConditions.length > 0) {
        const existingUser = await this.userModel.findOne({
          $or: orConditions,
          _id: { $ne: id },
        }).lean();

        if (existingUser) {
          throw new ConflictException('Duplicate value found');
        }
      }
    }

    // Validate relationship logic
    if (updateUserDto.relationship && updateUserDto.relationship !== RelationshipType.SELF) {
      if (!updateUserDto.primaryMemberId && !user.primaryMemberId) {
        throw new BadRequestException(
          'Primary Member ID is required for dependents',
        );
      }
    }

    // If name is being updated, calculate fullName
    const updateData: any = {
      ...updateUserDto,
      ...(updateUserDto.email && { email: updateUserDto.email.toLowerCase() }),
      updatedBy,
      updatedAt: new Date(),
    };

    // Add fullName if name is being updated
    if (updateUserDto.name && updateUserDto.name.firstName && updateUserDto.name.lastName) {
      updateData.name = {
        ...updateUserDto.name,
        fullName: `${updateUserDto.name.firstName} ${updateUserDto.name.lastName}`,
      };
    }

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
        relationship: { $ne: RelationshipType.SELF }
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
    if (user.relationship === RelationshipType.SELF) {
      // If this is a primary member, fetch their dependents
      dependents = await this.getDependents(user.memberId);
    }

    return {
      user,
      dependents,
    };
  }

  async delete(id: string, deletedBy: string) {
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