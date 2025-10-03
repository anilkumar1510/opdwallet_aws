import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectClaimDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Documents are not authentic or incomplete',
  })
  @IsString()
  rejectionReason: string;

  @ApiProperty({
    description: 'Optional internal notes',
    required: false,
    example: 'Contacted provider for verification - failed',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
