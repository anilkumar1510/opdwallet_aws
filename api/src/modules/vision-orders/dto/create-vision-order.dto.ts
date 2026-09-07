import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { VisionPurchaseMode } from '../schemas/vision-order.schema';

export class CreateVisionOrderDto {
  @ApiProperty({ example: '6a34c98e4e45325c5a7c06b5', description: 'Who the spectacles are for' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'Shivam Jain' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ example: 'VIS-PTR-LENSKART' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ enum: VisionPurchaseMode, example: VisionPurchaseMode.ONLINE })
  @IsEnum(VisionPurchaseMode)
  mode: VisionPurchaseMode;

  @ApiProperty({ example: 4200, required: false, description: 'What the order comes to' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderValue?: number;
}
