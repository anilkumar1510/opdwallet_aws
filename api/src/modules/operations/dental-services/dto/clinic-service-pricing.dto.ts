import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ToggleServiceDto {
  @ApiProperty({
    description: 'Whether the service is enabled for this clinic',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;
}

export class UpdatePriceDto {
  @ApiProperty({
    description: 'Price for the service at this clinic',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @ApiPropertyOptional({
    description: 'Date from which this price is effective',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({
    description: 'Date until which this price is effective',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class BulkUpdateServiceDto {
  @ApiProperty({
    description: 'Service code',
    example: 'DEN001',
  })
  @IsString()
  serviceCode: string;

  @ApiProperty({
    description: 'Whether the service is enabled',
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Price for the service',
    example: 1500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class BulkUpdateServicesDto {
  @ApiProperty({
    description: 'Array of services to update',
    type: [BulkUpdateServiceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateServiceDto)
  services: BulkUpdateServiceDto[];
}
