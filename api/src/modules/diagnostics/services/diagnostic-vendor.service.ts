import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiagnosticVendor } from '../schemas/diagnostic-vendor.schema';
import { DiagnosticVendorPricing } from '../schemas/diagnostic-vendor-pricing.schema';
import { DiagnosticVendorSlot, TimeSlot } from '../schemas/diagnostic-vendor-slot.schema';
import { DiagnosticService } from '../schemas/diagnostic-service.schema';
import { CreateDiagnosticVendorDto } from '../dto/create-diagnostic-vendor.dto';
import { DiagnosticMasterTestService } from './diagnostic-master-test.service';

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
    @InjectModel(DiagnosticService.name)
    private diagnosticServiceModel: Model<DiagnosticService>,
    private readonly masterTestService: DiagnosticMasterTestService,
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
      services: createDto.services ?? [],
      serviceAliases: createDto.serviceAliases ?? {},
      homeCollection: createDto.homeCollection !== false,
      centerVisit: createDto.centerVisit !== false,
      homeCollectionCharges: createDto.homeCollectionCharges || 100,
      description: createDto.description,
      labVendorId: createDto.labVendorId ? new Types.ObjectId(createDto.labVendorId) : undefined,
      isActive: true,
    });

    const savedVendor = await vendor.save();

    // Process service aliases and create/update master tests
    if (createDto.serviceAliases && Object.keys(createDto.serviceAliases).length > 0) {
      try {
        await this.processMasterTests(createDto.services || [], createDto.serviceAliases);
      } catch (error) {
        console.error('[DIAGNOSTIC-VENDOR] Error processing master tests during creation:', error);
        // Continue with vendor creation even if master test processing fails
      }
    }

    return savedVendor;
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
        ...(vendor.equipmentCapabilities || {}),
        ...updateDto.equipmentCapabilities,
      } as any;
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

    if (updateDto.services !== undefined) {
      vendor.services = updateDto.services;
    }

    if (updateDto.serviceAliases !== undefined) {
      vendor.serviceAliases = updateDto.serviceAliases;

      // Process service aliases and create/update master tests
      if (Object.keys(updateDto.serviceAliases).length > 0) {
        try {
          await this.processMasterTests(vendor.services || [], updateDto.serviceAliases);
        } catch (error) {
          console.error('[DIAGNOSTIC-VENDOR] Error processing master tests:', error);
          // Continue with vendor update even if master test processing fails
          // This allows alias updates to succeed even if master test creation fails
        }
      }
    }

    return vendor.save();
  }

  // ============ PRICING MANAGEMENT ============

  async createPricing(createDto: CreateDiagnosticPricingDto): Promise<DiagnosticVendorPricing> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(createDto.vendorId);

    // Check if pricing already exists
    const existingPricing = await this.diagnosticVendorPricingModel.findOne({
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
      serviceId: new Types.ObjectId(createDto.serviceId),
    });

    if (existingPricing) {
      throw new ConflictException('Pricing for this service already exists for this vendor');
    }

    const pricing = new this.diagnosticVendorPricingModel({
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
      serviceId: new Types.ObjectId(createDto.serviceId),
      actualPrice: createDto.actualPrice,
      discountedPrice: createDto.discountedPrice,
      homeCollectionCharges: createDto.homeCollectionCharges || 0,
      isActive: true,
    });

    return pricing.save();
  }

  async getVendorPricing(vendorId: string): Promise<any[]> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    const pricing = await this.diagnosticVendorPricingModel
      .find({
        vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
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

  /**
   * Get pricing for multiple services for a vendor
   * Used by AHC order creation to get pricing for all package services
   */
  async getPricingForServices(
    vendorId: string,
    serviceIds: string[], // Array of service codes like ["DIAG-001", "DIAG-002"]
  ): Promise<any[]> {
    console.log('[DIAGNOSTIC-VENDOR] getPricingForServices called:', { vendorId, serviceIds });

    // Get vendor by vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    // Query diagnostic services to get their ObjectIds from service codes
    const diagnosticServices = await this.diagnosticServiceModel.find({
      serviceId: { $in: serviceIds },
    });

    console.log('[DIAGNOSTIC-VENDOR] Found diagnostic services:', diagnosticServices.length);

    const serviceObjectIds = diagnosticServices.map((service) => service._id);

    // Get pricing for these services
    const pricingRecords = await this.diagnosticVendorPricingModel
      .find({
        vendorId: vendor._id,
        serviceId: { $in: serviceObjectIds },
        isActive: true,
      })
      .populate('serviceId')
      .exec();

    console.log('[DIAGNOSTIC-VENDOR] Found pricing records:', pricingRecords.length);

    // Transform to flatten service data
    return pricingRecords.map((p: any) => ({
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
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    const pricing = await this.diagnosticVendorPricingModel.findOne({
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
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    const slotId = `DIAG-SLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if slot already exists
    const existingSlot = await this.diagnosticVendorSlotModel.findOne({
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
      pincode,
      date,
      timeSlot,
    });

    if (existingSlot) {
      throw new ConflictException('Slot already exists for this time');
    }

    const slot = new this.diagnosticVendorSlotModel({
      slotId,
      vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
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
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    return this.diagnosticVendorSlotModel
      .find({
        vendorId: vendor._id, // Use MongoDB ObjectId from vendor document
        pincode,
        date,
        isActive: true,
      })
      .sort({ startTime: 1 })
      .exec();
  }

  async getSlotById(slotId: string): Promise<DiagnosticVendorSlot> {
    const slot = await this.diagnosticVendorSlotModel.findOne({ slotId });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    return slot;
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

  // ============ ELIGIBLE VENDORS FOR PRESCRIPTION DIGITIZATION ============

  /**
   * Get eligible vendors based on selected services and pincode
   * Returns vendors that:
   * 1. Serve the specified pincode
   * 2. Have pricing for ALL selected services
   * 3. Have available slots for current or future dates
   */
  async getEligibleVendors(serviceIds: string[], pincode: string): Promise<any[]> {
    // Convert serviceIds to ObjectIds
    const serviceObjectIds = serviceIds.map(id => new Types.ObjectId(id));

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find vendors that serve this pincode
    const vendorsInPincode = await this.diagnosticVendorModel.find({
      isActive: true,
      serviceablePincodes: pincode,
    });

    if (vendorsInPincode.length === 0) {
      return [];
    }

    const eligibleVendors = [];

    // For each vendor, check if they have pricing for ALL selected services AND available slots
    for (const vendor of vendorsInPincode) {
      const vendorPricing = await this.diagnosticVendorPricingModel.find({
        vendorId: vendor._id,
        serviceId: { $in: serviceObjectIds },
        isActive: true,
      }).populate('serviceId', 'name code category');

      // Vendor must have pricing for ALL services
      if (vendorPricing.length !== serviceIds.length) {
        continue;
      }

      // Check if vendor has available slots for current or future dates
      const availableSlots = await this.diagnosticVendorSlotModel.find({
        vendorId: vendor._id,
        pincode: pincode,
        date: { $gte: todayStr },
        isActive: true,
        $expr: { $lt: ['$currentBookings', '$maxBookings'] } // currentBookings < maxBookings
      });

      // Vendor must have at least one available slot for current or future dates
      if (availableSlots.length === 0) {
        continue;
      }

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
        pricing: vendorPricing.map((p: any) => ({
          serviceId: p.serviceId._id,
          serviceName: p.serviceId.name,
          serviceCode: p.serviceId.code,
          category: p.serviceId.category,
          actualPrice: p.actualPrice,
          discountedPrice: p.discountedPrice,
        })),
        totalActualPrice,
        totalDiscountedPrice,
        totalWithHomeCollection: totalDiscountedPrice + (vendor.homeCollectionCharges || 0),
        availableSlotsCount: availableSlots.length,
      });
    }

    return eligibleVendors;
  }

  /**
   * Get selected vendors for cart with pricing details
   * Used when member is viewing cart and selecting vendor
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
      const vendor = await this.diagnosticVendorModel.findById(vendorId);

      if (!vendor || !vendor.isActive) {
        continue;
      }

      const vendorPricing = await this.diagnosticVendorPricingModel.find({
        vendorId: vendor._id,
        serviceId: { $in: serviceIds },
        isActive: true,
      }).populate('serviceId', 'name code category');

      // Only include vendor if they have pricing for all services
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
          pricing: vendorPricing.map((p: any) => ({
            serviceId: p.serviceId._id,
            serviceName: p.serviceId.name,
            serviceCode: p.serviceId.code,
            category: p.serviceId.category,
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

  /**
   * Process service aliases and create/update diagnostic master tests
   * For each service with an alias:
   * - Check if diagnostic master test exists with matching service code
   * - If exists: Update synonyms to include the new alias
   * - If not exists: Create new diagnostic master test with mappings
   */
  private async processMasterTests(
    serviceIds: string[],
    serviceAliases: Record<string, string>,
  ): Promise<void> {
    console.log('[DIAGNOSTIC-VENDOR] Processing master tests for service aliases:', {
      serviceCount: serviceIds.length,
      aliasCount: Object.keys(serviceAliases).length,
    });

    // Process each service that has an alias
    for (const serviceId of serviceIds) {
      const alias = serviceAliases[serviceId];
      if (!alias || alias.trim() === '') {
        continue; // Skip if no alias provided
      }

      try {
        // Fetch the diagnostic service to get its details
        const diagnosticService = await this.diagnosticServiceModel.findOne({ serviceId: serviceId });
        if (!diagnosticService) {
          console.warn(`[DIAGNOSTIC-VENDOR] Service ${serviceId} not found, skipping master test creation`);
          continue;
        }

        console.log(`[DIAGNOSTIC-VENDOR] Processing alias "${alias}" for service ${diagnosticService.code}`);

        // Check if diagnostic master test exists with this service code
        const existingMasterTest = await this.masterTestService.getByCode(diagnosticService.code);

        if (existingMasterTest) {
          // Update synonyms: add alias if not already present
          const currentSynonyms = existingMasterTest.synonyms || [];
          if (!currentSynonyms.includes(alias.trim())) {
            console.log(`[DIAGNOSTIC-VENDOR] Updating master test ${existingMasterTest.parameterId} with new synonym`);
            await this.masterTestService.update(existingMasterTest.parameterId, {
              synonyms: [...currentSynonyms, alias.trim()],
            });
          } else {
            console.log(`[DIAGNOSTIC-VENDOR] Synonym already exists in master test ${existingMasterTest.parameterId}`);
          }
        } else {
          // Create new diagnostic master test
          console.log(`[DIAGNOSTIC-VENDOR] Creating new master test for code ${diagnosticService.code}`);
          await this.masterTestService.create({
            code: diagnosticService.code,
            standardName: diagnosticService.name,
            category: diagnosticService.category as any,
            synonyms: [alias.trim()],
          });
        }
      } catch (error) {
        console.error(`[DIAGNOSTIC-VENDOR] Error processing master test for service ${serviceId}:`, error);
        // Continue processing other aliases even if one fails
      }
    }

    console.log('[DIAGNOSTIC-VENDOR] Finished processing master tests');
  }
}
