import { PartialType } from '@nestjs/swagger';
import { CreateSlotConfigDto } from './create-slot-config.dto';

export class UpdateSlotConfigDto extends PartialType(CreateSlotConfigDto) {}