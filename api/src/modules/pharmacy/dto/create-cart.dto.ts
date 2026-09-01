import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCartDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsOptional()
  @IsString()
  prescriptionFileName?: string;
}
