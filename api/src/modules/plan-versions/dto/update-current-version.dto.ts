import {
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCurrentVersionDto {
  @ApiProperty({
    description: 'Plan version number to make current',
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  planVersion: number;
}