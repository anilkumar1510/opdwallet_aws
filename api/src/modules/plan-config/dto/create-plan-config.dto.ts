import { IsOptional, IsNumber, IsObject, IsArray, IsString } from 'class-validator';

export class CreatePlanConfigDto {
  @IsOptional()
  @IsNumber()
  version?: number; // Auto-increment if not provided

  @IsOptional()
  @IsObject()
  benefits?: any;

  @IsOptional()
  @IsObject()
  wallet?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coveredRelationships?: string[];

  @IsOptional()
  @IsObject()
  memberConfigs?: { [relationshipCode: string]: any };
}