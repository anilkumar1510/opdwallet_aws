import {
  IsDateString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanVersionDto {
  @ApiProperty({
    description: 'Effective from date',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  effectiveFrom: string;

  @ApiProperty({
    description: 'Effective to date',
    example: '2025-12-31T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}