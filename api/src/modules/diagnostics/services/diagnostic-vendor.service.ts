import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosticVendor } from '../schemas/diagnostic-vendor.schema';
import { DiagnosticVendorPricing } from '../schemas/diagnostic-vendor-pricing.schema';
import { DiagnosticVendorSlot, TimeSlot } from '../schemas/diagnostic-vendor-slot.schema';

export interface CreateDiagnosticVendorDto {
  name: string;
  code: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  serviceablePincodes: string[];
  equipmentCapabilities: {
    ctScan?: boolean;
    mri?: boolean;
    xRay?: boolean;
    ultrasound?: boolean;
    ecg?: boolean;
    echo?: boolean;
    mammography?: boolean;
    petScan?: boolean;
    boneDensity?: boolean;
  };
  homeCollection?: boolean;
  centerVisit?: boolean;
  homeCollectionCharges?: number;
  description?: string;
  labVendorId?: string;
}

export interface CreateDiagnosticPricingDto {
  vendorId: string;
  serviceId: string;
  actualPrice: number;
  discountedPrice: number;
  homeCollectionCharges?: number;
}

@Injectable()
export class DiagnosticVendorService {
  constructor(
    @InjectModel(DiagnosticVendor.name)
    private diagnosticVendorModel: Model<DiagnosticVendor>,
    @InjectModel(DiagnosticVendorPricing.name)
    private diagnosticVendorPricingModel: Model<DiagnosticVendorPricing>,
    @InjectModel(DiagnosticVendorSlot.name)
    private diagnosticVendorSlotModel: Model<DiagnosticVendorSlot>,
  ) {}

  // ============ VENDOR MANAGEMENT ============

