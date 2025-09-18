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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/constants/roles.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    return this.categoriesService.create(createCategoryDto, req.user?.id);
  }

  @Get()
  async findAll(
    @Query() query: PaginationDto & {
      isActive?: string;
      search?: string;
    },
  ) {
    const parsedQuery = {
      ...query,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    };
    return this.categoriesService.findAll(parsedQuery);
  }

  @Get('ids')
  async getCategoryIds() {
    return this.categoriesService.getAllCategoryIds();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, req.user?.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    // This will always throw an error as categories cannot be deleted
    throw new HttpException(
      'Categories cannot be deleted. You can only deactivate them.',
      HttpStatus.METHOD_NOT_ALLOWED
    );
  }

  @Put(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.categoriesService.toggleActive(id, req.user?.id);
  }
}