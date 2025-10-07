import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { PrescriptionsService } from './prescriptions.service';
import { UploadPrescriptionDto } from './dto/upload-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { prescriptionMulterConfig } from './config/prescription-multer.config';

interface AuthRequest extends Request {
  user: {
    userId?: string;
    id?: string;
    doctorId?: string;
    name?: string;
    role: UserRole;
  };
}

@Controller('doctor/prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorPrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', prescriptionMulterConfig))
  async uploadPrescription(
    @Body() uploadDto: UploadPrescriptionDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequest,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    const doctorId = req.user.doctorId;
    const doctorName = req.user.name || 'Unknown Doctor';

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const prescription = await this.prescriptionsService.uploadPrescription(
      uploadDto,
      doctorId,
      doctorName,
      file,
    );

    return {
      message: 'Prescription uploaded successfully',
      prescription: prescription.toObject(),
    };
  }

  @Get()
  async getDoctorPrescriptions(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const result = await this.prescriptionsService.getDoctorPrescriptions(
      doctorId,
      +page,
      +limit,
    );

    return {
      message: 'Prescriptions retrieved successfully',
      ...result,
    };
  }

  @Get(':prescriptionId')
  async getPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const prescription = await this.prescriptionsService.getPrescriptionById(
      prescriptionId,
      doctorId,
    );

    return {
      message: 'Prescription retrieved successfully',
      prescription: prescription.toObject(),
    };
  }

  @Delete(':prescriptionId')
  async deletePrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    await this.prescriptionsService.deletePrescription(prescriptionId, doctorId);

    return {
      message: 'Prescription deleted successfully',
    };
  }
}

@Controller('member/prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER)
export class MemberPrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  async getMemberPrescriptions(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const result = await this.prescriptionsService.getMemberPrescriptions(
      userId,
      +page,
      +limit,
    );

    return {
      message: 'Prescriptions retrieved successfully',
      ...result,
    };
  }

  @Get(':prescriptionId')
  async getPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const prescription = await this.prescriptionsService.getMemberPrescriptionById(
      prescriptionId,
      userId,
    );

    return {
      message: 'Prescription retrieved successfully',
      prescription: prescription.toObject(),
    };
  }

  @Get(':prescriptionId/download')
  async downloadPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const prescription = await this.prescriptionsService.getMemberPrescriptionById(
      prescriptionId,
      userId,
    );

    if (!existsSync(prescription.filePath)) {
      throw new BadRequestException('File not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${prescription.fileName}"`);

    const fileStream = createReadStream(prescription.filePath);
    fileStream.pipe(res);
  }
}
