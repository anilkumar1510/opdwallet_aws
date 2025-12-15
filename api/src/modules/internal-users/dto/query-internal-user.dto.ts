import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/common/constants/roles.enum';
import { UserStatus } from '@/common/constants/status.enum';

/**
 * DTO for querying internal users with pagination and filtering
 */
export class QueryInternalUserDto {
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
    description: 'Search term (searches in name, email, employeeId)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.TPA,
      UserRole.TPA_ADMIN,
      UserRole.TPA_USER,
      UserRole.FINANCE_USER,
      UserRole.OPS,
    ],
  })
  @IsOptional()
  @IsEnum([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TPA,
    UserRole.TPA_ADMIN,
    UserRole.TPA_USER,
    UserRole.FINANCE_USER,
    UserRole.OPS,
  ])
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filter by department',
    example: 'Finance',
  })
  @IsOptional()
  @IsString()
  department?: string;
}
