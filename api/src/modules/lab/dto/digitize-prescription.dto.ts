import { IsNotEmpty, IsString, IsArray, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionStatus } from '../schemas/lab-prescription.schema';

export class CartItemDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsNotEmpty()
  @IsString()
  serviceName: string;

  @IsNotEmpty()
  @IsString()
  serviceCode: string;

  @IsNotEmpty()
  @IsString()
  category: string;
}

export class DigitizePrescriptionDto {
  @IsNotEmpty()
  @IsString()
  prescriptionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsEnum(PrescriptionStatus)
  status: PrescriptionStatus;

  @IsOptional()
  @IsString()
  delayReason?: string;
}
