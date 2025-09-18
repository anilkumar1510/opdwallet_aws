import {
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Helper to ensure max 2 decimal places for amounts
const roundToTwoDecimals = (value: any) => {
  if (typeof value === 'number') {
    return Math.round(value * 100) / 100;
  }
  return value;
};

export class ConsultationConfigDto {
  @ApiProperty({ description: 'Whether consultation is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Annual amount limit for consultation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => roundToTwoDecimals(value))
  annualAmountLimit?: number;

  @ApiPropertyOptional({ description: 'Visit limit for consultation' })
  @IsOptional()
  @IsInt()
  @Min(0)
  visitsLimit?: number;

  @ApiPropertyOptional({ description: 'Whether prescription is required' })
  @IsOptional()
  @IsBoolean()
  rxRequired?: boolean;
}

export class PharmacyConfigDto {
  @ApiProperty({ description: 'Whether pharmacy is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Annual amount limit for pharmacy' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => roundToTwoDecimals(value))
  annualAmountLimit?: number;

  @ApiPropertyOptional({ description: 'Whether prescription is required' })
  @IsOptional()
  @IsBoolean()
  rxRequired?: boolean;
}

export class DiagnosticsConfigDto {
  @ApiProperty({ description: 'Whether diagnostics is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Annual amount limit for diagnostics' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => roundToTwoDecimals(value))
  annualAmountLimit?: number;

  @ApiPropertyOptional({ description: 'Visit limit for diagnostics' })
  @IsOptional()
  @IsInt()
  @Min(0)
  visitsLimit?: number;

  @ApiPropertyOptional({ description: 'Whether prescription is required' })
  @IsOptional()
  @IsBoolean()
  rxRequired?: boolean;
}

export class AHCConfigDto {
  @ApiProperty({ description: 'Whether Annual Health Check is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Whether fasting is included' })
  @IsOptional()
  @IsBoolean()
  includesFasting?: boolean;
}

export class SimpleComponentConfigDto {
  @ApiProperty({ description: 'Whether component is enabled' })
  @IsBoolean()
  enabled: boolean;
}

export class ComponentsConfigDto {
  @ApiPropertyOptional({ type: ConsultationConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsultationConfigDto)
  consultation?: ConsultationConfigDto;

  @ApiPropertyOptional({ type: PharmacyConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PharmacyConfigDto)
  pharmacy?: PharmacyConfigDto;

  @ApiPropertyOptional({ type: DiagnosticsConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiagnosticsConfigDto)
  diagnostics?: DiagnosticsConfigDto;

  @ApiPropertyOptional({ type: AHCConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AHCConfigDto)
  ahc?: AHCConfigDto;

  @ApiPropertyOptional({ type: SimpleComponentConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SimpleComponentConfigDto)
  vaccination?: SimpleComponentConfigDto;

  @ApiPropertyOptional({ type: SimpleComponentConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SimpleComponentConfigDto)
  dental?: SimpleComponentConfigDto;

  @ApiPropertyOptional({ type: SimpleComponentConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SimpleComponentConfigDto)
  vision?: SimpleComponentConfigDto;

  @ApiPropertyOptional({ type: SimpleComponentConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SimpleComponentConfigDto)
  wellness?: SimpleComponentConfigDto;
}

export class UpdateBenefitComponentsDto {
  @ApiProperty({ type: ComponentsConfigDto })
  @ValidateNested()
  @Type(() => ComponentsConfigDto)
  components: ComponentsConfigDto;
}