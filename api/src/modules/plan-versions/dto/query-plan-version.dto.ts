import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlanVersionStatus } from '../schemas/plan-version.schema';

export class QueryPlanVersionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ enum: PlanVersionStatus })
  @IsEnum(PlanVersionStatus)
  @IsOptional()
  status?: PlanVersionStatus;
}