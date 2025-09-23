import { IsOptional, IsObject, IsArray, IsString } from 'class-validator';

export class UpdatePlanConfigDto {
  @IsOptional()
  @IsObject()
  benefits?: any;

  @IsOptional()
  @IsObject()
  wallet?: any;

  @IsOptional()
  @IsObject()
  enabledServices?: { [serviceCode: string]: { enabled: boolean } };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coveredRelationships?: string[];

  @IsOptional()
  @IsObject()
  memberConfigs?: { [relationshipCode: string]: any };
}