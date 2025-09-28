import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { AppointmentType } from '../schemas/appointment.schema';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  patientName: string;

  @IsNotEmpty()
  @IsString()
  patientId: string;

  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsNotEmpty()
  @IsString()
  doctorName: string;

  @IsNotEmpty()
  @IsString()
  specialty: string;

  @IsNotEmpty()
  @IsString()
  clinicId: string;

  @IsNotEmpty()
  @IsString()
  clinicName: string;

  @IsNotEmpty()
  @IsString()
  clinicAddress: string;

  @IsNotEmpty()
  @IsEnum(AppointmentType)
  appointmentType: string;

  @IsNotEmpty()
  @IsString()
  appointmentDate: string;

  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @IsNotEmpty()
  @IsNumber()
  consultationFee: number;
}