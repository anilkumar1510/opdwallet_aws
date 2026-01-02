import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { DoctorCalendarService, CreateUnavailabilityDto, UpdateUnavailabilityDto } from './doctor-calendar.service';
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

@Controller('doctor/calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorCalendarController {
  constructor(private readonly calendarService: DoctorCalendarService) {}

  @Post('unavailability')
  async createUnavailability(
    @Request() req: AuthRequest,
    @Body() dto: Omit<CreateUnavailabilityDto, 'doctorId'>,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const unavailability = await this.calendarService.createUnavailability({
      ...dto,
      doctorId,
    });

    return {
      message: 'Unavailability period created successfully',
      data: unavailability,
    };
  }

  @Get('unavailability')
  async getUnavailability(
    @Request() req: AuthRequest,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const unavailabilities = await this.calendarService.findAllByDoctor(
      doctorId,
      includeInactive === 'true',
    );

    return {
      message: 'Unavailability periods retrieved successfully',
      data: unavailabilities,
    };
  }

  @Get('unavailability/upcoming')
  async getUpcomingUnavailability(@Request() req: AuthRequest) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const unavailabilities = await this.calendarService.findUpcomingByDoctor(doctorId);

    return {
      message: 'Upcoming unavailability periods retrieved successfully',
      data: unavailabilities,
    };
  }

  @Get('unavailability/:unavailabilityId')
  async getUnavailabilityById(@Param('unavailabilityId') unavailabilityId: string) {
    const unavailability = await this.calendarService.findOne(unavailabilityId);

    return {
      message: 'Unavailability period retrieved successfully',
      data: unavailability,
    };
  }

  @Patch('unavailability/:unavailabilityId')
  async updateUnavailability(
    @Param('unavailabilityId') unavailabilityId: string,
    @Body() dto: UpdateUnavailabilityDto,
  ) {
    const unavailability = await this.calendarService.update(unavailabilityId, dto);

    return {
      message: 'Unavailability period updated successfully',
      data: unavailability,
    };
  }

  @Delete('unavailability/:unavailabilityId')
  async deleteUnavailability(@Param('unavailabilityId') unavailabilityId: string) {
    await this.calendarService.delete(unavailabilityId);

    return {
      message: 'Unavailability period deleted successfully',
    };
  }

  @Get('unavailable-dates')
  async getUnavailableDates(
    @Request() req: AuthRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('clinicId') clinicId?: string,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const unavailableDates = await this.calendarService.getUnavailableDates(
      doctorId,
      startDate,
      endDate,
      clinicId,
    );

    return {
      message: 'Unavailable dates retrieved successfully',
      data: unavailableDates,
    };
  }

  @Get('check-availability')
  async checkAvailability(
    @Request() req: AuthRequest,
    @Query('date') date: string,
    @Query('time') time?: string,
    @Query('clinicId') clinicId?: string,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    if (!date) {
      throw new BadRequestException('date is required');
    }

    const isUnavailable = await this.calendarService.isUnavailable(
      doctorId,
      date,
      time,
      clinicId,
    );

    return {
      message: 'Availability checked successfully',
      data: {
        date,
        time,
        clinicId,
        isAvailable: !isUnavailable,
        isUnavailable,
      },
    };
  }
}
