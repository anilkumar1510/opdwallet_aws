import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { InternalUser, InternalUserDocument } from '../internal-users/schemas/internal-user.schema';
import { Address, AddressDocument } from '../users/schemas/address.schema';
import { UserStatus } from '@/common/constants/status.enum';
import { UserRole } from '@/common/constants/roles.enum';

/**
 * Parse JWT expiry string (e.g., '15m', '7d', '1h') to seconds
 */
function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // Default 1 hour
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 3600;
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InternalUser.name) private internalUserModel: Model<InternalUserDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('[AUTH DEBUG] Login attempt for email:', email);
    console.log('[AUTH DEBUG] Looking for user with email:', email.toLowerCase());

    // Try members/doctors collection first (most common)
    let user = await this.userModel.findOne({
      email: email.toLowerCase(),
      status: UserStatus.ACTIVE,
    });

    let userType: 'member' | 'internal' | 'doctor' = 'member';
    let source: 'users' | 'internal_users' = 'users';

    // If not found in users, try internal_users collection
    if (!user) {
      console.log('[AUTH DEBUG] Not found in users collection, checking internal_users...');
      user = await this.internalUserModel.findOne({
        email: email.toLowerCase(),
        status: UserStatus.ACTIVE,
      }) as any;

      if (user) {
        userType = 'internal';
        source = 'internal_users';
        console.log('[AUTH DEBUG] Found in internal_users collection');
      }
    } else {
      // Determine user type based on role
      if (user.role === UserRole.MEMBER) {
        userType = 'member';
      } else if (user.role === UserRole.DOCTOR) {
        userType = 'doctor';
      } else {
        userType = 'internal';
      }
      console.log('[AUTH DEBUG] Found in users collection');
    }

    if (!user) {
      console.log('[AUTH DEBUG] User not found in any collection or not active');
      return null;
    }

    console.log('[AUTH DEBUG] User found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      userType,
      source,
      hasPassword: !!user.passwordHash,
    });

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('[AUTH DEBUG] Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('[AUTH DEBUG] Password does not match');
      return null;
    }

    console.log('[AUTH DEBUG] Authentication successful for user:', user.email);
    const { passwordHash, ...result } = user.toObject();
    return {
      ...result,
      userType,
      source,
    };
  }

  async login(user: any) {
    const jwtConfig = this.configService.get('jwt');
    const accessTokenExpiry = jwtConfig.expiresIn || '7d';
    const refreshTokenExpiry = jwtConfig.refreshExpiresIn || '30d';
    const refreshSecret = jwtConfig.refreshSecret || jwtConfig.secret;

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
      memberId: user.memberId,
      userType: user.userType || (user.role === UserRole.MEMBER || user.role === UserRole.DOCTOR ? 'member' : 'internal'),
      name: user.name, // Include name in JWT for status history tracking
    };

    // Generate access token
    const token = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiry,
    });

    // Generate refresh token with different secret and longer expiry
    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString(), type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: refreshTokenExpiry,
      },
    );

    // Calculate expiresIn in seconds for frontend
    const expiresIn = parseExpiryToSeconds(accessTokenExpiry);

    this.logger.debug(`Login successful for ${user.email}, token expires in ${accessTokenExpiry} (${expiresIn}s)`);

    return {
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        memberId: user.memberId,
        mustChangePassword: user.mustChangePassword,
      },
      token,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(refreshToken: string) {
    const jwtConfig = this.configService.get('jwt');
    const refreshSecret = jwtConfig.refreshSecret || jwtConfig.secret;
    const accessTokenExpiry = jwtConfig.expiresIn || '7d';
    const newRefreshTokenExpiry = jwtConfig.refreshExpiresIn || '30d';

    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userId = decoded.sub;

      // Fetch user from database to ensure they still exist and are active
      const userDoc = await this.userModel.findById(userId).select('-passwordHash');
      const internalUserDoc = !userDoc
        ? await this.internalUserModel.findById(userId).select('-passwordHash')
        : null;

      const user = userDoc || internalUserDoc;

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const userIdStr = (user._id as Types.ObjectId).toString();
      const userEmail = user.email;
      const userRole = user.role;
      const userName = user.name;
      const userMemberId = (user as UserDocument).memberId;

      // Generate new access token
      const payload = {
        email: userEmail,
        sub: userIdStr,
        role: userRole,
        memberId: userMemberId,
        userType: userRole === UserRole.MEMBER || userRole === UserRole.DOCTOR ? 'member' : 'internal',
        name: userName,
      };

      const newToken = this.jwtService.sign(payload, {
        expiresIn: accessTokenExpiry,
      });

      // Generate new refresh token (token rotation for security)
      const newRefreshToken = this.jwtService.sign(
        { sub: userIdStr, type: 'refresh' },
        {
          secret: refreshSecret,
          expiresIn: newRefreshTokenExpiry,
        },
      );

      const expiresIn = parseExpiryToSeconds(accessTokenExpiry);

      this.logger.debug(`Token refreshed for ${userEmail}`);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn,
      };
    } catch (error) {
      this.logger.warn(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    // Try members/doctors collection first
    let user = await this.userModel.findById(userId).select('-passwordHash');

    // If not found, try internal_users collection
    if (!user) {
      user = await this.internalUserModel.findById(userId).select('-passwordHash') as any;
    }

    if (!user) {
      throw new UnauthorizedException();
    }

    // Convert to plain object
    const userObj = user.toObject();

    // If user doesn't have an embedded address, try to fetch from addresses collection
    if (!userObj.address || !userObj.address.pincode) {
      console.log('[AUTH] User has no embedded address, fetching from addresses collection...');

      // Try to find default address first
      let address = await this.addressModel.findOne({
        userId: user._id,
        isDefault: true,
      });

      // If no default address, get any address
      if (!address) {
        console.log('[AUTH] No default address found, fetching any address...');
        address = await this.addressModel.findOne({
          userId: user._id,
        });
      }

      if (address) {
        console.log('[AUTH] Address found:', {
          addressId: address.addressId,
          pincode: address.pincode,
          city: address.city,
        });

        // Add address to user object (map field names to match user schema)
        userObj.address = {
          line1: address.addressLine1,
          line2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        };
      } else {
        console.log('[AUTH] No address found in addresses collection');
      }
    } else {
      console.log('[AUTH] User has embedded address with pincode:', userObj.address.pincode);
    }

    return userObj;
  }
}