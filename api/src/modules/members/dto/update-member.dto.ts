import { PartialType, OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';
import { CreateMemberDto } from './create-member.dto';

/**
 * DTO for updating a member
 * All fields are optional, cannot update uhid and memberId (system-assigned)
 * Note: role field doesn't exist in CreateMemberDto - members are auto-assigned MEMBER role
 * Frontend is responsible for not sending role, memberId, or uhid in update requests
 */
export class UpdateMemberDto extends PartialType(
  OmitType(CreateMemberDto, ['uhid', 'memberId'] as const),
) {
  @ApiProperty({
    description: 'New password for the member (optional)',
    example: 'NewSecurePassword123',
    minLength: 8,
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;
}
