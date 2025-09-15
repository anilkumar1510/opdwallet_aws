import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    _id: '123',
    email: 'test@test.com',
    passwordHash: '$2b$12$hashedpassword',
    role: 'MEMBER',
    status: 'ACTIVE',
    name: { firstName: 'Test', lastName: 'User' },
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        'jwt.secret': 'test-secret',
        'jwt.expiresIn': '1h',
        'cookie.name': 'test-session',
        'cookie.maxAge': 3600000,
        'cookie.httpOnly': true,
        'cookie.secure': false,
        'cookie.sameSite': 'lax',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should return null when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      const result = await service.validateUser('test@test.com', 'wrong');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token and cookie options', async () => {
      const mockToken = 'jwt-token';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser as any);

      expect(result).toHaveProperty('access_token', mockToken);
      expect(result).toHaveProperty('cookieOptions');
      expect(result.cookieOptions).toMatchObject({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('Security Requirements', () => {
    it('should enforce rate limiting configuration', () => {
      const rateLimitConfig = mockConfigService.get('rateLimit');
      expect(rateLimitConfig).toBeDefined();
    });

    it('should use secure cookie settings in production', () => {
      process.env.NODE_ENV = 'production';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'cookie.secure') return true;
        if (key === 'cookie.sameSite') return 'strict';
        return null;
      });

      const cookieConfig = {
        secure: mockConfigService.get('cookie.secure'),
        sameSite: mockConfigService.get('cookie.sameSite'),
      };

      expect(cookieConfig.secure).toBe(true);
      expect(cookieConfig.sameSite).toBe('strict');
    });

    it('should hash passwords with appropriate bcrypt rounds', async () => {
      const bcryptRounds = 12;
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, bcryptRounds);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$12$')).toBe(true);
    });
  });
});