import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/**
 * The only change a member can make to their cart: a smaller number.
 *
 * Was `AddCartItemDto`, back when the member built the cart themselves. Zero is
 * allowed and means take the line out — the service treats it that way, and
 * `Min(1)` here was quietly rejecting the last step down. Anything at or above
 * the current quantity is refused by the service, not here, because only it
 * knows what that quantity is.
 */
export class ReduceCartItemDto {
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @IsInt()
  @Min(0)
  quantity: number;
}
