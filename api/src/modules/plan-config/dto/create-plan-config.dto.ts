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
  @IsObject()
  policyDescription?: {
    inclusions?: Array<{ headline: string; description: string }>;
    exclusions?: Array<{ headline: string; description: string }>;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coveredRelationships?: string[];

  @IsOptional()
  @IsObject()
  memberConfigs?: { [relationshipCode: string]: any };
}