import { IsString, IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ToggleSpecialtyMappingDto {
  @ApiProperty({ description: 'Category ID (CAT001 or CAT005)' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Specialty MongoDB ObjectId' })
  @IsMongoId()
  specialtyId: string;

  @ApiProperty({ description: 'Enable or disable the specialty for this category' })
  @IsBoolean()
  isEnabled: boolean;
}

export class GetMappingsDto {
  @ApiProperty({ description: 'Category ID to filter mappings' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Filter by enabled status' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class SpecialtyWithMappingDto {
  @ApiProperty({ description: 'Specialty MongoDB ID' })
  _id: string;

  @ApiProperty({ description: 'Specialty unique identifier (e.g., SPEC001)' })
  specialtyId: string;

  @ApiProperty({ description: 'Specialty code (e.g., CARDIO)' })
  code: string;

  @ApiProperty({ description: 'Specialty name' })
  name: string;

  @ApiPropertyOptional({ description: 'Specialty description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Specialty icon (emoji or identifier)' })
  icon?: string;

  @ApiProperty({ description: 'Whether specialty is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting' })
  displayOrder?: number;

  @ApiProperty({ description: 'Whether this specialty is enabled for the category' })
  isEnabledForCategory: boolean;
}
