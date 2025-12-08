import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating service configuration for a benefit
 */
export class UpdateServicesConfigDto {
  @ApiProperty({
    description: 'Array of service IDs to enable for this benefit',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  serviceIds: string[];
}

/**
 * DTO for updating specialty configuration (CAT001, CAT005)
 */
export class UpdateSpecialtyConfigDto {
  @ApiProperty({
    description: 'Array of specialty ObjectIds to enable',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedSpecialties?: string[];
}

/**
 * DTO for updating lab service category configuration (CAT003, CAT004)
 */
export class UpdateLabServiceConfigDto {
  @ApiProperty({
    description: 'Array of lab service categories to enable',
    example: ['RADIOLOGY', 'ENDOSCOPY'],
    enum: ['RADIOLOGY', 'ENDOSCOPY', 'PATHOLOGY', 'CARDIOLOGY', 'OTHER'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedLabServiceCategories?: string[];
}

/**
 * DTO for updating service type configuration (CAT006, CAT007, CAT008)
 */
export class UpdateServiceTypeConfigDto {
  @ApiProperty({
    description: 'Array of service codes to enable',
    example: ['DEN001', 'DEN002', 'VIS001'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedServiceCodes?: string[];
}
