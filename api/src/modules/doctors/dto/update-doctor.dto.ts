import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsEmail } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsString()
  specialtyId?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @IsOptional()
  @IsNumber()
  consultationFee?: number;

  @IsOptional()
  @IsBoolean()
  cashlessAvailable?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  insuranceAccepted?: string[];

  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDirectBooking?: boolean;

  @IsOptional()
  @IsBoolean()
  availableOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  availableOffline?: boolean;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}