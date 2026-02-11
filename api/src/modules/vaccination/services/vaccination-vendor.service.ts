import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VaccinationVendor } from '../schemas/vaccination-vendor.schema';
import { VaccinationVendorPricing } from '../schemas/vaccination-vendor-pricing.schema';
import { VaccinationVendorSlot } from '../schemas/vaccination-vendor-slot.schema';
import { VaccinationService } from '../schemas/vaccination-service.schema';
import { CreateVaccinationVendorDto } from '../dto/create-vaccination-vendor.dto';
import { UpdateVaccinationVendorDto } from '../dto/update-vaccination-vendor.dto';
import { CreateVaccinationPricingDto } from '../dto/create-vaccination-pricing.dto';
import { VaccinationMasterService } from './vaccination-master.service';

@Injectable()
export class VaccinationVendorService {
  constructor(
    @InjectModel(VaccinationVendor.name)
    private vendorModel: Model<VaccinationVendor>,
    @InjectModel(VaccinationVendorPricing.name)
    private pricingModel: Model<VaccinationVendorPricing>,
    @InjectModel(VaccinationVendorSlot.name)
    private slotModel: Model<VaccinationVendorSlot>,
    @InjectModel(VaccinationService.name)
    private vaccinationServiceModel: Model<VaccinationService>,
    private readonly masterService: VaccinationMasterService,
  ) {}

  async createVendor(createDto: CreateVaccinationVendorDto): Promise<VaccinationVendor> {
    const vendorId = `VVEN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Check if vendor code already exists
    const existingVendor = await this.vendorModel.findOne({
      code: createDto.code.toUpperCase(),
    });

    if (existingVendor) {
      throw new ConflictException(`Vaccination vendor with code ${createDto.code} already exists`);
    }

    const vendor = new this.vendorModel({
      vendorId,
      name: createDto.name,
      code: createDto.code.toUpperCase(),
      contactInfo: createDto.contactInfo,
      serviceablePincodes: createDto.serviceablePincodes,
      centerVisit: true, // Always true for vaccination - no home collection
      description: createDto.description,
      services: createDto.services ?? [],
      serviceAliases: createDto.serviceAliases ?? {},
      isActive: true,
    });

    const savedVendor = await vendor.save();

    // Process service aliases and create/update master vaccines
    if (createDto.serviceAliases && Object.keys(createDto.serviceAliases).length > 0) {
      await this.processMasterVaccines(createDto.services || [], createDto.serviceAliases);
    }

    return savedVendor;
  }

  async getVendorById(vendorId: string): Promise<VaccinationVendor> {
    const vendor = await this.vendorModel.findOne({ vendorId });

    if (!vendor) {
      throw new NotFoundException(`Vaccination vendor ${vendorId} not found`);
    }

    return vendor;
  }

  async getAllVendors(): Promise<VaccinationVendor[]> {
    return this.vendorModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  async getVendorsByPincode(pincode: string): Promise<VaccinationVendor[]> {
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
    updateDto: UpdateVaccinationVendorDto,
  ): Promise<VaccinationVendor> {
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
        throw new ConflictException(`Vaccination vendor with code ${updateDto.code} already exists`);
      }

      vendor.code = updateDto.code.toUpperCase();
    }

    if (updateDto.contactInfo) {
      vendor.contactInfo = updateDto.contactInfo;
    }

    if (updateDto.serviceablePincodes) {
      vendor.serviceablePincodes = updateDto.serviceablePincodes;
    }

    if (updateDto.description !== undefined) {
      vendor.description = updateDto.description;
    }

    if (updateDto.services !== undefined) {
      vendor.services = updateDto.services;
    }

    if (updateDto.serviceAliases !== undefined) {
      vendor.serviceAliases = updateDto.serviceAliases;

      // Process service aliases and create/update master vaccines
      if (Object.keys(updateDto.serviceAliases).length > 0) {
        await this.processMasterVaccines(vendor.services || [], updateDto.serviceAliases);
      }
    }

    if (updateDto.isActive !== undefined) {
      vendor.isActive = updateDto.isActive;
    }

    return vendor.save();
  }

  // Pricing Management
  async createPricing(createDto: CreateVaccinationPricingDto): Promise<VaccinationVendorPricing> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(createDto.vendorId);

    // Check if pricing already exists
    const existingPricing = await this.pricingModel.findOne({
      vendorId: vendor._id,
      serviceId: new Types.ObjectId(createDto.serviceId),
    });

    if (existingPricing) {
      throw new ConflictException('Pricing for this vendor and service already exists');
    }

    const pricing = new this.pricingModel({
      vendorId: vendor._id,
      serviceId: new Types.ObjectId(createDto.serviceId),
      actualPrice: createDto.actualPrice,
      discountedPrice: createDto.discountedPrice,
      isActive: true,
    });

    return pricing.save();
  }

  async getVendorPricing(vendorId: string): Promise<any[]> {
    // First get the vendor document by string vendorId to get MongoDB _id
    const vendor = await this.getVendorById(vendorId);

    const pricingRecords = await this.pricingModel
      .find({
        vendorId: vendor._id,
        isActive: true,
      })
      .populate('serviceId', 'name code category')
      .exec();

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
        isActive: pricing.isActive,
      };
    });

    return transformedPricing;
  }

  async getPricingForService(
    vendorId: string,
    serviceId: string,
  ): Promise<VaccinationVendorPricing | null> {
    const vendor = await this.getVendorById(vendorId);

    return this.pricingModel
      .findOne({
        vendorId: vendor._id,
        serviceId: new Types.ObjectId(serviceId),
        isActive: true,
      })
      .populate('serviceId', 'name code category')
      .exec();
  }

  async updatePricing(
    vendorId: string,
    serviceId: string,
    updateDto: Partial<CreateVaccinationPricingDto>,
  ): Promise<VaccinationVendorPricing> {
    const vendor = await this.getVendorById(vendorId);

    const pricing = await this.pricingModel.findOne({
      vendorId: vendor._id,
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

    return pricing.save();
  }

  // Slot Management
  async createSlot(
    vendorId: string,
    pincode: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    slotDuration: number = 30,
    maxAppointments: number = 20,
  ): Promise<VaccinationVendorSlot> {
    const vendor = await this.getVendorById(vendorId);

    // Check if a slot with the same vendor, pincode, dayOfWeek, and time already exists
    const existingSlot = await this.slotModel.findOne({
      vendorId: vendor._id,
      pincode,
      dayOfWeek,
      startTime,
      endTime,
    });

    if (existingSlot) {
      throw new ConflictException(
        `A slot for ${dayOfWeek} from ${startTime} to ${endTime} already exists for pincode ${pincode}`,
      );
    }

    const slotId = `VSLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const slot = new this.slotModel({
      slotId,
      vendorId: vendor._id,
      pincode,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
      maxAppointments,
      isActive: true,
    });

    return slot.save();
  }

