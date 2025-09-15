import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyStatus } from '@/common/constants/status.enum';

export class CreatePolicyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ enum: PolicyStatus })
  @IsEnum(PolicyStatus)
  @IsOptional()
  status?: PolicyStatus;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  effectiveFrom!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ownerPayer?: string;
}