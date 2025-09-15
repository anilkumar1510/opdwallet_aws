import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/common/constants/roles.enum';
import { UserStatus } from '@/common/constants/status.enum';

export class QueryUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  limit?: string;
}