import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/constants/roles.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new service type' })
  @ApiResponse({ status: 201, description: 'Service type created successfully' })
  @ApiResponse({ status: 409, description: 'Service with same code already exists' })
  async create(@Body() createServiceDto: CreateServiceDto, @Req() req: any) {
    console.log('[ServicesController] POST /services/types - Creating service type');
    console.log('[ServicesController] Request body:', JSON.stringify(createServiceDto, null, 2));
    console.log('[ServicesController] User:', req.user?.email, req.user?.id);

    try {
      const result = await this.servicesService.create(createServiceDto, req.user?.id);
      console.log('[ServicesController] Service type created successfully:', (result as any)._id);
      return result;
    } catch (error) {
      console.error('[ServicesController] Error creating service type:', error);
      throw error;
    }
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all service types' })
  @ApiResponse({ status: 200, description: 'Service types retrieved successfully' })
  async findAll(
    @Query() query: PaginationDto & {
      isActive?: string;
      search?: string;
      category?: string;
    },
  ) {
    console.log('[ServicesController] GET /services/types');
    console.log('[ServicesController] Query params:', JSON.stringify(query, null, 2));

    const parsedQuery = {
      ...query,
      page: query.page ? parseInt(query.page.toString()) : 1,
      limit: query.limit ? parseInt(query.limit.toString()) : 20,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    };

    const result = await this.servicesService.findAll(parsedQuery);

    console.log('[ServicesController] Service types found:', {
      dataCount: result.data?.length,
      total: result.total,
    });

    return result;
  }

  @Get('types/codes')
  @ApiOperation({ summary: 'Get all service codes' })
  @ApiResponse({ status: 200, description: 'Service codes retrieved successfully' })
  async getServiceCodes() {
    console.log('[ServicesController] GET /services/types/codes');
    return this.servicesService.getAllServiceCodes();
  }

  @Get('types/:id')
  @ApiOperation({ summary: 'Get a service type by ID' })
  @ApiResponse({ status: 200, description: 'Service type retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  async findOne(@Param('id') id: string) {
    console.log('[ServicesController] GET /services/types/:id - ID:', id);
    return this.servicesService.findOne(id);
  }

  @Put('types/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a service type' })
  @ApiResponse({ status: 200, description: 'Service type updated successfully' })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: any,
  ) {
    console.log('[ServicesController] PUT /services/types/:id - ID:', id);
    console.log('[ServicesController] Update data:', JSON.stringify(updateServiceDto, null, 2));
    return this.servicesService.update(id, updateServiceDto, req.user?.id);
  }

  @Delete('types/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a service type' })
  @ApiResponse({ status: 200, description: 'Service type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  async remove(@Param('id') id: string) {
    console.log('[ServicesController] DELETE /services/types/:id - ID:', id);
    await this.servicesService.remove(id);
    return { message: 'Service type deleted successfully' };
  }

  @Put('types/:id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle service type active status' })
  @ApiResponse({ status: 200, description: 'Service type status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  async toggleActive(@Param('id') id: string, @Req() req: any) {
    console.log('[ServicesController] PUT /services/types/:id/toggle-active - ID:', id);
    return this.servicesService.toggleActive(id, req.user?.id);
  }

  @Get('categories/:category')
  @ApiOperation({ summary: 'Get services by category' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async getServicesByCategory(@Param('category') category: string) {
    console.log('[ServicesController] GET /services/categories/:category - Category:', category);
    return this.servicesService.getServicesByCategory(category);
  }
}