import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateVaccinationMasterDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  standardName: string;

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
}
