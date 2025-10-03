import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePricingDto {
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  homeCollectionCharges?: number;
}
