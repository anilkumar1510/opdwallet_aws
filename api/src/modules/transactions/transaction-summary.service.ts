import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TransactionSummary,
  TransactionSummaryDocument,
  TransactionServiceType,
  TransactionStatus,
  PaymentMethod,
} from './schemas/transaction-summary.schema';
import { CounterService } from '../counters/counter.service';

@Injectable()
export class TransactionSummaryService {
  constructor(
    @InjectModel(TransactionSummary.name)
    private transactionModel: Model<TransactionSummaryDocument>,
    private readonly counterService: CounterService,
  ) {}

  /**
   * Create a transaction summary record
   */
  async createTransaction(data: {
    userId: string;
    serviceType: TransactionServiceType;
    serviceId: string;
    serviceReferenceId: string;
    serviceName: string;
    serviceDate: Date;
    totalAmount: number;
    walletAmount: number;
    selfPaidAmount: number;
    copayAmount: number;
    paymentMethod: PaymentMethod;
    paymentId?: string;
    categoryCode?: string;
    categoryName?: string;
    description?: string;
    notes?: string;
    status?: TransactionStatus;
  }): Promise<TransactionSummaryDocument> {
    console.log('🟡 [TRANSACTION SERVICE] Creating transaction summary:', {
      serviceType: data.serviceType,
      totalAmount: data.totalAmount,
      walletAmount: data.walletAmount,
      selfPaidAmount: data.selfPaidAmount,
    });

    const transactionId =
      await this.counterService.generateTransactionId();

    const transaction = new this.transactionModel({
      transactionId,
      userId: new Types.ObjectId(data.userId),
      serviceType: data.serviceType,
      serviceId: new Types.ObjectId(data.serviceId),
      serviceReferenceId: data.serviceReferenceId,
      serviceName: data.serviceName,
      serviceDate: data.serviceDate,
      totalAmount: data.totalAmount,
      walletAmount: data.walletAmount,
      selfPaidAmount: data.selfPaidAmount,
      copayAmount: data.copayAmount,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId
        ? new Types.ObjectId(data.paymentId)
        : undefined,
      categoryCode: data.categoryCode,
      categoryName: data.categoryName,
      description: data.description,
      notes: data.notes,
      status: data.status || TransactionStatus.PENDING_PAYMENT,
      isActive: true,
    });

    const saved = await transaction.save();

    console.log('✅ [TRANSACTION SERVICE] Transaction created:', {
      transactionId,
    });

    return saved;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    notes?: string,
  ): Promise<TransactionSummaryDocument> {
    const transaction = await this.transactionModel.findOne({
      transactionId,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    transaction.status = status;

    if (status === TransactionStatus.COMPLETED) {
      transaction.completedAt = new Date();
    } else if (status === TransactionStatus.REFUNDED) {
      transaction.refundedAt = new Date();
    } else if (status === TransactionStatus.CANCELLED) {
      transaction.cancelledAt = new Date();
    }

    if (notes) {
      transaction.notes = notes;
    }

    return transaction.save();
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(
    transactionId: string,
  ): Promise<TransactionSummaryDocument> {
    const transaction = await this.transactionModel
      .findOne({ transactionId })
      .populate('paymentId')
      .lean()
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction as TransactionSummaryDocument;
  }

  /**
   * Get transaction by service
   */
  async getTransactionByService(
    serviceType: TransactionServiceType,
    serviceId: string,
  ): Promise<TransactionSummaryDocument | null> {
    return this.transactionModel
      .findOne({
        serviceType,
        serviceId: new Types.ObjectId(serviceId),
      })
      .lean()
      .exec();
  }

  /**
   * Get user transactions with filters and pagination
   */
  async getUserTransactions(
    userId: string,
    filters?: {
      serviceType?: TransactionServiceType;
      paymentMethod?: PaymentMethod;
      status?: TransactionStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      skip?: number;
    },
  ): Promise<{ transactions: TransactionSummaryDocument[]; total: number }> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.serviceType) {
      query.serviceType = filters.serviceType;
    }

    if (filters?.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      query.serviceDate = {};
      if (filters.dateFrom) {
        query.serviceDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.serviceDate.$lte = filters.dateTo;
      }
    }

    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('paymentId')
        .lean()
        .exec(),
      this.transactionModel.countDocuments(query),
    ]);

    return {
      transactions: transactions as TransactionSummaryDocument[],
      total,
    };
  }

  /**
   * Get transaction summary statistics
   */
  async getTransactionSummary(userId: string): Promise<{
    totalTransactions: number;
    totalSpent: number;
    totalFromWallet: number;
    totalSelfPaid: number;
    totalCopay: number;
    byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }>;
    byServiceType: Record<
      TransactionServiceType,
      { count: number; amount: number }
    >;
  }> {
    const result = await this.transactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          // Count all transactions regardless of status
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalTransactions: { $sum: 1 },
                totalSpent: { $sum: '$totalAmount' },
                totalFromWallet: { $sum: '$walletAmount' },
                totalSelfPaid: { $sum: '$selfPaidAmount' },
                totalCopay: { $sum: '$copayAmount' },
              },
            },
          ],
          byPaymentMethod: [
            {
              $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                amount: { $sum: '$totalAmount' },
              },
            },
          ],
          byServiceType: [
            {
              $group: {
                _id: '$serviceType',
                count: { $sum: 1 },
                amount: { $sum: '$totalAmount' },
              },
            },
          ],
        },
      },
    ]);

    const totals = result[0]?.totals?.[0] || {
      totalTransactions: 0,
      totalSpent: 0,
      totalFromWallet: 0,
      totalSelfPaid: 0,
      totalCopay: 0,
    };

    const byPaymentMethod: Record<
      PaymentMethod,
      { count: number; amount: number }
    > = {} as any;
    result[0]?.byPaymentMethod?.forEach((item: any) => {
      byPaymentMethod[item._id as PaymentMethod] = {
        count: item.count,
        amount: item.amount,
      };
    });

    const byServiceType: Record<
      TransactionServiceType,
      { count: number; amount: number }
    > = {} as any;
    result[0]?.byServiceType?.forEach((item: any) => {
      byServiceType[item._id as TransactionServiceType] = {
        count: item.count,
        amount: item.amount,
      };
    });

    return {
      ...totals,
      byPaymentMethod,
      byServiceType,
    };
  }

  /**
   * Add wallet transaction reference
   */
  async addWalletTransactionRef(
    transactionId: string,
    walletTransactionId: string,
  ): Promise<void> {
    await this.transactionModel.updateOne(
      { transactionId },
      {
        $push: {
          walletTransactionIds: new Types.ObjectId(walletTransactionId),
        },
      },
    );
  }

  /**
   * Record refund
   */
  async recordRefund(
    transactionId: string,
    refundAmount: number,
    refundReason: string,
  ): Promise<TransactionSummaryDocument> {
    const transaction = await this.transactionModel.findOne({
      transactionId,
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    transaction.status = TransactionStatus.REFUNDED;
    transaction.refundAmount = refundAmount;
    transaction.refundReason = refundReason;
    transaction.refundedAt = new Date();

    return transaction.save();
  }
}
