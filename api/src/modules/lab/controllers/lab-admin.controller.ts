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
import { MasterTestParameterService, CreateMasterTestParameterDto } from '../services/master-test-parameter.service';
import { TestNameAliasService, CreateTestNameAliasDto, BulkCreateTestNameAliasDto } from '../services/test-name-alias.service';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { CreatePricingDto } from '../dto/create-pricing.dto';
import { LabServiceCategory } from '../schemas/lab-service.schema';
import { MasterTestCategory } from '../schemas/master-test-parameter.schema';

@Controller('admin/lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN, UserRole.OPS_USER)
export class LabAdminController {
  constructor(
    private readonly serviceService: LabServiceService,
    private readonly vendorService: LabVendorService,
    private readonly masterTestParameterService: MasterTestParameterService,
    private readonly testNameAliasService: TestNameAliasService,
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
    console.log('🔍 [LAB-ADMIN] GET /admin/lab/services called');
    console.log('🔍 [LAB-ADMIN] Category filter:', category);
    console.log('🔍 [LAB-ADMIN] Search query:', search);

    try {
      let services;

      if (search) {
        services = await this.serviceService.searchServices(search);
      } else {
        services = await this.serviceService.getAllServices(category);
      }

      console.log('✅ [LAB-ADMIN] Services found:', services.length);

      return {
        success: true,
        data: services,
      };
    } catch (error) {
      console.error('❌ [LAB-ADMIN] Error fetching services:', error.message);
      throw error;
    }
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

  @Patch('services/:id/activate')
  async activateService(@Param('id') id: string) {
    const service = await this.serviceService.activateService(id);

    return {
      success: true,
      message: 'Service activated successfully',
      data: service,
    };
  }

  @Patch('services/:id/deactivate')
  async deactivateServicePatch(@Param('id') id: string) {
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
    console.log('🔍 [LAB-ADMIN] GET /admin/lab/vendors called');

    try {
      const vendors = await this.vendorService.getAllVendors();
      console.log('✅ [LAB-ADMIN] Vendors found:', vendors.length);

      return {
        success: true,
        data: vendors,
      };
    } catch (error) {
      console.error('❌ [LAB-ADMIN] Error fetching vendors:', error.message);
      console.error('❌ [LAB-ADMIN] Error stack:', error.stack);
      throw error;
    }
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

  // ============ MASTER TEST PARAMETER MANAGEMENT ============

  @Post('master-tests')
  async createMasterTest(@Body() createDto: CreateMasterTestParameterDto) {
    const parameter = await this.masterTestParameterService.create(createDto);

    return {
      success: true,
      message: 'Master test parameter created successfully',
      data: parameter,
    };
  }

  @Get('master-tests')
  async getMasterTests(
    @Query('category') category?: MasterTestCategory,
    @Query('search') search?: string,
  ) {
    let parameters;

    if (search) {
      parameters = await this.masterTestParameterService.search(search);
    } else {
      parameters = await this.masterTestParameterService.getAll(category);
    }

    return {
      success: true,
      data: parameters,
    };
  }

  @Get('master-tests/search')
  async searchMasterTests(@Query('q') query: string) {
    const parameters = await this.masterTestParameterService.search(query);

    return {
      success: true,
      data: parameters,
    };
  }

  @Get('master-tests/:id')
  async getMasterTestById(@Param('id') id: string) {
    const parameter = await this.masterTestParameterService.getById(id);

    return {
      success: true,
      data: parameter,
    };
  }

  @Patch('master-tests/:id')
  async updateMasterTest(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateMasterTestParameterDto>,
  ) {
    const parameter = await this.masterTestParameterService.update(id, updateDto);

    return {
      success: true,
      message: 'Master test parameter updated successfully',
      data: parameter,
    };
  }

  @Delete('master-tests/:id')
  async deactivateMasterTest(@Param('id') id: string) {
    const parameter = await this.masterTestParameterService.deactivate(id);

    return {
      success: true,
      message: 'Master test parameter deactivated successfully',
      data: parameter,
    };
  }

  // ============ TEST NAME ALIAS MANAGEMENT ============

  @Post('test-aliases')
  async createTestAlias(@Body() createDto: CreateTestNameAliasDto) {
    const alias = await this.testNameAliasService.create(createDto);

    return {
      success: true,
      message: 'Test name alias created successfully',
      data: alias,
    };
  }

  @Post('test-aliases/bulk')
  async bulkCreateTestAliases(@Body() bulkDto: BulkCreateTestNameAliasDto) {
    const aliases = await this.testNameAliasService.bulkCreate(bulkDto);

    return {
      success: true,
      message: `${aliases.length} test name aliases created successfully`,
      data: aliases,
    };
  }

  @Get('test-aliases/vendor/:vendorId')
  async getVendorTestAliases(@Param('vendorId') vendorId: string) {
    const aliases = await this.testNameAliasService.getVendorAliases(vendorId);

    return {
      success: true,
      data: aliases,
    };
  }

  @Get('test-aliases/vendor/:vendorId/search')
  async searchVendorTestAliases(
    @Param('vendorId') vendorId: string,
    @Query('q') query: string,
  ) {
    const aliases = await this.testNameAliasService.searchByVendor(vendorId, query);

    return {
      success: true,
      data: aliases,
    };
  }

  @Patch('test-aliases/:aliasId')
  async updateTestAlias(
    @Param('aliasId') aliasId: string,
    @Body() updateDto: Partial<CreateTestNameAliasDto>,
  ) {
    const alias = await this.testNameAliasService.update(aliasId, updateDto);

    return {
      success: true,
      message: 'Test name alias updated successfully',
      data: alias,
    };
  }

  @Delete('test-aliases/:aliasId')
  async deleteTestAlias(@Param('aliasId') aliasId: string) {
    await this.testNameAliasService.delete(aliasId);

    return {
      success: true,
      message: 'Test name alias deleted successfully',
    };
  }
}
