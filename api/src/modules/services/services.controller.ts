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
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto/service-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/constants/roles.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Body() createServiceTypeDto: CreateServiceTypeDto, @Req() req: any) {
    return this.servicesService.create(createServiceTypeDto, req.user?.id);
  }

  @Get('types')
  async findAll(
    @Query() query: PaginationDto & {
      category?: string;
      isActive?: string;
      search?: string;
    },
  ) {
    const parsedQuery = {
      ...query,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    };
    return this.servicesService.findAll(parsedQuery);
  }

  @Get('types/categories')
  async getCategories() {
    return this.servicesService.getCategories();
  }

  @Get('types/:id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Put('types/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateServiceTypeDto: UpdateServiceTypeDto,
    @Req() req: any,
  ) {
    return this.servicesService.update(id, updateServiceTypeDto, req.user?.id);
  }

  @Delete('types/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  @Put('types/:id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.toggleActive(id, req.user?.id);
  }
}