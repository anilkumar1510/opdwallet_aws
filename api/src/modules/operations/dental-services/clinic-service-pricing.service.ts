import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClinicServicePricing,
  ClinicServicePricingDocument,
} from './schemas/clinic-service-pricing.schema';
import {
  Clinic,
  ClinicDocument,
} from '../../clinics/schemas/clinic.schema';
import {
  ServiceMaster,
  ServiceMasterDocument,
} from '../../masters/schemas/service-master.schema';
import {
  DentalServiceSlot,
  DentalServiceSlotDocument,
} from './schemas/dental-service-slot.schema';
import { UpdatePriceDto, BulkUpdateServicesDto } from './dto/clinic-service-pricing.dto';
import { CreateDentalSlotDto } from './dto/dental-slot.dto';

const DENTAL_CATEGORY = 'CAT006';
const CLINIC_LEVEL_SERVICE_CODE = 'DENTAL_SERVICES_ENABLED';

@Injectable()
export class ClinicServicePricingService {
  constructor(
    @InjectModel(ClinicServicePricing.name)
    private pricingModel: Model<ClinicServicePricingDocument>,
    @InjectModel(Clinic.name)
    private clinicModel: Model<ClinicDocument>,
    @InjectModel(ServiceMaster.name)
    private serviceMasterModel: Model<ServiceMasterDocument>,
    @InjectModel(DentalServiceSlot.name)
    private dentalSlotModel: Model<DentalServiceSlotDocument>,
  ) {}

  /**
   * Get all clinics with dental service status
   */
  async getAllClinicsWithServiceStatus() {
    // Get all active clinics
    const clinics = await this.clinicModel
      .find({ isActive: true })
      .select('clinicId name address isActive')
      .lean();

    // Get service counts for each clinic
    const clinicsWithStatus = await Promise.all(
      clinics.map(async (clinic) => {
        // Check if dental services are enabled at clinic level
        const clinicLevelToggle = await this.pricingModel.findOne({
          clinicId: clinic.clinicId,
          serviceCode: CLINIC_LEVEL_SERVICE_CODE,
        });

        const dentalServicesEnabled = clinicLevelToggle?.isEnabled || false;

        const enabledCount = await this.pricingModel.countDocuments({
          clinicId: clinic.clinicId,
          category: DENTAL_CATEGORY,
          serviceCode: { $ne: CLINIC_LEVEL_SERVICE_CODE },
          isEnabled: true,
        });

        return {
          ...clinic,
          dentalServicesEnabled,
          hasEnabledServices: enabledCount > 0,
          enabledServicesCount: enabledCount,
        };
      }),
    );

    return {
      data: clinicsWithStatus,
      total: clinicsWithStatus.length,
    };
  }

  /**
   * Get all dental services for a specific clinic with pricing info
   */
  async getServicesForClinic(clinicId: string) {
    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Get all active dental services
    const services = await this.serviceMasterModel
      .find({
        category: DENTAL_CATEGORY,
        isActive: true,
      })
      .select('code name description isActive')
      .lean();

    // Get existing pricing mappings for this clinic
    const pricingMappings = await this.pricingModel
      .find({
        clinicId,
        category: DENTAL_CATEGORY,
      })
      .lean();

    // Create a map for quick lookup
    const pricingMap = new Map(
      pricingMappings.map((p) => [p.serviceCode, p]),
    );

    // Combine services with their pricing info
    const servicesWithPricing = services.map((service) => {
      const pricing = pricingMap.get(service.code);

      return {
        _id: service._id,
        code: service.code,
        name: service.name,
        description: service.description || '',
        isActive: service.isActive,
        isEnabledForClinic: pricing?.isEnabled || false,
        price: pricing?.price || null,
        currency: pricing?.currency || 'INR',
        effectiveFrom: pricing?.effectiveFrom || null,
        effectiveTo: pricing?.effectiveTo || null,
      };
    });

    return {
      clinic: {
        clinicId: clinic.clinicId,
        name: clinic.name,
      },
      data: servicesWithPricing,
      total: servicesWithPricing.length,
    };
  }

