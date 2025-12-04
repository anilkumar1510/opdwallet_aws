import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Matches,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeCount } from '@/common/constants/status.enum';

export class CreateCugDto {
  @ApiProperty({
    description: 'Unique CUG ID in format: 3 letters + 3 digits',
    example: 'CUG001',
    pattern: '^[A-Z]{3}\\d{3}$',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @Matches(/^[A-Z]{3}\d{3}$/, {
    message: 'CUG ID must be in format: 3 uppercase letters followed by 3 digits (e.g., CUG001)',
  })
  cugId: string;

  @ApiProperty({
    description: 'CUG code',
    example: 'GOOGLE',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  code: string;

  @ApiProperty({
    description: 'CUG name',
    example: 'Google Inc.',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Company name (official)',
    example: 'Google Inc.',
  })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'Employee count range',
    enum: EmployeeCount,
    example: EmployeeCount.ONE_THOUSAND_TO_5000,
  })
  @IsNotEmpty()
  @IsEnum(EmployeeCount)
  employeeCount: EmployeeCount;

  @ApiPropertyOptional({
    description: 'CUG description',
    example: 'Google corporate group',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the CUG is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Display order for sorting',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number = 0;
}

export class UpdateCugDto {
  @ApiPropertyOptional({
    description: 'CUG code',
    example: 'GOOGLE',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  code?: string;

  @ApiPropertyOptional({
    description: 'CUG name',
    example: 'Google Inc.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Company name (official)',
    example: 'Google Inc.',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Employee count range',
    enum: EmployeeCount,
  })
  @IsOptional()
  @IsEnum(EmployeeCount)
  employeeCount?: EmployeeCount;

  @ApiPropertyOptional({
    description: 'CUG description',
    example: 'Google corporate group',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the CUG is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Display order for sorting',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number;
}