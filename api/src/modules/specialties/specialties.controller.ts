import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpecialtiesService } from './specialties.service';

@Controller('specialties')
@UseGuards(JwtAuthGuard)
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  async findAll() {
    return this.specialtiesService.findAll();
  }

  @Get(':specialtyId')
  async findOne(@Param('specialtyId') specialtyId: string) {
    return this.specialtiesService.findOne(specialtyId);
  }
}