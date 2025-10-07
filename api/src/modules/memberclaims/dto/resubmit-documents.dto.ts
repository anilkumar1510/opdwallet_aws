import { IsArray, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DocumentResubmissionDto {
  @ApiProperty({ example: 'invoice.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: '/uploads/claims/invoice-123.pdf' })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({ example: 'Medical Invoice' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: 'Updated invoice with correct details', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ResubmitDocumentsDto {
  @ApiProperty({ type: [DocumentResubmissionDto] })
  @IsArray()
  @IsNotEmpty()
  documents: DocumentResubmissionDto[];

  @ApiProperty({ example: 'Resubmitting requested documents', required: false })
  @IsOptional()
  @IsString()
  resubmissionNotes?: string;
}
