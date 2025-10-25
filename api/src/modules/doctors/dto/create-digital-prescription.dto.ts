import { IsString, IsOptional, IsArray, ValidateNested, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class MedicineItemDto {
  @IsString()
  medicineName: string;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsString()
  dosage: string;

  @IsString()
  frequency: string;

  @IsString()
  duration: string;

  @IsString()
  route: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class LabTestItemDto {
  @IsString()
  testName: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateDigitalPrescriptionDto {
  @IsString()
  appointmentId: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  clinicalFindings?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines?: MedicineItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestItemDto)
  labTests?: LabTestItemDto[];

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  followUpInstructions?: string;

  @IsOptional()
  @IsString()
  generalInstructions?: string;

  @IsOptional()
  @IsString()
  precautions?: string;

  @IsOptional()
  @IsString()
  dietaryAdvice?: string;
}

export class UpdateDigitalPrescriptionDto {
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  clinicalFindings?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines?: MedicineItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestItemDto)
  labTests?: LabTestItemDto[];

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  followUpInstructions?: string;

  @IsOptional()
  @IsString()
  generalInstructions?: string;

  @IsOptional()
  @IsString()
  precautions?: string;

  @IsOptional()
  @IsString()
  dietaryAdvice?: string;
}
