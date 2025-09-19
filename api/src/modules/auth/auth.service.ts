import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserStatus } from '@/common/constants/status.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('[AUTH DEBUG] Login attempt for email:', email);
    console.log('[AUTH DEBUG] Looking for user with email:', email.toLowerCase());

    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      status: UserStatus.ACTIVE,
    });

    if (!user) {
      console.log('[AUTH DEBUG] User not found or not active');
      console.log('[AUTH DEBUG] Checking if user exists with any status...');
      const anyUser = await this.userModel.findOne({ email: email.toLowerCase() });
      if (anyUser) {
        console.log('[AUTH DEBUG] User exists but status is:', anyUser.status);
        console.log('[AUTH DEBUG] User details:', {
          id: anyUser._id,
          email: anyUser.email,
          name: anyUser.name,
          role: anyUser.role,
          status: anyUser.status,
        });
      } else {
        console.log('[AUTH DEBUG] No user found with this email at all');
      }
      return null;
    }

    console.log('[AUTH DEBUG] User found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
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
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
      memberId: user.memberId,
    };

    const token = this.jwtService.sign(payload);

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
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}