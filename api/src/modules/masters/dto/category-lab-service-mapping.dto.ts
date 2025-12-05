import { IsString, IsBoolean, IsMongoId, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ToggleLabServiceMappingDto {
  @ApiProperty({ description: 'Category ID (currently CAT004)' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Lab Service MongoDB ObjectId' })
  @IsMongoId()
  labServiceId: string;

  @ApiProperty({ description: 'Enable or disable the lab service for this category' })
  @IsBoolean()
  isEnabled: boolean;
}

export class LabServiceWithMappingDto {
  @ApiProperty({ description: 'Lab Service MongoDB ID' })
  _id: string;

  @ApiProperty({ description: 'Lab Service unique identifier (e.g., SVC-...)' })
  serviceId: string;

  @ApiProperty({ description: 'Lab Service code (e.g., CBC)' })
  code: string;

  @ApiProperty({ description: 'Lab Service name' })
  name: string;

  @ApiPropertyOptional({ description: 'Lab Service description' })
  description?: string;

  @ApiProperty({ description: 'Lab Service category (PATHOLOGY, RADIOLOGY, etc.)' })
  category: string;

  @ApiPropertyOptional({ description: 'Sample type (Blood, Urine, etc.)' })
  sampleType?: string;

  @ApiPropertyOptional({ description: 'Preparation instructions' })
  preparationInstructions?: string;

  @ApiProperty({ description: 'Whether lab service is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Display order for sorting' })
  displayOrder?: number;

  @ApiProperty({ description: 'Whether this lab service is enabled for the category' })
  isEnabledForCategory: boolean;
}
