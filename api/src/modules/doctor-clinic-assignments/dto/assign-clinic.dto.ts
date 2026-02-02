import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AssignClinicDto {
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @IsNotEmpty()
  @IsString()
  clinicId: string;

  @IsString()
  @IsOptional()
  assignedBy?: string;
}

export class SyncClinicsDto {
  @IsNotEmpty()
  clinicIds: string[];

  @IsString()
  @IsOptional()
  assignedBy?: string;
}
