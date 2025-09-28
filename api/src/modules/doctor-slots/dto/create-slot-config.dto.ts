import { IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, IsOptional, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek, ConsultationType } from '../schemas/doctor-slot.schema';

export class CreateSlotConfigDto {
  @ApiProperty({ description: 'Doctor ID' })
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ description: 'Clinic ID' })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiProperty({ enum: DayOfWeek, description: 'Day of the week' })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek: string;

  @ApiProperty({ description: 'Start time in HH:mm format', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '17:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Slot duration in minutes', example: 30 })
  @IsNumber()
  @Min(10)
  @Max(120)
  slotDuration: number;

  @ApiProperty({ description: 'Consultation fee', example: 500 })
  @IsNumber()
  @Min(0)
  consultationFee: number;

  @ApiProperty({ enum: ConsultationType, description: 'Type of consultation' })
  @IsEnum(ConsultationType)
  @IsNotEmpty()
  consultationType: string;

  @ApiProperty({ description: 'Whether the slot is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Valid from date', required: false })
  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @ApiProperty({ description: 'Valid until date', required: false })
  @IsDateString()
  @IsOptional()
  validUntil?: Date;

  @ApiProperty({ description: 'List of blocked dates in YYYY-MM-DD format', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  blockedDates?: string[];

  @ApiProperty({ description: 'Maximum appointments per slot', default: 20 })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  maxAppointments?: number;
}