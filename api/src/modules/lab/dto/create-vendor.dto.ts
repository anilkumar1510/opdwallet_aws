import { IsNotEmpty, IsString, IsBoolean, IsArray, IsOptional, ValidateNested, IsNumber, Min } from 'class-validator';
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

export class CreateVendorDto {
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
  @IsBoolean()
  homeCollection?: boolean;

  @IsOptional()
  @IsBoolean()
  centerVisit?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  homeCollectionCharges?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}
