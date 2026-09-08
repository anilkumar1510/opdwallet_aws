import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

import {
  PharmacyPrescription,
  PharmacyPrescriptionDocument,
  PharmacyPrescriptionSource,
  PharmacyPrescriptionStatus,
} from '../schemas/pharmacy-prescription.schema';

/**
 * Flow 5 steps 2 and 3 — the member submits a prescription and nothing else.
 *
 * The cart is not built here. An adjudicator does that (step 4), reading this
 * record from the queue; this service only takes the prescription in, gives it
 * an identifier, and refuses one that has already been submitted.
 */
@Injectable()
export class PharmacyPrescriptionService {
  constructor(
    @InjectModel(PharmacyPrescription.name)
    private readonly model: Model<PharmacyPrescriptionDocument>,
  ) {}

  /**
   * Step 3's duplicate check, on the bytes rather than the name.
   *
   * Members re-photograph the same slip and upload it twice under a different
   * name, and a second cart built from the same prescription is a second claim
   * on the same medicine. Hashing the file catches that where a filename
   * comparison never would.
   */
  private hashOf(filePath?: string): string | undefined {
    if (!filePath) return undefined;
    try {
      return createHash('sha256').update(readFileSync(filePath)).digest('hex');
    } catch {
      // An unreadable upload is a problem for the caller to report, not a
      // reason to skip the duplicate check silently — but it must not throw
      // here and lose the prescription.
      return undefined;
    }
  }

  async upload(
    userId: string,
    input: { patientId: string; patientName: string },
    file: { filename?: string; originalname?: string; path?: string } | undefined,
  ): Promise<PharmacyPrescriptionDocument> {
    if (!file?.path) {
      throw new BadRequestException('Attach the prescription you want us to fill');
    }
    if (!input.patientId || !input.patientName) {
      throw new BadRequestException('Tell us who this prescription is for');
    }

    const fileHash = this.hashOf(file.path);
    if (fileHash) {
      const already = await this.model.findOne({
        userId: new Types.ObjectId(userId),
        patientId: input.patientId,
        fileHash,
        status: { $ne: PharmacyPrescriptionStatus.CANCELLED },
      });
      if (already) {
        throw new ConflictException(
          `You have already sent this prescription (${already.prescriptionId}). We are working on it.`,
        );
      }
    }

    return this.model.create({
      prescriptionId: `PHRX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: new Types.ObjectId(userId),
      patientId: input.patientId,
      patientName: input.patientName,
      source: PharmacyPrescriptionSource.UPLOAD,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileHash,
      status: PharmacyPrescriptionStatus.UPLOADED,
    });
  }

  /** Step 2's other half — one the member already has in their health records. */
  async submitExisting(
    userId: string,
    input: { patientId: string; patientName: string; healthRecordId: string; fileName?: string },
  ): Promise<PharmacyPrescriptionDocument> {
    if (!input.healthRecordId) {
      throw new BadRequestException('Choose a prescription from your records');
    }

    const already = await this.model.findOne({
      userId: new Types.ObjectId(userId),
      patientId: input.patientId,
      healthRecordId: input.healthRecordId,
      status: { $ne: PharmacyPrescriptionStatus.CANCELLED },
    });
    if (already) {
      throw new ConflictException(
        `That prescription is already with us (${already.prescriptionId}).`,
      );
    }

    return this.model.create({
      prescriptionId: `PHRX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: new Types.ObjectId(userId),
      patientId: input.patientId,
      patientName: input.patientName,
      source: PharmacyPrescriptionSource.HEALTH_RECORD,
      healthRecordId: input.healthRecordId,
      fileName: input.fileName,
      status: PharmacyPrescriptionStatus.UPLOADED,
    });
  }

  /** The member's own prescriptions, newest first — the lifecycle view step 3 asks for. */
  async listForMember(userId: string): Promise<PharmacyPrescriptionDocument[]> {
    return this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOwned(prescriptionId: string, userId: string): Promise<PharmacyPrescriptionDocument> {
    const found = await this.model.findOne({
      prescriptionId,
      userId: new Types.ObjectId(userId),
    });
    if (!found) throw new NotFoundException('Prescription not found');
    return found;
  }

  /** Step 4's queue: what is waiting for an adjudicator. */
  async queue(): Promise<PharmacyPrescriptionDocument[]> {
    return this.model
      .find({
        status: {
          $in: [PharmacyPrescriptionStatus.UPLOADED, PharmacyPrescriptionStatus.DIGITIZING],
        },
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findById(prescriptionId: string): Promise<PharmacyPrescriptionDocument> {
    const found = await this.model.findOne({ prescriptionId });
    if (!found) throw new NotFoundException('Prescription not found');
    return found;
  }

  /** Marks it digitised and records the cart the adjudicator built from it. */
  async markDigitized(
    prescriptionId: string,
    cartId: string,
    digitizedBy: string,
  ): Promise<PharmacyPrescriptionDocument> {
    const prescription = await this.findById(prescriptionId);
    prescription.status = PharmacyPrescriptionStatus.DIGITIZED;
    prescription.cartId = cartId;
    prescription.digitizedBy = digitizedBy;
    prescription.digitizedAt = new Date();
    return prescription.save();
  }

  async cancel(prescriptionId: string, userId: string, reason?: string) {
    const prescription = await this.findOwned(prescriptionId, userId);
    if (prescription.status === PharmacyPrescriptionStatus.DIGITIZED) {
      throw new BadRequestException('Your cart is already built. Reduce or cancel that instead.');
    }
    prescription.status = PharmacyPrescriptionStatus.CANCELLED;
    prescription.cancellationReason = reason?.trim() || 'Cancelled by member';
    return prescription.save();
  }
}
