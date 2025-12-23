import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClinicServicePricing,
  ClinicServicePricingDocument,
} from '../dental-services/schemas/clinic-service-pricing.schema';
import {
  Clinic,
  ClinicDocument,
} from '../../clinics/schemas/clinic.schema';
import {
  ServiceMaster,
  ServiceMasterDocument,
} from '../../masters/schemas/service-master.schema';
import {
  VisionServiceSlot,
  VisionServiceSlotDocument,
} from './schemas/vision-service-slot.schema';
import { CreateVisionSlotDto } from './dto/vision-slot.dto';

// Vision Services uses CAT007 category
const VISION_CATEGORY = 'CAT007';
const CLINIC_LEVEL_SERVICE_CODE = 'VISION_SERVICES_ENABLED';

@Injectable()
export class VisionServicesService {
  constructor(
    @InjectModel(ClinicServicePricing.name)
    private pricingModel: Model<ClinicServicePricingDocument>,
    @InjectModel(Clinic.name)
    private clinicModel: Model<ClinicDocument>,
    @InjectModel(ServiceMaster.name)
    private serviceMasterModel: Model<ServiceMasterDocument>,
    @InjectModel(VisionServiceSlot.name)
    private visionSlotModel: Model<VisionServiceSlotDocument>,
  ) {}

