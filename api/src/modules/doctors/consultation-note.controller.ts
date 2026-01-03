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
import {
  ConsultationNoteService,
  CreateConsultationNoteDto,
  UpdateConsultationNoteDto,
} from './consultation-note.service';
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

@Controller('doctor/consultation-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class ConsultationNoteController {
  constructor(private readonly noteService: ConsultationNoteService) {}

  @Post()
  async createNote(
    @Request() req: AuthRequest,
    @Body() dto: Omit<CreateConsultationNoteDto, 'doctorId'>,
  ) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 [ConsultationNote] CREATE START`);
    console.log(`[${timestamp}] User:`, req.user);
    console.log(`[${timestamp}] DTO:`, JSON.stringify(dto, null, 2));

    try {
      const doctorId = req.user?.doctorId;
      if (!doctorId) {
        console.error(`[${timestamp}] ❌ No doctorId found`);
        throw new BadRequestException('Doctor ID is required');
      }

      console.log(`[${timestamp}] Doctor ID: ${doctorId}`);
      const note = await this.noteService.create({
        ...dto,
        doctorId,
      });

      console.log(`[${timestamp}] ✅ Note created: ${note.noteId}`);
      return {
        message: 'Consultation note created successfully',
        data: note,
      };
    } catch (error) {
      console.error(`[${timestamp}] ❌ CREATE FAILED:`, error);
      console.error(`[${timestamp}] Error stack:`, error.stack);
      throw error;
    }
  }

  @Get()
  async getNotes(
    @Request() req: AuthRequest,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const notes = await this.noteService.findAllByDoctor(
      doctorId,
      limit ? parseInt(limit, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );

    return {
      message: 'Consultation notes retrieved successfully',
      data: notes,
    };
  }

  @Get('appointment/:appointmentId')
  async getNoteByAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const note = await this.noteService.findByAppointment(appointmentId, doctorId);

    return {
      message: note ? 'Consultation note retrieved successfully' : 'No note found for this appointment',
      data: note,
    };
  }

  @Get('patient/:patientId')
  async getNotesByPatient(
    @Param('patientId') patientId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const notes = await this.noteService.findAllByPatient(patientId, doctorId);

    return {
      message: 'Patient consultation notes retrieved successfully',
      data: notes,
    };
  }

  @Get(':noteId')
  async getNote(
    @Param('noteId') noteId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const note = await this.noteService.findOne(noteId, doctorId);

    return {
      message: 'Consultation note retrieved successfully',
      data: note,
    };
  }

  @Patch(':noteId')
  async updateNote(
    @Param('noteId') noteId: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateConsultationNoteDto,
  ) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 [ConsultationNote] UPDATE START`);
    console.log(`[${timestamp}] Note ID: ${noteId}`);
    console.log(`[${timestamp}] User:`, req.user);
    console.log(`[${timestamp}] DTO:`, JSON.stringify(dto, null, 2));

    try {
      const doctorId = req.user?.doctorId;
      if (!doctorId) {
        console.error(`[${timestamp}] ❌ No doctorId found`);
        throw new BadRequestException('Doctor ID is required');
      }

      console.log(`[${timestamp}] Doctor ID: ${doctorId}`);
      const note = await this.noteService.update(noteId, doctorId, dto);

      console.log(`[${timestamp}] ✅ Note updated: ${note.noteId}`);
      return {
        message: 'Consultation note updated successfully',
        data: note,
      };
    } catch (error) {
      console.error(`[${timestamp}] ❌ UPDATE FAILED:`, error);
      console.error(`[${timestamp}] Error stack:`, error.stack);
      throw error;
    }
  }

  @Delete(':noteId')
  async deleteNote(
    @Param('noteId') noteId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    await this.noteService.delete(noteId, doctorId);

    return {
      message: 'Consultation note deleted successfully',
    };
  }

  @Post(':noteId/link-prescription')
  async linkPrescription(
    @Param('noteId') noteId: string,
    @Request() req: AuthRequest,
    @Body('prescriptionId') prescriptionId: string,
  ) {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    if (!prescriptionId) {
      throw new BadRequestException('Prescription ID is required');
    }

    const note = await this.noteService.linkPrescription(noteId, doctorId, prescriptionId);

    return {
      message: 'Prescription linked to consultation note successfully',
      data: note,
    };
  }
}