  /**
   * Toggle service enabled/disabled for a clinic
   */
  async toggleService(
    clinicId: string,
    serviceCode: string,
    isEnabled: boolean,
    userId?: string,
  ) {
    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Verify service exists and is a dental service
    const service = await this.serviceMasterModel
      .findOne({
        code: serviceCode.toUpperCase(),
        category: DENTAL_CATEGORY,
      })
      .lean();

    if (!service) {
      throw new NotFoundException(
        `Dental service with code ${serviceCode} not found`,
      );
    }

    // Check if dental services are enabled at clinic level
    if (isEnabled) {
      const clinicLevelToggle = await this.pricingModel.findOne({
        clinicId,
        serviceCode: CLINIC_LEVEL_SERVICE_CODE,
      });

      if (!clinicLevelToggle || !clinicLevelToggle.isEnabled) {
        throw new BadRequestException(
          'Dental services must be enabled at clinic level before enabling individual services',
        );
      }
    }

    // Upsert the pricing record
    const updated = await this.pricingModel.findOneAndUpdate(
      {
        clinicId,
        serviceCode: serviceCode.toUpperCase(),
      },
      {
        $set: {
          isEnabled,
          updatedBy: userId,
        },
        $setOnInsert: {
          clinicId,
          serviceCode: serviceCode.toUpperCase(),
          category: DENTAL_CATEGORY,
          currency: 'INR',
          createdBy: userId,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return {
      success: true,
      message: `Service ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: updated,
    };
  }

  /**
   * Update price for a service at a clinic
   */
  async updatePrice(
    clinicId: string,
    serviceCode: string,
    updatePriceDto: UpdatePriceDto,
    userId?: string,
  ) {
    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Verify service exists and is a dental service
    const service = await this.serviceMasterModel
      .findOne({
        code: serviceCode.toUpperCase(),
        category: DENTAL_CATEGORY,
      })
      .lean();

    if (!service) {
      throw new NotFoundException(
        `Dental service with code ${serviceCode} not found`,
      );
    }

    // Find existing pricing record
    const existing = await this.pricingModel.findOne({
      clinicId,
      serviceCode: serviceCode.toUpperCase(),
    });

    if (!existing) {
      throw new BadRequestException(
        'Service must be enabled before setting price. Please enable the service first.',
      );
    }

    if (!existing.isEnabled) {
      throw new BadRequestException(
        'Cannot set price for disabled service. Please enable the service first.',
      );
    }

    // Update pricing
    const updateData: any = {
      price: updatePriceDto.price,
      updatedBy: userId,
    };

    if (updatePriceDto.effectiveFrom) {
      updateData.effectiveFrom = new Date(updatePriceDto.effectiveFrom);
    }

    if (updatePriceDto.effectiveTo) {
      updateData.effectiveTo = new Date(updatePriceDto.effectiveTo);
    }

    const updated = await this.pricingModel.findOneAndUpdate(
      {
        clinicId,
        serviceCode: serviceCode.toUpperCase(),
      },
      { $set: updateData },
      { new: true },
    );

    return {
      success: true,
      message: 'Price updated successfully',
      data: updated,
    };
  }

  /**
   * Bulk update services for a clinic
   */
  async bulkUpdateServices(
    clinicId: string,
    bulkUpdateDto: BulkUpdateServicesDto,
    userId?: string,
  ) {
    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    const results = [];
    const errors = [];

    for (const serviceUpdate of bulkUpdateDto.services) {
      try {
        // Toggle service
        const toggleResult = await this.toggleService(
          clinicId,
          serviceUpdate.serviceCode,
          serviceUpdate.isEnabled,
          userId,
        );

        // Update price if provided and service is enabled
        if (
          serviceUpdate.isEnabled &&
          serviceUpdate.price !== undefined &&
          serviceUpdate.price !== null
        ) {
          const priceResult = await this.updatePrice(
            clinicId,
            serviceUpdate.serviceCode,
            { price: serviceUpdate.price },
            userId,
          );
          results.push({
            serviceCode: serviceUpdate.serviceCode,
            success: true,
            data: priceResult.data,
          });
        } else {
          results.push({
            serviceCode: serviceUpdate.serviceCode,
            success: true,
            data: toggleResult.data,
          });
        }
      } catch (error) {
        errors.push({
          serviceCode: serviceUpdate.serviceCode,
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      message:
        errors.length === 0
          ? 'All services updated successfully'
          : `${results.length} services updated, ${errors.length} failed`,
      results,
      errors,
    };
  }

  /**
   * Get pricing details for a specific service at a clinic
   */
  async getPricingDetails(clinicId: string, serviceCode: string) {
    const pricing = await this.pricingModel
      .findOne({
        clinicId,
        serviceCode: serviceCode.toUpperCase(),
      })
      .lean();

    if (!pricing) {
      throw new NotFoundException(
        `No pricing found for service ${serviceCode} at clinic ${clinicId}`,
      );
    }

    return pricing;
  }

  /**
   * Delete pricing record (disable service and remove pricing)
   */
  async deletePricing(clinicId: string, serviceCode: string) {
    const result = await this.pricingModel.deleteOne({
      clinicId,
      serviceCode: serviceCode.toUpperCase(),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `No pricing found for service ${serviceCode} at clinic ${clinicId}`,
      );
    }

    return {
      success: true,
      message: 'Pricing deleted successfully',
    };
  }

  /**
   * Toggle dental services enabled/disabled at clinic level
   */
  async toggleClinicDentalServices(
    clinicId: string,
    isEnabled: boolean,
    userId?: string,
  ) {
    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Upsert the clinic-level toggle record
    const updated = await this.pricingModel.findOneAndUpdate(
      {
        clinicId,
        serviceCode: CLINIC_LEVEL_SERVICE_CODE,
      },
      {
        $set: {
          isEnabled,
          updatedBy: userId,
        },
        $setOnInsert: {
          clinicId,
          serviceCode: CLINIC_LEVEL_SERVICE_CODE,
          category: DENTAL_CATEGORY,
          currency: 'INR',
          createdBy: userId,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    // If disabling dental services at clinic level, disable all individual services
    if (!isEnabled) {
      await this.pricingModel.updateMany(
        {
          clinicId,
          category: DENTAL_CATEGORY,
          serviceCode: { $ne: CLINIC_LEVEL_SERVICE_CODE },
        },
        {
          $set: {
            isEnabled: false,
            updatedBy: userId,
          },
        },
      );
    }

    return {
      success: true,
      message: `Dental services ${isEnabled ? 'enabled' : 'disabled'} for clinic successfully`,
      data: updated,
    };
  }

  /**
   * Create dental service slots for a clinic
   */
  async createDentalSlots(
    clinicId: string,
    createDto: CreateDentalSlotDto,
    userId?: string,
  ) {
    console.log(`[DentalSlots] Creating slots for clinic ${clinicId}`, createDto);

    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Verify dental services are enabled at clinic level
    const clinicLevelToggle = await this.pricingModel.findOne({
      clinicId,
      serviceCode: CLINIC_LEVEL_SERVICE_CODE,
    });

    if (!clinicLevelToggle || !clinicLevelToggle.isEnabled) {
      throw new BadRequestException(
        'Dental services must be enabled at clinic level before creating slots',
      );
    }

    // Validate dates are in the future
    const today = new Date().toISOString().split('T')[0];
    const invalidDates = createDto.dates.filter((date) => date < today);
    if (invalidDates.length > 0) {
      throw new BadRequestException(
        `Cannot create slots for past dates: ${invalidDates.join(', ')}`,
      );
    }

    // Create slots for each date
    const createdSlots = [];
    for (const date of createDto.dates) {
      // Check if slot already exists for this clinic and date
      const existingSlot = await this.dentalSlotModel.findOne({
        clinicId,
        date,
      });

      if (existingSlot) {
        console.log(`[DentalSlots] Slot already exists for ${clinicId} on ${date}, skipping`);
        continue;
      }

      // Generate unique slot ID
      const slotId = `DSLOT${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

      const slotData = {
        slotId,
        clinicId,
        date,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        slotDuration: createDto.slotDuration || 30,
        maxAppointments: createDto.maxAppointments || 10,
        isActive: true,
        createdBy: userId,
      };

      const slot = await this.dentalSlotModel.create(slotData);
      createdSlots.push(slot);
      console.log(`[DentalSlots] Created slot ${slotId} for ${clinicId} on ${date}`);
    }

    return {
      success: true,
      message: `Created ${createdSlots.length} slot(s) successfully`,
      data: createdSlots,
    };
  }

  /**
   * Get all dental service slots for a clinic
   */
  async getClinicSlots(clinicId: string) {
    console.log(`[DentalSlots] Fetching slots for clinic ${clinicId}`);

    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Get all slots for the clinic, sorted by date
    const slots = await this.dentalSlotModel
      .find({ clinicId })
      .sort({ date: 1, startTime: 1 })
      .lean();

    console.log(`[DentalSlots] Found ${slots.length} slots for clinic ${clinicId}`);

    return {
      success: true,
      count: slots.length,
      data: slots,
    };
  }

  /**
   * Delete a dental service slot
   */
  async deleteSlot(slotId: string) {
    console.log(`[DentalSlots] Deleting slot ${slotId}`);

    const slot = await this.dentalSlotModel.findOneAndDelete({ slotId });

    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    console.log(`[DentalSlots] Deleted slot ${slotId}`);

    return {
      success: true,
      message: 'Slot deleted successfully',
      data: slot,
    };
  }

  /**
   * Get all clinics that have a specific service enabled
   * Used by dental bookings module for clinic search
   */
  async getClinicsWithServiceEnabled(serviceCode: string) {
    console.log(`[ClinicServicePricing] Getting clinics with service ${serviceCode} enabled`);

    // Find all pricing records where this service is enabled
    const enabledPricings = await this.pricingModel
      .find({
        serviceCode: serviceCode.toUpperCase(),
        isEnabled: true,
        category: DENTAL_CATEGORY,
      })
      .lean();

    console.log(`[ClinicServicePricing] Found ${enabledPricings.length} clinics with service enabled`);

    // Get clinic details for each enabled pricing
    const clinicsWithService = await Promise.all(
      enabledPricings.map(async (pricing) => {
        const clinic = await this.clinicModel
          .findOne({
            clinicId: pricing.clinicId,
            isActive: true,
          })
          .lean();

        if (!clinic) {
          return null;
        }

        return {
          clinicId: clinic.clinicId,
          name: clinic.name,
          address: clinic.address,
          contactNumber: clinic.contactNumber,
          servicePrice: pricing.price || 0,
          currency: pricing.currency || 'INR',
        };
      }),
    );

    // Filter out null values (clinics that don't exist or are inactive)
    return clinicsWithService.filter((clinic) => clinic !== null);
  }
}
