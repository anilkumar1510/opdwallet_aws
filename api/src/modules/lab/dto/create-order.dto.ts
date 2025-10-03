import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CollectionType } from '../schemas/lab-order.schema';

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

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  cartId: string;

  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @IsNotEmpty()
  @IsEnum(CollectionType)
  collectionType: CollectionType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CollectionAddressDto)
  collectionAddress?: CollectionAddressDto;

  @IsOptional()
  @IsString()
  collectionDate?: string;

  @IsOptional()
  @IsString()
  collectionTime?: string;

  @IsOptional()
  @IsString()
  slotId?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  homeCollectionCharges?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
