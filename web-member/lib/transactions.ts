// Transaction Management Library for OPD Wallet
// Handles creation and tracking of payment transactions

import { logger } from './logger'

export interface TransactionData {
  userId: string;
  patientId?: string;
  serviceType: 'APPOINTMENT' | 'ONLINE_CONSULTATION' | 'CLAIM' | 'LAB_TEST';
  serviceName: string;
  serviceReferenceId?: string; // appointmentId, claimId, etc.
  totalAmount: number;
  walletAmount: number;
  selfPaidAmount: number;
  copayAmount?: number;
  paymentMethod: 'WALLET_ONLY' | 'COPAY' | 'OUT_OF_POCKET' | 'FULL_PAYMENT' | 'PARTIAL';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentGatewayId?: string;
  metadata?: Record<string, any>;
}

export interface Transaction extends TransactionData {
  transactionId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PendingPayment {
  paymentId: string;
  amount: number;
  paymentType: string;
  serviceType: string;
  serviceReferenceId?: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  userId: string;
  patientId?: string;
  metadata?: Record<string, any>;
}

// Generate unique transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TXN${timestamp}${random}`;
}

// Generate unique payment ID
function generatePaymentId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAY${timestamp}${random}`;
}

// Create a new transaction record
export async function createTransaction(data: TransactionData): Promise<Transaction> {
  const transaction: Transaction = {
    ...data,
    transactionId: generateTransactionId(),
    status: data.status || 'COMPLETED',
    createdAt: new Date()
  };

  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      logger.error('Transactions', 'Failed to create transaction:', await response.text());
      throw new Error('Failed to create transaction');
    }

    const savedTransaction = await response.json();
    logger.info('Transactions', 'Transaction created successfully:', savedTransaction.transactionId);

    return savedTransaction;
  } catch (error) {
    logger.error('Transactions', 'Error creating transaction:', error);
    // Still return the transaction even if API fails
    // This ensures the booking process continues
    return transaction;
  }
}

// Create a pending payment that requires external payment
export async function createPendingPayment(data: {
  amount: number;
  paymentType: 'COPAY' | 'OUT_OF_POCKET' | 'FULL_PAYMENT';
  serviceType: string;
  serviceReferenceId?: string;
  description: string;
  userId: string;
  patientId?: string;
  metadata?: Record<string, any>;
}): Promise<PendingPayment> {
  logger.info('Transactions', 'Creating pending payment with data:', data);

  const payment: PendingPayment = {
    paymentId: generatePaymentId(),
    ...data,
    status: 'PENDING'
  };

  logger.info('Transactions', 'Generated payment object:', payment);

  try {
    logger.info('Transactions', 'Sending POST request to /api/payments');

    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payment)
    });

    logger.info('Transactions', 'Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Transactions', 'Failed to create pending payment:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        requestPayload: payment
      });

      // Try to parse error as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        logger.error('Transactions', 'Parsed error:', errorJson);
      } catch (e) {
        // Error is not JSON
      }
    }

    const savedPayment = await response.json();
    logger.info('Transactions', 'Pending payment created successfully:', savedPayment.paymentId);

    // Store in session for later completion
    sessionStorage.setItem(`payment_${savedPayment.paymentId}`, JSON.stringify({
      ...savedPayment,
      originalData: data
    }));

    return savedPayment;
  } catch (error) {
    logger.error('Transactions', 'Exception creating pending payment:', error);
    logger.info('Transactions', 'Falling back to local payment object');
    // Return the payment object even if API fails
    sessionStorage.setItem(`payment_${payment.paymentId}`, JSON.stringify({
      ...payment,
      originalData: data
    }));
    return payment;
  }
}

// Update wallet balance after transaction
export async function updateWalletBalance(userId: string, amount: number): Promise<boolean> {
  try {
    const response = await fetch('/api/wallet/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        amount,
        type: 'DEBIT'
      })
    });

    if (!response.ok) {
      logger.error('Transactions', 'Failed to update wallet balance');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Transactions', 'Error updating wallet balance:', error);
    return false;
  }
}

// Complete a pending payment after external gateway payment
export async function completePendingPayment(
  paymentId: string,
  transactionReference?: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        status: 'COMPLETED',
        transactionReference
      })
    });

    if (!response.ok) {
      logger.error('Transactions', 'Failed to complete pending payment');
      return false;
    }

    // Clear from session storage
    sessionStorage.removeItem(`payment_${paymentId}`);

    return true;
  } catch (error) {
    logger.error('Transactions', 'Error completing pending payment:', error);
    return false;
  }
}

// Get transaction details
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const response = await fetch(`/api/transactions/${transactionId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error('Transactions', 'Error fetching transaction:', error);
    return null;
  }
}

// Get user's transaction history
export async function getUserTransactions(
  userId: string,
  limit: number = 10
): Promise<Transaction[]> {
  try {
    const response = await fetch(`/api/transactions?userId=${userId}&limit=${limit}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    logger.error('Transactions', 'Error fetching user transactions:', error);
    return [];
  }
}