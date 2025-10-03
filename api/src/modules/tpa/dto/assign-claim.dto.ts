import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignClaimDto {
  @ApiProperty({
    description: 'User ID of the TPA user to assign the claim to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  assignedTo: string;

  @ApiProperty({
    description: 'Optional notes about the assignment',
    required: false,
    example: 'Assigned to senior reviewer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
