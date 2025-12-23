import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  Min,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateVisionSlotDto {
  @ApiProperty({
    description: 'Clinic ID',
    example: 'CLN001',
  })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiProperty({
    description: 'Array of dates in YYYY-MM-DD format',
    example: ['2024-01-15', '2024-01-16', '2024-01-17'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    each: true,
    message: 'Each date must be in YYYY-MM-DD format',
  })
  dates: string[];

  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '17:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime: string;

  @ApiProperty({
    description: 'Slot duration in minutes',
    example: 30,
    default: 30,
  })
  @IsNumber()
  @Min(15)
  @IsOptional()
  slotDuration?: number;

  @ApiProperty({
    description: 'Maximum appointments per time slot',
    example: 10,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxAppointments?: number;
}

export class UpdateVisionSlotDto {
  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '09:00',
  })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime?: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '17:00',
  })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Slot duration in minutes',
    example: 30,
  })
  @IsNumber()
  @Min(15)
  @IsOptional()
  slotDuration?: number;

  @ApiProperty({
    description: 'Maximum appointments per time slot',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxAppointments?: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}
