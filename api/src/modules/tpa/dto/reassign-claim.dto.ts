import { IsMongoId, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReassignClaimDto {
  @ApiProperty({
    description: 'User ID of the new TPA user to assign the claim to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  assignedTo: string;

  @ApiProperty({
    description: 'Reason for reassignment',
    example: 'Previous assignee is on leave',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Additional notes or context for reassignment',
    example: 'Urgent claim requiring immediate attention',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
