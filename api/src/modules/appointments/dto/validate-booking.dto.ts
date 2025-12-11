import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { AppointmentType } from '../schemas/appointment.schema';

export class ValidateBookingDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsNotEmpty()
  @IsNumber()
  consultationFee: number;

  @IsNotEmpty()
  @IsEnum(AppointmentType)
  appointmentType: string;
}
