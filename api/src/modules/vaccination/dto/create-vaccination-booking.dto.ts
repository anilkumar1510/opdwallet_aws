import {
  IsString,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateVaccinationBookingDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  serviceCode: string;

  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @IsString()
  @IsNotEmpty()
  appointmentTime: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  vaccineType?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  dosesRequired?: number;

  @IsOptional()
  @IsBoolean()
  paymentAlreadyProcessed?: boolean;

  @IsOptional()
  @IsString()
  paymentId?: string;
}