  /**
   * Get all clinics with vision service status
   */
  async getAllClinicsWithServiceStatus() {
    console.log('[VisionServices] Fetching clinics with vision status');

    // Get all active clinics
    const clinics = await this.clinicModel
      .find({ isActive: true })
      .select('clinicId name address isActive')
      .lean();

    // Get service counts for each clinic
    const clinicsWithStatus = await Promise.all(
      clinics.map(async (clinic) => {
        // Check if vision services are enabled at clinic level
        const clinicLevelToggle = await this.pricingModel.findOne({
          clinicId: clinic.clinicId,
          serviceCode: CLINIC_LEVEL_SERVICE_CODE,
        });

        const visionServicesEnabled = clinicLevelToggle?.isEnabled || false;

        const enabledCount = await this.pricingModel.countDocuments({
          clinicId: clinic.clinicId,
          category: VISION_CATEGORY,
          serviceCode: { $ne: CLINIC_LEVEL_SERVICE_CODE },
          isEnabled: true,
        });

        return {
          ...clinic,
          visionServicesEnabled,
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
   * Get all vision services for a specific clinic (NO pricing)
   */
  async getServicesForClinic(clinicId: string) {
    console.log('[VisionServices] Fetching services for clinic:', clinicId);

    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Get all active vision services
    const services = await this.serviceMasterModel
      .find({
        category: VISION_CATEGORY,
        isActive: true,
      })
      .select('code name description isActive')
      .lean();

    // Get existing service mappings for this clinic
    const serviceMappings = await this.pricingModel
      .find({
        clinicId,
        category: VISION_CATEGORY,
      })
      .lean();

    // Create a map for quick lookup
    const serviceMap = new Map(
      serviceMappings.map((s) => [s.serviceCode, s]),
    );

    // Combine services with their enabled status (NO PRICE FIELDS)
    const servicesWithStatus = services.map((service) => {
      const mapping = serviceMap.get(service.code);

      return {
        _id: service._id,
        code: service.code,
        name: service.name,
        description: service.description || '',
        isActive: service.isActive,
        isEnabledForClinic: mapping?.isEnabled || false,
      };
    });

    return {
      clinic: {
        clinicId: clinic.clinicId,
        name: clinic.name,
      },
      data: servicesWithStatus,
      total: servicesWithStatus.length,
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
    console.log('[VisionServices] Toggling service:', { clinicId, serviceCode, isEnabled });

    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Verify service exists and is a vision service
    const service = await this.serviceMasterModel
      .findOne({
        code: serviceCode.toUpperCase(),
        category: VISION_CATEGORY,
      })
      .lean();

    if (!service) {
      throw new NotFoundException(
        `Vision service with code ${serviceCode} not found`,
      );
    }

    // Check if vision services are enabled at clinic level
    if (isEnabled) {
      const clinicLevelToggle = await this.pricingModel.findOne({
        clinicId,
        serviceCode: CLINIC_LEVEL_SERVICE_CODE,
      });

      if (!clinicLevelToggle || !clinicLevelToggle.isEnabled) {
        throw new BadRequestException(
          'Vision services must be enabled at clinic level before enabling individual services',
        );
      }
    }

    // Upsert the service record (reusing clinic_service_pricing schema)
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
          category: VISION_CATEGORY,
          currency: 'INR', // Required field, but not used for vision
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
   * Toggle vision services enabled/disabled at clinic level
   */
  async toggleClinicVisionServices(
    clinicId: string,
    isEnabled: boolean,
    userId?: string,
  ) {
    console.log('[VisionServices] Toggling clinic vision services:', { clinicId, isEnabled });

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
          category: VISION_CATEGORY,
          currency: 'INR', // Required field
          createdBy: userId,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    // If disabling vision services at clinic level, disable all individual services
    if (!isEnabled) {
      await this.pricingModel.updateMany(
        {
          clinicId,
          category: VISION_CATEGORY,
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
      message: `Vision services ${isEnabled ? 'enabled' : 'disabled'} for clinic successfully`,
      data: updated,
    };
  }

  /**
   * Create vision service slots for a clinic
   */
  async createVisionSlots(
    clinicId: string,
    createDto: CreateVisionSlotDto,
    userId?: string,
  ) {
    console.log('[VisionServices] Creating vision slots:', { clinicId, dates: createDto.dates, slotDuration: createDto.slotDuration });

    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Verify vision services are enabled at clinic level
    const clinicLevelToggle = await this.pricingModel.findOne({
      clinicId,
      serviceCode: CLINIC_LEVEL_SERVICE_CODE,
    });

    if (!clinicLevelToggle || !clinicLevelToggle.isEnabled) {
      throw new BadRequestException(
        'Vision services must be enabled at clinic level before creating slots',
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
      const existingSlot = await this.visionSlotModel.findOne({
        clinicId,
        date,
      });

      if (existingSlot) {
        console.log(`[VisionServices] Slot already exists for ${clinicId} on ${date}, skipping`);
        continue;
      }

      // Generate unique slot ID with VSLOT prefix
      const slotId = `VSLOT${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

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

      const slot = await this.visionSlotModel.create(slotData);
      createdSlots.push(slot);
      console.log(`[VisionServices] Created slot ${slotId} for ${clinicId} on ${date}`);
    }

    return {
      success: true,
      message: `Created ${createdSlots.length} slot(s) successfully`,
      data: createdSlots,
    };
  }

  /**
   * Get all vision service slots for a clinic
   */
  async getClinicSlots(clinicId: string) {
    console.log(`[VisionServices] Fetching slots for clinic ${clinicId}`);

    // Verify clinic exists
    const clinic = await this.clinicModel.findOne({ clinicId }).lean();
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Get all slots for the clinic, sorted by date
    const slots = await this.visionSlotModel
      .find({ clinicId })
      .sort({ date: 1, startTime: 1 })
      .lean();

    console.log(`[VisionServices] Found ${slots.length} slots for clinic ${clinicId}`);

    return {
      success: true,
      count: slots.length,
      data: slots,
    };
  }

  /**
   * Delete a vision service slot
   */
  async deleteSlot(slotId: string) {
    console.log(`[VisionServices] Deleting slot ${slotId}`);

    const slot = await this.visionSlotModel.findOneAndDelete({ slotId });

    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    console.log(`[VisionServices] Deleted slot ${slotId}`);

    return {
      success: true,
      message: 'Slot deleted successfully',
      data: slot,
    };
  }
}
