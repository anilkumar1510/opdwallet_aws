import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ValidateDiagnosticOrderDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  cartId: string;

  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;
}
