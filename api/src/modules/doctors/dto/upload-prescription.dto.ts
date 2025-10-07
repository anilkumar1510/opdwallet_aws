import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class UploadPrescriptionDto {
  @IsMongoId()
  @IsNotEmpty()
  appointmentId: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
