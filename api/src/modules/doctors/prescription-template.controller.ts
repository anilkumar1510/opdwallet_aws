import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PrescriptionTemplateService, CreateTemplateDto, UpdateTemplateDto } from './prescription-template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

interface AuthRequest extends ExpressRequest {
  user: {
    doctorId?: string;
    role: UserRole;
  };
}

@Controller('doctor/prescription-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class PrescriptionTemplateController {
  constructor(private readonly templateService: PrescriptionTemplateService) {}

  @Post()
  async createTemplate(
    @Request() req: AuthRequest,
    @Body() dto: Omit<CreateTemplateDto, 'doctorId'>,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const template = await this.templateService.create({
      ...dto,
      doctorId,
    });

    return {
      message: 'Template created successfully',
      data: template,
    };
  }

  @Get()
  async getTemplates(@Request() req: AuthRequest) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const templates = await this.templateService.findAllByDoctor(doctorId);

    return {
      message: 'Templates retrieved successfully',
      data: templates,
    };
  }

  @Get(':templateId')
  async getTemplate(
    @Param('templateId') templateId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const template = await this.templateService.findOne(templateId, doctorId);

    return {
      message: 'Template retrieved successfully',
      data: template,
    };
  }

  @Patch(':templateId')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateTemplateDto,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const template = await this.templateService.update(templateId, doctorId, dto);

    return {
      message: 'Template updated successfully',
      data: template,
    };
  }

  @Delete(':templateId')
  async deleteTemplate(
    @Param('templateId') templateId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    await this.templateService.delete(templateId, doctorId);

    return {
      message: 'Template deleted successfully',
    };
  }

  @Post(':templateId/use')
  async incrementUsage(
    @Param('templateId') templateId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    await this.templateService.incrementUsage(templateId, doctorId);

    return {
      message: 'Template usage incremented',
    };
  }
}
