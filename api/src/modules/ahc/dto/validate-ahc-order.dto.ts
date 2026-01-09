import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsObject,
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

export class ValidateAhcOrderDto {
  @IsNotEmpty()
  @IsString()
  packageId: string;

  // Lab portion
  @IsNotEmpty()
  @IsString()
  labVendorId: string;

  @IsNotEmpty()
  @IsString()
  labSlotId: string;

  @IsNotEmpty()
  @IsEnum(CollectionType)
  labCollectionType: CollectionType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CollectionAddressDto)
  labCollectionAddress?: CollectionAddressDto;

  @IsNotEmpty()
  @IsString()
  labCollectionDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  labCollectionTime: string; // "09:00 AM - 10:00 AM"

  // Diagnostic portion
  @IsNotEmpty()
  @IsString()
  diagnosticVendorId: string;

  @IsNotEmpty()
  @IsString()
  diagnosticSlotId: string;

  @IsNotEmpty()
  @IsString()
  diagnosticAppointmentDate: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  diagnosticAppointmentTime: string; // "09:00 AM - 10:00 AM"
}
