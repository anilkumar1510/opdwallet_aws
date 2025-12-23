import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  ValidateNested,
  MinLength,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
 * DTO for creating a new member (external user)
 * Role is automatically set to MEMBER - do not include role in the request
 */
export class CreateMemberDto {
  @ApiProperty({ description: 'Unique Health ID', example: 'UHID-0001' })
  @IsString()
  @IsNotEmpty()
  uhid!: string;

  @ApiProperty({ description: 'Unique Member ID', example: 'MEM-0001' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiPropertyOptional({
    description:
      'Relationship code (e.g., REL001 for Self, REL002 for Spouse) - Can be assigned later during policy assignment',
    example: 'REL001',
  })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiPropertyOptional({
    description: 'Primary Member ID for dependents',
    example: 'MEM-0001',
  })
  @IsString()
  @IsOptional()
  primaryMemberId?: string;

  @ApiPropertyOptional({
    description: 'Corporate User Group ID (ObjectId reference)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'CUG ID must be a valid MongoDB ObjectId' })
  cugId?: string;

  @ApiProperty({ type: NameDto })
  @ValidateNested()
  @Type(() => NameDto)
  name!: NameDto;

  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number as string or object with countryCode and number',
  })
  @IsNotEmpty()
  phone!: string | { countryCode: string; number: string };

  @ApiPropertyOptional({ description: 'Date of Birth', example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] })
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  @IsOptional()
  bloodGroup?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({
    description:
      'Optional password. If not provided, a random password will be generated',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Corporate name (auto-synced from CUG if cugId provided)',
  })
  @IsString()
  @IsOptional()
  corporateName?: string;
}
