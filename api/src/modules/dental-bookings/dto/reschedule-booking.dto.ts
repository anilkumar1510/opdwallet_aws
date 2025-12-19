import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleBookingDto {
  @IsString()
  @IsNotEmpty()
  slotId: string; // New slot ID

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string; // New date (YYYY-MM-DD)

  @IsString()
  @IsNotEmpty()
  appointmentTime: string; // New time (HH:mm)

  @IsString()
  @IsNotEmpty()
  reason: string; // Reason for reschedule
}
