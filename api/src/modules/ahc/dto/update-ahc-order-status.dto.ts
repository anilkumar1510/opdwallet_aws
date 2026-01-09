import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { AhcOrderStatus } from '../schemas/ahc-order.schema';

export class UpdateAhcOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(AhcOrderStatus)
  status: AhcOrderStatus;

  @IsOptional()
  @IsString()
  confirmedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
