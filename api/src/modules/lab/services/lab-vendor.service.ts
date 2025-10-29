import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LabVendor } from '../schemas/lab-vendor.schema';
import { LabVendorPricing } from '../schemas/lab-vendor-pricing.schema';
import { LabVendorSlot } from '../schemas/lab-vendor-slot.schema';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { CreatePricingDto } from '../dto/create-pricing.dto';

@Injectable()
export class LabVendorService {
  constructor(
    @InjectModel(LabVendor.name)
    private vendorModel: Model<LabVendor>,
    @InjectModel(LabVendorPricing.name)
    private pricingModel: Model<LabVendorPricing>,
    @InjectModel(LabVendorSlot.name)
    private slotModel: Model<LabVendorSlot>,
  ) {}

  async createVendor(createDto: CreateVendorDto): Promise<LabVendor> {
    const vendorId = `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if vendor code already exists
    const existingVendor = await this.vendorModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingVendor) {
      throw new ConflictException(`Vendor with code ${createDto.code} already exists`);
    }

    const vendor = new this.vendorModel({
      vendorId,
      name: createDto.name,
      code: createDto.code.toUpperCase(),
      contactInfo: createDto.contactInfo,
      serviceablePincodes: createDto.serviceablePincodes,
      homeCollection: createDto.homeCollection ?? true,
      centerVisit: createDto.centerVisit ?? true,
      description: createDto.description,
      isActive: true,
    });

    return vendor.save();
  }

  async getVendorById(vendorId: string): Promise<LabVendor> {
    const vendor = await this.vendorModel.findOne({ vendorId });

    if (!vendor) {
      throw new NotFoundException(`Vendor ${vendorId} not found`);
    }

    return vendor;
  }

  async getAllVendors(): Promise<LabVendor[]> {
    return this.vendorModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async getVendorsByPincode(pincode: string): Promise<LabVendor[]> {
    return this.vendorModel
      .find({
        isActive: true,
        serviceablePincodes: pincode,
      })
      .sort({ name: 1 })
      .exec();
  }

  async updateVendor(
    vendorId: string,
    updateDto: Partial<CreateVendorDto>,
  ): Promise<LabVendor> {
    const vendor = await this.getVendorById(vendorId);

    if (updateDto.name) {
      vendor.name = updateDto.name;
    }

    if (updateDto.code) {
      const existingVendor = await this.vendorModel.findOne({
        code: updateDto.code.toUpperCase(),
        vendorId: { $ne: vendorId },
      });

      if (existingVendor) {
        throw new ConflictException(`Vendor with code ${updateDto.code} already exists`);
      }

      vendor.code = updateDto.code.toUpperCase();
    }

    if (updateDto.contactInfo) {
      vendor.contactInfo = updateDto.contactInfo;
    }

    if (updateDto.serviceablePincodes) {
      vendor.serviceablePincodes = updateDto.serviceablePincodes;
    }

    if (updateDto.homeCollection !== undefined) {
      vendor.homeCollection = updateDto.homeCollection;
    }

    if (updateDto.centerVisit !== undefined) {
      vendor.centerVisit = updateDto.centerVisit;
    }

    if (updateDto.description !== undefined) {
      vendor.description = updateDto.description;
    }

    return vendor.save();
  }

  // Pricing Management
  async createPricing(createDto: CreatePricingDto): Promise<LabVendorPricing> {
    console.log('🔍 [LAB-VENDOR] Creating pricing:', {
      vendorId: createDto.vendorId,
      serviceId: createDto.serviceId,
      actualPrice: createDto.actualPrice,
      discountedPrice: createDto.discountedPrice,
    });

    // First get the vendor document by string vendorId to get MongoDB _id
    // This allows vendorId to be either the string "VENDOR-002" or a MongoDB _id
    const vendor = await this.getVendorById(createDto.vendorId);
    console.log('✅ [LAB-VENDOR] Found vendor MongoDB _id:', vendor._id);

    // Check if pricing already exists
    const existingPricing = await this.pricingModel.findOne({
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
      serviceId: new Types.ObjectId(createDto.serviceId),
    });

    if (existingPricing) {
      console.log('❌ [LAB-VENDOR] Pricing already exists for this vendor and service');
      throw new ConflictException('Pricing for this vendor and service already exists');
    }

    const pricing = new this.pricingModel({
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
      serviceId: new Types.ObjectId(createDto.serviceId),
      actualPrice: createDto.actualPrice,
      discountedPrice: createDto.discountedPrice,
      homeCollectionCharges: createDto.homeCollectionCharges ?? 0,
      isActive: true,
    });

    const saved = await pricing.save();
    console.log('✅ [LAB-VENDOR] Pricing created successfully:', saved._id);

    return saved;
  }

  async getVendorPricing(vendorId: string): Promise<any[]> {
    console.log('🔍 [LAB-VENDOR] Getting pricing for vendor:', vendorId);

    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);
    console.log('✅ [LAB-VENDOR] Found vendor MongoDB _id:', vendor._id);

    const pricingRecords = await this.pricingModel
      .find({
        vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
        isActive: true,
      })
      .populate('serviceId', 'name code category')
      .exec();

    console.log('✅ [LAB-VENDOR] Found pricing records:', pricingRecords.length);

    // Transform to flatten service data for frontend
    const transformedPricing = pricingRecords.map((pricing) => {
      const serviceData = pricing.serviceId as any;
      return {
        _id: pricing._id,
        serviceId: serviceData._id,
        serviceName: serviceData.name,
        serviceCode: serviceData.code,
        actualPrice: pricing.actualPrice,
        discountedPrice: pricing.discountedPrice,
        homeCollectionCharges: pricing.homeCollectionCharges,
        isActive: pricing.isActive,
      };
    });

    console.log('✅ [LAB-VENDOR] Transformed pricing records with service names');

    return transformedPricing;
  }

  async getPricingForService(
    vendorId: string,
    serviceId: string,
  ): Promise<LabVendorPricing | null> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    return this.pricingModel
      .findOne({
        vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
        serviceId: new Types.ObjectId(serviceId),
        isActive: true,
      })
      .populate('serviceId', 'name code category')
      .exec();
  }

  async updatePricing(
    vendorId: string,
    serviceId: string,
    updateDto: Partial<CreatePricingDto>,
  ): Promise<LabVendorPricing> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    const pricing = await this.pricingModel.findOne({
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
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

  // Slot Management
  async createSlot(
    vendorId: string,
    pincode: string,
    date: string,
    timeSlot: string,
    startTime: string,
    endTime: string,
    maxBookings: number = 5,
  ): Promise<LabVendorSlot> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    const slotId = `SLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const slot = new this.slotModel({
      slotId,
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
      pincode,
      date,
      timeSlot,
      startTime,
      endTime,
      maxBookings,
      currentBookings: 0,
      isActive: true,
    });

    return slot.save();
  }

