import { IsNumber, IsString, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveClaimDto {
  @ApiProperty({
    description: 'Approved amount for the claim',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  approvedAmount: number;

  @ApiProperty({
    description: 'Reason for approval or partial approval',
    example: 'All documents verified and claim is valid',
  })
  @IsString()
  approvalReason: string;

  @ApiProperty({
    description: 'Whether this is a partial approval',
    example: false,
    default: false,
  })
  @IsBoolean()
  isPartial: boolean;

  @ApiProperty({
    description: 'Optional internal notes',
    required: false,
    example: 'Approved after verification with provider',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
