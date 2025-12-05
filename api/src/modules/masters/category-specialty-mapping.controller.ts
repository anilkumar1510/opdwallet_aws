import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CategorySpecialtyMappingService } from './category-specialty-mapping.service';
import { SpecialtyWithMappingDto } from './dto/category-specialty-mapping.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/constants/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategorySpecialtyMappingController {
  constructor(
    private readonly mappingService: CategorySpecialtyMappingService,
  ) {}

  @Get(':categoryId/specialties')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all specialties with mapping status for a category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID (CAT001 or CAT005)', example: 'CAT001' })
  @ApiResponse({
    status: 200,
    description: 'Specialties retrieved successfully',
    type: [SpecialtyWithMappingDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid category or unsupported category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getSpecialtiesForCategory(
    @Param('categoryId') categoryId: string,
  ): Promise<SpecialtyWithMappingDto[]> {
    console.log(`[CategorySpecialtyMappingController] GET /categories/${categoryId}/specialties`);
    return this.mappingService.getSpecialtiesForCategory(categoryId);
  }

  @Put(':categoryId/specialties/:specialtyId/toggle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle specialty mapping for a category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID (CAT001 or CAT005)', example: 'CAT001' })
  @ApiParam({ name: 'specialtyId', description: 'Specialty MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isEnabled: {
          type: 'boolean',
          description: 'Enable or disable the specialty for this category',
          example: true,
        },
      },
      required: ['isEnabled'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Specialty mapping toggled successfully',
    type: SpecialtyWithMappingDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid category, specialty, or unsupported category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category or specialty not found' })
  async toggleSpecialtyMapping(
    @Param('categoryId') categoryId: string,
    @Param('specialtyId') specialtyId: string,
    @Body() dto: { isEnabled: boolean },
    @Req() req: any,
  ): Promise<SpecialtyWithMappingDto> {
    console.log(`[CategorySpecialtyMappingController] PUT /categories/${categoryId}/specialties/${specialtyId}/toggle`);
    console.log(`[CategorySpecialtyMappingController] isEnabled: ${dto.isEnabled}, user: ${req.user?.id}`);

    return this.mappingService.toggleSpecialtyMapping(
      categoryId,
      specialtyId,
      dto.isEnabled,
      req.user?.id,
    );
  }
}
