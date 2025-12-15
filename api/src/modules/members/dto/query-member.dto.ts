import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@/common/constants/status.enum';

/**
 * DTO for querying members with pagination and filtering
 */
export class QueryMemberDto {
  @ApiPropertyOptional({
    description: 'Page number (default: 1)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of results per page (default: 10)',
    example: '10',
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Search term (searches in name, email, uhid, memberId)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by member status',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filter by relationship',
    example: 'REL001',
  })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional({
    description: 'Filter by primary member ID (to get all dependents)',
    example: 'MEM-0001',
  })
  @IsOptional()
  @IsString()
  primaryMemberId?: string;

  @ApiPropertyOptional({
    description: 'Filter by CUG ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  cugId?: string;
}
