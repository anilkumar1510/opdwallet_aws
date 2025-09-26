import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserWallet, UserWalletDocument } from './schemas/user-wallet.schema';
import { WalletTransaction, WalletTransactionDocument } from './schemas/wallet-transaction.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
  ) {}

  async getUserWallet(userId: string) {
    try {
      const wallet = await this.userWalletModel
        .findOne({
          userId,
          isActive: true
        })
        .populate('policyAssignmentId')
        .exec();

      return wallet;
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      return null;
    }
  }

  async getUserWalletByAssignment(userId: string, policyAssignmentId: string) {
    try {
      const wallet = await this.userWalletModel
        .findOne({
          userId,
          policyAssignmentId,
          isActive: true
        })
        .exec();

      return wallet;
    } catch (error) {
      console.error('Error fetching user wallet by assignment:', error);
      return null;
    }
  }

  async createUserWallet(walletData: {
    userId: string;
    policyAssignmentId: string;
    totalBalance: {
      allocated: number;
      current: number;
      consumed: number;
    };
    categoryBalances: Array<{
      categoryCode: string;
      categoryName: string;
      allocated: number;
      current: number;
      consumed: number;
      isUnlimited: boolean;
    }>;
    policyYear: string;
    effectiveFrom: Date;
    effectiveTo: Date;
  }) {
    try {
      const wallet = new this.userWalletModel(walletData);
      return await wallet.save();
    } catch (error) {
      console.error('Error creating user wallet:', error);
      throw error;
    }
  }

  async getWalletTransactions(userId: string, limit: number = 50) {
    try {
      const transactions = await this.walletTransactionModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return transactions;
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  async createTransaction(transactionData: {
    userId: string;
    userWalletId: string;
    transactionId: string;
    type: string;
    amount: number;
    categoryCode?: string;
    previousBalance: { total: number; category?: number };
    newBalance: { total: number; category?: number };
    serviceType?: string;
    serviceProvider?: string;
    bookingId?: string;
    notes?: string;
    processedBy?: string;
  }) {
    try {
      const transaction = new this.walletTransactionModel(transactionData);
      return await transaction.save();
    } catch (error) {
      console.error('Error creating wallet transaction:', error);
      throw error;
    }
  }

  // Helper method to format wallet categories for frontend
  formatWalletForFrontend(wallet: UserWalletDocument | null) {
    if (!wallet) {
      return {
        totalBalance: { allocated: 0, current: 0, consumed: 0 },
        categories: []
      };
    }

    return {
      totalBalance: wallet.totalBalance,
      categories: wallet.categoryBalances.map(category => ({
        categoryCode: category.categoryCode,
        name: category.categoryName,
        available: category.current,
        total: category.allocated,
        consumed: category.consumed,
        isUnlimited: category.isUnlimited
      }))
    };
  }
}