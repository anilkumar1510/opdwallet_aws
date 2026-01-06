import { IsString, IsNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class DiagnosticVendorContactInfoDto {
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

class EquipmentCapabilitiesDto {
  @IsOptional()
  @IsBoolean()
  ctScan?: boolean;

  @IsOptional()
  @IsBoolean()
  mri?: boolean;

  @IsOptional()
  @IsBoolean()
  xRay?: boolean;

  @IsOptional()
  @IsBoolean()
  ultrasound?: boolean;

  @IsOptional()
  @IsBoolean()
  ecg?: boolean;

  @IsOptional()
  @IsBoolean()
  echo?: boolean;

  @IsOptional()
  @IsBoolean()
  mammography?: boolean;

  @IsOptional()
  @IsBoolean()
  petScan?: boolean;

  @IsOptional()
  @IsBoolean()
  boneDensity?: boolean;
}

export class CreateDiagnosticVendorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DiagnosticVendorContactInfoDto)
  contactInfo: DiagnosticVendorContactInfoDto;

  @IsArray()
  @IsString({ each: true })
  serviceablePincodes: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EquipmentCapabilitiesDto)
  equipmentCapabilities?: EquipmentCapabilitiesDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

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
  @IsString()
  labVendorId?: string;

  @IsOptional()
  @IsObject()
  serviceAliases?: Record<string, string>;
}
