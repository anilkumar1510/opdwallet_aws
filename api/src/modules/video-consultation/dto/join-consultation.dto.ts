import { IsMongoId, IsNotEmpty } from 'class-validator';

export class JoinConsultationDto {
  @IsMongoId()
  @IsNotEmpty()
  appointmentId: string;
}
