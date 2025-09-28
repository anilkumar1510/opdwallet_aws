import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DoctorsService } from './doctors.service';
import { QueryDoctorsDto } from './dto/query-doctors.dto';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  async findAll(@Query() query: QueryDoctorsDto) {
    return this.doctorsService.findAll(query);
  }

  @Get(':doctorId')
  async findOne(@Param('doctorId') doctorId: string) {
    return this.doctorsService.findOne(doctorId);
  }

  @Get(':doctorId/slots')
  async getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.doctorsService.getAvailableSlots(doctorId, date);
  }
}