import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class EndConsultationDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  followUpRequired?: boolean;

  @IsNumber()
  @IsOptional()
  followUpDays?: number;

  @IsString()
  @IsOptional()
  endedBy?: string;
}
