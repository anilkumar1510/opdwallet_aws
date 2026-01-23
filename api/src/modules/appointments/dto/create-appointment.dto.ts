import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AppointmentType, CallPreference } from '../schemas/appointment.schema';

export class CreateAppointmentDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNotEmpty()
  @IsString()
  patientName: string;

  @IsNotEmpty()
  @IsString()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsNotEmpty()
  @IsString()
  slotId: string;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @IsNotEmpty()
  @IsEnum(AppointmentType)
  appointmentType: string;

  @IsNotEmpty()
  @IsString()
  appointmentDate: string;

  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @IsOptional()
  @IsNumber()
  consultationFee?: number;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsEnum(CallPreference)
  callPreference?: string;

  @IsOptional()
  @IsBoolean()
  useWallet?: boolean = true;

  @IsOptional()
  @IsString()
  transactionId?: string;
}