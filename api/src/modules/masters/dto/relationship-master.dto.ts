import { IsString, IsBoolean, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRelationshipMasterDto {
  @ApiProperty({ description: 'Unique relationship code (e.g., REL001)' })
  @IsString()
  @IsNotEmpty()
  relationshipCode!: string;

  @ApiProperty({ description: 'Relationship name' })
  @IsString()
  @IsNotEmpty()
  relationshipName!: string;

  @ApiProperty({ description: 'Display name for UI' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiPropertyOptional({ description: 'Description of the relationship' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', default: 1 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateRelationshipMasterDto {
  @ApiPropertyOptional({ description: 'Relationship name' })
  @IsString()
  @IsOptional()
  relationshipName?: string;

  @ApiPropertyOptional({ description: 'Display name for UI' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Description of the relationship' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
