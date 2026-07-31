import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AutoAssignStrategy {
  /** Level the queue: each claim goes to whoever has the fewest open claims right now. */
  BALANCED = 'BALANCED',
  /** Ignore existing workload and split this batch evenly across the selected users. */
  ROUND_ROBIN = 'ROUND_ROBIN',
}

export class AutoAssignClaimsDto {
  @ApiProperty({
    description: 'User IDs of the TPA users marked available to receive claims',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  assigneeIds: string[];

  @ApiProperty({
    description:
      'Business claim IDs to distribute. Omit to distribute every unassigned claim (up to maxClaims).',
    type: [String],
    required: false,
    example: ['CLM202607310001', 'CLM202607310002'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  claimIds?: string[];

  @ApiProperty({
    description: 'Distribution strategy',
    enum: AutoAssignStrategy,
    required: false,
    default: AutoAssignStrategy.BALANCED,
  })
  @IsOptional()
  @IsEnum(AutoAssignStrategy)
  strategy?: AutoAssignStrategy;

  @ApiProperty({
    description: 'Optional notes recorded on every assignment in this batch',
    required: false,
    example: 'Auto-assigned - month end backlog',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Safety cap on how many claims a single run may assign',
    required: false,
    default: 200,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxClaims?: number;
}
