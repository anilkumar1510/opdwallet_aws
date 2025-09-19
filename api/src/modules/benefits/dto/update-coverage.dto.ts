import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CoverageItemDto {
  @ApiProperty({ description: 'Category ID (e.g., CONSULTATION, PHARMACY, DIAGNOSTICS)' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Service code (e.g., CON001, PHA001, LAB001)' })
  @IsString()
  serviceCode: string;

  @ApiProperty({ description: 'Whether the service is enabled for coverage' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ required: false, description: 'Optional notes about the coverage' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCoverageDto {
  @ApiProperty({
    type: [CoverageItemDto],
    description: 'List of coverage items to update'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageItemDto)
  items: CoverageItemDto[];
}