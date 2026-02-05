import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, ValidateNested, ArrayMinSize, IsEmail, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

class ClinicLocationDto {
  @IsString()
  clinicId: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  location?: {
    latitude: number;
    longitude: number;
  };

  @IsNumber()
  consultationFee: number;
}

class TimeSlotDto {
  @IsString()
  date: string;

  @IsArray()
  @IsString({ each: true })
  slots: string[];
}

export class CreateDoctorDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsString()
  qualifications: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  specializations: string[];

  @IsString()
  specialtyId: string;

  @IsString()
  specialty: string;

  @IsNumber()
  experienceYears: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicLocationDto)
  @ArrayMinSize(1)
  clinics: ClinicLocationDto[];

  @IsNumber()
  consultationFee: number;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  availableSlots?: TimeSlotDto[];

  @IsOptional()
  @IsBoolean()
  availableOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  availableOffline?: boolean;
}