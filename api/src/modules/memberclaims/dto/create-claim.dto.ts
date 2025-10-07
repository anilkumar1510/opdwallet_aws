import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimType, ClaimCategory } from '../schemas/memberclaim.schema';

class DocumentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  @Min(0)
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsEnum(['INVOICE', 'PRESCRIPTION', 'REPORT', 'DISCHARGE_SUMMARY', 'OTHER'])
  documentType: string;
}

export class CreateClaimDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(ClaimType)
  @IsNotEmpty()
  claimType: ClaimType;

  @IsEnum(ClaimCategory)
  @IsNotEmpty()
  category: ClaimCategory;

  @IsDateString()
  @IsNotEmpty()
  treatmentDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerName: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  providerLocation?: string;

  @IsNumber()
  @Min(0)
  billAmount: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  billNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  treatmentDescription?: string;

  @IsString()
  @IsOptional()
  patientName?: string;

  @IsString()
  @IsOptional()
  relationToMember?: string;

  @IsString()
  @IsOptional()
  memberCardNumber?: string;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresPreAuth?: boolean;

  @IsString()
  @IsOptional()
  preAuthNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  @IsOptional()
  documents?: DocumentDto[];
}