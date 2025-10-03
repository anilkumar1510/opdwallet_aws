import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestDocumentsDto {
  @ApiProperty({
    description: 'Reason why additional documents are required',
    example: 'Original invoice is missing or unclear',
  })
  @IsString()
  documentsRequiredReason: string;

  @ApiProperty({
    description: 'List of required documents',
    example: ['Original Invoice', 'Prescription Copy', 'Lab Report'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  requiredDocuments: string[];

  @ApiProperty({
    description: 'Optional internal notes',
    required: false,
    example: 'Member to provide scanned copies within 7 days',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
