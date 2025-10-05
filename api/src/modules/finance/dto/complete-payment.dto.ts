import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentMode {
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  CHEQUE = 'CHEQUE',
  CASH = 'CASH',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  IMPS = 'IMPS',
}

export class CompletePaymentDto {
  @ApiProperty({
    description: 'Payment mode used',
    enum: PaymentMode,
    example: PaymentMode.BANK_TRANSFER,
  })
  @IsEnum(PaymentMode)
  @IsNotEmpty()
  paymentMode: PaymentMode;

  @ApiProperty({
    description: 'Payment reference number or transaction ID',
    example: 'TXN123456789',
  })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @ApiProperty({
    description: 'Amount paid (should match approved amount)',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amountPaid: number;

  @ApiProperty({
    description: 'Payment date',
    example: '2025-10-03',
  })
  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiProperty({
    description: 'Optional notes about the payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentNotes?: string;
}
