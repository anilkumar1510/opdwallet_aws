import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub?: string;
  email: string;
  role: string;
  memberId?: string;
  doctorId?: string;
  id?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from Authorization header (for mobile apps)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try to extract from cookie (for web apps)
        (request: Request) => {
          const cookieName = this.configService.get<string>('cookie.name') || 'opd_session';
          const token = request?.cookies?.[cookieName];
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'dev_jwt_secret',
    });
  }

  async validate(payload: JwtPayload) {
    console.log('[JwtStrategy] validate() called with payload:', JSON.stringify(payload, null, 2));
    console.log('[JwtStrategy] Payload keys:', Object.keys(payload));

    // Handle both member and doctor tokens
    const userId = payload.sub || payload.id;

    if (!userId && !payload.doctorId) {
      console.error('[JwtStrategy] No userId or doctorId found in payload');
      throw new UnauthorizedException('Invalid token: missing user identifier');
    }

    if (!payload.email || !payload.role) {
      console.error('[JwtStrategy] Missing required fields:', { email: !!payload.email, role: !!payload.role });
      throw new UnauthorizedException('Invalid token: missing required fields');
    }

    const result = {
      userId: userId,
      email: payload.email,
      role: payload.role,
      memberId: payload.memberId,
      doctorId: payload.doctorId,
    };

    console.log('[JwtStrategy] Returning validated user:', JSON.stringify(result, null, 2));
    return result;
  }
}