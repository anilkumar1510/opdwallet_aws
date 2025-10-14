import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { DoctorSlot, DoctorSlotDocument } from '../doctor-slots/schemas/doctor-slot.schema';
import { Clinic, ClinicDocument } from '../clinics/schemas/clinic.schema';
import { Appointment, AppointmentDocument, AppointmentStatus } from '../appointments/schemas/appointment.schema';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CounterService } from '../counters/counter.service';
import { LocationService } from '../location/location.service';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(DoctorSlot.name) private doctorSlotModel: Model<DoctorSlotDocument>,
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private counterService: CounterService,
    private locationService: LocationService,
  ) {}

  async findAll(query: QueryDoctorsDto): Promise<any> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };

    if (query.specialtyId) {
      filter.specialtyId = query.specialtyId;
    }

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { specializations: new RegExp(query.search, 'i') },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.doctorModel.find(filter).skip(skip).limit(limit).exec(),
      this.doctorModel.countDocuments(filter),
    ]);

    // Determine user location for distance calculation
    let userLatitude: number | null = null;
    let userLongitude: number | null = null;
    const radius = query.radius || 10; // Default 10km radius

    // Get user coordinates from pincode or lat/lng
    if (query.pincode) {
      this.logger.log(`[findAll] Geocoding pincode: ${query.pincode}`);
      const geocoded = await this.locationService.forwardGeocode(query.pincode);
      if (geocoded) {
        userLatitude = geocoded.latitude;
        userLongitude = geocoded.longitude;
        this.logger.log(`[findAll] Pincode ${query.pincode} -> lat=${userLatitude}, lng=${userLongitude}`);
      }
    } else if (query.latitude && query.longitude) {
      userLatitude = query.latitude;
      userLongitude = query.longitude;
      this.logger.log(`[findAll] Using provided coordinates: lat=${userLatitude}, lng=${userLongitude}`);
    }

    // Populate clinics for each doctor from doctor_slots
    const doctorsWithClinics = await Promise.all(
      doctors.map(async (doctor) => {
        const doctorObj = doctor.toObject();

        // Find all slots for this doctor with consultation type IN_CLINIC
        const slots = await this.doctorSlotModel
          .find({
            doctorId: doctor.doctorId,
            isActive: true,
            consultationType: 'IN_CLINIC'
          })
          .exec();

        // Get unique clinicIds and their consultation fees
        const clinicFeeMap = new Map();
        slots.forEach(slot => {
          if (!clinicFeeMap.has(slot.clinicId)) {
            clinicFeeMap.set(slot.clinicId, slot.consultationFee);
          }
        });

        // Get clinic details for each unique clinicId
        const clinicIds = Array.from(clinicFeeMap.keys());
        const clinics = await this.clinicModel
          .find({ clinicId: { $in: clinicIds }, isActive: true })
          .select('clinicId name address location contactNumber facilities')
          .exec();

        // Transform clinics to match frontend expectations and calculate distances
        const transformedClinics = clinics
          .map(clinic => {
            const clinicObj = clinic.toObject();
            // Build address with fallbacks for missing fields
            const addressParts = [];
            if (clinicObj.address?.line1) addressParts.push(clinicObj.address.line1);
            if (clinicObj.address?.city) addressParts.push(clinicObj.address.city);
            if (clinicObj.address?.state) addressParts.push(clinicObj.address.state);
            const addressStr = addressParts.join(', ');
            const pincode = clinicObj.address?.pincode ? ` - ${clinicObj.address.pincode}` : '';

            // Calculate distance if user location is provided
            let distance: number | null = null;
            if (userLatitude && userLongitude && clinicObj.location?.latitude && clinicObj.location?.longitude) {
              distance = this.locationService.calculateDistance(
                userLatitude,
                userLongitude,
                clinicObj.location.latitude,
                clinicObj.location.longitude,
              );
            }

            return {
              clinicId: clinicObj.clinicId,
              name: clinicObj.name,
              address: addressStr + pincode,
              city: clinicObj.address?.city || '',
              state: clinicObj.address?.state || '',
              pincode: clinicObj.address?.pincode || '',
              consultationFee: clinicFeeMap.get(clinicObj.clinicId) || 0,
              location: clinicObj.location,
              facilities: clinicObj.facilities || [],
              distance, // Add distance in km
              distanceText: distance ? `${distance} km` : null,
            };
          })
          .filter(clinic => {
            // Filter by radius if location is provided
            if (userLatitude && userLongitude && clinic.distance !== null) {
              return clinic.distance <= radius;
            }
            return true; // If no location filter, include all clinics
          })
          .sort((a, b) => {
            // Sort by distance (closest first)
            if (a.distance !== null && b.distance !== null) {
              return a.distance - b.distance;
            }
            return 0;
          });

        return {
          ...doctorObj,
          clinics: transformedClinics,
        };
      })
    );

    // Filter out doctors with no clinics (if location filter applied)
    const filteredDoctors = doctorsWithClinics.filter(doctor => doctor.clinics.length > 0);

    this.logger.log(`[findAll] Returning ${filteredDoctors.length} doctors (page ${page} of ${Math.ceil(total / limit)})`);

    return {
      data: filteredDoctors,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(doctorId: string): Promise<any> {
    const doctor = await this.doctorModel.findOne({ doctorId, isActive: true }).exec();

    if (!doctor) {
      return null;
    }

    const doctorObj = doctor.toObject();

    // Find all slots for this doctor with consultation type IN_CLINIC
    const slots = await this.doctorSlotModel
      .find({
        doctorId: doctor.doctorId,
        isActive: true,
        consultationType: 'IN_CLINIC'
      })
      .exec();

    // Get unique clinicIds and their consultation fees
    const clinicFeeMap = new Map();
    slots.forEach(slot => {
      if (!clinicFeeMap.has(slot.clinicId)) {
        clinicFeeMap.set(slot.clinicId, slot.consultationFee);
      }
    });

    // Get clinic details for each unique clinicId
    const clinicIds = Array.from(clinicFeeMap.keys());
    const clinics = await this.clinicModel
      .find({ clinicId: { $in: clinicIds }, isActive: true })
      .select('clinicId name address location contactNumber facilities')
      .exec();

    // Transform clinics to match frontend expectations
    const transformedClinics = clinics.map(clinic => {
      const clinicObj = clinic.toObject();
      // Build address with fallbacks for missing fields
      const addressParts = [];
      if (clinicObj.address?.line1) addressParts.push(clinicObj.address.line1);
      if (clinicObj.address?.city) addressParts.push(clinicObj.address.city);
      if (clinicObj.address?.state) addressParts.push(clinicObj.address.state);
      const addressStr = addressParts.join(', ');
      const pincode = clinicObj.address?.pincode ? ` - ${clinicObj.address.pincode}` : '';

      return {
        clinicId: clinicObj.clinicId,
        name: clinicObj.name,
        // Combine address fields into a single string with fallbacks
        address: addressStr + pincode,
        city: clinicObj.address?.city || '',
        state: clinicObj.address?.state || '',
        // Get consultation fee from the map
        consultationFee: clinicFeeMap.get(clinicObj.clinicId) || 0,
        // Include other useful fields
        location: clinicObj.location,
        facilities: clinicObj.facilities || []
      };
    });

    return {
      ...doctorObj,
      clinics: transformedClinics,
    };
  }

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    // PERFORMANCE: Use counter service instead of querying database
    const doctorId = await this.counterService.generateDoctorId();

    const doctorData = {
      ...createDoctorDto,
      doctorId,
      isActive: true,
      rating: 0,
      reviewCount: 0,
    };

    const doctor = new this.doctorModel(doctorData);
    return doctor.save();
  }

  async update(doctorId: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ doctorId });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    Object.assign(doctor, updateDoctorDto);
    return doctor.save();
  }

  async uploadPhoto(doctorId: string, file: any): Promise<{ message: string; photoUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const doctor = await this.doctorModel.findOne({ doctorId });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Store relative path to the uploaded file
    const photoUrl = `/uploads/doctors/${file.filename}`;

    doctor.profilePhoto = photoUrl;
    await doctor.save();

    return {
      message: 'Doctor photo uploaded successfully',
      photoUrl: photoUrl,
    };
  }

  async activate(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ doctorId });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    doctor.isActive = true;
    return doctor.save();
  }

  async deactivate(doctorId: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findOne({ doctorId });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    doctor.isActive = false;
    return doctor.save();
  }

  async getSlots(doctorId: string, clinicId?: string, date?: string): Promise<any> {
    // Validate doctor exists
    const doctor = await this.doctorModel.findOne({ doctorId, isActive: true });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    let slotConfigs;

    if (clinicId) {
      // IN-CLINIC consultation: Get slots for specific clinic
      const clinic = await this.clinicModel.findOne({ clinicId, isActive: true });
      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      slotConfigs = await this.doctorSlotModel
        .find({
          doctorId,
          clinicId,
          isActive: true,
          consultationType: 'IN_CLINIC'
        })
        .exec();
    } else {
      // ONLINE consultation: Get all online slots for doctor across all clinics
      slotConfigs = await this.doctorSlotModel
        .find({
          doctorId,
          isActive: true,
          consultationType: 'ONLINE'
        })
        .exec();
    }

    if (!slotConfigs || slotConfigs.length === 0) {
      return [];
    }

    // Generate slots for the next 7 days
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all existing appointments for this doctor in the next 7 days
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);

    const existingAppointments = await this.appointmentModel
      .find({
        doctorId: doctorId,
        ...(clinicId && { clinicId: clinicId }),
        appointmentDate: {
          $gte: today.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        },
        status: { $in: [AppointmentStatus.PENDING_CONFIRMATION, AppointmentStatus.CONFIRMED] }
      })
      .select('appointmentDate timeSlot slotId')
      .lean()
      .exec();

    // Create a map of booked slots for quick lookup
    const bookedSlots = new Map<string, boolean>();
    existingAppointments.forEach(appointment => {
      const key = `${appointment.appointmentDate}_${appointment.timeSlot}`;
      bookedSlots.set(key, true);
      // Also set by slotId if available
      if (appointment.slotId) {
        bookedSlots.set(appointment.slotId, true);
      }
    });

    console.log(`[DoctorsService] Found ${existingAppointments.length} existing appointments for doctor ${doctorId}`);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find all slot configs for this day
      const daySlotConfigs = slotConfigs.filter(config => config.dayOfWeek === dayOfWeek);

      if (daySlotConfigs.length > 0) {
        // For online consultations, merge slots from all clinics
        // For in-clinic, there will be only one config
        const allSlots = new Set<string>();

        daySlotConfigs.forEach(config => {
          const slots = this.generateTimeSlots(
            config.startTime,
            config.endTime,
            config.slotDuration,
            undefined, // breakStartTime not in schema
            undefined  // breakEndTime not in schema
          );
          slots.forEach(slot => allSlots.add(slot));
        });

        // Convert Set to sorted array
        const sortedSlots = Array.from(allSlots).sort((a, b) => {
          const timeA = this.parseTime(a.replace(' AM', '').replace(' PM', ''));
          const timeB = this.parseTime(b.replace(' AM', '').replace(' PM', ''));
          return timeA - timeB;
        });

        days.push({
          date: dateStr,
          dayOfWeek: dayOfWeek,
          slots: sortedSlots.map(time => {
            const slotId = clinicId
              ? `${doctorId}_${clinicId}_${dateStr}_${time}`
              : `${doctorId}_ONLINE_${dateStr}_${time}`;

            // Check if this slot is booked
            const slotKey = `${dateStr}_${time}`;
            const isBooked = bookedSlots.has(slotKey) || bookedSlots.has(slotId);

            return {
              time,
              available: !isBooked, // Mark as unavailable if booked
              slotId: slotId
            };
          })
        });
      }
    }

    return days;
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    breakStart?: string,
    breakEnd?: string
  ): string[] {
    const slots: string[] = [];
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    const breakStartTime = breakStart ? this.parseTime(breakStart) : null;
    const breakEndTime = breakEnd ? this.parseTime(breakEnd) : null;

    let current = start;
    while (current < end) {
      const slotTime = this.formatTime(current);

      // Skip break time
      if (breakStartTime && breakEndTime) {
        if (current >= breakStartTime && current < breakEndTime) {
          current += duration;
          continue;
        }
      }

      slots.push(slotTime);
      current += duration;
    }

    return slots;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  }

  // REMOVED: Replaced with counter service for better performance
  // private async getNextDoctorNumber() was removed
}