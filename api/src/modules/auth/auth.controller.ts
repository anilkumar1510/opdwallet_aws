import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = await this.authService.login(req.user);
    const cookieConfig = this.configService.get('cookie');

    res.cookie(cookieConfig.name, result.token, {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: cookieConfig.maxAge,
    });

    return result.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  logout(@Response({ passthrough: true }) res: ExpressResponse) {
    const cookieConfig = this.configService.get('cookie');
    res.clearCookie(cookieConfig.name);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req: AuthRequest) {
    return this.authService.getCurrentUser(req.user.userId);
  }
}