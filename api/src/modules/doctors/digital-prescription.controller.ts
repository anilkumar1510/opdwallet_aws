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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { DigitalPrescriptionService } from './digital-prescription.service';
import { PdfGenerationService } from './pdf-generation.service';
import { DiagnosisService } from './diagnosis.service';
import { SymptomsService } from './symptoms.service';
import { CreateDigitalPrescriptionDto, UpdateDigitalPrescriptionDto } from './dto/create-digital-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';

interface AuthRequest extends Request {
  user: {
    userId?: string;
    id?: string;
    doctorId?: string;
    name?: string;
    role: UserRole;
  };
}

@Controller('doctor/digital-prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorDigitalPrescriptionsController {
  constructor(
    private readonly digitalPrescriptionService: DigitalPrescriptionService,
    private readonly pdfGenerationService: PdfGenerationService,
  ) {}

  @Post()
  async createDigitalPrescription(
    @Body() createDto: CreateDigitalPrescriptionDto,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;
    const doctorName = req.user.name || 'Unknown Doctor';

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const prescription = await this.digitalPrescriptionService.createDigitalPrescription(
      createDto,
      doctorId,
      doctorName,
    );

    return {
      message: 'Digital prescription created successfully',
      prescription: prescription.toObject(),
    };
  }

  @Patch(':prescriptionId')
  async updateDigitalPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Body() updateDto: UpdateDigitalPrescriptionDto,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const prescription = await this.digitalPrescriptionService.updateDigitalPrescription(
      prescriptionId,
      updateDto,
      doctorId,
    );

    return {
      message: 'Digital prescription updated successfully',
      prescription: prescription.toObject(),
    };
  }

  @Get()
  async getDoctorDigitalPrescriptions(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const result = await this.digitalPrescriptionService.getDoctorDigitalPrescriptions(
      doctorId,
      +page,
      +limit,
    );

    return {
      message: 'Digital prescriptions retrieved successfully',
      ...result,
    };
  }

  @Get(':prescriptionId')
  async getDigitalPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const prescription = await this.digitalPrescriptionService.getDigitalPrescriptionById(
      prescriptionId,
      doctorId,
    );

    return {
      message: 'Digital prescription retrieved successfully',
      prescription: prescription.toObject(),
    };
  }

  @Post(':prescriptionId/generate-pdf')
  async generatePDF(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    // Verify prescription belongs to doctor
    await this.digitalPrescriptionService.getDigitalPrescriptionById(
      prescriptionId,
      doctorId,
    );

    const { filePath, fileName } = await this.pdfGenerationService.generatePrescriptionPDF(
      prescriptionId,
    );

    return {
      message: 'PDF generated successfully',
      fileName,
      downloadUrl: `/api/doctor/digital-prescriptions/${prescriptionId}/download-pdf`,
    };
  }

  @Get(':prescriptionId/download-pdf')
  async downloadPDF(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const prescription = await this.digitalPrescriptionService.getDigitalPrescriptionById(
      prescriptionId,
      doctorId,
    );

    if (!prescription.pdfGenerated || !prescription.pdfPath) {
      throw new BadRequestException('PDF not generated yet');
    }

    if (!existsSync(prescription.pdfPath)) {
      throw new BadRequestException('PDF file not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${prescription.pdfFileName}"`);

    const fileStream = createReadStream(prescription.pdfPath);
    fileStream.pipe(res);
  }

  @Delete(':prescriptionId')
  async deleteDigitalPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    await this.digitalPrescriptionService.deleteDigitalPrescription(prescriptionId, doctorId);

    return {
      message: 'Digital prescription deleted successfully',
    };
  }
}

// Medicine search controller
@Controller('medicines')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR, UserRole.MEMBER)
export class MedicinesController {
  constructor(
    private readonly digitalPrescriptionService: DigitalPrescriptionService,
  ) {}

  @Get('search')
  async searchMedicines(
    @Query('q') query: string,
    @Query('limit') limit = 20,
  ) {
    if (!query || query.trim().length < 2) {
      return {
        message: 'Search query must be at least 2 characters',
        medicines: [],
      };
    }

    const medicines = await this.digitalPrescriptionService.searchMedicines(
      query.trim(),
      +limit,
    );

    return {
      message: 'Medicines retrieved successfully',
      medicines,
    };
  }
}

// Diagnosis search controller
@Controller('diagnoses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR, UserRole.MEMBER)
export class DiagnosesController {
  constructor(
    private readonly diagnosisService: DiagnosisService,
  ) {}

  @Get('search')
  async searchDiagnoses(
    @Query('q') query: string,
    @Query('limit') limit = 20,
  ) {
    if (!query || query.trim().length < 2) {
      return {
        message: 'Search query must be at least 2 characters',
        diagnoses: [],
      };
    }

    const diagnoses = await this.diagnosisService.searchDiagnoses(
      query.trim(),
      +limit,
    );

    return {
      message: 'Diagnoses retrieved successfully',
      diagnoses,
    };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.diagnosisService.getCategories();

    return {
      message: 'Categories retrieved successfully',
      categories,
    };
  }
}

// Symptoms search controller
@Controller('symptoms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR, UserRole.MEMBER)
export class SymptomsController {
  constructor(
    private readonly symptomsService: SymptomsService,
  ) {}

  @Get('search')
  async searchSymptoms(
    @Query('q') query: string,
    @Query('limit') limit = 20,
  ) {
    if (!query || query.trim().length < 2) {
      return {
        message: 'Search query must be at least 2 characters',
        symptoms: [],
      };
    }

    const symptoms = await this.symptomsService.searchSymptoms(
      query.trim(),
      +limit,
    );

    return {
      message: 'Symptoms retrieved successfully',
      symptoms,
    };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.symptomsService.getCategories();

    return {
      message: 'Categories retrieved successfully',
      categories,
    };
  }
}

// Member digital prescriptions controller
@Controller('member/digital-prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER)
export class MemberDigitalPrescriptionsController {
  constructor(
    private readonly digitalPrescriptionService: DigitalPrescriptionService,
  ) {}

  @Get()
  async getMemberDigitalPrescriptions(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const result = await this.digitalPrescriptionService.getMemberDigitalPrescriptions(
      userId,
      +page,
      +limit,
    );

    return {
      message: 'Digital prescriptions retrieved successfully',
      ...result,
    };
  }

  @Get(':prescriptionId')
  async getDigitalPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const prescription = await this.digitalPrescriptionService.getMemberDigitalPrescriptionById(
      prescriptionId,
      userId,
    );

    return {
      message: 'Digital prescription retrieved successfully',
      prescription: prescription.toObject(),
    };
  }

  @Get(':prescriptionId/download-pdf')
  async downloadPDF(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const prescription = await this.digitalPrescriptionService.getMemberDigitalPrescriptionById(
      prescriptionId,
      userId,
    );

    if (!prescription.pdfGenerated || !prescription.pdfPath) {
      throw new BadRequestException('PDF not generated yet');
    }

    if (!existsSync(prescription.pdfPath)) {
      throw new BadRequestException('PDF file not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${prescription.pdfFileName}"`);

    const fileStream = createReadStream(prescription.pdfPath);
    fileStream.pipe(res);
  }
}
