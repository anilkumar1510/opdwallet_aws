import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryVisionBookingsDto {
  @IsOptional()
  @IsString()
  serviceCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
