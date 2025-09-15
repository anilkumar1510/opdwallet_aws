import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyStatus } from '@/common/constants/status.enum';

export class QueryPolicyDto {
  @ApiPropertyOptional({ enum: PolicyStatus })
  @IsEnum(PolicyStatus)
  @IsOptional()
  status?: PolicyStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  limit?: string;
}