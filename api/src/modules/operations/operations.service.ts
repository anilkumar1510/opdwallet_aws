import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Doctor, DoctorDocument } from '../doctors/schemas/doctor.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { LabPrescription, LabPrescriptionDocument } from '../lab/schemas/lab-prescription.schema';
import { LabOrder, LabOrderDocument } from '../lab/schemas/lab-order.schema';
import { WalletService } from '../wallet/wallet.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { RelationshipType } from '@/common/constants/status.enum';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class OperationsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(LabPrescription.name) private labPrescriptionModel: Model<LabPrescriptionDocument>,
    @InjectModel(LabOrder.name) private labOrderModel: Model<LabOrderDocument>,
    private walletService: WalletService,
    private assignmentsService: AssignmentsService,
  ) {}

  async searchMembers(
    search?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const filter: any = {
      role: 'MEMBER', // Only search for members, not admin/ops users
    };

    if (search) {
      filter.$or = [
        { 'name.firstName': { $regex: search, $options: 'i' } },
        { 'name.lastName': { $regex: search, $options: 'i' } },
        { 'name.fullName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { uhid: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('userId memberId uhid name email phone relationship status primaryMemberId createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMemberDetails(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').lean();

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    // Get wallet information
    const wallet = await this.walletService.getUserWallet(userId);
    const formattedWallet = this.walletService.formatWalletForFrontend(wallet as any);

    // Get policy assignments
    const assignments = await this.assignmentsService.getUserAssignments(userId);

    // Get wallet transactions (last 50)
    const transactions = await this.walletService.getWalletTransactions(userId, {}, 50);

    // Get dependents if this is a primary member
    let dependents: any[] = [];
    const isPrimaryMember = (user.relationship as string) === 'REL001' ||
                           (user.relationship as string) === 'SELF';

    if (isPrimaryMember) {
      dependents = await this.userModel
        .find({
          primaryMemberId: user.memberId,
          relationship: { $nin: ['REL001', 'SELF'] }
        })
        .select('userId memberId name email phone relationship')
        .lean();
    }

    return {
      user,
      wallet: formattedWallet,
      rawWallet: wallet,
      assignments,
      transactions,
      dependents,
      isPrimaryMember,
    };
  }

  async topupMemberWallet(
    userId: string,
    amount: number,
    categoryCode: string,
    notes: string,
    processedBy: string,
    processedByName: string,
  ) {
    // Get user details
    const user = await this.userModel.findById(userId).select('relationship memberId name');

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    // Note: Top-up is now allowed for all members (primary and dependents)
    // Each member has their own individual wallet

    // Get wallet to verify category exists
    const wallet = await this.walletService.getUserWallet(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this member');
    }

    const categoryExists = wallet.categoryBalances.some(
      (cat: any) => cat.categoryCode === categoryCode
    );

    if (!categoryExists) {
      throw new BadRequestException(`Category ${categoryCode} not found in member's wallet`);
    }

    // Perform top-up using the new method in wallet service
    const topupNotes = `Manual wallet top-up by ${processedByName} - ${notes}`;

    const result = await this.walletService.topupWallet(
      userId,
      amount,
      categoryCode,
      processedBy,
      topupNotes
    );

    return {
      success: true,
      message: 'Wallet topped up successfully',
      transactionId: result.transactionId,
      newBalance: result.newBalance,
      newCategoryBalance: result.newCategoryBalance,
    };
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalDoctors,
      activeDoctors,
      pendingAppointments,
      todayAppointments,
      pendingPrescriptions,
      labOrdersPending,
    ] = await Promise.all([
      this.doctorModel.countDocuments(),
      this.doctorModel.countDocuments({ isActive: true }),
      this.appointmentModel.countDocuments({ status: 'PENDING_CONFIRMATION' }),
      this.appointmentModel.countDocuments({
        appointmentDate: {
          $gte: today,
          $lt: tomorrow,
        },
      }),
      this.labPrescriptionModel.countDocuments({ status: 'PENDING' }),
      this.labOrderModel.countDocuments({ status: 'PLACED' }),
    ]);

    return {
      totalDoctors,
      activeDoctors,
      pendingAppointments,
      todayAppointments,
      pendingPrescriptions,
      labOrdersPending,
    };
  }
}
