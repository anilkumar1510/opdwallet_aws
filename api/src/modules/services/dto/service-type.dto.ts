import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ServiceCategory {
  CONSULTATION = 'CONSULTATION',
  DIAGNOSTIC = 'DIAGNOSTIC',
  PHARMACY = 'PHARMACY',
  PROCEDURE = 'PROCEDURE',
  PREVENTIVE = 'PREVENTIVE',
  EMERGENCY = 'EMERGENCY',
  WELLNESS = 'WELLNESS',
  OTHER = 'OTHER',
}

class PriceRangeDto {
  @IsNumber()
  @Min(0)
  min!: number;

  @IsNumber()
  @Min(0)
  max!: number;
}

export class CreateServiceTypeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => PriceRangeDto)
  @IsOptional()
  priceRange?: PriceRangeDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  coveragePercentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  copayAmount?: number;

  @IsBoolean()
  @IsOptional()
  requiresPreAuth?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresReferral?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  waitingPeriodDays?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  perClaimLimit?: number;
}

export class UpdateServiceTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => PriceRangeDto)
  @IsOptional()
  priceRange?: PriceRangeDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  coveragePercentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  copayAmount?: number;

  @IsBoolean()
  @IsOptional()
  requiresPreAuth?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresReferral?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  waitingPeriodDays?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  annualLimit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  perClaimLimit?: number;
}