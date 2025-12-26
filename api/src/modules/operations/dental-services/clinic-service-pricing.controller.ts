import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { ClinicServicePricingService } from './clinic-service-pricing.service';
import {
  ToggleServiceDto,
  UpdatePriceDto,
  BulkUpdateServicesDto,
} from './dto/clinic-service-pricing.dto';
import { CreateDentalSlotDto } from './dto/dental-slot.dto';

@ApiTags('Operations - Dental Services')
@Controller('ops/dental-services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPS_ADMIN, UserRole.OPS_USER)
export class ClinicServicePricingController {
  constructor(
    private readonly clinicServicePricingService: ClinicServicePricingService,
  ) {}

  @Get('clinics')
  @ApiOperation({
    summary: 'Get all clinics with dental service status',
    description:
      'Returns all active clinics with information about enabled dental services',
  })
  @ApiResponse({
    status: 200,
    description: 'List of clinics with service status',
  })
  async getAllClinics() {
    return this.clinicServicePricingService.getAllClinicsWithServiceStatus();
  }

  @Put('clinics/:clinicId/toggle')
  @ApiOperation({
    summary: 'Toggle dental services enabled/disabled for a clinic',
    description:
      'Enable or disable dental services at the clinic level. Disabling will also disable all individual services.',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 200,
    description: 'Dental services toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async toggleClinicDentalServices(
    @Param('clinicId') clinicId: string,
    @Body() toggleDto: ToggleServiceDto,
    @Request() req: AuthRequest,
  ) {
    return this.clinicServicePricingService.toggleClinicDentalServices(
      clinicId,
      toggleDto.isEnabled,
      req.user?.userId,
    );
  }

  @Get('clinics/:clinicId/services')
  @ApiOperation({
    summary: 'Get all dental services for a clinic with pricing',
    description:
      'Returns all dental services with their pricing and enabled status for the specified clinic',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of services with pricing info',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async getServicesForClinic(@Param('clinicId') clinicId: string) {
    return this.clinicServicePricingService.getServicesForClinic(clinicId);
  }

  @Put('clinics/:clinicId/services/:serviceCode/toggle')
  @ApiOperation({
    summary: 'Toggle service enabled/disabled for a clinic',
    description: 'Enable or disable a dental service for a specific clinic',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiParam({
    name: 'serviceCode',
    description: 'Service code (e.g., DEN001)',
    example: 'DEN001',
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
    return this.clinicServicePricingService.toggleService(
      clinicId,
      serviceCode,
      toggleDto.isEnabled,
      req.user?.userId,
    );
  }

  @Patch('clinics/:clinicId/services/:serviceCode/price')
  @ApiOperation({
    summary: 'Update price for a service at a clinic',
    description:
      'Update the pricing for a dental service at a specific clinic. Service must be enabled first.',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiParam({
    name: 'serviceCode',
    description: 'Service code (e.g., DEN001)',
    example: 'DEN001',
  })
  @ApiResponse({
    status: 200,
    description: 'Price updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Service not enabled or invalid price',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic or service not found',
  })
  async updatePrice(
    @Param('clinicId') clinicId: string,
    @Param('serviceCode') serviceCode: string,
    @Body() updatePriceDto: UpdatePriceDto,
    @Request() req: AuthRequest,
  ) {
    return this.clinicServicePricingService.updatePrice(
      clinicId,
      serviceCode,
      updatePriceDto,
      req.user?.userId,
    );
  }

  @Put('clinics/:clinicId/services/bulk')
  @ApiOperation({
    summary: 'Bulk update services for a clinic',
    description:
      'Enable/disable multiple services and optionally set their prices in a single request',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 200,
    description: 'Services updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async bulkUpdateServices(
    @Param('clinicId') clinicId: string,
    @Body() bulkUpdateDto: BulkUpdateServicesDto,
    @Request() req: AuthRequest,
  ) {
    return this.clinicServicePricingService.bulkUpdateServices(
      clinicId,
      bulkUpdateDto,
      req.user?.userId,
    );
  }

  @Get('clinics/:clinicId/services/:serviceCode/pricing')
  @ApiOperation({
    summary: 'Get pricing details for a specific service at a clinic',
    description: 'Returns detailed pricing information for a service at a clinic',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiParam({
    name: 'serviceCode',
    description: 'Service code (e.g., DEN001)',
    example: 'DEN001',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing details',
  })
  @ApiResponse({
    status: 404,
    description: 'Pricing not found',
  })
  async getPricingDetails(
    @Param('clinicId') clinicId: string,
    @Param('serviceCode') serviceCode: string,
  ) {
    return this.clinicServicePricingService.getPricingDetails(
      clinicId,
      serviceCode,
    );
  }

  @Delete('clinics/:clinicId/services/:serviceCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete pricing record',
    description:
      'Remove the pricing record for a service at a clinic (disables service and removes pricing)',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiParam({
    name: 'serviceCode',
    description: 'Service code (e.g., DEN001)',
    example: 'DEN001',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Pricing not found',
  })
  async deletePricing(
    @Param('clinicId') clinicId: string,
    @Param('serviceCode') serviceCode: string,
  ) {
    return this.clinicServicePricingService.deletePricing(clinicId, serviceCode);
  }

  @Post('clinics/:clinicId/slots')
  @ApiOperation({
    summary: 'Create dental service slots for a clinic',
    description:
      'Create time slots for dental services at a specific clinic. Supports creating slots for multiple dates at once.',
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
    description: 'Dental services not enabled at clinic level or invalid dates',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async createDentalSlots(
    @Param('clinicId') clinicId: string,
    @Body() createDto: CreateDentalSlotDto,
    @Request() req: AuthRequest,
  ) {
    return this.clinicServicePricingService.createDentalSlots(
      clinicId,
      createDto,
      req.user?.userId,
    );
  }

  @Get('clinics/:clinicId/slots')
  @ApiOperation({
    summary: 'Get all dental service slots for a clinic',
    description: 'Returns all time slots configured for dental services at a specific clinic',
  })
  @ApiParam({
    name: 'clinicId',
    description: 'Clinic ID (e.g., CLN001)',
    example: 'CLN001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of dental service slots',
  })
  @ApiResponse({
    status: 404,
    description: 'Clinic not found',
  })
  async getClinicSlots(@Param('clinicId') clinicId: string) {
    return this.clinicServicePricingService.getClinicSlots(clinicId);
  }

  @Delete('slots/:slotId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a dental service slot',
    description: 'Remove a specific time slot for dental services',
  })
  @ApiParam({
    name: 'slotId',
    description: 'Slot ID (e.g., DSLOT1702648800001)',
    example: 'DSLOT1702648800001',
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
    return this.clinicServicePricingService.deleteSlot(slotId);
  }
}
