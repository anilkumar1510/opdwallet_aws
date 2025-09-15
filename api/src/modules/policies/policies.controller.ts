import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthRequest } from '@/common/interfaces/auth-request.interface';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { QueryPolicyDto } from './dto/query-policy.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('policies')
@Controller('policies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  create(@Body() createPolicyDto: CreatePolicyDto, @Request() req: AuthRequest) {
    return this.policiesService.create(createPolicyDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all policies with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Policies retrieved successfully' })
  findAll(@Query() query: QueryPolicyDto) {
    return this.policiesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy found' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update policy' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  update(
    @Param('id') id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @Request() req: AuthRequest,
  ) {
    return this.policiesService.update(id, updatePolicyDto, req.user.userId);
  }
}