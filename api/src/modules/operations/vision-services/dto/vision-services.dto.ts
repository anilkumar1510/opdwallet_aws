import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleServiceDto {
  @ApiProperty({
    description: 'Whether the service is enabled for this clinic',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;
}
