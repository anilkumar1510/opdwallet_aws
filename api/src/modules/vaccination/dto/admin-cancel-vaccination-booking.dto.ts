import { IsString, IsNotEmpty } from 'class-validator';

export class AdminCancelVaccinationBookingDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
