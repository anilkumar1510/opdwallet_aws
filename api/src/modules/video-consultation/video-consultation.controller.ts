import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VideoConsultationService } from './video-consultation.service';
import { StartConsultationDto } from './dto/start-consultation.dto';
import { EndConsultationDto } from './dto/end-consultation.dto';
import { JoinConsultationDto } from './dto/join-consultation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

@Controller('video-consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoConsultationController {
  constructor(private readonly videoConsultationService: VideoConsultationService) {}

  @Post('start')
  @Roles(UserRole.DOCTOR)
  async startConsultation(@Request() req: any, @Body() startDto: StartConsultationDto) {
    // Use doctorId (DOC001) not userId (MongoDB _id) because appointment.doctorId stores the human-readable ID
    return this.videoConsultationService.startConsultation(startDto.appointmentId, req.user.doctorId);
  }

  @Post('join')
  @Roles(UserRole.MEMBER)
  async joinConsultation(@Request() req: any, @Body() joinDto: JoinConsultationDto) {
    return this.videoConsultationService.joinConsultation(joinDto.appointmentId, req.user.userId);
  }

  @Post(':consultationId/end')
  @Roles(UserRole.DOCTOR)
  async endConsultation(
    @Request() req: any,
    @Param('consultationId') consultationId: string,
    @Body() endDto: EndConsultationDto,
  ) {
    // Use userId (MongoDB _id) here because VideoConsultation.doctorId is stored as ObjectId
    return this.videoConsultationService.endConsultation(consultationId, req.user.userId, endDto);
  }

  @Get(':consultationId/status')
  async getConsultationStatus(@Param('consultationId') consultationId: string) {
    return this.videoConsultationService.getConsultationStatus(consultationId);
  }

  @Get('doctor/history')
  @Roles(UserRole.DOCTOR)
  async getDoctorConsultations(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.videoConsultationService.getDoctorConsultations(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('patient/history')
  @Roles(UserRole.MEMBER)
  async getPatientConsultations(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.videoConsultationService.getPatientConsultations(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
    );
  }
}
