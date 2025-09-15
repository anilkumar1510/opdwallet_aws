import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  policyId!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}