import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CancelDiagnosticPrescriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;
}
