import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClaimStatus } from '@/modules/memberclaims/schemas/memberclaim.schema';

export class UpdateClaimStatusDto {
  @ApiProperty({
    description: 'New status for the claim',
    enum: ClaimStatus,
    example: ClaimStatus.UNDER_REVIEW,
  })
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @ApiProperty({
    description: 'Optional notes about the status change',
    required: false,
    example: 'Moving to under review',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
