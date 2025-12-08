import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PolicyServicesConfigService } from './policy-services-config.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { BenefitAccessGuard } from '@/common/guards/benefit-access.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('member-services')
@Controller('member/benefits')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MemberServicesController {
  constructor(
    private readonly policyServicesConfigService: PolicyServicesConfigService,
  ) {}

  /**
   * Member: Get allowed services for a category (filtered by policy)
   * GET /api/member/benefits/:categoryId/services
   */
  @Get(':categoryId/services')
  @Roles(UserRole.MEMBER)
  @UseGuards(BenefitAccessGuard)
  @ApiOperation({
    summary: 'Get member allowed services for a category (filtered by policy)',
  })
  @ApiResponse({
    status: 200,
    description: 'Allowed services retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active policy assignment or benefit not enabled',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied: Benefit not enabled in policy',
  })
  async getMemberAllowedServices(
    @Param('categoryId') categoryId: string,
    @Request() req: any,
  ) {
    console.log(
      `[MemberServicesController] GET member/benefits/${categoryId}/services - User: ${req.user.userId}`,
    );

    const services = await this.policyServicesConfigService.getMemberAllowedServices(
      req.user.userId,
      categoryId,
    );

    console.log(
      `[MemberServicesController] Returning ${services.length} allowed services`,
    );

    return {
      categoryId,
      services,
      total: services.length,
    };
  }

  /**
   * Member: Get allowed specialties (CAT001, CAT005)
   * GET /api/member/benefits/:categoryId/specialties
   */
  @Get(':categoryId/specialties')
  @Roles(UserRole.MEMBER)
  @UseGuards(BenefitAccessGuard)
  @ApiOperation({
    summary: 'Get member allowed specialties (CAT001 or CAT005)',
  })
  @ApiResponse({
    status: 200,
    description: 'Allowed specialties retrieved successfully',
  })
  async getMemberAllowedSpecialties(
    @Param('categoryId') categoryId: string,
    @Request() req: any,
  ) {
    console.log(
      `[MemberServicesController] GET member/benefits/${categoryId}/specialties - User: ${req.user.userId}`,
    );

    const services = await this.policyServicesConfigService.getMemberAllowedServices(
      req.user.userId,
      categoryId,
    );

    console.log(
      `[MemberServicesController] Returning ${services.length} allowed specialties`,
    );

    return {
      categoryId,
      services,
      total: services.length,
    };
  }

  /**
   * Member: Get allowed lab service categories (CAT003, CAT004)
   * GET /api/member/benefits/:categoryId/lab-services
   */
  @Get(':categoryId/lab-services')
  @Roles(UserRole.MEMBER)
  @UseGuards(BenefitAccessGuard)
  @ApiOperation({
    summary: 'Get member allowed lab service categories (CAT003 or CAT004)',
  })
  @ApiResponse({
    status: 200,
    description: 'Allowed lab service categories retrieved successfully',
  })
  async getMemberAllowedLabServices(
    @Param('categoryId') categoryId: string,
    @Request() req: any,
  ) {
    console.log(
      `[MemberServicesController] GET member/benefits/${categoryId}/lab-services - User: ${req.user.userId}`,
    );

    const labCategories = await this.policyServicesConfigService.getMemberAllowedServices(
      req.user.userId,
      categoryId,
    );

    return {
      categoryId,
      labServiceCategories: labCategories,
      total: labCategories.length,
    };
  }
}
