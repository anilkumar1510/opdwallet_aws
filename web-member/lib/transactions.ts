// Transaction Management Library for OPD Wallet
// Handles creation and tracking of payment transactions

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
      console.error('Failed to create transaction:', await response.text());
      throw new Error('Failed to create transaction');
    }

    const savedTransaction = await response.json();
    console.log('Transaction created successfully:', savedTransaction.transactionId);

    return savedTransaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
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
  const payment: PendingPayment = {
    paymentId: generatePaymentId(),
    ...data,
    status: 'PENDING'
  };

  try {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payment)
    });

    if (!response.ok) {
      console.error('Failed to create pending payment:', await response.text());
    }

    const savedPayment = await response.json();
    console.log('Pending payment created:', savedPayment.paymentId);

    // Store in session for later completion
    sessionStorage.setItem(`payment_${savedPayment.paymentId}`, JSON.stringify({
      ...savedPayment,
      originalData: data
    }));

    return savedPayment;
  } catch (error) {
    console.error('Error creating pending payment:', error);
    // Return the payment object even if API fails
    sessionStorage.setItem(`payment_${payment.paymentId}`, JSON.stringify({
      ...payment,
      originalData: data
    }));
    return payment;
  }
}

// Process wallet payment (deduct from wallet balance)
export async function processWalletPayment(data: {
  userId: string;
  patientId?: string;
  amount: number;
  walletDeduction: number;
  serviceType: string;
  serviceDescription: string;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/wallet/deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: data.patientId || data.userId,
        amount: data.walletDeduction,
        type: 'DEBIT',
        serviceType: data.serviceType,
        notes: data.serviceDescription
      })
    });

    if (!response.ok) {
      console.error('Failed to process wallet payment:', await response.text());
      return false;
    }

    console.log('Wallet payment processed successfully');
    return true;
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    return false;
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
      console.error('Failed to update wallet balance');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
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
      console.error('Failed to complete pending payment');
      return false;
    }

    // Clear from session storage
    sessionStorage.removeItem(`payment_${paymentId}`);

    return true;
  } catch (error) {
    console.error('Error completing pending payment:', error);
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
    console.error('Error fetching transaction:', error);
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
    console.error('Error fetching user transactions:', error);
    return [];
  }
}