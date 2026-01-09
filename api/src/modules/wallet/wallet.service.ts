import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserWallet, UserWalletDocument } from './schemas/user-wallet.schema';
import { WalletTransaction, WalletTransactionDocument } from './schemas/wallet-transaction.schema';
import { CategoryMaster, CategoryMasterDocument } from '../masters/schemas/category-master.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CounterService } from '../counters/counter.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(CategoryMaster.name) private categoryMasterModel: Model<CategoryMasterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private counterService: CounterService,
  ) {}

  async getUserWallet(userId: string) {
    try {
      // Convert string userId to ObjectId for query
      const userObjectId = new Types.ObjectId(userId);

      // Find user's wallet
      const wallet = await this.userWalletModel
        .findOne({
          userId: userObjectId,
          isActive: true
        })
        .lean()
        .exec();

      if (!wallet) {
        return null;
      }

      // If this is a dependent wallet in a floater policy, return the master wallet's balance
      if (wallet.floaterMasterWalletId) {
        console.log('🟡 [WALLET SERVICE] User has floater wallet, fetching master balance');

        const masterWallet = await this.userWalletModel
          .findOne({
            _id: wallet.floaterMasterWalletId,
            isActive: true
          })
          .lean()
          .exec();

        if (masterWallet) {
          // Return master wallet with additional metadata
          return {
            ...masterWallet,
            isFloater: true,
            viewingUserId: userId,
            memberConsumption: masterWallet.memberConsumption || []
          };
        }
      }

      // Check if this is a master wallet
      if (wallet.isFloaterMaster) {
        return {
          ...wallet,
          isFloater: true,
          viewingUserId: userId,
          memberConsumption: wallet.memberConsumption || []
        };
      }

      // Individual wallet - return as-is
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

  async getWalletTransactions(userId: string, limit: number = 50, filters?: {
    type?: string[];
    categoryCode?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
  }) {
    try {
      // Build query
      const query: any = { userId };

      // Add filters
      if (filters) {
        // Transaction type filter (supports multiple types)
        if (filters.type && filters.type.length > 0) {
          query.type = { $in: filters.type };
        }

        // Category filter (supports multiple categories)
        if (filters.categoryCode && filters.categoryCode.length > 0) {
          query.categoryCode = { $in: filters.categoryCode };
        }

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
          query.createdAt = {};
          if (filters.dateFrom) {
            query.createdAt.$gte = filters.dateFrom;
          }
          if (filters.dateTo) {
            // Set to end of day for dateTo
            const endOfDay = new Date(filters.dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            query.createdAt.$lte = endOfDay;
          }
        }

        // Amount range filter
        if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
          query.amount = {};
          if (filters.amountMin !== undefined) {
            query.amount.$gte = filters.amountMin;
          }
          if (filters.amountMax !== undefined) {
            query.amount.$lte = filters.amountMax;
          }
        }
      }

      const transactions = await this.walletTransactionModel
        .find(query)
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
  formatWalletForFrontend(wallet: any, planConfig?: any) {
    if (!wallet) {
      return {
        totalBalance: { allocated: 0, current: 0, consumed: 0 },
        categories: [],
        isFloater: false,
        memberConsumption: [],
        config: null
      };
    }

    const result: any = {
      totalBalance: wallet.totalBalance,
      categories: wallet.categoryBalances.map((category: any) => ({
        categoryCode: category.categoryCode,
        name: category.categoryName,
        available: category.current,
        total: category.allocated,
        consumed: category.consumed,
        isUnlimited: category.isUnlimited
      })),
      isFloater: wallet.isFloater || false,
      viewingUserId: wallet.viewingUserId
    };

    // If floater wallet, include member consumption breakdown
    if (wallet.isFloater && wallet.memberConsumption) {
      result.memberConsumption = wallet.memberConsumption.map((mc: any) => ({
        userId: mc.userId.toString(),
        consumed: mc.consumed,
        categoryBreakdown: mc.categoryBreakdown || []
      }));
    }

    // Include plan config if provided
    if (planConfig) {
      result.config = {
        benefits: planConfig.benefits || {},
        wallet: planConfig.wallet || {}
      };
    }

    return result;
  }

  // Helper method to get userId from memberId
  private async getUserIdFromMemberId(memberId: string): Promise<string | null> {
    try {
      const user = await this.userModel.findOne({
        memberId: memberId
      }).select('_id').lean().exec();

      return user ? user._id.toString() : null;
    } catch (error) {
      console.error('Error finding user by memberId:', error);
      return null;
    }
  }

  // Initialize wallet from policy configuration
  async initializeWalletFromPolicy(
    userId: string,
    policyAssignmentId: string,
    planConfig: any,
    effectiveFrom: Date,
    effectiveTo: Date,
    primaryMemberId?: string  // NEW - for linking dependents to master in floater
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

      // Get allocation type (default to INDIVIDUAL for backward compatibility)
      const allocationType = planConfig.wallet?.allocationType || 'INDIVIDUAL';
      console.log('🟡 [WALLET SERVICE] Allocation type:', allocationType);

      // Common wallet data preparation
      const totalAmount = planConfig.wallet?.totalAnnualAmount || 0;
      const categoryIds = Object.keys(planConfig.benefits || {});

      if (categoryIds.length === 0) {
        console.log('⚠️ [WALLET SERVICE] No benefits found in plan config');
        return null;
      }

      // Fetch category master data
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
            categoryCode: categoryId,
            categoryName: categoryInfo.name,
            allocated: allocated,
            current: allocated,
            consumed: 0,
            isUnlimited: !benefit.annualLimit
          });
        }
      }

      // Calculate policy year
      const fromYear = new Date(effectiveFrom).getFullYear();
      const toYear = new Date(effectiveTo).getFullYear();
      const policyYear = `${fromYear}-${toYear}`;

      // Handle FLOATER vs INDIVIDUAL
      if (allocationType === 'FLOATER' && primaryMemberId) {
        // This is a dependent in a floater policy - find master wallet
        console.log('🟡 [WALLET SERVICE] Creating dependent wallet for floater policy');
        console.log('🟡 [WALLET SERVICE] Primary member ID (memberId):', primaryMemberId);

        // Convert memberId to userId
        const primaryUserId = await this.getUserIdFromMemberId(primaryMemberId);

        if (!primaryUserId) {
          throw new Error(`Primary member not found with memberId: ${primaryMemberId}`);
        }

        console.log('🟡 [WALLET SERVICE] Primary user ID (userId):', primaryUserId);

        // Now search with the correct userId (ObjectId)
        const masterWallet = await this.userWalletModel.findOne({
          userId: new Types.ObjectId(primaryUserId),
          isActive: true,
          isFloaterMaster: true
        });

        if (!masterWallet) {
          throw new Error(
            `Master floater wallet not found for primary member ${primaryMemberId} (userId: ${primaryUserId}). ` +
            `Ensure the primary member's wallet was created first.`
          );
        }

        console.log('✅ [WALLET SERVICE] Found master wallet:', masterWallet._id);

        // Create dependent wallet that references master
        const dependentWalletData = {
          userId,
          policyAssignmentId,
          floaterMasterWalletId: masterWallet._id,
          isFloaterMaster: false,
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

        const dependentWallet = new this.userWalletModel(dependentWalletData);
        const savedDependentWallet = await dependentWallet.save();

        // Add this user to master wallet's memberConsumption tracking
        masterWallet.memberConsumption = masterWallet.memberConsumption || [];
        masterWallet.memberConsumption.push({
          userId: new Types.ObjectId(userId),
          consumed: 0,
          categoryBreakdown: categoryBalances.map(cat => ({
            categoryCode: cat.categoryCode,
            consumed: 0
          }))
        });
        await masterWallet.save();

        console.log('✅ [WALLET SERVICE] Dependent wallet created and linked to master');
        return savedDependentWallet;

      } else if (allocationType === 'FLOATER' && !primaryMemberId) {
        // This is the primary member in a floater policy - create master wallet
        console.log('🟡 [WALLET SERVICE] Creating MASTER wallet for floater policy');

        const masterWalletData = {
          userId,
          policyAssignmentId,
          floaterMasterWalletId: null,
          isFloaterMaster: true,
          totalBalance: {
            allocated: totalAmount,
            current: totalAmount,
            consumed: 0
          },
          categoryBalances,
          memberConsumption: [{
            userId: new Types.ObjectId(userId),
            consumed: 0,
            categoryBreakdown: categoryBalances.map(cat => ({
              categoryCode: cat.categoryCode,
              consumed: 0
            }))
          }],
          policyYear,
          effectiveFrom: new Date(effectiveFrom),
          effectiveTo: new Date(effectiveTo),
          isActive: true
        };

        const masterWallet = new this.userWalletModel(masterWalletData);
        const savedMasterWallet = await masterWallet.save();

        console.log('✅ [WALLET SERVICE] Master floater wallet created');
        return savedMasterWallet;

      } else {
        // INDIVIDUAL wallet (default behavior - backward compatible)
        console.log('🟡 [WALLET SERVICE] Creating INDIVIDUAL wallet');

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

        console.log('✅ [WALLET SERVICE] Individual wallet created successfully');
        return savedWallet;
      }

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

      // Find user's wallet
      const userWallet = await this.userWalletModel.findOne({
        userId: userObjectId,
        isActive: true
      }).exec();

      if (!userWallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      // Determine which wallet to debit from
      let walletToDebit = userWallet;
      const isFloaterDependent = !!userWallet.floaterMasterWalletId;

      if (isFloaterDependent) {
        // This is a dependent in floater policy - debit from master wallet
        console.log('🟡 [WALLET SERVICE] Floater dependent - fetching master wallet');

        const masterWallet = await this.userWalletModel.findOne({
          _id: userWallet.floaterMasterWalletId,
          isActive: true
        }).exec();

        if (!masterWallet) {
          throw new NotFoundException('Master floater wallet not found');
        }

        walletToDebit = masterWallet;
      }

      // Find category balance
      const categoryBalance = walletToDebit.categoryBalances.find(c => c.categoryCode === categoryCode);

      if (!categoryBalance) {
        throw new BadRequestException(`Category ${categoryCode} not found in wallet`);
      }

      // Check sufficient balance
      if (walletToDebit.totalBalance.current < amount) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: ₹${walletToDebit.totalBalance.current}, Required: ₹${amount}`
        );
      }

      if (categoryBalance.current < amount) {
        throw new BadRequestException(
          `Insufficient ${categoryBalance.categoryName} balance. Available: ₹${categoryBalance.current}, Required: ₹${amount}`
        );
      }

      // Store previous balances
      const previousTotalBalance = walletToDebit.totalBalance.current;
      const previousCategoryBalance = categoryBalance.current;

      // Debit from wallet
      walletToDebit.totalBalance.current -= amount;
      walletToDebit.totalBalance.consumed += amount;
      walletToDebit.totalBalance.lastUpdated = new Date();

      categoryBalance.current -= amount;
      categoryBalance.consumed += amount;
      categoryBalance.lastTransaction = new Date();

      // If floater wallet, update member consumption tracking
      if (walletToDebit.isFloaterMaster || isFloaterDependent) {
        console.log('🟡 [WALLET SERVICE] Updating member consumption for floater wallet');

        const memberConsumption = walletToDebit.memberConsumption || [];
        let memberRecord = memberConsumption.find(
          mc => mc.userId.toString() === userId
        );

        if (!memberRecord) {
          // Initialize tracking for this member
          memberRecord = {
            userId: userObjectId,
            consumed: 0,
            categoryBreakdown: []
          };
          memberConsumption.push(memberRecord);
        }

        // Update member's consumption
        memberRecord.consumed += amount;

        // Update category breakdown
        let categoryRecord = memberRecord.categoryBreakdown.find(
          cb => cb.categoryCode === categoryCode
        );

        if (!categoryRecord) {
          categoryRecord = { categoryCode, consumed: 0 };
          memberRecord.categoryBreakdown.push(categoryRecord);
        }

        categoryRecord.consumed += amount;

        walletToDebit.memberConsumption = memberConsumption;
      }

      // Save updated wallet
      await walletToDebit.save();

      // Create transaction record
      const transactionId = await this.counterService.generateTransactionId();

      const transaction = new this.walletTransactionModel({
        transactionId,
        userId: new Types.ObjectId(walletToDebit.userId as any),  // Master wallet owner
        consumedByUserId: userObjectId,  // Actual consumer (for floater tracking)
        userWalletId: walletToDebit._id,
        type: 'DEBIT',
        amount,
        categoryCode,
        previousBalance: {
          total: previousTotalBalance,
          category: previousCategoryBalance
        },
        newBalance: {
          total: walletToDebit.totalBalance.current,
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
        newBalance: walletToDebit.totalBalance.current,
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
        userId, amount, categoryCode, bookingId
      });

      const userObjectId = new Types.ObjectId(userId);

      // Find user's wallet
      const userWallet = await this.userWalletModel.findOne({
        userId: userObjectId,
        isActive: true
      }).exec();

      if (!userWallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      // Determine which wallet to credit
      let walletToCredit = userWallet;
      const isFloaterDependent = !!userWallet.floaterMasterWalletId;

      if (isFloaterDependent) {
        console.log('🟡 [WALLET SERVICE] Floater dependent - fetching master wallet');

        const masterWallet = await this.userWalletModel.findOne({
          _id: userWallet.floaterMasterWalletId,
          isActive: true
        }).exec();

        if (!masterWallet) {
          throw new NotFoundException('Master floater wallet not found');
        }

        walletToCredit = masterWallet;
      }

      // Find category balance
      const categoryBalance = walletToCredit.categoryBalances.find(c => c.categoryCode === categoryCode);

      if (!categoryBalance) {
        throw new BadRequestException(`Category ${categoryCode} not found in wallet`);
      }

      // Store previous balances
      const previousTotalBalance = walletToCredit.totalBalance.current;
      const previousCategoryBalance = categoryBalance.current;

      // Credit to wallet
      walletToCredit.totalBalance.current += amount;
      walletToCredit.totalBalance.consumed -= amount;
      walletToCredit.totalBalance.lastUpdated = new Date();

      categoryBalance.current += amount;
      categoryBalance.consumed -= amount;
      categoryBalance.lastTransaction = new Date();

      // If floater wallet, update member consumption tracking
      if (walletToCredit.isFloaterMaster || isFloaterDependent) {
        console.log('🟡 [WALLET SERVICE] Updating member consumption for floater refund');

        const memberConsumption = walletToCredit.memberConsumption || [];
        const memberRecord = memberConsumption.find(
          mc => mc.userId.toString() === userId
        );

        if (memberRecord) {
          // Reduce member's consumption
          memberRecord.consumed = Math.max(0, memberRecord.consumed - amount);

          // Update category breakdown
          const categoryRecord = memberRecord.categoryBreakdown.find(
            cb => cb.categoryCode === categoryCode
          );

          if (categoryRecord) {
            categoryRecord.consumed = Math.max(0, categoryRecord.consumed - amount);
          }

          walletToCredit.memberConsumption = memberConsumption;
        }
      }

      // Save updated wallet
      await walletToCredit.save();
      console.log('✅ [WALLET SERVICE] Wallet balances updated');

      // Create transaction record
      const transactionId = await this.counterService.generateTransactionId();

      const transaction = new this.walletTransactionModel({
        transactionId,
        userId: new Types.ObjectId(walletToCredit.userId as any),
        consumedByUserId: userObjectId,
        userWalletId: walletToCredit._id,
        type: 'CREDIT',
        amount,
        categoryCode,
        previousBalance: {
          total: previousTotalBalance,
          category: previousCategoryBalance
        },
        newBalance: {
          total: walletToCredit.totalBalance.current,
          category: categoryBalance.current
        },
        serviceType,
        serviceProvider,
        bookingId: new Types.ObjectId(bookingId),
        notes: notes || `Refund - ${serviceType} - ${serviceProvider}`,
        processedAt: new Date(),
        isReversed: false,
        status: 'COMPLETED'
      });

      await transaction.save();
      console.log('✅ [WALLET SERVICE] Transaction saved successfully');

      return {
        success: true,
        transactionId,
        newBalance: walletToCredit.totalBalance.current,
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