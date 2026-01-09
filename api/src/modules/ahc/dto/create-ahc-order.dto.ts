import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionType } from '../schemas/ahc-order.schema';

export class CollectionAddressDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsString()
  pincode: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;
}

export class CreateAhcOrderDto {
  @IsNotEmpty()
  @IsString()
  packageId: string;

  // Lab portion (optional - package may not have lab tests)
  @IsOptional()
  @IsString()
  labVendorId?: string;

  @IsOptional()
  @IsString()
  labSlotId?: string;

  @IsOptional()
  @IsEnum(CollectionType)
  labCollectionType?: CollectionType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CollectionAddressDto)
  labCollectionAddress?: CollectionAddressDto;

  @IsOptional()
  @IsString()
  labCollectionDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  labCollectionTime?: string; // "09:00 AM - 10:00 AM"

  // Diagnostic portion (optional - package may not have diagnostic tests)
  @IsOptional()
  @IsString()
  diagnosticVendorId?: string;

  @IsOptional()
  @IsString()
  diagnosticSlotId?: string;

  @IsOptional()
  @IsString()
  diagnosticAppointmentDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  diagnosticAppointmentTime?: string; // "09:00 AM - 10:00 AM"

  // Payment flag
  @IsOptional()
  @IsBoolean()
  paymentAlreadyProcessed?: boolean; // True if payment was already handled by PaymentProcessor
}
