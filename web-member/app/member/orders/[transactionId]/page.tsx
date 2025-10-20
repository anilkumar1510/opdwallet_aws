'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Receipt, Wallet, CreditCard, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

interface TransactionDetails {
  transactionId: string;
  serviceType: string;
  serviceName: string;
  serviceReferenceId: string;
  totalAmount: number;
  walletAmount: number;
  selfPaidAmount: number;
  copayAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.transactionId as string;

  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactionDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();
      setTransaction(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId, fetchTransactionDetails]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-12 h-12 text-yellow-500" />;
      case 'FAILED':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Receipt className="w-12 h-12 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' },
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      WALLET_ONLY: 'Wallet Only',
      COPAY: 'Wallet + Copay',
      OUT_OF_POCKET: 'Wallet + Cash',
      PARTIAL: 'Partial Payment',
      FULL_PAYMENT: 'Full Payment',
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Transaction not found'}</p>
          <button
            onClick={() => router.push('/member/orders')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/member/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col items-center text-center mb-6">
            {getStatusIcon(transaction.status)}
            <h2 className="text-xl font-bold text-gray-900 mt-4 mb-2">{transaction.serviceName}</h2>
            <p className="text-gray-600 mb-3">{transaction.transactionId}</p>
            {getStatusBadge(transaction.status)}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Service Type</p>
                <p className="font-medium text-gray-900">{transaction.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Service ID</p>
                <p className="font-medium text-gray-900">{transaction.serviceReferenceId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium text-gray-900">{formatDate(transaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium text-gray-900">{getPaymentMethodLabel(transaction.paymentMethod)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Payment Breakdown
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">₹{transaction.totalAmount.toFixed(2)}</span>
            </div>

            {transaction.walletAmount > 0 && (
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Wallet className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">From Wallet</span>
                </div>
                <span className="font-semibold text-green-600">₹{transaction.walletAmount.toFixed(2)}</span>
              </div>
            )}

            {transaction.selfPaidAmount > 0 && (
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="font-medium text-gray-900">Self Paid {transaction.copayAmount > 0 ? '(Copay)' : ''}</span>
                </div>
                <span className="font-semibold text-orange-600">₹{transaction.selfPaidAmount.toFixed(2)}</span>
              </div>
            )}

            {transaction.copayAmount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This transaction includes a copay of ₹{transaction.copayAmount.toFixed(2)}
                  as per your policy configuration.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">Order Created</p>
                <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
              </div>
            </div>

            {transaction.status === 'COMPLETED' && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Payment Completed</p>
                  <p className="text-sm text-gray-600">{formatDate(transaction.updatedAt)}</p>
                </div>
              </div>
            )}

            {transaction.status === 'PENDING' && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Payment Pending</p>
                  <p className="text-sm text-gray-600">Waiting for payment confirmation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
