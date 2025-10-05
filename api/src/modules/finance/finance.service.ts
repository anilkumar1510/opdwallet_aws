import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MemberClaim, MemberClaimDocument, ClaimStatus, PaymentStatus } from '@/modules/memberclaims/schemas/memberclaim.schema';
import { User, UserDocument } from '@/modules/users/schemas/user.schema';
import { UserRole } from '@/common/constants/roles.enum';
import { CompletePaymentDto } from './dto/complete-payment.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(MemberClaim.name) private memberClaimModel: Model<MemberClaimDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Get pending payments (approved claims waiting for payment)
  async getPendingPayments(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'approvedAt',
  ) {
    const skip = (page - 1) * limit;

    const query = {
      status: { $in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED] },
      paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.APPROVED] },
    };

    const [claims, total] = await Promise.all([
      this.memberClaimModel
        .find(query)
        .populate('userId', 'name email memberId phone')
        .populate('assignedTo', 'name email')
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.memberClaimModel.countDocuments(query),
    ]);

    return {
      claims,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get single claim for payment processing
  async getClaimForPayment(claimId: string) {
    const claim = await this.memberClaimModel
      .findOne({ claimId })
      .populate('userId', 'name email memberId phone bankDetails')
      .populate('assignedTo', 'name email')
      .lean();

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Check if claim is eligible for payment
    if (![ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED].includes(claim.status)) {
      throw new BadRequestException('Claim is not approved for payment');
    }

    return { claim };
  }

  // Complete payment
  async completePayment(
    claimId: string,
    completePaymentDto: CompletePaymentDto,
    financeUserId: string,
    financeUserName: string,
  ) {
    const claim = await this.memberClaimModel.findOne({ claimId });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Validate claim status
    if (![ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED].includes(claim.status)) {
      throw new BadRequestException('Only approved claims can be paid');
    }

    // Validate payment amount
    if (completePaymentDto.amountPaid !== claim.approvedAmount) {
      throw new BadRequestException(
        `Payment amount (${completePaymentDto.amountPaid}) does not match approved amount (${claim.approvedAmount})`
      );
    }

    // Update claim with payment details
    claim.paymentMode = completePaymentDto.paymentMode;
    claim.paymentReferenceNumber = completePaymentDto.paymentReference;
    claim.paymentDate = new Date(completePaymentDto.paymentDate);
    claim.paidBy = new Types.ObjectId(financeUserId);
    claim.paidByName = financeUserName;
    claim.paymentNotes = completePaymentDto.paymentNotes || '';
    claim.paymentStatus = PaymentStatus.COMPLETED;
    claim.status = ClaimStatus.PAYMENT_COMPLETED;

    // Add to status history
    if (!claim.statusHistory) {
      claim.statusHistory = [];
    }

    claim.statusHistory.push({
      status: ClaimStatus.PAYMENT_COMPLETED,
      changedBy: new Types.ObjectId(financeUserId),
      changedByName: financeUserName,
      changedByRole: UserRole.FINANCE_USER,
      changedAt: new Date(),
      reason: 'Payment completed',
      notes: `Payment mode: ${completePaymentDto.paymentMode}, Reference: ${completePaymentDto.paymentReference}`,
    });

    await claim.save();

    return {
      message: 'Payment completed successfully',
      claim,
    };
  }

  // Get payment history
  async getPaymentHistory(
    page: number = 1,
    limit: number = 10,
    fromDate?: Date,
    toDate?: Date,
  ) {
    const skip = (page - 1) * limit;

    const query: any = {
      status: ClaimStatus.PAYMENT_COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
    };

    if (fromDate || toDate) {
      query.paymentDate = {};
      if (fromDate) query.paymentDate.$gte = fromDate;
      if (toDate) query.paymentDate.$lte = toDate;
    }

    const [claims, total] = await Promise.all([
      this.memberClaimModel
        .find(query)
        .populate('userId', 'name email memberId')
        .populate('paymentCompletedBy', 'name email')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.memberClaimModel.countDocuments(query),
    ]);

    return {
      claims,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get finance analytics summary
  async getFinanceAnalyticsSummary(fromDate?: Date, toDate?: Date) {
    const dateFilter: any = {};
    if (fromDate || toDate) {
      if (fromDate) dateFilter.$gte = fromDate;
      if (toDate) dateFilter.$lte = toDate;
    }

    // Build match query
    const matchQuery: any = {};
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.paymentDate = dateFilter;
    }

    // Count by payment status
    const [
      pendingPayments,
      processingPayments,
      completedPayments,
      financialMetrics,
    ] = await Promise.all([
      // Pending payments
      this.memberClaimModel.countDocuments({
        status: { $in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED] },
        paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.APPROVED] },
      }),

      // Processing payments
      this.memberClaimModel.countDocuments({
        status: ClaimStatus.PAYMENT_PROCESSING,
        paymentStatus: PaymentStatus.PROCESSING,
      }),

      // Completed payments
      this.memberClaimModel.countDocuments({
        status: ClaimStatus.PAYMENT_COMPLETED,
        paymentStatus: PaymentStatus.COMPLETED,
        ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter }),
      }),

      // Financial aggregation
      this.memberClaimModel.aggregate([
        {
          $match: {
            status: { $in: [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED, ClaimStatus.PAYMENT_COMPLETED] },
            ...(Object.keys(dateFilter).length > 0 && {
              $or: [
                { approvedAt: dateFilter },
                { paymentDate: dateFilter }
              ]
            }),
          },
        },
        {
          $group: {
            _id: null,
            totalApprovedAmount: {
              $sum: { $ifNull: ['$amountApproved', 0] },
            },
            totalPaidAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentStatus', PaymentStatus.COMPLETED] },
                  { $ifNull: ['$amountApproved', 0] },
                  0,
                ],
              },
            },
            totalPendingAmount: {
              $sum: {
                $cond: [
                  {
                    $in: ['$paymentStatus', [PaymentStatus.PENDING, PaymentStatus.APPROVED]]
                  },
                  { $ifNull: ['$amountApproved', 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const metrics = financialMetrics[0] || {
      totalApprovedAmount: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0,
    };

    // Get payment mode distribution
    const paymentModeDistribution = await this.memberClaimModel.aggregate([
      {
        $match: {
          status: ClaimStatus.PAYMENT_COMPLETED,
          paymentStatus: PaymentStatus.COMPLETED,
          ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter }),
        },
      },
      {
        $group: {
          _id: '$paymentMode',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amountApproved', 0] } },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    return {
      summary: {
        pendingPayments,
        processingPayments,
        completedPayments,
        totalApprovedAmount: metrics.totalApprovedAmount,
        totalPaidAmount: metrics.totalPaidAmount,
        totalPendingAmount: metrics.totalPendingAmount,
        paymentModeDistribution,
      },
      period: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    };
  }
}
