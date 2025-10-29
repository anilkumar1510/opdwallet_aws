import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, Length, Matches } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty()
  @IsEnum(['HOME', 'WORK', 'OTHER'])
  addressType!: string;

  @IsNotEmpty()
  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsString()
  city!: string;

  @IsNotEmpty()
  @IsString()
  state!: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Pincode must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'Pincode must contain only digits' })
  pincode!: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
