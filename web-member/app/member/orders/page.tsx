'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Loader2, Filter, ChevronRight, Wallet, CreditCard, DollarSign } from 'lucide-react';

interface Transaction {
  transactionId: string;
  serviceType: string;
  serviceName: string;
  totalAmount: number;
  walletAmount: number;
  selfPaidAmount: number;
  copayAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalSpent: number;
  totalFromWallet: number;
  totalSelfPaid: number;
  totalCopay: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterService, setFilterService] = useState<string>('ALL');

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [filterStatus, filterService]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterService !== 'ALL') params.append('serviceType', filterService);

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transactions/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      WALLET_ONLY: { color: 'bg-green-100 text-green-800', label: 'Wallet Only' },
      COPAY: { color: 'bg-blue-100 text-blue-800', label: 'Wallet + Copay' },
      OUT_OF_POCKET: { color: 'bg-yellow-100 text-yellow-800', label: 'Wallet + Cash' },
      PARTIAL: { color: 'bg-purple-100 text-purple-800', label: 'Partial Payment' },
      FULL_PAYMENT: { color: 'bg-orange-100 text-orange-800', label: 'Full Payment' },
    };
    const badge = badges[method] || { color: 'bg-gray-100 text-gray-800', label: method };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    };
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-sm text-gray-600">View all your payment transactions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{summary.totalSpent.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">From Wallet</p>
                  <p className="text-2xl font-bold text-green-600">₹{summary.totalFromWallet.toFixed(2)}</p>
                </div>
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Self Paid</p>
                  <p className="text-2xl font-bold text-orange-600">₹{summary.totalSelfPaid.toFixed(2)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Services</option>
                <option value="APPOINTMENT">Appointments</option>
                <option value="CLAIM">Claims</option>
                <option value="LAB">Lab Tests</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">You haven't made any transactions yet.</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.transactionId}
                onClick={() => router.push(`/member/orders/${transaction.transactionId}`)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{transaction.serviceName}</h3>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {transaction.transactionId} • {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {getPaymentMethodBadge(transaction.paymentMethod)}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{transaction.totalAmount.toFixed(2)}</p>
                      {transaction.walletAmount > 0 && (
                        <p className="text-xs text-green-600">
                          Wallet: ₹{transaction.walletAmount.toFixed(2)}
                        </p>
                      )}
                      {transaction.selfPaidAmount > 0 && (
                        <p className="text-xs text-orange-600">
                          Paid: ₹{transaction.selfPaidAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
