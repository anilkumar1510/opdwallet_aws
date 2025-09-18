import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanVersionDto {
  @ApiPropertyOptional({
    description: 'Plan version override (null/undefined to clear override)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  planVersion?: number;
}