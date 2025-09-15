import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@/common/constants/status.enum';

export class UpdateAssignmentDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;
}