  async createVendor(createDto: CreateDiagnosticVendorDto): Promise<DiagnosticVendor> {
    const vendorId = `DIAG-VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if vendor code already exists
    const existingVendor = await this.diagnosticVendorModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingVendor) {
      throw new ConflictException(`Diagnostic vendor with code ${createDto.code} already exists`);
    }

    const vendor = new this.diagnosticVendorModel({
      vendorId,
      name: createDto.name,
      code: createDto.code.toUpperCase(),
      contactInfo: createDto.contactInfo,
      serviceablePincodes: createDto.serviceablePincodes,
      equipmentCapabilities: createDto.equipmentCapabilities,
      homeCollection: createDto.homeCollection !== false,
      centerVisit: createDto.centerVisit !== false,
      homeCollectionCharges: createDto.homeCollectionCharges || 100,
      description: createDto.description,
      labVendorId: createDto.labVendorId ? new Types.ObjectId(createDto.labVendorId) : undefined,
      isActive: true,
    });

    return vendor.save();
  }

  async getVendorById(vendorId: string): Promise<DiagnosticVendor> {
    const vendor = await this.diagnosticVendorModel.findOne({ vendorId });

    if (!vendor) {
      throw new NotFoundException(`Diagnostic vendor ${vendorId} not found`);
    }

    return vendor;
  }

  async getAllVendors(): Promise<DiagnosticVendor[]> {
    return this.diagnosticVendorModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async getVendorsByPincode(pincode: string): Promise<DiagnosticVendor[]> {
    return this.diagnosticVendorModel
      .find({
        isActive: true,
        serviceablePincodes: pincode,
      })
      .sort({ name: 1 })
      .exec();
  }

  async updateVendor(
    vendorId: string,
    updateDto: Partial<CreateDiagnosticVendorDto>,
  ): Promise<DiagnosticVendor> {
    const vendor = await this.getVendorById(vendorId);

    if (updateDto.name) {
      vendor.name = updateDto.name;
    }

    if (updateDto.code) {
      const existingVendor = await this.diagnosticVendorModel.findOne({
        code: updateDto.code.toUpperCase(),
        vendorId: { $ne: vendorId },
      });

      if (existingVendor) {
        throw new ConflictException(`Diagnostic vendor with code ${updateDto.code} already exists`);
      }

      vendor.code = updateDto.code.toUpperCase();
    }

    if (updateDto.contactInfo) {
      vendor.contactInfo = updateDto.contactInfo;
    }

    if (updateDto.serviceablePincodes) {
      vendor.serviceablePincodes = updateDto.serviceablePincodes;
    }

    if (updateDto.equipmentCapabilities) {
      vendor.equipmentCapabilities = {
        ...vendor.equipmentCapabilities,
        ...updateDto.equipmentCapabilities,
      };
    }

    if (updateDto.homeCollection !== undefined) {
      vendor.homeCollection = updateDto.homeCollection;
    }

    if (updateDto.centerVisit !== undefined) {
      vendor.centerVisit = updateDto.centerVisit;
    }

    if (updateDto.homeCollectionCharges !== undefined) {
      vendor.homeCollectionCharges = updateDto.homeCollectionCharges;
    }

    if (updateDto.description !== undefined) {
      vendor.description = updateDto.description;
    }

    return vendor.save();
  }

  // ============ PRICING MANAGEMENT ============

  async createPricing(createDto: CreateDiagnosticPricingDto): Promise<DiagnosticVendorPricing> {
    // Check if pricing already exists
    const existingPricing = await this.diagnosticVendorPricingModel.findOne({
      vendorId: new Types.ObjectId(createDto.vendorId),
      serviceId: new Types.ObjectId(createDto.serviceId),
    });

    if (existingPricing) {
      throw new ConflictException('Pricing for this service already exists for this vendor');
    }

    const pricing = new this.diagnosticVendorPricingModel({
      vendorId: new Types.ObjectId(createDto.vendorId),
      serviceId: new Types.ObjectId(createDto.serviceId),
      actualPrice: createDto.actualPrice,
      discountedPrice: createDto.discountedPrice,
      homeCollectionCharges: createDto.homeCollectionCharges || 0,
      isActive: true,
    });

    return pricing.save();
  }

  async getVendorPricing(vendorId: string): Promise<any[]> {
    const pricing = await this.diagnosticVendorPricingModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        isActive: true,
      })
      .populate('serviceId')
      .exec();

    return pricing.map((p: any) => ({
      _id: p._id,
      serviceId: p.serviceId._id,
      serviceName: p.serviceId.name,
      serviceCode: p.serviceId.code,
      category: p.serviceId.category,
      actualPrice: p.actualPrice,
      discountedPrice: p.discountedPrice,
      homeCollectionCharges: p.homeCollectionCharges,
      isActive: p.isActive,
    }));
  }

  async updatePricing(
    vendorId: string,
    serviceId: string,
    updateDto: Partial<CreateDiagnosticPricingDto>,
  ): Promise<DiagnosticVendorPricing> {
    const pricing = await this.diagnosticVendorPricingModel.findOne({
      vendorId: new Types.ObjectId(vendorId),
      serviceId: new Types.ObjectId(serviceId),
    });

    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }

    if (updateDto.actualPrice !== undefined) {
      pricing.actualPrice = updateDto.actualPrice;
    }

    if (updateDto.discountedPrice !== undefined) {
      pricing.discountedPrice = updateDto.discountedPrice;
    }

    if (updateDto.homeCollectionCharges !== undefined) {
      pricing.homeCollectionCharges = updateDto.homeCollectionCharges;
    }

    return pricing.save();
  }

  // ============ SLOT MANAGEMENT ============

  async createSlot(
    vendorId: string,
    pincode: string,
    date: string,
    timeSlot: string,
    startTime: string,
    endTime: string,
    maxBookings: number = 5,
  ): Promise<DiagnosticVendorSlot> {
    const slotId = `DIAG-SLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if slot already exists
    const existingSlot = await this.diagnosticVendorSlotModel.findOne({
      vendorId: new Types.ObjectId(vendorId),
      pincode,
      date,
      timeSlot,
    });

    if (existingSlot) {
      throw new ConflictException('Slot already exists for this time');
    }

    const slot = new this.diagnosticVendorSlotModel({
      slotId,
      vendorId: new Types.ObjectId(vendorId),
      pincode,
      date,
      timeSlot: timeSlot as TimeSlot,
      startTime,
      endTime,
      maxBookings,
      currentBookings: 0,
      isActive: true,
    });

    return slot.save();
  }

  async getAvailableSlots(vendorId: string, pincode: string, date: string): Promise<DiagnosticVendorSlot[]> {
    return this.diagnosticVendorSlotModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        pincode,
        date,
        isActive: true,
      })
      .sort({ startTime: 1 })
      .exec();
  }

  async bookSlot(slotId: string): Promise<DiagnosticVendorSlot> {
    const slot = await this.diagnosticVendorSlotModel.findOne({ slotId });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.currentBookings >= slot.maxBookings) {
      throw new ConflictException('Slot is fully booked');
    }

    slot.currentBookings += 1;
    return slot.save();
  }

  async releaseSlot(slotId: string): Promise<DiagnosticVendorSlot> {
    const slot = await this.diagnosticVendorSlotModel.findOne({ slotId });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.currentBookings > 0) {
      slot.currentBookings -= 1;
    }

    return slot.save();
  }
}
