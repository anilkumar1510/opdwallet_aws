import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class UploadDiagnosticPrescriptionDto {
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  patientName: string;

  @IsNotEmpty()
  @IsString()
  patientRelationship: string; // SELF, SPOUSE, SON, DAUGHTER, FATHER, MOTHER

  @IsNotEmpty()
  @IsDateString()
  prescriptionDate: string; // ISO date string

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsNotEmpty()
  @IsString()
  pincode: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
