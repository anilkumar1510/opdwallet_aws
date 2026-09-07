import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private readonly videoConsultationService: VideoConsultationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /api/video-consultations/demo-start
   *
   * Starts the call from the member's side, for demonstrations only.
   *
   * A consultation is started by the DOCTOR — correctly, since they decide when
   * they are ready — so `join` answers "no active consultation" until one has.
   * On a demo database nobody is sitting in the doctor portal, which leaves the
   * whole video journey, and the Agora token path with it, impossible to show.
   *
   * Calls the very same service method the doctor's route calls, passing the
   * appointment's own doctorId so nothing is bypassed but the question of WHO
   * pressed start. Refused outside development.
   */
  @Post('demo-start')
  @Roles(UserRole.MEMBER)
  async demoStart(@Body() body: { appointmentId: string }, @Request() req: any) {
    if (this.configService.get<string>('nodeEnv') !== 'development') {
      throw new ForbiddenException('Your doctor starts the call');
    }
    return this.videoConsultationService.demoStartAsMember(body.appointmentId, req.user.userId);
  }

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

  /**
   * A fresh Agora token for a call already in progress.
   *
   * Both roles, because both are participants and both tokens expire. The
   * service checks the caller is actually in this consultation before signing
   * anything.
   */
  @Get(':consultationId/token')
  async refreshAgoraToken(@Request() req: any, @Param('consultationId') consultationId: string) {
    return this.videoConsultationService.refreshAgoraToken(consultationId, req.user.userId);
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