  async getAllSlots(vendorId: string): Promise<VaccinationVendorSlot[]> {
    const vendor = await this.getVendorById(vendorId);

    return this.slotModel
      .find({ vendorId: vendor._id })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .exec();
  }

  async getAvailableSlots(
    vendorId: string,
    pincode: string,
    dayOfWeek: string,
  ): Promise<VaccinationVendorSlot[]> {
    const vendor = await this.getVendorById(vendorId);

    return this.slotModel
      .find({
        vendorId: vendor._id,
        pincode,
        dayOfWeek,
        isActive: true,
      })
      .sort({ startTime: 1 })
      .exec();
  }

  async getSlotById(slotId: string): Promise<VaccinationVendorSlot | null> {
    return this.slotModel.findOne({ slotId }).exec();
  }

  async activateSlot(slotId: string): Promise<VaccinationVendorSlot> {
    const slot = await this.slotModel.findOne({ slotId });

    if (!slot) {
      throw new NotFoundException(`Slot ${slotId} not found`);
    }

    slot.isActive = true;
    return slot.save();
  }

  async deactivateSlot(slotId: string): Promise<VaccinationVendorSlot> {
    const slot = await this.slotModel.findOne({ slotId });

    if (!slot) {
      throw new NotFoundException(`Slot ${slotId} not found`);
    }

    slot.isActive = false;
    return slot.save();
  }

  async deleteSlot(slotId: string): Promise<void> {
    const slot = await this.slotModel.findOne({ slotId });

    if (!slot) {
      throw new NotFoundException(`Slot ${slotId} not found`);
    }

    await this.slotModel.deleteOne({ slotId });
  }

  /**
   * Get eligible vendors based on selected vaccines and pincode
   * Returns vendors that:
   * 1. Serve the specified pincode
   * 2. Have pricing for ALL selected vaccines
   * 3. Have active schedules for the specified pincode
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

    // For each vendor, check if they have pricing for ALL selected vaccines AND active schedules
    for (const vendor of vendorsInPincode) {
      const vendorPricing = await this.pricingModel.find({
        vendorId: vendor._id,
        serviceId: { $in: serviceObjectIds },
        isActive: true,
      }).populate('serviceId', 'name code category');

      // Vendor must have pricing for ALL vaccines
      if (vendorPricing.length !== serviceIds.length) {
        continue;
      }

      // Check if vendor has active schedules for this pincode
      const activeSchedules = await this.slotModel.find({
        vendorId: vendor._id,
        pincode: pincode,
        isActive: true,
      });

      // Vendor must have at least one active schedule
      if (activeSchedules.length === 0) {
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
        centerVisit: vendor.centerVisit,
        pricing: vendorPricing.map(p => ({
          serviceId: (p.serviceId as any)._id,
          serviceName: (p.serviceId as any).name,
          serviceCode: (p.serviceId as any).code,
          actualPrice: p.actualPrice,
          discountedPrice: p.discountedPrice,
        })),
        totalActualPrice,
        totalDiscountedPrice,
        activeSchedulesCount: activeSchedules.length,
      });
    }

    // Sort by total price (cheapest first)
    eligibleVendors.sort((a, b) => a.totalDiscountedPrice - b.totalDiscountedPrice);

    return eligibleVendors;
  }

  /**
   * Process service aliases and create/update master vaccines
   */
  private async processMasterVaccines(
    serviceIds: string[],
    serviceAliases: Record<string, string>,
  ): Promise<void> {
    for (const serviceId of serviceIds) {
      const alias = serviceAliases[serviceId];
      if (!alias || alias.trim() === '') {
        continue;
      }

      const vaccinationService = await this.vaccinationServiceModel.findOne({ serviceId: serviceId });
      if (!vaccinationService) {
        console.warn(`Vaccination service ${serviceId} not found, skipping master vaccine creation`);
        continue;
      }

      const existingMaster = await this.masterService.getByCode(vaccinationService.code);

      if (existingMaster) {
        const currentSynonyms = existingMaster.synonyms || [];
        if (!currentSynonyms.includes(alias.trim())) {
          await this.masterService.update(existingMaster.parameterId, {
            synonyms: [...currentSynonyms, alias.trim()],
          });
        }
      } else {
        await this.masterService.create({
          code: vaccinationService.code,
          standardName: vaccinationService.name,
          synonyms: [alias.trim()],
        });
      }
    }
  }
}
