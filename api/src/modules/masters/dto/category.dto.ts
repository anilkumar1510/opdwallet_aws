import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Matches,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Unique category ID in format: 3 letters + 3 digits',
    example: 'CAT001',
    pattern: '^[A-Z]{3}\\d{3}$',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @Matches(/^[A-Z]{3}\d{3}$/, {
    message: 'Category ID must be in format: 3 uppercase letters followed by 3 digits (e.g., CAT001)',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Consultation Services',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Medical consultation services',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
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

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Consultation Services',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Medical consultation services',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
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