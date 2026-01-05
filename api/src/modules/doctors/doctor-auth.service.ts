import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { DoctorLoginDto } from './dto/doctor-login.dto';
import { ConfigService } from '@nestjs/config';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DoctorAuthService {
  constructor(
    @InjectModel(Doctor.name)
    private doctorModel: Model<DoctorDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateDoctor(email: string, password: string): Promise<DoctorDocument> {
    console.log('[DoctorAuthService] validateDoctor called');
    console.log('[DoctorAuthService] Email:', email);
    console.log('[DoctorAuthService] Password length:', password?.length);

    console.log('[DoctorAuthService] Searching for doctor with email:', email);
    const doctor = await this.doctorModel.findOne({ email, isActive: true });

    console.log('[DoctorAuthService] Doctor found:', !!doctor);
    if (doctor) {
      console.log('[DoctorAuthService] Doctor ID:', doctor.doctorId);
      console.log('[DoctorAuthService] Doctor name:', doctor.name);
      console.log('[DoctorAuthService] Doctor has password:', !!doctor.password);
      console.log('[DoctorAuthService] Doctor isActive:', doctor.isActive);
    }

    if (!doctor) {
      console.error('[DoctorAuthService] No doctor found with email:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!doctor.password) {
      console.error('[DoctorAuthService] Doctor has no password set:', doctor.doctorId);
      throw new UnauthorizedException('Doctor account not configured for login');
    }

    console.log('[DoctorAuthService] Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    console.log('[DoctorAuthService] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.error('[DoctorAuthService] Invalid password for doctor:', doctor.doctorId);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('[DoctorAuthService] Validation successful for doctor:', doctor.doctorId);
    return doctor;
  }

  async login(loginDto: DoctorLoginDto): Promise<{ doctor: any; token: string }> {
    console.log('[DoctorAuthService] login called');
    console.log('[DoctorAuthService] Login DTO:', { email: loginDto.email, passwordLength: loginDto.password?.length });

    const doctor = await this.validateDoctor(loginDto.email, loginDto.password);

    console.log('[DoctorAuthService] Validation passed, updating last login...');
    // Update last login
    await this.doctorModel.updateOne(
      { _id: doctor._id },
      { lastLogin: new Date() },
    );

    console.log('[DoctorAuthService] Creating JWT payload...');
    const payload = {
      email: doctor.email,
      doctorId: doctor.doctorId,
      id: (doctor._id as any).toString(),
      name: doctor.name,
      role: 'DOCTOR',
    };
    console.log('[DoctorAuthService] JWT payload:', payload);

    const jwtSecret = this.configService.get('DOCTOR_JWT_SECRET') || this.configService.get('JWT_SECRET');
    const jwtExpiry = this.configService.get('DOCTOR_JWT_EXPIRY') || '8h';
    console.log('[DoctorAuthService] JWT secret exists:', !!jwtSecret);
    console.log('[DoctorAuthService] JWT expiry:', jwtExpiry);

    console.log('[DoctorAuthService] Signing JWT token...');
    const token = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiry,
    });
    console.log('[DoctorAuthService] JWT token created, length:', token?.length);

    const response = {
      doctor: {
        doctorId: doctor.doctorId,
        name: doctor.name,
        email: doctor.email,
        specializations: doctor.specializations,
        specialty: doctor.specialty,
        role: 'DOCTOR',
      },
      token,
    };

    console.log('[DoctorAuthService] Login successful, returning response');
    console.log('[DoctorAuthService] Response doctor:', response.doctor);
    return response;
  }

  async getDoctorProfile(doctorId: string): Promise<DoctorDocument> {
    // Force fresh query with no caching
    const doctor = await this.doctorModel
      .findOne({ doctorId, isActive: true })
      .lean(false) // Get full document, no caching
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async updateDoctorProfile(
    doctorId: string,
    updateData: Partial<Doctor>,
  ): Promise<DoctorDocument> {
    // Don't allow updating critical fields
    delete (updateData as any).doctorId;
    delete (updateData as any).email;
    delete (updateData as any).role;
    delete (updateData as any).password;

    const doctor = await this.doctorModel.findOneAndUpdate(
      { doctorId, isActive: true },
      { $set: updateData },
      { new: true },
    );

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async setDoctorPassword(doctorId: string, password: string): Promise<void> {
    const hashedPassword = await this.hashPassword(password);

    await this.doctorModel.updateOne(
      { doctorId },
      { password: hashedPassword },
    );
  }

  // ==================== SIGNATURE MANAGEMENT ====================

  async uploadSignature(
    doctorId: string,
    file: Express.Multer.File,
  ): Promise<{
    hasSignature: boolean;
    uploadedAt: Date;
    previewUrl: string;
  }> {
    console.log('[SIGNATURE-UPLOAD] Starting upload for doctorId:', doctorId);
    console.log('[SIGNATURE-UPLOAD] File path:', file.path);
    console.log('[SIGNATURE-UPLOAD] File exists:', existsSync(file.path));

    const doctor = await this.doctorModel.findOne({ doctorId, isActive: true });

    if (!doctor) {
      console.error('[SIGNATURE-UPLOAD] Doctor not found:', doctorId);
      throw new NotFoundException('Doctor not found');
    }

    console.log('[SIGNATURE-UPLOAD] Doctor found, current signature:', doctor.signatureImage);
    console.log('[SIGNATURE-UPLOAD] Has valid signature before:', doctor.hasValidSignature);

    // Delete old signature file if exists
    if (doctor.signatureImage && existsSync(doctor.signatureImage)) {
      try {
        unlinkSync(doctor.signatureImage);
        console.log('[SIGNATURE-UPLOAD] Deleted old signature file');
      } catch (error) {
        console.error('[SIGNATURE-UPLOAD] Error deleting old signature:', error);
      }
    }

    // Update doctor with new signature info using findOneAndUpdate for atomic operation
    const uploadedAt = new Date();
    const updatedDoctor = await this.doctorModel.findOneAndUpdate(
      { doctorId, isActive: true },
      {
        $set: {
          signatureImage: file.path,
          signatureUploadedAt: uploadedAt,
          hasValidSignature: true,
        },
      },
      {
        new: true, // Return updated document
        runValidators: true,
        lean: false // Get full mongoose document
      }
    );

    if (!updatedDoctor) {
      console.error('[SIGNATURE-UPLOAD] Failed to update doctor document');
      throw new Error('Failed to update signature');
    }

    console.log('[SIGNATURE-UPLOAD] ✅ Doctor updated successfully');
    console.log('[SIGNATURE-UPLOAD] New signature path:', updatedDoctor.signatureImage);
    console.log('[SIGNATURE-UPLOAD] Has valid signature after:', updatedDoctor.hasValidSignature);
    console.log('[SIGNATURE-UPLOAD] Uploaded at:', updatedDoctor.signatureUploadedAt);

    // Verify file exists on disk
    if (!existsSync(file.path)) {
      console.error('[SIGNATURE-UPLOAD] ❌ File does not exist on disk after upload:', file.path);
      throw new Error('Signature file not found on disk');
    }

    console.log('[SIGNATURE-UPLOAD] ✅ File verified on disk');

    return {
      hasSignature: true,
      uploadedAt,
      previewUrl: `/uploads/signatures/${file.filename}`,
    };
  }

  async getSignatureStatus(doctorId: string): Promise<{
    hasSignature: boolean;
    uploadedAt?: Date;
    previewUrl?: string;
  }> {
    console.log('[SIGNATURE-STATUS] Fetching status for doctorId:', doctorId);

    // Force fresh query with lean() disabled to avoid caching
    const doctor = await this.doctorModel
      .findOne({ doctorId, isActive: true })
      .lean(false) // Get full document, no caching
      .exec();

    if (!doctor) {
      console.error('[SIGNATURE-STATUS] Doctor not found:', doctorId);
      throw new NotFoundException('Doctor not found');
    }

    console.log('[SIGNATURE-STATUS] Doctor found');
    console.log('[SIGNATURE-STATUS] hasValidSignature:', doctor.hasValidSignature);
    console.log('[SIGNATURE-STATUS] signatureImage:', doctor.signatureImage);
    console.log('[SIGNATURE-STATUS] signatureUploadedAt:', doctor.signatureUploadedAt);

    // Check if file exists on disk
    if (doctor.signatureImage) {
      const fileExists = existsSync(doctor.signatureImage);
      console.log('[SIGNATURE-STATUS] File exists on disk:', fileExists);

      if (!fileExists) {
        console.error('[SIGNATURE-STATUS] ❌ DB has signature path but file missing on disk:', doctor.signatureImage);
        // File is missing, update DB to reflect this
        await this.doctorModel.updateOne(
          { doctorId },
          { $set: { hasValidSignature: false } }
        );
        return { hasSignature: false };
      }
    }

    if (!doctor.hasValidSignature || !doctor.signatureImage) {
      console.log('[SIGNATURE-STATUS] No valid signature found');
      return { hasSignature: false };
    }

    // Extract filename from path
    const filename = doctor.signatureImage.split('/').pop() || doctor.signatureImage.split('\\').pop();

    console.log('[SIGNATURE-STATUS] ✅ Valid signature found, filename:', filename);

    return {
      hasSignature: true,
      uploadedAt: doctor.signatureUploadedAt,
      // ServeStaticModule now serves at /api/uploads
      previewUrl: `/api/uploads/signatures/${filename}`,
    };
  }

  async deleteSignature(doctorId: string): Promise<void> {
    const doctor = await this.doctorModel.findOne({ doctorId, isActive: true });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Delete signature file if exists
    if (doctor.signatureImage && existsSync(doctor.signatureImage)) {
      try {
        unlinkSync(doctor.signatureImage);
      } catch (error) {
        console.error('Error deleting signature file:', error);
      }
    }

    // Update doctor record
    await this.doctorModel.updateOne(
      { doctorId },
      {
        $set: {
          signatureImage: undefined,
          signatureUploadedAt: undefined,
          hasValidSignature: false,
        },
      },
    );
  }
}
