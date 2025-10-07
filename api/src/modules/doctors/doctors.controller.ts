import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { DoctorsService } from './doctors.service';
import { DoctorAuthService } from './doctor-auth.service';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { doctorPhotoMulterConfig } from './config/multer.config';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly doctorAuthService: DoctorAuthService,
  ) {}

  @Get()
  async findAll(@Query() query: QueryDoctorsDto) {
    return this.doctorsService.findAll(query);
  }

  @Get(':doctorId/slots')
  async getSlots(
    @Param('doctorId') doctorId: string,
    @Query('clinicId') clinicId?: string,
    @Query('date') date?: string,
  ) {
    return this.doctorsService.getSlots(doctorId, clinicId, date);
  }

  @Get(':doctorId')
  async findOne(@Param('doctorId') doctorId: string) {
    return this.doctorsService.findOne(doctorId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Post(':doctorId/photo')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('photo', doctorPhotoMulterConfig))
  async uploadPhoto(
    @Param('doctorId') doctorId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.doctorsService.uploadPhoto(doctorId, file);
  }

  @Put(':doctorId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('doctorId') doctorId: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctorsService.update(doctorId, updateDoctorDto);
  }

  @Patch(':doctorId/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async activate(@Param('doctorId') doctorId: string) {
    return this.doctorsService.activate(doctorId);
  }

  @Patch(':doctorId/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deactivate(@Param('doctorId') doctorId: string) {
    return this.doctorsService.deactivate(doctorId);
  }

  @Post(':doctorId/set-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OPS, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async setPassword(
    @Param('doctorId') doctorId: string,
    @Body() body: { password: string },
  ) {
    await this.doctorAuthService.setDoctorPassword(doctorId, body.password);
    return { message: 'Password set successfully' };
  }
}