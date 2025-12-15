import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInternalUserDto } from './create-internal-user.dto';

/**
 * DTO for updating an internal user
 * All fields are optional, cannot update employeeId
 */
export class UpdateInternalUserDto extends PartialType(
  OmitType(CreateInternalUserDto, ['employeeId'] as const),
) {}
