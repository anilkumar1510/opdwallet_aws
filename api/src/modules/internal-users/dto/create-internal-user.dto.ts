import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  ValidateNested,
  MinLength,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/common/constants/roles.enum';
import { UserStatus } from '@/common/constants/status.enum';

class NameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

class PhoneDto {
  @ApiProperty({ default: '+91' })
  @IsString()
  countryCode!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  number!: string;
}

class AddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  line1!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pincode!: string;
}

/**
 * DTO for creating a new internal user (staff)
 * Only allows internal roles: SUPER_ADMIN, ADMIN, TPA, TPA_ADMIN, TPA_USER, FINANCE_USER, OPS
 * MEMBER and DOCTOR roles are NOT allowed
 */
export class CreateInternalUserDto {
  @ApiProperty({
    description: 'Employee ID (required for internal users)',
    example: 'EMP-0001',
  })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ type: NameDto })
  @ValidateNested()
  @Type(() => NameDto)
  name!: NameDto;

  @ApiProperty({ example: 'admin@opdwallet.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ type: PhoneDto })
  @ValidateNested()
  @Type(() => PhoneDto)
  phone!: PhoneDto;

  @ApiProperty({
    description: 'Internal user role (SUPER_ADMIN, ADMIN, TPA_ADMIN, TPA_USER, FINANCE_ADMIN, FINANCE_USER, OPS_ADMIN, OPS_USER)',
    enum: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.TPA_ADMIN,
      UserRole.TPA_USER,
      UserRole.FINANCE_ADMIN,
      UserRole.FINANCE_USER,
      UserRole.OPS_ADMIN,
      UserRole.OPS_USER,
    ],
    example: UserRole.ADMIN,
  })
  @IsEnum([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TPA_ADMIN,
    UserRole.TPA_USER,
    UserRole.FINANCE_ADMIN,
    UserRole.FINANCE_USER,
    UserRole.OPS_ADMIN,
    UserRole.OPS_USER,
  ])
  @IsNotEmpty()
  role!: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Optional password. If not provided, a random password will be generated',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Department name',
    example: 'Finance',
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({
    description: 'Job designation',
    example: 'Finance Manager',
  })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({
    description: 'Reporting manager user ID',
    example: 'EMP-0001',
  })
  @IsString()
  @IsOptional()
  reportingTo?: string;

  @ApiPropertyOptional({
    description: 'Enable Multi-Factor Authentication',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'List of allowed IP addresses for enhanced security',
    type: [String],
    example: ['192.168.1.100', '10.0.0.50'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedIPs?: string[];

  @ApiPropertyOptional({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;
}
