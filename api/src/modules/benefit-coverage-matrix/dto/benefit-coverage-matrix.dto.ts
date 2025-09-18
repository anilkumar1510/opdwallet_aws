import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CoverageRowDto {
  @ApiProperty({
    description: 'Category ID (CAT###)',
    example: 'CAT001'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^CAT\d{3}$/, { message: 'categoryId must be in format CAT### (e.g., CAT001)' })
  categoryId: string;

  @ApiProperty({
    description: 'Service code from serviceTypes',
    example: 'CON001',
    required: false
  })
  @IsOptional()
  @IsString()
  serviceCode?: string;

  @ApiProperty({
    description: 'Whether this category/service is enabled',
    example: true
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'Optional notes',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBenefitCoverageMatrixDto {
  @ApiProperty({
    description: 'Coverage rows',
    type: [CoverageRowDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageRowDto)
  rows: CoverageRowDto[];
}

export class BenefitCoverageMatrixResponseDto {
  policyId: string;
  planVersion: number;
  rows: Array<{
    categoryId: string;
    categoryName?: string;
    serviceCode?: string;
    serviceName?: string;
    enabled: boolean;
    notes?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}