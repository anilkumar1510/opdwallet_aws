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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
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

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Category with same ID already exists' })
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    console.log('[CategoriesController] POST /categories - Creating category');
    console.log('[CategoriesController] Request body:', JSON.stringify(createCategoryDto, null, 2));
    console.log('[CategoriesController] User:', req.user?.email, req.user?.id);

    try {
      const result = await this.categoriesService.create(createCategoryDto, req.user?.id);
      console.log('[CategoriesController] Category created successfully:', result);
      return result;
    } catch (error) {
      console.error('[CategoriesController] Error creating category:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(
    @Query() query: PaginationDto & {
      isActive?: string;
      search?: string;
    },
  ) {
    console.log('🎯🎯🎯 [CategoriesController] GET /categories START 🎯🎯🎯');
    console.log('[CategoriesController] Raw query params:', JSON.stringify(query, null, 2));
    console.log('[CategoriesController] Query keys:', Object.keys(query));

    const parsedQuery = {
      ...query,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    };

    console.log('[CategoriesController] Parsed query:', JSON.stringify(parsedQuery, null, 2));

    const result = await this.categoriesService.findAll(parsedQuery);

    console.log('[CategoriesController] Service returned:', {
      dataCount: result.data?.length,
      total: result.total,
      categoryIds: result.data?.map(c => c.categoryId)
    });

    console.log('[CategoriesController] Full response data:');
    result.data?.forEach((cat, idx) => {
      console.log(`  [${idx}] ${cat.categoryId}: ${cat.name}`);
    });

    console.log('🎯🎯🎯 [CategoriesController] GET /categories END 🎯🎯🎯');

    return result;
  }

  @Get('ids')
  @ApiOperation({ summary: 'Get all category IDs' })
  @ApiResponse({ status: 200, description: 'Category IDs retrieved successfully' })
  async getCategoryIds() {
    console.log('[CategoriesController] GET /categories/ids');
    return this.categoriesService.getAllCategoryIds();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    console.log('[CategoriesController] GET /categories/:id - ID:', id);
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    console.log('[CategoriesController] PUT /categories/:id - ID:', id);
    console.log('[CategoriesController] Update data:', JSON.stringify(updateCategoryDto, null, 2));
    return this.categoriesService.update(id, updateCategoryDto, req.user?.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Category is in use and cannot be deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string) {
    console.log('[CategoriesController] DELETE /categories/:id - ID:', id);
    await this.categoriesService.remove(id);
    return { message: 'Category deleted successfully' };
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle category active status' })
  @ApiResponse({ status: 200, description: 'Category status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async toggleActive(@Param('id') id: string, @Req() req: any) {
    console.log('[CategoriesController] PUT /categories/:id/toggle-active - ID:', id);
    return this.categoriesService.toggleActive(id, req.user?.id);
  }
}