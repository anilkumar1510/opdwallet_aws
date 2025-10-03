import { IsMongoId, IsString } from 'class-validator';
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
}
