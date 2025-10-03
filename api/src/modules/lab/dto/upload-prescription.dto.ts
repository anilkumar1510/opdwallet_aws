import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UploadPrescriptionDto {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
