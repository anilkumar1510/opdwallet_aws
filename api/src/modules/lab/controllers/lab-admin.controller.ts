import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { LabServiceService, CreateLabServiceDto } from '../services/lab-service.service';
import { LabVendorService } from '../services/lab-vendor.service';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { CreatePricingDto } from '../dto/create-pricing.dto';
import { LabServiceCategory } from '../schemas/lab-service.schema';

@Controller('admin/lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPS)
export class LabAdminController {
  constructor(
    private readonly serviceService: LabServiceService,
    private readonly vendorService: LabVendorService,
  ) {}

  // ============ SERVICE MANAGEMENT ============

  @Post('services')
  async createService(@Body() createDto: CreateLabServiceDto) {
    const service = await this.serviceService.createService(createDto);

    return {
      success: true,
      message: 'Service created successfully',
      data: service,
    };
  }

  @Get('services')
  async getServices(
    @Query('category') category?: LabServiceCategory,
    @Query('search') search?: string,
  ) {
    let services;

    if (search) {
      services = await this.serviceService.searchServices(search);
    } else {
      services = await this.serviceService.getAllServices(category);
    }

    return {
      success: true,
      data: services,
    };
  }

  @Get('services/:id')
  async getServiceById(@Param('id') id: string) {
    const service = await this.serviceService.getServiceById(id);

    return {
      success: true,
      data: service,
    };
  }

  @Patch('services/:id')
  async updateService(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateLabServiceDto>,
  ) {
    const service = await this.serviceService.updateService(id, updateDto);

    return {
      success: true,
      message: 'Service updated successfully',
      data: service,
    };
  }

  @Delete('services/:id')
  async deactivateService(@Param('id') id: string) {
    const service = await this.serviceService.deactivateService(id);

    return {
      success: true,
      message: 'Service deactivated successfully',
      data: service,
    };
  }

  // ============ VENDOR MANAGEMENT ============

  @Post('vendors')
  async createVendor(@Body() createDto: CreateVendorDto) {
    const vendor = await this.vendorService.createVendor(createDto);

    return {
      success: true,
      message: 'Vendor created successfully',
      data: vendor,
    };
  }

  @Get('vendors')
  async getVendors() {
    const vendors = await this.vendorService.getAllVendors();

    return {
      success: true,
      data: vendors,
    };
  }

  @Get('vendors/:id')
  async getVendorById(@Param('id') id: string) {
    const vendor = await this.vendorService.getVendorById(id);

    return {
      success: true,
      data: vendor,
    };
  }

  @Patch('vendors/:id')
  async updateVendor(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateVendorDto>,
  ) {
    const vendor = await this.vendorService.updateVendor(id, updateDto);

    return {
      success: true,
      message: 'Vendor updated successfully',
      data: vendor,
    };
  }

  // ============ PRICING MANAGEMENT ============

  @Post('vendors/:vendorId/pricing')
  async createPricing(
    @Param('vendorId') vendorId: string,
    @Body() createDto: Omit<CreatePricingDto, 'vendorId'>,
  ) {
    const pricing = await this.vendorService.createPricing({
      ...createDto,
      vendorId,
    });

    return {
      success: true,
      message: 'Pricing created successfully',
      data: pricing,
    };
  }

  @Get('vendors/:vendorId/pricing')
  async getVendorPricing(@Param('vendorId') vendorId: string) {
    const pricing = await this.vendorService.getVendorPricing(vendorId);

    return {
      success: true,
      data: pricing,
    };
  }

  @Patch('vendors/:vendorId/pricing/:serviceId')
  async updatePricing(
    @Param('vendorId') vendorId: string,
    @Param('serviceId') serviceId: string,
    @Body() updateDto: Partial<CreatePricingDto>,
  ) {
    const pricing = await this.vendorService.updatePricing(
      vendorId,
      serviceId,
      updateDto,
    );

    return {
      success: true,
      message: 'Pricing updated successfully',
      data: pricing,
    };
  }

  // ============ SLOT MANAGEMENT ============

  @Post('vendors/:vendorId/slots')
  async createSlot(
    @Param('vendorId') vendorId: string,
    @Body()
    body: {
      pincode: string;
      date: string;
      timeSlot: string;
      startTime: string;
      endTime: string;
      maxBookings?: number;
    },
  ) {
    const slot = await this.vendorService.createSlot(
      vendorId,
      body.pincode,
      body.date,
      body.timeSlot,
      body.startTime,
      body.endTime,
      body.maxBookings,
    );

    return {
      success: true,
      message: 'Slot created successfully',
      data: slot,
    };
  }

  @Get('vendors/:vendorId/slots')
  async getSlots(
    @Param('vendorId') vendorId: string,
    @Query('pincode') pincode: string,
    @Query('date') date: string,
  ) {
    const slots = await this.vendorService.getAvailableSlots(vendorId, pincode, date);

    return {
      success: true,
      data: slots,
    };
  }
}
