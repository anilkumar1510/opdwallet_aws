import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument, AppointmentStatus } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CounterService } from '../counters/counter.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private readonly counterService: CounterService,
    private readonly walletService: WalletService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const appointmentId = await this.counterService.generateAppointmentId();
    const consultationFee = createAppointmentDto.consultationFee || 0;
    const userId = createAppointmentDto.userId;
    const patientId = createAppointmentDto.patientId;

    // Validate userId is provided
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Validate patientId is provided
    if (!patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    // Use patientId for wallet operations (the patient's wallet should be debited, not necessarily the booking user)
    const walletUserId = patientId;

    // Check and debit wallet if consultation fee > 0
    if (consultationFee > 0) {
      console.log('🟡 [APPOINTMENTS SERVICE] Checking wallet balance for consultation fee:', consultationFee);
      console.log('🟡 [APPOINTMENTS SERVICE] Patient ID for wallet debit:', walletUserId);

      try {
        // Check sufficient balance
        const balanceCheck = await this.walletService.checkSufficientBalance(
          walletUserId,
          consultationFee,
          'CAT001' // Consult category
        );

        if (!balanceCheck.hasSufficient) {
          console.warn(`⚠️ [APPOINTMENTS SERVICE] Insufficient wallet balance. Available: ₹${balanceCheck.categoryBalance}, Required: ₹${consultationFee}`);
          // For now, just log the warning and continue with the appointment
          // In production, you would throw an error:
          // throw new BadRequestException(
          //   `Insufficient wallet balance. Available: ₹${balanceCheck.categoryBalance} in Consult category, Required: ₹${consultationFee}`
          // );
        } else {
          console.log('✅ [APPOINTMENTS SERVICE] Sufficient balance available');
        }
      } catch (error) {
        console.error('❌ [APPOINTMENTS SERVICE] Error checking wallet balance:', error.message);
        // Continue with appointment creation even if wallet check fails
        // In production, you might want to handle this differently
      }
    }

    const appointmentData = {
      ...createAppointmentDto,
      appointmentId,
      appointmentNumber: appointmentId.replace('APT', ''),
      userId: new Types.ObjectId(createAppointmentDto.userId),
      status: AppointmentStatus.PENDING_CONFIRMATION,
      requestedAt: new Date(),
      slotId: createAppointmentDto.slotId,
      doctorName: createAppointmentDto.doctorName || '',
      specialty: createAppointmentDto.specialty || '',
      clinicId: createAppointmentDto.clinicId || '',
      clinicName: createAppointmentDto.clinicName || '',
      clinicAddress: createAppointmentDto.clinicAddress || '',
      consultationFee: consultationFee,
    };

    const appointment = new this.appointmentModel(appointmentData);
    const saved = await appointment.save();

    // Debit wallet after appointment is saved
    if (consultationFee > 0) {
      try {
        console.log('🟡 [APPOINTMENTS SERVICE] Debiting wallet for appointment:', appointmentId);
        console.log('🟡 [APPOINTMENTS SERVICE] Debiting from patient wallet:', walletUserId);

        await this.walletService.debitWallet(
          walletUserId,
          consultationFee,
          'CAT001', // Consult category
          (saved._id as any).toString(),
          'CONSULTATION',
          createAppointmentDto.doctorName || 'Doctor',
          `Consultation fee - ${createAppointmentDto.doctorName || 'Doctor'} - ${createAppointmentDto.appointmentType || 'Appointment'}`
        );

        console.log('✅ [APPOINTMENTS SERVICE] Wallet debited successfully');
      } catch (walletError) {
        // If wallet debit fails, delete the appointment and throw error
        console.error('❌ [APPOINTMENTS SERVICE] Wallet debit failed, rolling back appointment:', walletError);
        await this.appointmentModel.deleteOne({ _id: saved._id });
        throw new BadRequestException('Failed to debit wallet: ' + walletError.message);
      }
    }

    return saved;
  }

  async getUserAppointments(userId: string, appointmentType?: string): Promise<Appointment[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (appointmentType) {
      filter.appointmentType = appointmentType;
    }

    // PERFORMANCE: Add field projection for list views, include prescription fields
    return this.appointmentModel
      .find(filter)
      .select('appointmentId appointmentNumber doctorName specialty appointmentDate timeSlot status appointmentType consultationFee createdAt clinicName clinicAddress patientName patientId hasPrescription prescriptionId')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getOngoingAppointments(userId: string): Promise<Appointment[]> {
    // PERFORMANCE: Add field projection for ongoing appointments view
    return this.appointmentModel
      .find({
        userId: new Types.ObjectId(userId),
        status: { $in: [AppointmentStatus.PENDING_CONFIRMATION, AppointmentStatus.CONFIRMED] },
      })
      .select('appointmentId doctorName appointmentDate timeSlot status clinicName')
      .sort({ appointmentDate: 1 })
      .lean()
      .exec();
  }

  async findOne(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentModel.findOne({ appointmentId }).lean().exec();
  }

  async findAll(query: any): Promise<{ data: Appointment[]; total: number; page: number; pages: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.doctorId) {
      filter.doctorId = query.doctorId;
    }

    if (query.specialtyId || query.specialty) {
      filter.specialty = query.specialtyId || query.specialty;
    }

    if (query.type) {
      filter.appointmentType = query.type;
    }

    const today = new Date().toISOString().split('T')[0];

    if (query.dateFrom) {
      filter.appointmentDate = { $gte: query.dateFrom };
    } else if (!query.includeOld) {
      filter.appointmentDate = { $gte: today };
    }

    if (query.dateTo) {
      filter.appointmentDate = filter.appointmentDate || {};
      filter.appointmentDate.$lte = query.dateTo;
    }

    const [appointments, total] = await Promise.all([
      this.appointmentModel
        .find(filter)
        .sort({ appointmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.appointmentModel.countDocuments(filter),
    ]);

    return {
      data: appointments,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException('Only pending appointments can be confirmed');
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmedAt = new Date();
    await appointment.save();

    return appointment;
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    // Check if appointment time has passed
    const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.timeSlot}`);
    const now = new Date();

    if (appointmentDateTime <= now) {
      throw new BadRequestException('Cannot cancel past appointments');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = 'OPS';
    await appointment.save();

    // Refund wallet if there was a consultation fee (same as user cancellation)
    // Use patientId for refund since that's whose wallet was debited
    if (appointment.consultationFee > 0) {
      try {
        console.log('🟡 [APPOINTMENTS SERVICE] OPS cancelling - Refunding wallet for cancelled appointment:', {
          appointmentId,
          amount: appointment.consultationFee,
          patientId: appointment.patientId
        });

        await this.walletService.creditWallet(
          appointment.patientId,
          appointment.consultationFee,
          'CAT001', // Consult category
          (appointment._id as any).toString(),
          'CONSULTATION_REFUND',
          appointment.doctorName || 'Doctor',
          `Refund for cancelled appointment - ${appointment.doctorName || 'Doctor'} - ${appointment.appointmentType || 'Appointment'}`
        );

        console.log('✅ [APPOINTMENTS SERVICE] Wallet refunded successfully');
      } catch (walletError) {
        console.error('❌ [APPOINTMENTS SERVICE] Failed to refund wallet:', walletError);
        // Continue even if refund fails, appointment is already cancelled
      }
    }

    return appointment;
  }

  async userCancelAppointment(appointmentId: string, userId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findOne({ appointmentId });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify the appointment belongs to this user
    if (appointment.userId.toString() !== userId) {
      throw new BadRequestException('You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed appointments');
    }

    // Check if appointment time has passed
    const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.timeSlot}`);
    const now = new Date();

    if (appointmentDateTime <= now) {
      throw new BadRequestException('Cannot cancel past appointments. The appointment time has already passed.');
    }

    // Cancel the appointment
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = 'USER';
    await appointment.save();

    // Refund wallet if there was a consultation fee
    // Use patientId for refund since that's whose wallet was debited
    if (appointment.consultationFee > 0) {
      try {
        console.log('🟡 [APPOINTMENTS SERVICE] Refunding wallet for cancelled appointment:', {
          appointmentId,
          amount: appointment.consultationFee,
          patientId: appointment.patientId
        });

        await this.walletService.creditWallet(
          appointment.patientId,
          appointment.consultationFee,
          'CAT001', // Consult category
          (appointment._id as any).toString(),
          'CONSULTATION_REFUND',
          appointment.doctorName || 'Doctor',
          `Refund for cancelled appointment - ${appointment.doctorName || 'Doctor'} - ${appointment.appointmentType || 'Appointment'}`
        );

        console.log('✅ [APPOINTMENTS SERVICE] Wallet refunded successfully');
      } catch (walletError) {
        console.error('❌ [APPOINTMENTS SERVICE] Failed to refund wallet:', walletError);
        // Continue even if refund fails, appointment is already cancelled
      }
    }

    return appointment;
  }
}