import { PartialType } from '@nestjs/mapped-types';
import { CreateClaimDto } from './create-claim.dto';
import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ClaimStatus, PaymentStatus } from '../schemas/memberclaim.schema';

export class UpdateClaimDto extends PartialType(CreateClaimDto) {
  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;

  @IsNumber()
  @IsOptional()
  approvedAmount?: number;

  @IsNumber()
  @IsOptional()
  copayAmount?: number;

  @IsNumber()
  @IsOptional()
  deductibleAmount?: number;

  @IsNumber()
  @IsOptional()
  reimbursableAmount?: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  reviewComments?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;
}