  async getAvailableSlots(
    vendorId: string,
    pincode: string,
    date: string,
  ): Promise<LabVendorSlot[]> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    return this.slotModel
      .find({
        vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
        pincode,
        date,
        isActive: true,
        $expr: { $lt: ['$currentBookings', '$maxBookings'] },
      })
      .sort({ startTime: 1 })
      .exec();
  }

  async bookSlot(slotId: string): Promise<LabVendorSlot> {
    const slot = await this.slotModel.findOne({ slotId });

    if (!slot) {
      throw new NotFoundException(`Slot ${slotId} not found`);
    }

    if (slot.currentBookings >= slot.maxBookings) {
      throw new ConflictException('Slot is fully booked');
    }

    slot.currentBookings += 1;
    return slot.save();
  }

  /**
   * Get eligible vendors based on selected tests and pincode
   * Returns vendors that:
   * 1. Serve the specified pincode
   * 2. Have pricing for ALL selected tests
   */
  async getEligibleVendors(serviceIds: string[], pincode: string): Promise<any[]> {
    // Convert serviceIds to ObjectIds
    const serviceObjectIds = serviceIds.map(id => new Types.ObjectId(id));

    // Find vendors that serve this pincode
    const vendorsInPincode = await this.vendorModel.find({
      isActive: true,
      serviceablePincodes: pincode,
    });

    if (vendorsInPincode.length === 0) {
      return [];
    }

    const eligibleVendors = [];

    // For each vendor, check if they have pricing for ALL selected tests
    for (const vendor of vendorsInPincode) {
      const vendorPricing = await this.pricingModel.find({
        vendorId: vendor._id,
        serviceId: { $in: serviceObjectIds },
        isActive: true,
      }).populate('serviceId', 'name code category');

      // Vendor is eligible only if they have pricing for ALL tests
      if (vendorPricing.length === serviceIds.length) {
        // Calculate total price
        const totalActualPrice = vendorPricing.reduce((sum, p) => sum + p.actualPrice, 0);
        const totalDiscountedPrice = vendorPricing.reduce((sum, p) => sum + p.discountedPrice, 0);

        eligibleVendors.push({
          _id: vendor._id,
          vendorId: vendor.vendorId,
          name: vendor.name,
          code: vendor.code,
          homeCollection: vendor.homeCollection,
          centerVisit: vendor.centerVisit,
          homeCollectionCharges: vendor.homeCollectionCharges,
          pricing: vendorPricing.map(p => ({
            serviceId: (p.serviceId as any)._id,
            serviceName: (p.serviceId as any).name,
            serviceCode: (p.serviceId as any).code,
            actualPrice: p.actualPrice,
            discountedPrice: p.discountedPrice,
          })),
          totalActualPrice,
          totalDiscountedPrice,
          totalWithHomeCollection: totalDiscountedPrice + (vendor.homeCollectionCharges || 0),
        });
      }
    }

    // Sort by total price (cheapest first)
    eligibleVendors.sort((a, b) => a.totalDiscountedPrice - b.totalDiscountedPrice);

    return eligibleVendors;
  }

  /**
   * Get selected vendors with pricing for cart items
   * Used by members to see vendor comparison for their cart
   */
  async getSelectedVendorsForCart(
    selectedVendorIds: Types.ObjectId[],
    serviceIds: Types.ObjectId[],
  ): Promise<any[]> {
    if (selectedVendorIds.length === 0) {
      return [];
    }

    const selectedVendors = [];

    // For each selected vendor, get their pricing for the cart items
    for (const vendorId of selectedVendorIds) {
      const vendor = await this.vendorModel.findById(vendorId);

      if (!vendor || !vendor.isActive) {
        continue;
      }

      const vendorPricing = await this.pricingModel.find({
        vendorId: vendor._id,
        serviceId: { $in: serviceIds },
        isActive: true,
      }).populate('serviceId', 'name code category');

      // Only include vendor if they have pricing for all tests
      if (vendorPricing.length === serviceIds.length) {
        // Calculate total price
        const totalActualPrice = vendorPricing.reduce((sum, p) => sum + p.actualPrice, 0);
        const totalDiscountedPrice = vendorPricing.reduce((sum, p) => sum + p.discountedPrice, 0);

        selectedVendors.push({
          _id: vendor._id,
          vendorId: vendor.vendorId,
          name: vendor.name,
          code: vendor.code,
          homeCollection: vendor.homeCollection,
          centerVisit: vendor.centerVisit,
          homeCollectionCharges: vendor.homeCollectionCharges,
          pricing: vendorPricing.map(p => ({
            serviceId: (p.serviceId as any)._id,
            serviceName: (p.serviceId as any).name,
            serviceCode: (p.serviceId as any).code,
            actualPrice: p.actualPrice,
            discountedPrice: p.discountedPrice,
          })),
          totalActualPrice,
          totalDiscountedPrice,
          totalWithHomeCollection: totalDiscountedPrice + (vendor.homeCollectionCharges || 0),
        });
      }
    }

    // Sort by total price (cheapest first)
    selectedVendors.sort((a, b) => a.totalDiscountedPrice - b.totalDiscountedPrice);

    return selectedVendors;
  }
}
