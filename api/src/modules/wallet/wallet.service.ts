import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserWallet, UserWalletDocument } from './schemas/user-wallet.schema';
import { WalletTransaction, WalletTransactionDocument } from './schemas/wallet-transaction.schema';
import { CategoryMaster, CategoryMasterDocument } from '../masters/schemas/category-master.schema';
import { CounterService } from '../counters/counter.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(CategoryMaster.name) private categoryMasterModel: Model<CategoryMasterDocument>,
    private counterService: CounterService,
  ) {}

  async getUserWallet(userId: string) {
    try {
      // Convert string userId to ObjectId for query
      const userObjectId = new Types.ObjectId(userId);

      const wallet = await this.userWalletModel
        .findOne({
          userId: userObjectId,
          isActive: true
        })
        .lean()
        .exec();

      return wallet;
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      return null;
    }
  }

  async getUserWalletByAssignment(userId: string, policyAssignmentId: string) {
    try {
      // Convert string IDs to ObjectIds for query
      const userObjectId = new Types.ObjectId(userId);
      const assignmentObjectId = new Types.ObjectId(policyAssignmentId);

      const wallet = await this.userWalletModel
        .findOne({
          userId: userObjectId,
          policyAssignmentId: assignmentObjectId,
          isActive: true
        })
        .lean()
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
        .select('transactionId type amount categoryCode previousBalance newBalance serviceType serviceProvider bookingId notes createdAt status')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
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

  // Initialize wallet from policy configuration
  async initializeWalletFromPolicy(
    userId: string,
    policyAssignmentId: string,
    planConfig: any,
    effectiveFrom: Date,
    effectiveTo: Date
  ) {
    try {
      console.log('🟡 [WALLET SERVICE] Initializing wallet for user:', userId);

      // Check if wallet already exists for this assignment
      const existingWallet = await this.userWalletModel.findOne({
        userId,
        policyAssignmentId,
        isActive: true
      });

      if (existingWallet) {
        console.log('⚠️ [WALLET SERVICE] Wallet already exists for this assignment');
        return existingWallet;
      }

      // Get total wallet amount from plan config
      const totalAmount = planConfig.wallet?.totalAnnualAmount || 0;

      // Get category IDs directly from plan config benefits (keys are already CAT001, CAT002, etc.)
      const categoryIds = Object.keys(planConfig.benefits || {});

      if (categoryIds.length === 0) {
        console.log('⚠️ [WALLET SERVICE] No benefits found in plan config');
        return null;
      }

      // Fetch category master data for display names
      const categories = await this.categoryMasterModel.find({
        categoryId: { $in: categoryIds },
        isActive: true
      });

      // Build category balances array
      const categoryBalances = [];
      for (const categoryId of categoryIds) {
        const benefit = planConfig.benefits[categoryId];
        const categoryInfo = categories.find(cat => cat.categoryId === categoryId);

        if (benefit?.enabled && categoryInfo) {
          const allocated = benefit.annualLimit || 0;
          categoryBalances.push({
            categoryCode: categoryId,  // CAT001, CAT002, etc.
            categoryName: categoryInfo.name,
            allocated: allocated,
            current: allocated,  // Start with full allocation
            consumed: 0,
            isUnlimited: !benefit.annualLimit
          });
        }
      }

      // Calculate policy year from effective dates
      const fromYear = new Date(effectiveFrom).getFullYear();
      const toYear = new Date(effectiveTo).getFullYear();
      const policyYear = `${fromYear}-${toYear}`;

      // Create wallet document
      const walletData = {
        userId,
        policyAssignmentId,
        totalBalance: {
          allocated: totalAmount,
          current: totalAmount,
          consumed: 0
        },
        categoryBalances,
        policyYear,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: new Date(effectiveTo),
        isActive: true
      };

      const wallet = new this.userWalletModel(walletData);
      const savedWallet = await wallet.save();

      console.log('✅ [WALLET SERVICE] Wallet created successfully with', categoryBalances.length, 'categories');
      return savedWallet;

    } catch (error) {
      console.error('❌ [WALLET SERVICE] Error initializing wallet:', error);
      throw error;
    }
  }

  // Delete wallet by assignment ID
  async deleteWalletByAssignment(policyAssignmentId: string) {
    try {
      console.log('🟡 [WALLET SERVICE] Deleting wallet for assignment:', policyAssignmentId);
      const result = await this.userWalletModel.deleteMany({ policyAssignmentId });
      console.log('✅ [WALLET SERVICE] Deleted', result.deletedCount, 'wallet(s)');
      return result;
    } catch (error) {
      console.error('❌ [WALLET SERVICE] Error deleting wallet:', error);
      throw error;
    }
  }

  // Check if user has sufficient balance in wallet
  async checkSufficientBalance(userId: string, amount: number, categoryCode: string): Promise<{ hasSufficient: boolean; availableBalance: number; categoryBalance: number }> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      const wallet = await this.userWalletModel.findOne({
        userId: userObjectId,
        isActive: true
      }).lean().exec();

      if (!wallet) {
        return { hasSufficient: false, availableBalance: 0, categoryBalance: 0 };
      }

      const categoryBalance = wallet.categoryBalances.find(c => c.categoryCode === categoryCode);

      if (!categoryBalance) {
        return { hasSufficient: false, availableBalance: wallet.totalBalance.current, categoryBalance: 0 };
      }

      const hasSufficient = wallet.totalBalance.current >= amount && categoryBalance.current >= amount;

      return {
        hasSufficient,
        availableBalance: wallet.totalBalance.current,
        categoryBalance: categoryBalance.current
      };
    } catch (error) {
      console.error('❌ [WALLET SERVICE] Error checking balance:', error);
      throw error;
    }
  }

  // Debit amount from wallet
  async debitWallet(
    userId: string,
    amount: number,
    categoryCode: string,
    bookingId: string,
    serviceType: string,
    serviceProvider: string,
    notes?: string
  ) {
    try {
      console.log('🟡 [WALLET SERVICE] Debiting wallet:', { userId, amount, categoryCode });

      const userObjectId = new Types.ObjectId(userId);

      // Find wallet
      const wallet = await this.userWalletModel.findOne({
        userId: userObjectId,
        isActive: true
      }).exec();

      if (!wallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      // Find category balance
      const categoryBalance = wallet.categoryBalances.find(c => c.categoryCode === categoryCode);

      if (!categoryBalance) {
        throw new BadRequestException(`Category ${categoryCode} not found in wallet`);
      }

      // Check sufficient balance
      if (wallet.totalBalance.current < amount) {
        throw new BadRequestException(`Insufficient wallet balance. Available: ₹${wallet.totalBalance.current}, Required: ₹${amount}`);
      }

      if (categoryBalance.current < amount) {
        throw new BadRequestException(`Insufficient ${categoryBalance.categoryName} balance. Available: ₹${categoryBalance.current}, Required: ₹${amount}`);
      }

      // Store previous balances for transaction record
      const previousTotalBalance = wallet.totalBalance.current;
      const previousCategoryBalance = categoryBalance.current;

      // Debit from total balance
      wallet.totalBalance.current -= amount;
      wallet.totalBalance.consumed += amount;
      wallet.totalBalance.lastUpdated = new Date();

      // Debit from category balance
      categoryBalance.current -= amount;
      categoryBalance.consumed += amount;
      categoryBalance.lastTransaction = new Date();

      // Save updated wallet
      await wallet.save();

      // Create transaction record
      const transactionId = await this.counterService.generateTransactionId();

      const transaction = new this.walletTransactionModel({
        transactionId,
        userId: userObjectId,
        userWalletId: wallet._id,
        type: 'DEBIT',
        amount,
        categoryCode,
        previousBalance: {
          total: previousTotalBalance,
          category: previousCategoryBalance
        },
        newBalance: {
          total: wallet.totalBalance.current,
          category: categoryBalance.current
        },
        serviceType,
        serviceProvider,
        bookingId: new Types.ObjectId(bookingId),
        notes: notes || `${serviceType} - ${serviceProvider}`,
        processedAt: new Date(),
        isReversed: false,
        status: 'COMPLETED'
      });

      await transaction.save();

      console.log('✅ [WALLET SERVICE] Wallet debited successfully:', transactionId);

      return {
        success: true,
        transactionId,
        newBalance: wallet.totalBalance.current,
        newCategoryBalance: categoryBalance.current
      };

    } catch (error) {
      console.error('❌ [WALLET SERVICE] Error debiting wallet:', error);
      throw error;
    }
  }

  // Credit amount to wallet (for refunds/cancellations)
  async creditWallet(
    userId: string,
    amount: number,
    categoryCode: string,
    bookingId: string,
    serviceType: string,
    serviceProvider: string,
    notes?: string
  ) {
    try {
      console.log('🟡 [WALLET SERVICE] Starting creditWallet:', {
        userId,
        amount,
        categoryCode,
        bookingId,
        serviceType,
        serviceProvider,
        notes
      });

      const userObjectId = new Types.ObjectId(userId);

      // Find wallet
      const wallet = await this.userWalletModel.findOne({
        userId: userObjectId,
        isActive: true
      }).exec();

      if (!wallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      // Find category balance
      const categoryBalance = wallet.categoryBalances.find(c => c.categoryCode === categoryCode);

      if (!categoryBalance) {
        throw new BadRequestException(`Category ${categoryCode} not found in wallet`);
      }

      // Store previous balances for transaction record
      const previousTotalBalance = wallet.totalBalance.current;
      const previousCategoryBalance = categoryBalance.current;

      // Credit to total balance
      wallet.totalBalance.current += amount;
      wallet.totalBalance.consumed -= amount;
      wallet.totalBalance.lastUpdated = new Date();

      // Credit to category balance
      categoryBalance.current += amount;
      categoryBalance.consumed -= amount;
      categoryBalance.lastTransaction = new Date();

      // Save updated wallet
      await wallet.save();
      console.log('✅ [WALLET SERVICE] Wallet balances updated');

      // Create transaction record
      console.log('🟡 [WALLET SERVICE] Generating transaction ID...');
      const transactionId = await this.counterService.generateTransactionId();
      console.log('✅ [WALLET SERVICE] Transaction ID generated:', transactionId);

      console.log('🟡 [WALLET SERVICE] Creating CREDIT transaction with data:', {
        transactionId,
        userId: userObjectId.toString(),
        walletId: (wallet._id as any).toString(),
        type: 'CREDIT',
        amount,
        categoryCode,
        bookingId,
        previousBalances: { total: previousTotalBalance, category: previousCategoryBalance },
        newBalances: { total: wallet.totalBalance.current, category: categoryBalance.current }
      });

      const transaction = new this.walletTransactionModel({
        transactionId,
        userId: userObjectId,
        userWalletId: wallet._id,
        type: 'CREDIT',
        amount,
        categoryCode,
        previousBalance: {
          total: previousTotalBalance,
          category: previousCategoryBalance
        },
        newBalance: {
          total: wallet.totalBalance.current,
          category: categoryBalance.current
        },
        serviceType,
        serviceProvider,
        bookingId: new Types.ObjectId(bookingId), // Convert to ObjectId like debit does
        notes: notes || `Refund - ${serviceType} - ${serviceProvider}`,
        processedAt: new Date(),
        isReversed: false,
        status: 'COMPLETED'
      });

      console.log('🟡 [WALLET SERVICE] Saving transaction to database...');
      await transaction.save();
      console.log('✅ [WALLET SERVICE] Transaction saved successfully');

      console.log('✅ [WALLET SERVICE] Wallet credited successfully:', transactionId);

      return {
        success: true,
        transactionId,
        newBalance: wallet.totalBalance.current,
        newCategoryBalance: categoryBalance.current
      };

    } catch (error) {
      console.error('❌ [WALLET SERVICE] Error crediting wallet:', error);
      throw error;
    }
  }

  // Top-up wallet (for manual adjustments by operations/admin)
  async topupWallet(
    userId: string,
    amount: number,
    categoryCode: string,
    processedBy: string,
    notes?: string
  ) {
    try {
      console.log('🟡 [WALLET SERVICE] Starting topupWallet:', {
        userId,
        amount,
        categoryCode,
        processedBy,
        notes
      });

      const userObjectId = new Types.ObjectId(userId);
      const processedByObjectId = new Types.ObjectId(processedBy);

      // Find wallet
      const wallet = await this.userWalletModel.findOne({
        userId: userObjectId,
        isActive: true
      }).exec();

      if (!wallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      // Find category balance
      const categoryBalance = wallet.categoryBalances.find(c => c.categoryCode === categoryCode);

      if (!categoryBalance) {
        throw new BadRequestException(`Category ${categoryCode} not found in wallet`);
      }

      // Store previous balances for transaction record
      const previousTotalBalance = wallet.totalBalance.current;
      const previousCategoryBalance = categoryBalance.current;

      // Credit to total balance
      wallet.totalBalance.current += amount;
      wallet.totalBalance.allocated += amount; // Also increase allocated for top-ups
      wallet.totalBalance.lastUpdated = new Date();

      // Credit to category balance
      categoryBalance.current += amount;
      categoryBalance.allocated += amount; // Also increase allocated for top-ups
      categoryBalance.lastTransaction = new Date();

      // Save updated wallet
      await wallet.save();
      console.log('✅ [WALLET SERVICE] Wallet balances updated');

      // Create transaction record
      console.log('🟡 [WALLET SERVICE] Generating transaction ID...');
      const transactionId = await this.counterService.generateTransactionId();
      console.log('✅ [WALLET SERVICE] Transaction ID generated:', transactionId);

      const transaction = new this.walletTransactionModel({
        transactionId,
        userId: userObjectId,
        userWalletId: wallet._id,
        type: 'ADJUSTMENT',
        amount,
        categoryCode,
        previousBalance: {
          total: previousTotalBalance,
          category: previousCategoryBalance
        },
        newBalance: {
          total: wallet.totalBalance.current,
          category: categoryBalance.current
        },
        serviceType: 'WALLET_TOPUP',
        serviceProvider: 'OPERATIONS',
        notes: notes || 'Manual wallet top-up',
        processedBy: processedByObjectId,
        processedAt: new Date(),
        isReversed: false,
        status: 'COMPLETED'
      });

      console.log('🟡 [WALLET SERVICE] Saving transaction to database...');
      await transaction.save();
      console.log('✅ [WALLET SERVICE] Transaction saved successfully');

      console.log('✅ [WALLET SERVICE] Wallet topped up successfully:', transactionId);

      return {
        success: true,
        transactionId,
        newBalance: wallet.totalBalance.current,
        newCategoryBalance: categoryBalance.current
      };

    } catch (error) {
      console.error('❌ [WALLET SERVICE] Error topping up wallet:', error);
      throw error;
    }
  }
}