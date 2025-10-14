import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { QueryClinicsDto } from './dto/query-clinics.dto';

@ApiTags('clinics')
@Controller('clinics')
@UseGuards(JwtAuthGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new clinic' })
  async create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicsService.create(createClinicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clinics' })
  async findAll(@Query() query: QueryClinicsDto) {
    return this.clinicsService.findAll(query);
  }

  @Get(':clinicId')
  @ApiOperation({ summary: 'Get a clinic by ID' })
  async findOne(@Param('clinicId') clinicId: string) {
    return this.clinicsService.findOne(clinicId);
  }

  @Put(':clinicId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a clinic' })
  async update(
    @Param('clinicId') clinicId: string,
    @Body() updateClinicDto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(clinicId, updateClinicDto);
  }

  @Patch(':clinicId/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate a clinic' })
  async activate(@Param('clinicId') clinicId: string) {
    return this.clinicsService.activate(clinicId);
  }

  @Patch(':clinicId/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a clinic' })
  async deactivate(@Param('clinicId') clinicId: string) {
    return this.clinicsService.deactivate(clinicId);
  }

  @Delete(':clinicId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a clinic' })
  async remove(@Param('clinicId') clinicId: string) {
    return this.clinicsService.remove(clinicId);
  }
}