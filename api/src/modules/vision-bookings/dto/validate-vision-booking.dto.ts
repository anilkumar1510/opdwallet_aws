import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ValidateVisionBookingDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @IsString()
  @IsNotEmpty()
  serviceCode: string;

  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsNumber()
  @Min(0)
  price: number;
}
