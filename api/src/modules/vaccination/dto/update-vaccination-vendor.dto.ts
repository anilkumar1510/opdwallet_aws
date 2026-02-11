import { IsOptional, IsString, IsArray, ValidateNested, IsObject, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { VendorContactInfoDto } from './create-vaccination-vendor.dto';

export class UpdateVaccinationVendorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VendorContactInfoDto)
  contactInfo?: VendorContactInfoDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceablePincodes?: string[];

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
