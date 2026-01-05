import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  Res,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { DoctorAuthService } from './doctor-auth.service';
import { DoctorLoginDto } from './dto/doctor-login.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/common/constants/roles.enum';
import { signatureMulterConfig } from './config/signature-multer.config';

interface AuthRequest extends Request {
  user: {
    doctorId?: string;
    role: UserRole;
  };
}

@Controller('auth/doctor')
export class DoctorAuthController {
  constructor(private readonly doctorAuthService: DoctorAuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: DoctorLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('[DoctorAuthController] POST /auth/doctor/login received');
    console.log('[DoctorAuthController] Request body:', { email: loginDto?.email, passwordLength: loginDto?.password?.length });
    console.log('[DoctorAuthController] NODE_ENV:', process.env.NODE_ENV);

    try {
      console.log('[DoctorAuthController] Calling doctorAuthService.login...');
      const result = await this.doctorAuthService.login(loginDto);
      console.log('[DoctorAuthController] Login service returned successfully');
      console.log('[DoctorAuthController] Result doctor:', result.doctor);
      console.log('[DoctorAuthController] Result token length:', result.token?.length);

      // Set JWT in HTTP-only cookie (using opd_session for consistency with JWT strategy)
      console.log('[DoctorAuthController] Setting cookie opd_session...');
      console.log('[DoctorAuthController] NODE_ENV:', process.env.NODE_ENV);
      console.log('[DoctorAuthController] USE_HTTPS:', process.env.USE_HTTPS);

      // Only use secure flag if explicitly using HTTPS (not just production)
      const useSecure = process.env.USE_HTTPS === 'true';
      console.log('[DoctorAuthController] Cookie secure flag:', useSecure);

      res.cookie('opd_session', result.token, {
        httpOnly: true,
        secure: useSecure,
        sameSite: 'lax', // Changed from 'strict' to 'lax' for consistency with global config
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        path: '/', // CRITICAL: Ensure cookie is sent with all requests
      });
      console.log('[DoctorAuthController] Cookie set successfully');

      const response = {
        message: 'Login successful',
        doctor: result.doctor,
      };

      console.log('[DoctorAuthController] Sending response:', response);
      return response;
    } catch (error: any) {
      console.error('[DoctorAuthController] Login failed with error:', error);
      console.error('[DoctorAuthController] Error message:', error.message);
      console.error('[DoctorAuthController] Error stack:', error.stack);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('opd_session');

    return {
      message: 'Logout successful',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getProfile(@Request() req: AuthRequest) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const doctor = await this.doctorAuthService.getDoctorProfile(doctorId);

    return {
      message: 'Profile retrieved successfully',
      doctor: {
        doctorId: doctor.doctorId,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specializations: doctor.specializations,
        specialty: doctor.specialty,
        qualifications: doctor.qualifications,
        experienceYears: doctor.experienceYears,
        rating: doctor.rating,
        reviewCount: doctor.reviewCount,
        languages: doctor.languages,
        registrationNumber: doctor.registrationNumber,
      },
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async updateProfile(@Request() req: AuthRequest, @Body() updateData: any) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const doctor = await this.doctorAuthService.updateDoctorProfile(
      doctorId,
      updateData,
    );

    return {
      message: 'Profile updated successfully',
      doctor,
    };
  }

  // ==================== SIGNATURE MANAGEMENT ====================

  @Post('profile/signature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @UseInterceptors(FileInterceptor('signature', signatureMulterConfig))
  async uploadSignature(
    @Request() req: AuthRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    if (!file) {
      throw new BadRequestException('Signature file is required');
    }

    const result = await this.doctorAuthService.uploadSignature(doctorId, file);

    return {
      message: 'Signature uploaded successfully',
      signature: result,
    };
  }

  @Get('profile/signature/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getSignatureStatus(@Request() req: AuthRequest) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const status = await this.doctorAuthService.getSignatureStatus(doctorId);

    return {
      message: 'Signature status retrieved successfully',
      ...status,
    };
  }

  @Get('profile/signature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getSignature(@Request() req: AuthRequest, @Res() res: Response) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    const doctor = await this.doctorAuthService.getDoctorProfile(doctorId);

    if (!doctor || !doctor.signatureImage || !existsSync(doctor.signatureImage)) {
      throw new BadRequestException('Signature not found');
    }

    // Determine content type
    const ext = doctor.signatureImage.toLowerCase().split('.').pop();
    const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

    // NO cache headers - force browser to always fetch fresh
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const fileStream = createReadStream(doctor.signatureImage);
    fileStream.pipe(res);
  }

  @Delete('profile/signature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async deleteSignature(@Request() req: AuthRequest) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new BadRequestException('Doctor ID is required');
    }

    await this.doctorAuthService.deleteSignature(doctorId);

    return {
      message: 'Signature deleted successfully',
    };
  }
}
