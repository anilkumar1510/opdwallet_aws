import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { DoctorSlotsService } from './doctor-slots.service';
import { CreateSlotConfigDto } from './dto/create-slot-config.dto';
import { UpdateSlotConfigDto } from './dto/update-slot-config.dto';

@ApiTags('doctor-slots')
@Controller('doctor-slots')
@UseGuards(JwtAuthGuard)
export class DoctorSlotsController {
  constructor(private readonly slotsService: DoctorSlotsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new slot configuration' })
  async create(@Body() createSlotDto: CreateSlotConfigDto) {
    return this.slotsService.create(createSlotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all slot configurations' })
  async findAll(@Query() query: any) {
    return this.slotsService.findAll(query);
  }

  // Removed: Slots are now fetched via /api/doctors/:doctorId/slots endpoint

  @Get('clinic/:clinicId')
  @ApiOperation({ summary: 'Get slots by clinic ID' })
  async findByClinic(@Param('clinicId') clinicId: string) {
    return this.slotsService.findByClinic(clinicId);
  }

  // Removed: Doctor slots are now managed via /api/doctors/:doctorId/slots endpoint

  @Get(':slotId')
  @ApiOperation({ summary: 'Get a slot configuration by ID' })
  async findOne(@Param('slotId') slotId: string) {
    return this.slotsService.findOne(slotId);
  }

  @Get(':slotId/generate/:date')
  @ApiOperation({ summary: 'Generate time slots for a specific date' })
  async generateTimeSlots(
    @Param('slotId') slotId: string,
    @Param('date') date: string,
  ) {
    return this.slotsService.generateTimeSlots(slotId, date);
  }

  @Put(':slotId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a slot configuration' })
  async update(
    @Param('slotId') slotId: string,
    @Body() updateSlotDto: UpdateSlotConfigDto,
  ) {
    return this.slotsService.update(slotId, updateSlotDto);
  }

  @Patch(':slotId/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate a slot configuration' })
  async activate(@Param('slotId') slotId: string) {
    return this.slotsService.activate(slotId);
  }

  @Patch(':slotId/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a slot configuration' })
  async deactivate(@Param('slotId') slotId: string) {
    return this.slotsService.deactivate(slotId);
  }

  @Patch(':slotId/block-date')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Block a specific date for a slot configuration' })
  async blockDate(
    @Param('slotId') slotId: string,
    @Body('date') date: string,
  ) {
    return this.slotsService.blockDate(slotId, date);
  }

  @Patch(':slotId/unblock-date')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Unblock a specific date for a slot configuration' })
  async unblockDate(
    @Param('slotId') slotId: string,
    @Body('date') date: string,
  ) {
    return this.slotsService.unblockDate(slotId, date);
  }

  @Delete(':slotId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a slot configuration' })
  async remove(@Param('slotId') slotId: string) {
    return this.slotsService.remove(slotId);
  }
}