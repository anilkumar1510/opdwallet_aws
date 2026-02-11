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
import { VaccinationServiceService } from '../services/vaccination-service.service';
import { VaccinationVendorService } from '../services/vaccination-vendor.service';
import { VaccinationMasterService } from '../services/vaccination-master.service';
import { CreateVaccinationServiceDto } from '../dto/create-vaccination-service.dto';
import { UpdateVaccinationServiceDto } from '../dto/update-vaccination-service.dto';
import { CreateVaccinationVendorDto } from '../dto/create-vaccination-vendor.dto';
import { UpdateVaccinationVendorDto } from '../dto/update-vaccination-vendor.dto';
import { CreateVaccinationPricingDto } from '../dto/create-vaccination-pricing.dto';
import { CreateVaccinationMasterDto } from '../dto/create-vaccination-master.dto';
import { UpdateVaccinationMasterDto } from '../dto/update-vaccination-master.dto';

@Controller('admin/vaccination')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN, UserRole.OPS_USER)
export class VaccinationAdminController {
  constructor(
    private readonly serviceService: VaccinationServiceService,
    private readonly vendorService: VaccinationVendorService,
    private readonly masterService: VaccinationMasterService,
  ) {}

  // ============ SERVICE MANAGEMENT ============

  @Post('services')
  async createService(@Body() createDto: CreateVaccinationServiceDto) {
    const service = await this.serviceService.createService(createDto);

    return {
      success: true,
      message: 'Vaccination service created successfully',
      data: service,
    };
  }

  @Get('services')
  async getServices(@Query('search') search?: string) {
    let services;

    if (search) {
      services = await this.serviceService.searchServices(search);
    } else {
      services = await this.serviceService.getAllServices();
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
    @Body() updateDto: UpdateVaccinationServiceDto,
  ) {
    const service = await this.serviceService.updateService(id, updateDto);

    return {
      success: true,
      message: 'Vaccination service updated successfully',
      data: service,
    };
  }

  @Delete('services/:id')
  async deactivateService(@Param('id') id: string) {
    const service = await this.serviceService.deactivateService(id);

    return {
      success: true,
      message: 'Vaccination service deactivated successfully',
      data: service,
    };
  }

  @Patch('services/:id/activate')
  async activateService(@Param('id') id: string) {
    const service = await this.serviceService.activateService(id);

    return {
      success: true,
      message: 'Vaccination service activated successfully',
      data: service,
    };
  }

  @Patch('services/:id/deactivate')
  async deactivateServicePatch(@Param('id') id: string) {
    const service = await this.serviceService.deactivateService(id);

    return {
      success: true,
      message: 'Vaccination service deactivated successfully',
      data: service,
    };
  }

  // ============ VENDOR MANAGEMENT ============

  @Post('vendors')
  async createVendor(@Body() createDto: CreateVaccinationVendorDto) {
    const vendor = await this.vendorService.createVendor(createDto);

    return {
      success: true,
      message: 'Vaccination vendor created successfully',
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
    @Body() updateDto: UpdateVaccinationVendorDto,
  ) {
    const vendor = await this.vendorService.updateVendor(id, updateDto);

    return {
      success: true,
      message: 'Vaccination vendor updated successfully',
      data: vendor,
    };
  }

  // ============ PRICING MANAGEMENT ============

  @Post('vendors/:vendorId/pricing')
  async createPricing(
    @Param('vendorId') vendorId: string,
    @Body() createDto: Omit<CreateVaccinationPricingDto, 'vendorId'>,
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
    @Body() updateDto: Partial<CreateVaccinationPricingDto>,
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
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      slotDuration?: number;
      maxAppointments?: number;
    },
  ) {
    const slot = await this.vendorService.createSlot(
      vendorId,
      body.pincode,
      body.dayOfWeek,
      body.startTime,
      body.endTime,
      body.slotDuration,
      body.maxAppointments,
    );

    return {
      success: true,
      message: 'Schedule created successfully',
      data: slot,
    };
  }

  @Get('vendors/:vendorId/slots')
  async getSlots(@Param('vendorId') vendorId: string) {
    const slots = await this.vendorService.getAllSlots(vendorId);

    return {
      success: true,
      data: slots,
    };
  }

  @Patch('vendors/:vendorId/slots/:slotId/activate')
  async activateSlot(
    @Param('vendorId') vendorId: string,
    @Param('slotId') slotId: string,
  ) {
    // Verify vendor exists
    await this.vendorService.getVendorById(vendorId);

    const slot = await this.vendorService.activateSlot(slotId);

    return {
      success: true,
      message: 'Schedule activated successfully',
      data: slot,
    };
  }

  @Patch('vendors/:vendorId/slots/:slotId/deactivate')
  async deactivateSlot(
    @Param('vendorId') vendorId: string,
    @Param('slotId') slotId: string,
  ) {
    // Verify vendor exists
    await this.vendorService.getVendorById(vendorId);

    const slot = await this.vendorService.deactivateSlot(slotId);

    return {
      success: true,
      message: 'Schedule deactivated successfully',
      data: slot,
    };
  }

  @Delete('vendors/:vendorId/slots/:slotId')
  async deleteSlot(
    @Param('vendorId') vendorId: string,
    @Param('slotId') slotId: string,
  ) {
    // Verify vendor exists
    await this.vendorService.getVendorById(vendorId);

    await this.vendorService.deleteSlot(slotId);

    return {
      success: true,
      message: 'Schedule deleted successfully',
    };
  }

  // ============ MASTER VACCINE MANAGEMENT ============

  @Post('master-tests')
  async createMasterVaccine(@Body() createDto: CreateVaccinationMasterDto) {
    const parameter = await this.masterService.create(createDto);

    return {
      success: true,
      message: 'Master vaccine created successfully',
      data: parameter,
    };
  }

  @Get('master-tests')
  async getMasterVaccines(@Query('search') search?: string) {
    let parameters;

    if (search) {
      parameters = await this.masterService.search(search);
    } else {
      parameters = await this.masterService.getAll();
    }

    return {
      success: true,
      data: parameters,
    };
  }

  @Get('master-tests/search')
  async searchMasterVaccines(@Query('q') query: string) {
    const parameters = await this.masterService.search(query);

    return {
      success: true,
      data: parameters,
    };
  }

  @Get('master-tests/:id')
  async getMasterVaccineById(@Param('id') id: string) {
    const parameter = await this.masterService.getById(id);

    return {
      success: true,
      data: parameter,
    };
  }

  @Patch('master-tests/:id')
  async updateMasterVaccine(
    @Param('id') id: string,
    @Body() updateDto: UpdateVaccinationMasterDto,
  ) {
    const parameter = await this.masterService.update(id, updateDto);

    return {
      success: true,
      message: 'Master vaccine updated successfully',
      data: parameter,
    };
  }

  @Delete('master-tests/:id')
  async deactivateMasterVaccine(@Param('id') id: string) {
    const parameter = await this.masterService.deactivate(id);

    return {
      success: true,
      message: 'Master vaccine deactivated successfully',
      data: parameter,
    };
  }
}
