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
    console.log('🔵 [DigitalPrescriptionController] ========== CREATE PRESCRIPTION START ==========');
    console.log('🔵 [DigitalPrescriptionController] POST /doctor/digital-prescriptions');
    console.log('🔵 [DigitalPrescriptionController] Request user:', JSON.stringify(req.user, null, 2));
    console.log('🔵 [DigitalPrescriptionController] Create DTO:', JSON.stringify(createDto, null, 2));

    const doctorId = req.user.doctorId;
    console.log('🔵 [DigitalPrescriptionController] Doctor ID from JWT:', doctorId);

    if (!doctorId) {
      console.error('❌ [DigitalPrescriptionController] No doctorId found in request!');
      throw new BadRequestException('Doctor ID is required');
    }

    try {
      // Fetch doctor details from database to get qualification and specialty
      console.log('🔍 [DigitalPrescriptionController] Fetching doctor details from database...');
      const doctor = await this.digitalPrescriptionService.getDoctorDetails(doctorId);

      if (!doctor) {
        console.error('❌ [DigitalPrescriptionController] Doctor not found in database:', doctorId);
        throw new BadRequestException('Doctor not found');
      }

      console.log('✅ [DigitalPrescriptionController] Doctor found:', {
        doctorId: doctor.doctorId,
        name: doctor.name,
        qualifications: doctor.qualifications,
        specialty: doctor.specialty,
        specializations: doctor.specializations,
        registrationNumber: doctor.registrationNumber,
      });

      const doctorName = doctor.name || 'Unknown Doctor';
      const doctorQualification = doctor.qualifications || '';
      const doctorSpecialty = doctor.specialty || (doctor.specializations && doctor.specializations.length > 0 ? doctor.specializations[0] : '');
      const doctorRegistrationNumber = doctor.registrationNumber || '';

      console.log('📝 [DigitalPrescriptionController] Creating prescription with doctor info:', {
        doctorId,
        doctorName,
        doctorQualification,
        doctorSpecialty,
        doctorRegistrationNumber,
      });

      const prescription = await this.digitalPrescriptionService.createDigitalPrescription(
        createDto,
        doctorId,
        doctorName,
        doctorQualification,
        doctorRegistrationNumber,
        doctorSpecialty,
      );

      console.log('✅ [DigitalPrescriptionController] Prescription created successfully:', prescription.prescriptionId);
      console.log('🔵 [DigitalPrescriptionController] ========== CREATE PRESCRIPTION END ==========');

      return {
        message: 'Digital prescription created successfully',
        prescription: prescription.toObject(),
      };
    } catch (error) {
      console.error('❌ [DigitalPrescriptionController] Error creating prescription:', error);
      console.error('❌ [DigitalPrescriptionController] Error stack:', error.stack);
      console.log('🔵 [DigitalPrescriptionController] ========== CREATE PRESCRIPTION ERROR END ==========');
      throw error;
    }
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

    let prescription = await this.digitalPrescriptionService.getDigitalPrescriptionById(
      prescriptionId,
      doctorId,
    );

    // Auto-generate PDF if it doesn't exist or file is missing
    if (!prescription.pdfGenerated || !prescription.pdfPath || !existsSync(prescription.pdfPath)) {
      console.log(`[PDF Download] PDF not found for ${prescriptionId}, generating now...`);

      // Generate the PDF
      const { filePath, fileName } = await this.pdfGenerationService.generatePrescriptionPDF(prescriptionId);

      // Reload prescription to get updated pdfPath
      prescription = await this.digitalPrescriptionService.getDigitalPrescriptionById(
        prescriptionId,
        doctorId,
      );

      console.log(`[PDF Download] PDF generated successfully: ${fileName}`);
    }

    // Final check - if still no PDF path, something went wrong
    if (!prescription.pdfPath || !existsSync(prescription.pdfPath)) {
      throw new BadRequestException('Failed to generate PDF');
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
    console.log('🔍 [MedicinesController] ========== MEDICINE SEARCH START ==========');
    console.log('🔍 [MedicinesController] GET /medicines/search');
    console.log('🔍 [MedicinesController] Query:', query);
    console.log('🔍 [MedicinesController] Limit:', limit);

    if (!query || query.trim().length < 2) {
      console.log('⚠️ [MedicinesController] Query too short (< 2 characters)');
      console.log('🔍 [MedicinesController] ========== MEDICINE SEARCH END (empty query) ==========');
      return {
        message: 'Search query must be at least 2 characters',
        medicines: [],
      };
    }

    try {
      console.log('🔍 [MedicinesController] Searching medicines with query:', query.trim());
      const medicines = await this.digitalPrescriptionService.searchMedicines(
        query.trim(),
        +limit,
      );

      console.log('✅ [MedicinesController] Medicines found:', medicines.length);
      console.log('✅ [MedicinesController] Sample results:', medicines.slice(0, 3).map(m => ({ genericName: m.genericName, brandNames: m.brandNames })));
      console.log('🔍 [MedicinesController] ========== MEDICINE SEARCH END ==========');

      return {
        message: 'Medicines retrieved successfully',
        medicines,
      };
    } catch (error) {
      console.error('❌ [MedicinesController] Error searching medicines:', error);
      console.error('❌ [MedicinesController] Error stack:', error.stack);
      console.log('🔍 [MedicinesController] ========== MEDICINE SEARCH ERROR END ==========');
      throw error;
    }
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
    console.log('🔍 [DiagnosesController] ========== DIAGNOSIS SEARCH START ==========');
    console.log('🔍 [DiagnosesController] GET /diagnoses/search');
    console.log('🔍 [DiagnosesController] Query:', query);
    console.log('🔍 [DiagnosesController] Limit:', limit);

    if (!query || query.trim().length < 2) {
      console.log('⚠️ [DiagnosesController] Query too short (< 2 characters)');
      console.log('🔍 [DiagnosesController] ========== DIAGNOSIS SEARCH END (empty query) ==========');
      return {
        message: 'Search query must be at least 2 characters',
        diagnoses: [],
      };
    }

    try {
      console.log('🔍 [DiagnosesController] Searching diagnoses with query:', query.trim());
      const diagnoses = await this.diagnosisService.searchDiagnoses(
        query.trim(),
        +limit,
      );

      console.log('✅ [DiagnosesController] Diagnoses found:', diagnoses.length);
      console.log('✅ [DiagnosesController] Sample results:', diagnoses.slice(0, 3).map(d => ({ diagnosisName: d.diagnosisName, icdCode: d.icdCode })));
      console.log('🔍 [DiagnosesController] ========== DIAGNOSIS SEARCH END ==========');

      return {
        message: 'Diagnoses retrieved successfully',
        diagnoses,
      };
    } catch (error) {
      console.error('❌ [DiagnosesController] Error searching diagnoses:', error);
      console.error('❌ [DiagnosesController] Error stack:', error.stack);
      console.log('🔍 [DiagnosesController] ========== DIAGNOSIS SEARCH ERROR END ==========');
      throw error;
    }
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
    console.log('🔍 [SymptomsController] ========== SYMPTOM SEARCH START ==========');
    console.log('🔍 [SymptomsController] GET /symptoms/search');
    console.log('🔍 [SymptomsController] Query:', query);
    console.log('🔍 [SymptomsController] Limit:', limit);

    if (!query || query.trim().length < 2) {
      console.log('⚠️ [SymptomsController] Query too short (< 2 characters)');
      console.log('🔍 [SymptomsController] ========== SYMPTOM SEARCH END (empty query) ==========');
      return {
        message: 'Search query must be at least 2 characters',
        symptoms: [],
      };
    }

    try {
      console.log('🔍 [SymptomsController] Searching symptoms with query:', query.trim());
      const symptoms = await this.symptomsService.searchSymptoms(
        query.trim(),
        +limit,
      );

      console.log('✅ [SymptomsController] Symptoms found:', symptoms.length);
      console.log('✅ [SymptomsController] Sample results:', symptoms.slice(0, 3).map(s => ({ symptomName: s.symptomName, category: s.category })));
      console.log('🔍 [SymptomsController] ========== SYMPTOM SEARCH END ==========');

      return {
        message: 'Symptoms retrieved successfully',
        symptoms,
      };
    } catch (error) {
      console.error('❌ [SymptomsController] Error searching symptoms:', error);
      console.error('❌ [SymptomsController] Error stack:', error.stack);
      console.log('🔍 [SymptomsController] ========== SYMPTOM SEARCH ERROR END ==========');
      throw error;
    }
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
    private readonly pdfGenerationService: PdfGenerationService,
  ) {}

  @Get()
  async getMemberDigitalPrescriptions(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('filterUsed') filterUsed?: string,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const result = await this.digitalPrescriptionService.getMemberDigitalPrescriptions(
      userId,
      +page,
      +limit,
      filterUsed === 'true',
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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] === START ===`);
    console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] Prescription ID:`, prescriptionId);
    console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] Request user:`, req.user);

    const userId = req.user.userId || req.user.id;
    console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] User ID extracted:`, userId);

    if (!userId) {
      console.error(`[${timestamp}] ❌ [MemberPrescriptionDownload] No user ID found`);
      throw new BadRequestException('User ID is required');
    }

    try {
      console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] Querying prescription from database...`);
      let prescription = await this.digitalPrescriptionService.getMemberDigitalPrescriptionById(
        prescriptionId,
        userId,
      );
      console.log(`[${timestamp}] ✅ [MemberPrescriptionDownload] Prescription found:`, {
        id: prescription.prescriptionId,
        userId: prescription.userId,
        pdfGenerated: prescription.pdfGenerated,
        pdfPath: prescription.pdfPath,
        pdfFileName: prescription.pdfFileName
      });

      // Auto-generate PDF if not generated yet or file is missing
      if (!prescription.pdfGenerated || !prescription.pdfPath || !existsSync(prescription.pdfPath)) {
        console.log(`[${timestamp}] ⚠️ [MemberPrescriptionDownload] PDF not generated or missing, generating now...`);
        await this.pdfGenerationService.generatePrescriptionPDF(prescriptionId);

        // Reload prescription to get updated PDF path
        console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] Reloading prescription after PDF generation...`);
        prescription = await this.digitalPrescriptionService.getMemberDigitalPrescriptionById(
          prescriptionId,
          userId,
        );
        console.log(`[${timestamp}] ✅ [MemberPrescriptionDownload] Prescription reloaded, pdfPath:`, prescription.pdfPath);
      }

      // Verify PDF path exists after generation
      if (!prescription.pdfPath) {
        console.error(`[${timestamp}] ❌ [MemberPrescriptionDownload] PDF path is null/undefined`);
        throw new BadRequestException('PDF generation failed - no file path');
      }

      console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] Checking if PDF file exists at:`, prescription.pdfPath);
      const fileExists = existsSync(prescription.pdfPath);
      console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] File exists:`, fileExists);

      if (!fileExists) {
        console.error(`[${timestamp}] ❌ [MemberPrescriptionDownload] PDF file not found at path:`, prescription.pdfPath);
        throw new BadRequestException('PDF file not found');
      }

      console.log(`[${timestamp}] ✅ [MemberPrescriptionDownload] Setting response headers...`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${prescription.pdfFileName}"`);
      console.log(`[${timestamp}] ✅ [MemberPrescriptionDownload] Headers set, filename:`, prescription.pdfFileName);

      console.log(`[${timestamp}] 🔵 [MemberPrescriptionDownload] Creating file stream and piping to response...`);
      const fileStream = createReadStream(prescription.pdfPath);
      fileStream.pipe(res);
      console.log(`[${timestamp}] ✅ [MemberPrescriptionDownload] === SUCCESS ===`);
    } catch (error) {
      console.error(`[${timestamp}] ❌ [MemberPrescriptionDownload] === ERROR ===`);
      console.error(`[${timestamp}] ❌ [MemberPrescriptionDownload] Error:`, error);
      console.error(`[${timestamp}] ❌ [MemberPrescriptionDownload] Error message:`, error.message);
      console.error(`[${timestamp}] ❌ [MemberPrescriptionDownload] Error stack:`, error.stack);
      throw error;
    }
  }
}
