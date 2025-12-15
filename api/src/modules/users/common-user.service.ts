import { Injectable, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

/**
 * Common User Service
 * Provides shared logic for both Members and Internal Users services
 */
@Injectable()
export class CommonUserService {
  constructor(private configService: ConfigService) {}

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('bcrypt.rounds') || 12;
    return bcrypt.hash(password, rounds);
  }

  /**
   * Generate a secure random password
   * @param length - Length of password (default: 12)
   * @returns Generated password
   */
  generateRandomPassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Build a search filter for user queries
   * @param search - Search term
   * @param additionalFields - Additional fields to search
   * @returns MongoDB filter object
   */
  buildSearchFilter(search?: string, additionalFields?: string[]): any {
    if (!search) {
      return {};
    }

    const defaultFields = [
      { 'name.firstName': { $regex: search, $options: 'i' } },
      { 'name.lastName': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const extraFields =
      additionalFields?.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      })) || [];

    return {
      $or: [...defaultFields, ...extraFields],
    };
  }

  /**
   * Check if a field value already exists in the collection
   * @param model - Mongoose model to check against
   * @param field - Field name to check
   * @param value - Value to check
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async checkFieldExists(
    model: any,
    field: string,
    value: any,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: any = { [field]: value };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await model.findOne(filter).lean();
    return !!existing;
  }

  /**
   * Validate email uniqueness across both collections
   * @param userModel - User model (members/doctors)
   * @param internalUserModel - Internal user model
   * @param email - Email to validate
   * @param excludeId - Optional ID to exclude
   */
  async validateEmailUniqueness(
    userModel: any,
    internalUserModel: any,
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const lowerEmail = email.toLowerCase();

    // Check in users collection
    const existsInUsers = await this.checkFieldExists(
      userModel,
      'email',
      lowerEmail,
      excludeId,
    );

    if (existsInUsers) {
      throw new ConflictException('Email already exists');
    }

    // Check in internal_users collection
    const existsInInternal = await this.checkFieldExists(
      internalUserModel,
      'email',
      lowerEmail,
      excludeId,
    );

    if (existsInInternal) {
      throw new ConflictException('Email already exists');
    }
  }

  /**
   * Validate phone uniqueness across both collections
   * @param userModel - User model (members/doctors)
   * @param internalUserModel - Internal user model
   * @param phone - Phone to validate (can be string or object)
   * @param excludeId - Optional ID to exclude
   */
  async validatePhoneUniqueness(
    userModel: any,
    internalUserModel: any,
    phone: string | { countryCode: string; number: string },
    excludeId?: string,
  ): Promise<void> {
    // Normalize phone to string
    const phoneStr = typeof phone === 'string' ? phone : phone.number;

    // Check in users collection
    const existsInUsers = await this.checkFieldExists(
      userModel,
      'phone',
      phoneStr,
      excludeId,
    );

    if (existsInUsers) {
      throw new ConflictException('Phone number already exists');
    }

    // Check in internal_users collection
    const filter: any = { 'phone.number': phoneStr };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existsInInternal = await internalUserModel.findOne(filter).lean();

    if (existsInInternal) {
      throw new ConflictException('Phone number already exists');
    }
  }

  /**
   * Validate userId uniqueness across both collections
   * @param userModel - User model (members/doctors)
   * @param internalUserModel - Internal user model
   * @param userId - User ID to validate
   * @param excludeId - Optional ID to exclude
   */
  async validateUserIdUniqueness(
    userModel: any,
    internalUserModel: any,
    userId: string,
    excludeId?: string,
  ): Promise<void> {
    // Check in users collection
    const existsInUsers = await this.checkFieldExists(
      userModel,
      'userId',
      userId,
      excludeId,
    );

    if (existsInUsers) {
      throw new ConflictException('User ID already exists');
    }

    // Check in internal_users collection
    const existsInInternal = await this.checkFieldExists(
      internalUserModel,
      'userId',
      userId,
      excludeId,
    );

    if (existsInInternal) {
      throw new ConflictException('User ID already exists');
    }
  }

  /**
   * Normalize email to lowercase
   * @param email - Email to normalize
   * @returns Normalized email
   */
  normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Build pagination metadata
   * @param total - Total count
   * @param page - Current page
   * @param limit - Page size
   * @returns Pagination metadata
   */
  buildPaginationMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }
}
