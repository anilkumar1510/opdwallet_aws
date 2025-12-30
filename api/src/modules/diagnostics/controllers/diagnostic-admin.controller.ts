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
import { DiagnosticServiceService, CreateDiagnosticServiceDto } from '../services/diagnostic-service.service';
import { DiagnosticVendorService, CreateDiagnosticVendorDto, CreateDiagnosticPricingDto } from '../services/diagnostic-vendor.service';
import { DiagnosticMasterTestService, CreateDiagnosticMasterTestDto } from '../services/diagnostic-master-test.service';
import { DiagnosticServiceCategory } from '../schemas/diagnostic-service.schema';
import { DiagnosticMasterTestCategory } from '../schemas/diagnostic-master-test.schema';

@Controller('admin/diagnostics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN, UserRole.OPS_USER)
export class DiagnosticAdminController {
  constructor(
    private readonly serviceService: DiagnosticServiceService,
    private readonly vendorService: DiagnosticVendorService,
    private readonly masterTestService: DiagnosticMasterTestService,
  ) {}

  // ============ SERVICE MANAGEMENT ============

  @Post('services')
  async createService(@Body() createDto: CreateDiagnosticServiceDto) {
    const service = await this.serviceService.createService(createDto);

    return {
      success: true,
      message: 'Diagnostic service created successfully',
      data: service,
    };
  }

  @Get('services')
  async getServices(
    @Query('category') category?: DiagnosticServiceCategory,
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
    @Body() updateDto: Partial<CreateDiagnosticServiceDto>,
  ) {
    const service = await this.serviceService.updateService(id, updateDto);

    return {
      success: true,
      message: 'Diagnostic service updated successfully',
      data: service,
    };
  }

  @Delete('services/:id')
  async deactivateService(@Param('id') id: string) {
    const service = await this.serviceService.deactivateService(id);

    return {
      success: true,
      message: 'Diagnostic service deactivated successfully',
      data: service,
    };
  }

  // ============ VENDOR MANAGEMENT ============

  @Post('vendors')
  async createVendor(@Body() createDto: CreateDiagnosticVendorDto) {
    const vendor = await this.vendorService.createVendor(createDto);

    return {
      success: true,
      message: 'Diagnostic vendor created successfully',
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
    @Body() updateDto: Partial<CreateDiagnosticVendorDto>,
  ) {
    const vendor = await this.vendorService.updateVendor(id, updateDto);

    return {
      success: true,
      message: 'Diagnostic vendor updated successfully',
      data: vendor,
    };
  }

  // ============ PRICING MANAGEMENT ============

  @Post('vendors/:vendorId/pricing')
  async createPricing(
    @Param('vendorId') vendorId: string,
    @Body() createDto: Omit<CreateDiagnosticPricingDto, 'vendorId'>,
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
    @Body() updateDto: Partial<CreateDiagnosticPricingDto>,
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

  // ============ MASTER TEST MANAGEMENT ============

  @Post('master-tests')
  async createMasterTest(@Body() createDto: CreateDiagnosticMasterTestDto) {
    const masterTest = await this.masterTestService.create(createDto);

    return {
      success: true,
      message: 'Diagnostic master test created successfully',
      data: masterTest,
    };
  }

  @Get('master-tests')
  async getMasterTests(
    @Query('category') category?: DiagnosticMasterTestCategory,
    @Query('search') search?: string,
  ) {
    let masterTests;

    if (search) {
      masterTests = await this.masterTestService.search(search);
    } else {
      masterTests = await this.masterTestService.getAll(category);
    }

    return {
      success: true,
      data: masterTests,
    };
  }

  @Get('master-tests/:id')
  async getMasterTestById(@Param('id') id: string) {
    const masterTest = await this.masterTestService.getById(id);

    return {
      success: true,
      data: masterTest,
    };
  }

  @Patch('master-tests/:id')
  async updateMasterTest(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateDiagnosticMasterTestDto>,
  ) {
    const masterTest = await this.masterTestService.update(id, updateDto);

    return {
      success: true,
      message: 'Diagnostic master test updated successfully',
      data: masterTest,
    };
  }

  @Patch('master-tests/:id/status')
  async updateMasterTestStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    const masterTest = await this.masterTestService.updateStatus(id, body.isActive);

    return {
      success: true,
      message: `Diagnostic master test ${body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: masterTest,
    };
  }
}
