import { IsString, IsNotEmpty, IsOptional, IsDate, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  policyId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  @IsOptional()
  @IsNumber()
  planVersionOverride?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}