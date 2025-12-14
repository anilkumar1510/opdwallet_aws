// Payment Validation Library for OPD Wallet
// Handles payment calculations, copay determination, and wallet balance validation

import { logger } from './logger'

export interface PaymentValidationInput {
  userId: string;
  patientId: string;
  consultationFee: number;
}

export interface WalletBalance {
  balance: number;
  allocated: number;
  consumed: number;
}

export interface PolicyDetails {
  copay?: {
    percentage: number;
    mode: 'PERCENT' | 'AMOUNT';
    value: number;
  };
  walletEnabled: boolean;
}

export interface PaymentValidationResult {
  canProceed: boolean;
  paymentMethod: 'WALLET_ONLY' | 'COPAY' | 'OUT_OF_POCKET' | 'FULL_PAYMENT';
  walletDeduction: number;
  userPayment: number;
  walletCoverage: number;
  copayAmount: number;
  copayPercentage: number;
  walletBalance: number;
  message: string;
  insufficientFunds: boolean;
}

// Get wallet balance for a patient
export async function getWalletBalance(patientId: string): Promise<WalletBalance> {
  try {
    const response = await fetch(`/api/wallet/balance?userId=${patientId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      logger.error('PaymentValidator', 'Failed to fetch wallet balance');
      return { balance: 0, allocated: 0, consumed: 0 };
    }

    const data = await response.json();
    return {
      balance: data.totalBalance?.current || 0,
      allocated: data.totalBalance?.allocated || 0,
      consumed: data.totalBalance?.consumed || 0
    };
  } catch (error) {
    logger.error('PaymentValidator', 'Error fetching wallet balance:', error);
    return { balance: 0, allocated: 0, consumed: 0 };
  }
}

// Get user's policy details for copay calculation
export async function getUserPolicy(userId: string): Promise<PolicyDetails> {
  logger.info('PaymentValidator', 'Starting getUserPolicy for userId:', userId);

  try {
    logger.info('PaymentValidator', 'Fetching from /api/assignments/my-policy');
    const response = await fetch('/api/assignments/my-policy', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    logger.info('PaymentValidator', 'Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('PaymentValidator', 'Failed to fetch user policy:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      logger.error('PaymentValidator', 'This likely means NO POLICY is assigned to the user');
      logger.error('PaymentValidator', 'Returning NO COPAY (0%) - Admin needs to assign policy');
      // Return NO copay if API fails (likely no assignment)
      return {
        copay: {
          percentage: 0,
          mode: 'PERCENT',
          value: 0
        },
        walletEnabled: false
      };
    }

    const data = await response.json();
    logger.info('PaymentValidator', 'Raw API response:', data);

    // Extract copay configuration from the response
    const copay = data.copay || data.planConfig?.copay;
    const copayPercentage = copay?.percentage || copay?.value || 0; // Changed from 20 to 0

    logger.info('PaymentValidator', 'Extracted copay details:', {
      rawCopay: copay,
      copayPercentage,
      copayMode: copay?.mode || 'PERCENT',
      policyId: data.policyId,
      walletEnabled: data.walletEnabled
    });

    const result = {
      copay: {
        percentage: copayPercentage,
        mode: copay?.mode || 'PERCENT',
        value: copayPercentage
      },
      walletEnabled: data.walletEnabled !== false
    };

    logger.info('PaymentValidator', 'Returning policy details:', result);
    return result;
  } catch (error) {
    logger.error('PaymentValidator', 'Exception in getUserPolicy:', error);
    logger.error('PaymentValidator', 'Returning NO COPAY (0%) due to exception');
    // Return NO copay fallback in case of error
    return {
      copay: {
        percentage: 0,
        mode: 'PERCENT',
        value: 0
      },
      walletEnabled: false
    };
  }
}

// Main payment validation function
export async function validatePayment({
  userId,
  patientId,
  consultationFee
}: PaymentValidationInput): Promise<PaymentValidationResult> {
  // 1. Get wallet balance for the patient
  const wallet = await getWalletBalance(patientId);

  // 2. Get user's policy and copay percentage
  const policy = await getUserPolicy(userId);
  const copayPercentage = policy?.copay?.percentage || 0;

  // 3. Calculate amounts
  const copayAmount = Math.round((consultationFee * copayPercentage) / 100);
  const walletCoverage = consultationFee - copayAmount;

  // 4. Determine payment scenarios

  // Scenario 1: No copay required (fully covered by insurance)
  if (copayAmount === 0) {
    const hasBalance = wallet.balance >= consultationFee;
    return {
      canProceed: hasBalance,
      paymentMethod: 'WALLET_ONLY',
      walletDeduction: hasBalance ? consultationFee : 0,
      userPayment: 0,
      walletCoverage: consultationFee,
      copayAmount: 0,
      copayPercentage: 0,
      walletBalance: wallet.balance,
      message: hasBalance
        ? 'Fully covered by insurance'
        : `Insufficient wallet balance. Need ₹${consultationFee}, have ₹${wallet.balance}`,
      insufficientFunds: !hasBalance
    };
  }

  // Scenario 2: Standard copay with sufficient wallet balance
  if (wallet.balance >= walletCoverage) {
    return {
      canProceed: true,
      paymentMethod: 'COPAY',
      walletDeduction: walletCoverage,
      userPayment: copayAmount,
      walletCoverage,
      copayAmount,
      copayPercentage,
      walletBalance: wallet.balance,
      message: `Insurance covers ₹${walletCoverage}, you pay ₹${copayAmount} copay`,
      insufficientFunds: false
    };
  }

  // Scenario 3: Partial wallet balance (out of pocket payment needed)
  if (wallet.balance > 0) {
    const outOfPocket = consultationFee - wallet.balance;
    return {
      canProceed: true,
      paymentMethod: 'OUT_OF_POCKET',
      walletDeduction: wallet.balance,
      userPayment: outOfPocket,
      walletCoverage: wallet.balance,
      copayAmount: outOfPocket,
      copayPercentage,
      walletBalance: wallet.balance,
      message: `Wallet covers ₹${wallet.balance}, pay ₹${outOfPocket} out of pocket`,
      insufficientFunds: false
    };
  }

  // Scenario 4: No wallet balance (full payment required)
  return {
    canProceed: true,
    paymentMethod: 'FULL_PAYMENT',
    walletDeduction: 0,
    userPayment: consultationFee,
    walletCoverage: 0,
    copayAmount: consultationFee,
    copayPercentage: 0,
    walletBalance: 0,
    message: `No wallet balance. Pay full amount: ₹${consultationFee}`,
    insufficientFunds: false
  };
}

// Helper function to format payment method for display
export function getPaymentMethodDisplay(method: string): string {
  const displays: Record<string, string> = {
    'WALLET_ONLY': 'Insurance/Wallet',
    'COPAY': 'Insurance + Copay',
    'OUT_OF_POCKET': 'Partial Wallet + Cash',
    'FULL_PAYMENT': 'Full Payment'
  };
  return displays[method] || method;
}

// Helper function to calculate final amounts after validation
export function calculateFinalAmounts(
  consultationFee: number,
  validationResult: PaymentValidationResult
) {
  return {
    totalFee: consultationFee,
    walletPays: validationResult.walletDeduction,
    userPays: validationResult.userPayment,
    breakdown: {
      consultation: consultationFee,
      insuranceCoverage: validationResult.walletCoverage,
      copay: validationResult.copayAmount,
      copayPercentage: validationResult.copayPercentage
    }
  };
}