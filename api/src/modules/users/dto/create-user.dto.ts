import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  ValidateNested,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/common/constants/roles.enum';
import { UserStatus, RelationshipType } from '@/common/constants/status.enum';

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

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  uhid!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  @IsNotEmpty()
  relationship!: RelationshipType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  primaryMemberId?: string;

  @ApiProperty({ type: NameDto })
  @ValidateNested()
  @Type(() => NameDto)
  name!: NameDto;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}