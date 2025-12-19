import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryDentalBookingsDto {
  @IsOptional()
  @IsString()
  serviceCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
