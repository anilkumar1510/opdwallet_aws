import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { CategoryLabServiceMappingService } from './category-lab-service-mapping.service';
import { LabServiceWithMappingDto } from './dto/category-lab-service-mapping.dto';
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
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoryLabServiceMappingController {
  constructor(
    private readonly mappingService: CategoryLabServiceMappingService,
  ) {}

  @Get(':categoryId/lab-services')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all lab services with mapping status for a category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID (e.g., CAT003, CAT004)', example: 'CAT004' })
  @ApiQuery({
    name: 'categories',
    required: false,
    description: 'Comma-separated lab service categories to filter (e.g., RADIOLOGY,ENDOSCOPY)',
    example: 'RADIOLOGY,ENDOSCOPY',
  })
  @ApiResponse({
    status: 200,
    description: 'Lab services retrieved successfully',
    type: [LabServiceWithMappingDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid category or unsupported category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getLabServicesForCategory(
    @Param('categoryId') categoryId: string,
    @Query('categories') categories?: string,
  ): Promise<LabServiceWithMappingDto[]> {
    console.log(`[CategoryLabServiceMappingController] GET /categories/${categoryId}/lab-services${categories ? `?categories=${categories}` : ''}`);

    // Parse comma-separated categories
    const labServiceCategories = categories
      ? categories.split(',').map(c => c.trim().toUpperCase())
      : undefined;

    return this.mappingService.getLabServicesForCategory(categoryId, labServiceCategories);
  }

  @Put(':categoryId/lab-services/:labServiceId/toggle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle lab service mapping for a category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID (CAT004)', example: 'CAT004' })
  @ApiParam({ name: 'labServiceId', description: 'Lab Service MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isEnabled: {
          type: 'boolean',
          description: 'Enable or disable the lab service for this category',
          example: true,
        },
      },
      required: ['isEnabled'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lab service mapping toggled successfully',
    type: LabServiceWithMappingDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid category, lab service, or unsupported category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category or lab service not found' })
  async toggleLabServiceMapping(
    @Param('categoryId') categoryId: string,
    @Param('labServiceId') labServiceId: string,
    @Body() dto: { isEnabled: boolean },
    @Req() req: any,
  ): Promise<LabServiceWithMappingDto> {
    console.log(`[CategoryLabServiceMappingController] PUT /categories/${categoryId}/lab-services/${labServiceId}/toggle`);
    console.log(`[CategoryLabServiceMappingController] isEnabled: ${dto.isEnabled}, user: ${req.user?.id}`);

    return this.mappingService.toggleLabServiceMapping(
      categoryId,
      labServiceId,
      dto.isEnabled,
      req.user?.id,
    );
  }
}
