import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';

/**
 * DTO for updating a member
 * All fields are optional, cannot update uhid and memberId
 */
export class UpdateMemberDto extends PartialType(
  OmitType(CreateMemberDto, ['uhid', 'memberId'] as const),
) {}
