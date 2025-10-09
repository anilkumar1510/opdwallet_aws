import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopupWalletDto {
  @ApiProperty({ description: 'Amount to top-up', example: 5000 })
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Category code for top-up', example: 'CAT001' })
  @IsString()
  @IsNotEmpty()
  categoryCode: string;

  @ApiProperty({ description: 'Notes for the top-up transaction', example: 'Emergency medical expenses top-up' })
  @IsString()
  @IsNotEmpty()
  notes: string;
}
