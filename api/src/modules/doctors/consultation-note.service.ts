import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConsultationNote, ConsultationNoteDocument } from './schemas/consultation-note.schema';
import { CounterService } from '../counters/counter.service';

export interface CreateConsultationNoteDto {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  clinicId: string;
  consultationDate: Date | string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  clinicalFindings?: {
    generalExamination?: string;
    systemicExamination?: string;
    localExamination?: string;
  };
  provisionalDiagnosis?: string;
  investigationsOrdered?: string[];
  treatmentPlan?: string;
  followUpInstructions?: string;
  nextFollowUpDate?: Date | string;
  additionalNotes?: string;
  privateNotes?: string;
  prescriptionId?: string;
}

export interface UpdateConsultationNoteDto {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  clinicalFindings?: {
    generalExamination?: string;
    systemicExamination?: string;
    localExamination?: string;
  };
  provisionalDiagnosis?: string;
  investigationsOrdered?: string[];
  treatmentPlan?: string;
  followUpInstructions?: string;
  nextFollowUpDate?: Date | string;
  additionalNotes?: string;
  privateNotes?: string;
  prescriptionId?: string;
}

@Injectable()
export class ConsultationNoteService {
  constructor(
    @InjectModel(ConsultationNote.name)
    private noteModel: Model<ConsultationNoteDocument>,
    private counterService: CounterService,
  ) {}

  async create(dto: CreateConsultationNoteDto): Promise<ConsultationNoteDocument> {
    // Check if note already exists for this appointment
    const existing = await this.noteModel.findOne({
      appointmentId: dto.appointmentId,
      isActive: true,
    });

    if (existing) {
      throw new BadRequestException('Consultation note already exists for this appointment');
    }

    const noteId = await this.counterService.generateConsultationNoteId();

    const note = new this.noteModel({
      noteId,
      ...dto,
      consultationDate: new Date(dto.consultationDate),
      nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
    });

    return note.save();
  }

  async findOne(noteId: string, doctorId: string): Promise<ConsultationNoteDocument> {
    const note = await this.noteModel.findOne({
      noteId,
      doctorId,
      isActive: true,
    }).exec();

    if (!note) {
      throw new NotFoundException('Consultation note not found');
    }

    return note;
  }

  async findByAppointment(appointmentId: string, doctorId: string): Promise<ConsultationNoteDocument | null> {
    return this.noteModel.findOne({
      appointmentId,
      doctorId,
      isActive: true,
    }).exec();
  }

  async findAllByDoctor(
    doctorId: string,
    limit: number = 50,
    skip: number = 0,
  ): Promise<ConsultationNoteDocument[]> {
    return this.noteModel
      .find({ doctorId, isActive: true })
      .sort({ consultationDate: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async findAllByPatient(
    patientId: string,
    doctorId: string,
  ): Promise<ConsultationNoteDocument[]> {
    return this.noteModel
      .find({ patientId, doctorId, isActive: true })
      .sort({ consultationDate: -1 })
      .exec();
  }

  async update(
    noteId: string,
    doctorId: string,
    dto: UpdateConsultationNoteDto,
  ): Promise<ConsultationNoteDocument> {
    const note = await this.findOne(noteId, doctorId);

    const updateData: any = { ...dto };
    if (dto.nextFollowUpDate) {
      updateData.nextFollowUpDate = new Date(dto.nextFollowUpDate);
    }

    Object.assign(note, updateData);
    return note.save();
  }

  async delete(noteId: string, doctorId: string): Promise<void> {
    const note = await this.findOne(noteId, doctorId);
    note.isActive = false;
    await note.save();
  }

  async linkPrescription(
    noteId: string,
    doctorId: string,
    prescriptionId: string,
  ): Promise<ConsultationNoteDocument> {
    const note = await this.findOne(noteId, doctorId);
    note.prescriptionId = prescriptionId;
    return note.save();
  }
}
