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
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      status: UserStatus.ACTIVE,
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

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