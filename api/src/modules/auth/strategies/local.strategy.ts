import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    console.log('[LOCAL STRATEGY DEBUG] Validating user with email:', email);
    console.log('[LOCAL STRATEGY DEBUG] Password length:', password?.length || 0);

    const user = await this.authService.validateUser(email, password);

    if (!user) {
      console.log('[LOCAL STRATEGY DEBUG] Validation failed - throwing UnauthorizedException');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('[LOCAL STRATEGY DEBUG] Validation successful for user:', user.email);
    return user;
  }
}