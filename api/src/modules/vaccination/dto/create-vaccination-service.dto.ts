import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateVaccinationServiceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vaccineType?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dosesRequired?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  doseIntervalDays?: number;

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsOptional()
  @IsString()
  administrationRoute?: string;

  @IsOptional()
  @IsString()
  storageRequirements?: string;

  @IsOptional()
  @IsString()
  contraindications?: string;
}
