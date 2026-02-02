import { Controller, Get, Post, Delete, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { DoctorClinicAssignmentsService } from './doctor-clinic-assignments.service';
import { AssignClinicDto, SyncClinicsDto } from './dto/assign-clinic.dto';

@Controller('doctor-clinic-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorClinicAssignmentsController {
  constructor(
    private readonly assignmentsService: DoctorClinicAssignmentsService,
  ) {}

  @Get('doctor/:doctorId')
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAssignedClinics(@Param('doctorId') doctorId: string) {
    const clinics = await this.assignmentsService.getAssignedClinics(doctorId, true);
    return {
      success: true,
      data: clinics,
      count: clinics.length,
    };
  }

  @Post()
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async assignClinic(@Body() assignClinicDto: AssignClinicDto, @Request() req: any) {
    const assignedBy = req.user?.userId || assignClinicDto.assignedBy || 'SYSTEM';
    const assignment = await this.assignmentsService.assignClinic(
      assignClinicDto.doctorId,
      assignClinicDto.clinicId,
      assignedBy,
    );
    return {
      success: true,
      data: assignment,
      message: 'Clinic assigned successfully',
    };
  }

  @Delete(':doctorId/:clinicId')
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async unassignClinic(
    @Param('doctorId') doctorId: string,
    @Param('clinicId') clinicId: string,
    @Request() req: any,
  ) {
    const updatedBy = req.user?.userId || 'SYSTEM';
    await this.assignmentsService.unassignClinic(doctorId, clinicId, updatedBy);
    return {
      success: true,
      message: 'Clinic unassigned successfully',
    };
  }

  @Put('doctor/:doctorId/sync')
  @Roles(UserRole.OPS_ADMIN, UserRole.OPS_USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async syncClinicAssignments(
    @Param('doctorId') doctorId: string,
    @Body() syncClinicsDto: SyncClinicsDto,
    @Request() req: any,
  ) {
    const assignedBy = req.user?.userId || syncClinicsDto.assignedBy || 'SYSTEM';
    const result = await this.assignmentsService.syncClinicAssignments(
      doctorId,
      syncClinicsDto.clinicIds,
      assignedBy,
    );
    return {
      success: true,
      data: result,
      message: `Successfully synced clinics: ${result.added} added, ${result.removed} removed`,
    };
  }
}
