import { IsString, IsNotEmpty } from 'class-validator';

export class AdminCancelBookingDto {
  @IsString()
  @IsNotEmpty()
  reason: string; // Cancellation reason
}
