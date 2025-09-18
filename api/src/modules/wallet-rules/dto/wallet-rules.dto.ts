import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  IsEnum,
  ValidateNested,
  IsObject,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CopayMode } from '../schemas/wallet-rule.schema';

export class CopayDto {
  @IsEnum(CopayMode)
  mode: CopayMode;

  @IsNumber()
  @Min(0)
  value: number;
}

export class CarryForwardDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  months?: number;
}

export class UpdateWalletRulesDto {
  @IsNumber()
  @Min(0)
  totalAnnualAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perClaimLimit?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CopayDto)
  copay?: CopayDto;

  @IsOptional()
  @IsBoolean()
  partialPaymentEnabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CarryForwardDto)
  carryForward?: CarryForwardDto;

  @IsOptional()
  @IsBoolean()
  topUpAllowed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}