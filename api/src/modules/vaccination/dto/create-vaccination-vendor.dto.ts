import { IsNotEmpty, IsString, IsArray, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class VendorContactInfoDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}

export class CreateVaccinationVendorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => VendorContactInfoDto)
  contactInfo: VendorContactInfoDto;

  @IsArray()
  @IsString({ each: true })
  serviceablePincodes: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsObject()
  serviceAliases?: Record<string, string>;
}
