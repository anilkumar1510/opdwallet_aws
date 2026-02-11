import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleVaccinationBookingDto {
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @IsString()
  @IsNotEmpty()
  appointmentTime: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
