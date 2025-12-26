import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { VisionServicesService } from './vision-services.service';
import { ToggleServiceDto } from './dto/vision-services.dto';
import { CreateVisionSlotDto } from './dto/vision-slot.dto';

@ApiTags('Operations - Vision Services')
@Controller('ops/vision-services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPS_ADMIN, UserRole.OPS_USER)
export class VisionServicesController {
  constructor(
    private readonly visionServicesService: VisionServicesService,
  ) {}

  @Get('clinics')
  @ApiOperation({
    summary: 'Get all clinics with vision service status',
    description:
      'Returns all active clinics with information about enabled vision services',
  })
  @ApiResponse({
    status: 200,
    description: 'List of clinics with service status',
  })
  async getAllClinics() {
    return this.visionServicesService.getAllClinicsWithServiceStatus();
  }

  @Put('clinics/:clinicId/toggle')
  @ApiOperation({
    summary: 'Toggle vision services enabled/disabled for a clinic',
    description:
      'Enable or disable vision services at the clinic level. Disabling will also disable all individual services.',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 200,
    description: 'Vision services toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async toggleClinicVisionServices(
    @Param('clinicId') clinicId: string,
    @Body() toggleDto: ToggleServiceDto,
    @Request() req: AuthRequest,
  ) {
    return this.visionServicesService.toggleClinicVisionServices(
      clinicId,
      toggleDto.isEnabled,
      req.user?.userId,
    );
  }

  @Get('clinics/:clinicId/services')
  @ApiOperation({
    summary: 'Get all vision services for a clinic (no pricing)',
    description:
      'Returns all vision services with their enabled status for the specified clinic. No pricing information included.',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of services with enabled status',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async getServicesForClinic(@Param('clinicId') clinicId: string) {
    return this.visionServicesService.getServicesForClinic(clinicId);
  }

  @Put('clinics/:clinicId/services/:serviceCode/toggle')
  @ApiOperation({
    summary: 'Toggle service enabled/disabled for a clinic',
    description: 'Enable or disable a vision service for a specific clinic',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiParam({
    name: 'serviceCode',
    description: 'Service code (e.g., VIS001)',
    example: 'VIS001',
  })
  @ApiResponse({
    status: 200,
    description: 'Service toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic or service not found',
  })
  async toggleService(
    @Param('clinicId') clinicId: string,
    @Param('serviceCode') serviceCode: string,
    @Body() toggleDto: ToggleServiceDto,
    @Request() req: AuthRequest,
  ) {
    return this.visionServicesService.toggleService(
      clinicId,
      serviceCode,
      toggleDto.isEnabled,
      req.user?.userId,
    );
  }

  @Post('clinics/:clinicId/slots')
  @ApiOperation({
    summary: 'Create vision service slots for a clinic',
    description:
      'Create time slots for vision services at a specific clinic. Supports creating slots for multiple dates at once.',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 201,
    description: 'Slots created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Vision services not enabled at clinic level or invalid dates',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async createVisionSlots(
    @Param('clinicId') clinicId: string,
    @Body() createDto: CreateVisionSlotDto,
    @Request() req: AuthRequest,
  ) {
    return this.visionServicesService.createVisionSlots(
      clinicId,
      createDto,
      req.user?.userId,
    );
  }

  @Get('clinics/:clinicId/slots')
  @ApiOperation({
    summary: 'Get all vision service slots for a clinic',
    description: 'Returns all time slots configured for vision services at a specific clinic',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vision service slots',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async getClinicSlots(@Param('clinicId') clinicId: string) {
    return this.visionServicesService.getClinicSlots(clinicId);
  }

  @Delete('slots/:slotId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a vision service slot',
    description: 'Remove a specific time slot for vision services',
  })
  @ApiParam({
    name: 'slotId',
    description: 'Slot ID (e.g., VSLOT1702648800001)',
    example: 'VSLOT1702648800001',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Slot not found',
  })
  async deleteSlot(@Param('slotId') slotId: string) {
    return this.visionServicesService.deleteSlot(slotId);
  }
}
