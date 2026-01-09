import { IsNotEmpty, IsString } from 'class-validator';

export class CancelAhcOrderDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
