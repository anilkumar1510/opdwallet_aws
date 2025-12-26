import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateRelationshipMasterDto, UpdateRelationshipMasterDto } from './dto/relationship-master.dto';

@ApiTags('relationships')
@Controller('relationships')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPS_ADMIN, UserRole.OPS_USER)
  @ApiOperation({ summary: 'Get all active relationships' })
  @ApiResponse({ status: 200, description: 'Relationships retrieved successfully' })
  async findAll() {
    return this.relationshipsService.findAll();
  }

  @Get('all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all relationships including inactive' })
  @ApiResponse({ status: 200, description: 'All relationships retrieved successfully' })
  async findAllIncludingInactive() {
    return this.relationshipsService.findAllIncludingInactive();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get relationship by ID' })
  @ApiResponse({ status: 200, description: 'Relationship retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async findById(@Param('id') id: string) {
    return this.relationshipsService.findById(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new relationship' })
  @ApiResponse({ status: 201, description: 'Relationship created successfully' })
  @ApiResponse({ status: 409, description: 'Relationship code already exists' })
  async create(
    @Body() createDto: CreateRelationshipMasterDto,
    @Request() req: any,
  ) {
    return this.relationshipsService.create(createDto, req.user?.userId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update relationship' })
  @ApiResponse({ status: 200, description: 'Relationship updated successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRelationshipMasterDto,
    @Request() req: any,
  ) {
    return this.relationshipsService.update(id, updateDto, req.user?.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete relationship' })
  @ApiResponse({ status: 200, description: 'Relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async delete(@Param('id') id: string) {
    return this.relationshipsService.delete(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle relationship active status' })
  @ApiResponse({ status: 200, description: 'Relationship status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  async toggleActive(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.relationshipsService.toggleActive(id, req.user?.userId);
  }
}