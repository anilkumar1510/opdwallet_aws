import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class CreateVaccinationPricingDto {
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  actualPrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountedPrice: number;
}
