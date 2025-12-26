import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/modules/users/schemas/user.schema';
import { InternalUser, InternalUserDocument } from '@/modules/internal-users/schemas/internal-user.schema';
import { UserRole } from '../constants/roles.enum';

/**
 * Unified User Service
 * Provides methods to find users across both collections (users and internal_users)
 * Used primarily for authentication and backward compatibility
 */
@Injectable()
export class UnifiedUserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InternalUser.name) private internalUserModel: Model<InternalUserDocument>,
  ) {}

  /**
   * Find a user by MongoDB ObjectId
   * Searches in users collection first, then internal_users
   * @param id - MongoDB ObjectId
   * @returns User object or null
   */
  async findById(id: string): Promise<any> {
    // Try users collection first (members + doctors)
    const userFromUsers = await this.userModel.findById(id).lean();

    if (userFromUsers) {
      return {
        ...userFromUsers,
        userType: userFromUsers.role === UserRole.MEMBER || userFromUsers.role === UserRole.DOCTOR ? 'member' : 'internal',
        source: 'users',
      };
    }

    // Try internal_users collection
    const user = await this.internalUserModel.findById(id).lean();

    if (user) {
      return {
        ...user,
        userType: 'internal',
        source: 'internal_users',
      };
    }

    return null;
  }

  /**
   * Find a user by email (case-insensitive)
   * Searches in both collections
   * Used primarily for authentication
   * @param email - User email
   * @returns User object or null
   */
  async findByEmail(email: string): Promise<any> {
    const lowerEmail = email.toLowerCase();

    // Try users collection first (most common)
    const userFromUsers = await this.userModel.findOne({ email: lowerEmail }).lean();

    if (userFromUsers) {
      return {
        ...userFromUsers,
        userType: userFromUsers.role === UserRole.MEMBER || userFromUsers.role === UserRole.DOCTOR ? 'member' : 'internal',
        source: 'users',
      };
    }

    // Try internal_users collection
    const user = await this.internalUserModel.findOne({ email: lowerEmail }).lean();

    if (user) {
      return {
        ...user,
        userType: 'internal',
        source: 'internal_users',
      };
    }

    return null;
  }

  /**
   * Find a user by userId (string ID)
   * Searches in both collections
   * @param userId - User ID string
   * @returns User object or null
   */
  async findByUserId(userId: string): Promise<any> {
    // Try users collection first
    const userFromUsers = await this.userModel.findOne({ userId }).lean();

    if (userFromUsers) {
      return {
        ...userFromUsers,
        userType: userFromUsers.role === UserRole.MEMBER || userFromUsers.role === UserRole.DOCTOR ? 'member' : 'internal',
        source: 'users',
      };
    }

    // Try internal_users collection
    const user = await this.internalUserModel.findOne({ userId }).lean();

    if (user) {
      return {
        ...user,
        userType: 'internal',
        source: 'internal_users',
      };
    }

    return null;
  }

  /**
   * Find a user by phone number
   * Searches in both collections
   * @param phone - Phone number (string or object)
   * @returns User object or null
   */
  async findByPhone(phone: string | { countryCode: string; number: string }): Promise<any> {
    const phoneNumber = typeof phone === 'string' ? phone : phone.number;

    // Try users collection first
    const userFromUsers = await this.userModel.findOne({ phone: phoneNumber }).lean();

    if (userFromUsers) {
      return {
        ...userFromUsers,
        userType: userFromUsers.role === UserRole.MEMBER || userFromUsers.role === UserRole.DOCTOR ? 'member' : 'internal',
        source: 'users',
      };
    }

    // Try internal_users collection
    const user = await this.internalUserModel.findOne({ 'phone.number': phoneNumber }).lean();

    if (user) {
      return {
        ...user,
        userType: 'internal',
        source: 'internal_users',
      };
    }

    return null;
  }

  /**
   * Find a user by employee ID
   * Only searches in internal_users collection
   * @param employeeId - Employee ID
   * @returns User object or null
   */
  async findByEmployeeId(employeeId: string): Promise<any> {
    const user = await this.internalUserModel.findOne({ employeeId }).lean();

    if (user) {
      return {
        ...user,
        userType: 'internal',
        source: 'internal_users',
      };
    }

    return null;
  }

  /**
   * Find a user by member ID
   * Only searches in users collection
   * @param memberId - Member ID
   * @returns User object or null
   */
  async findByMemberId(memberId: string): Promise<any> {
    const user = await this.userModel.findOne({ memberId }).lean();

    if (user) {
      return {
        ...user,
        userType: user.role === UserRole.MEMBER ? 'member' : 'doctor',
        source: 'users',
      };
    }

    return null;
  }

  /**
   * Check if user is a member (external user)
   * @param user - User object
   * @returns True if member, false otherwise
   */
  isMember(user: any): boolean {
    return user?.role === UserRole.MEMBER;
  }

  /**
   * Check if user is an internal user (staff)
   * @param user - User object
   * @returns True if internal user, false otherwise
   */
  isInternalUser(user: any): boolean {
    return (
      user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.TPA_ADMIN ||
      user?.role === UserRole.TPA_USER ||
      user?.role === UserRole.FINANCE_ADMIN ||
      user?.role === UserRole.FINANCE_USER ||
      user?.role === UserRole.OPS_ADMIN ||
      user?.role === UserRole.OPS_USER
    );
  }

  /**
   * Check if user is a doctor
   * @param user - User object
   * @returns True if doctor, false otherwise
   */
  isDoctor(user: any): boolean {
    return user?.role === UserRole.DOCTOR;
  }

  /**
   * Get user type string
   * @param user - User object
   * @returns User type ('member', 'internal', or 'doctor')
   */
  getUserType(user: any): 'member' | 'internal' | 'doctor' | 'unknown' {
    if (this.isMember(user)) return 'member';
    if (this.isInternalUser(user)) return 'internal';
    if (this.isDoctor(user)) return 'doctor';
    return 'unknown';
  }
}
