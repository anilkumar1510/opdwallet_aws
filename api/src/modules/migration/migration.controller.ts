import { Controller, Post, UseGuards } from '@nestjs/common';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('migration')
@Controller('migration')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MigrationController {
  constructor(private readonly planConfigService: PlanConfigService) {}

  @Post('spouse-coverage')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Migrate all plan configs to include spouse coverage' })
  @ApiResponse({ status: 200, description: 'Migration completed successfully' })
  async migrateSpouseCoverage() {
    return this.planConfigService.migrateSpouseCoverage();
  }
}