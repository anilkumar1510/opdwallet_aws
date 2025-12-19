import { IsOptional, IsString, IsDateString, IsNumber, Min } from 'class-validator';

export class AdminQueryBookingsDto {
  @IsOptional()
  @IsString()
  status?: string; // PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsString()
  serviceCode?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  dateTo?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  searchTerm?: string; // Search by patient name, booking ID, etc.

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
