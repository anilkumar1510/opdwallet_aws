import { IsString, IsBoolean, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Unique service code (e.g., CON001)',
    example: 'CON001'
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Service name',
    example: 'General Consultation'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Service description',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Service category',
    example: 'Consultation Services'
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Is service active',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Coverage percentage (0-100)',
    default: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  coveragePercentage?: number = 100;

  @ApiProperty({
    description: 'Copay amount',
    default: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  copayAmount?: number = 0;

  @ApiProperty({
    description: 'Requires pre-authorization',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  requiresPreAuth?: boolean = false;

  @ApiProperty({
    description: 'Requires referral',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  requiresReferral?: boolean = false;

  @ApiProperty({
    description: 'Price range',
    required: false
  })
  @IsOptional()
  priceRange?: {
    min: number;
    max: number;
  };

  @ApiProperty({
    description: 'Annual limit',
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @ApiProperty({
    description: 'Waiting period in days',
    default: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  waitingPeriodDays?: number = 0;

  @ApiProperty({
    description: 'Required documents',
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[] = [];
}

export class UpdateServiceDto {
  @ApiProperty({
    description: 'Service code',
    required: false
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Service name',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Service description',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Service category',
    required: false
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Is service active',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Coverage percentage (0-100)',
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  coveragePercentage?: number;

  @ApiProperty({
    description: 'Copay amount',
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  copayAmount?: number;

  @ApiProperty({
    description: 'Requires pre-authorization',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  requiresPreAuth?: boolean;

  @ApiProperty({
    description: 'Requires referral',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  requiresReferral?: boolean;

  @ApiProperty({
    description: 'Price range',
    required: false
  })
  @IsOptional()
  priceRange?: {
    min: number;
    max: number;
  };

  @ApiProperty({
    description: 'Annual limit',
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @ApiProperty({
    description: 'Waiting period in days',
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  waitingPeriodDays?: number;

  @ApiProperty({
    description: 'Required documents',
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[];
}