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
  Patch,
} from '@nestjs/common';
import { CugsService } from './cugs.service';
import { CreateCugDto, UpdateCugDto } from './dto/cug.dto';
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

@ApiTags('cugs')
@Controller('cugs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CugsController {
  constructor(private readonly cugsService: CugsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new CUG' })
  @ApiResponse({ status: 201, description: 'CUG created successfully' })
  @ApiResponse({ status: 409, description: 'CUG with same ID already exists' })
  async create(@Body() createCugDto: CreateCugDto, @Req() req: any) {
    console.log('[CugsController] POST /cugs - Creating CUG');
    console.log('[CugsController] Request body:', JSON.stringify(createCugDto, null, 2));
    console.log('[CugsController] User:', req.user?.email, req.user?.id);

    try {
      const result = await this.cugsService.create(createCugDto, req.user?.id);
      console.log('[CugsController] CUG created successfully:', result);
      return result;
    } catch (error) {
      console.error('[CugsController] Error creating CUG:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all CUGs' })
  @ApiResponse({ status: 200, description: 'CUGs retrieved successfully' })
  async findAll(
    @Query() query: PaginationDto & {
      isActive?: string;
      search?: string;
    },
  ) {
    console.log('🎯🎯🎯 [CugsController] GET /cugs START 🎯🎯🎯');
    console.log('[CugsController] Raw query params:', JSON.stringify(query, null, 2));
    console.log('[CugsController] Query keys:', Object.keys(query));

    const parsedQuery = {
      ...query,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    };

    console.log('[CugsController] Parsed query:', JSON.stringify(parsedQuery, null, 2));

    const result = await this.cugsService.findAll(parsedQuery);

    console.log('[CugsController] Service returned:', {
      dataCount: result.data?.length,
      total: result.total,
      cugIds: result.data?.map(c => c.cugId)
    });

    console.log('🎯🎯🎯 [CugsController] GET /cugs END 🎯🎯🎯');
    return result;
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active CUGs' })
  @ApiResponse({ status: 200, description: 'Active CUGs retrieved successfully' })
  async findAllActive() {
    console.log('[CugsController] GET /cugs/active - Finding all active CUGs');
    const result = await this.cugsService.findAllActive();
    console.log('[CugsController] Found active CUGs:', result.length);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CUG by ID' })
  @ApiResponse({ status: 200, description: 'CUG retrieved successfully' })
  @ApiResponse({ status: 404, description: 'CUG not found' })
  async findOne(@Param('id') id: string) {
    console.log('[CugsController] GET /cugs/:id - Finding CUG by ID:', id);
    const result = await this.cugsService.findOne(id);
    console.log('[CugsController] Found CUG:', result.cugId);
    return result;
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update CUG' })
  @ApiResponse({ status: 200, description: 'CUG updated successfully' })
  @ApiResponse({ status: 404, description: 'CUG not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCugDto: UpdateCugDto,
    @Req() req: any,
  ) {
    console.log('[CugsController] PUT /cugs/:id - Updating CUG:', id);
    console.log('[CugsController] Update data:', JSON.stringify(updateCugDto, null, 2));

    const result = await this.cugsService.update(id, updateCugDto, req.user?.id);
    console.log('[CugsController] CUG updated successfully');
    return result;
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle CUG active status' })
  @ApiResponse({ status: 200, description: 'CUG status toggled successfully' })
  @ApiResponse({ status: 404, description: 'CUG not found' })
  @ApiResponse({ status: 409, description: 'CUG has active members and cannot be deactivated' })
  async toggleActive(@Param('id') id: string) {
    console.log('[CugsController] PATCH /cugs/:id/toggle-active - Toggling CUG status:', id);
    const result = await this.cugsService.toggleActive(id);
    console.log('[CugsController] CUG status toggled to:', result.isActive);
    return result;
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete CUG' })
  @ApiResponse({ status: 200, description: 'CUG deleted successfully' })
  @ApiResponse({ status: 404, description: 'CUG not found' })
  @ApiResponse({ status: 409, description: 'CUG has members and cannot be deleted' })
  async remove(@Param('id') id: string) {
    console.log('[CugsController] DELETE /cugs/:id - Deleting CUG:', id);
    await this.cugsService.remove(id);
    console.log('[CugsController] CUG deleted successfully');
    return { message: 'CUG deleted successfully' };
  }

  @Post('seed')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Seed default CUGs' })
  @ApiResponse({ status: 201, description: 'Default CUGs seeded successfully' })
  async seedDefaultCugs() {
    console.log('[CugsController] POST /cugs/seed - Seeding default CUGs');
    await this.cugsService.seedDefaultCugs();
    console.log('[CugsController] Default CUGs seeded successfully');
    return { message: 'Default CUGs seeded successfully' };
  }
}