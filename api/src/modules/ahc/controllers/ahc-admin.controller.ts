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
import { AhcPackageService } from '../services/ahc-package.service';
import { CreateAhcPackageDto, UpdateAhcPackageDto } from '../dto/create-ahc-package.dto';

@Controller('admin/ahc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPS_ADMIN, UserRole.OPS_USER)
export class AhcAdminController {
  constructor(private readonly ahcPackageService: AhcPackageService) {}

  @Post('packages')
  async createPackage(@Body() createDto: CreateAhcPackageDto) {
    const ahcPackage = await this.ahcPackageService.createPackage(createDto);

    return {
      success: true,
      message: 'AHC Package created successfully',
      data: ahcPackage,
    };
  }

  @Get('packages')
  async getPackages(@Query('search') search?: string) {
    let packages;

    if (search) {
      packages = await this.ahcPackageService.searchPackages(search);
    } else {
      packages = await this.ahcPackageService.getAllPackages();
    }

    return {
      success: true,
      data: packages,
    };
  }

  @Get('packages/:packageId')
  async getPackageById(@Param('packageId') packageId: string) {
    const ahcPackage = await this.ahcPackageService.getPackageById(packageId);

    return {
      success: true,
      data: ahcPackage,
    };
  }

  @Patch('packages/:packageId')
  async updatePackage(
    @Param('packageId') packageId: string,
    @Body() updateDto: UpdateAhcPackageDto,
  ) {
    const ahcPackage = await this.ahcPackageService.updatePackage(packageId, updateDto);

    return {
      success: true,
      message: 'AHC Package updated successfully',
      data: ahcPackage,
    };
  }

  @Patch('packages/:packageId/toggle-active')
  @Roles(UserRole.SUPER_ADMIN)
  async toggleActive(@Param('packageId') packageId: string) {
    const ahcPackage = await this.ahcPackageService.toggleActive(packageId);

    return {
      success: true,
      message: `AHC Package ${ahcPackage.isActive ? 'activated' : 'deactivated'} successfully`,
      data: ahcPackage,
    };
  }

  @Delete('packages/:packageId')
  @Roles(UserRole.SUPER_ADMIN)
  async deletePackage(@Param('packageId') packageId: string) {
    await this.ahcPackageService.deletePackage(packageId);

    return {
      success: true,
      message: 'AHC Package deleted successfully',
    };
  }
}
