import { Controller, Get, UseGuards } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('relationships')
@Controller('relationships')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all active relationships' })
  @ApiResponse({ status: 200, description: 'Relationships retrieved successfully' })
  async findAll() {
    return this.relationshipsService.findAll();
  }
}