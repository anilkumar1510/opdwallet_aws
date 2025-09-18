import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PolicyStatus, OwnerPayerType } from '@/common/constants/status.enum';

export class CreatePolicyDto {
  @ApiProperty({ minLength: 3, maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: OwnerPayerType })
  @IsEnum(OwnerPayerType)
  @IsNotEmpty()
  ownerPayer!: OwnerPayerType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sponsorName?: string;

  @ApiPropertyOptional({ enum: PolicyStatus, default: PolicyStatus.DRAFT })
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
}