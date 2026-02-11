import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class UpdateVaccinationMasterDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  standardName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @IsOptional()
  @IsString()
  vaccineType?: string;

  @IsOptional()
  @IsString()
  targetDisease?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
