import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class GenerateBillDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  servicePrice: number; // The actual cost entered by admin
}
