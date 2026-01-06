import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum PrescriptionType {
  DIGITAL = 'DIGITAL',
  PDF = 'PDF',
}

export class SubmitExistingDiagnosticPrescriptionDto {
  @IsString()
  @IsNotEmpty()
  healthRecordId: string;

  @IsEnum(PrescriptionType)
  @IsNotEmpty()
  prescriptionType: PrescriptionType;

  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsString()
  @IsNotEmpty()
  patientRelationship: string;

  @IsString()
  @IsOptional()
  pincode: string;

  @IsDateString()
  @IsNotEmpty()
  prescriptionDate: string;
}
