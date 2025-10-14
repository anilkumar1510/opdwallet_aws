import { IsMongoId, IsNotEmpty } from 'class-validator';

export class StartConsultationDto {
  @IsMongoId()
  @IsNotEmpty()
  appointmentId: string;
}
