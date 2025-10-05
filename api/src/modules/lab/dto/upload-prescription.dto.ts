import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UploadPrescriptionDto {
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  patientName: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
