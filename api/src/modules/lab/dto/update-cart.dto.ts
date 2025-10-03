import { IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCartItemDto } from './create-cart.dto';
import { CartStatus } from '../schemas/lab-cart.schema';

export class UpdateCartDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCartItemDto)
  items?: CreateCartItemDto[];

  @IsOptional()
  @IsEnum(CartStatus)
  status?: CartStatus;
}
