import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  WalletIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
} from '../../src/components/icons/InlineSVGs';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import apiClient from '../../src/lib/api/client';
import { useFamily } from '../../src/contexts/FamilyContext';

// ============================================================================
// TYPES
// ============================================================================

type TransactionType = 'DEBIT' | 'CREDIT' | 'REFUND' | 'ADJUSTMENT';

interface Transaction {
  _id: string;
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryCode: string;
  categoryName?: string;
  serviceType?: string;
  serviceProvider?: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
  status: string;
  previousBalance?: {
    total: number;
    category: number;
  };
  newBalance?: {
    total: number;
    category: number;
  };
  bookingId?: string;
}

interface WalletBalance {
  totalBalance: {
    allocated: number;
    current: number;
    consumed: number;
  };
  categories: Array<{
    categoryCode: string;
    name: string;
    total: number;
    available: number;
    consumed: number;
  }>;
}

// ============================================================================
// FILTER POPUP COMPONENT
// ============================================================================

interface FilterPopupProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
  visible,
  title,
  onClose,
  onConfirm,
  children,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#86ACD8',
            minWidth: 280,
            maxWidth: 400,
            width: '100%',
            maxHeight: '80%',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2' }}>
              {title}
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              maxHeight: 400,
            }}
          >
            {children}
          </ScrollView>

          {/* Actions */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#0F5FDC',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TransactionsScreen() {
  const router = useRouter();
  const { viewingUserId } = useFamily();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state (applied filters)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [includeReversed, setIncludeReversed] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([]);

  // Popup state
  const [activePopup, setActivePopup] = useState<string | null>(null);

  // Temp filter states (for popup editing)
  const [tempTypes, setTempTypes] = useState<string[]>([]);
  const [tempCategories, setTempCategories] = useState<string[]>([]);
  const [tempDateFrom, setTempDateFrom] = useState<string>('');
  const [tempDateTo, setTempDateTo] = useState<string>('');
  const [tempMinAmount, setTempMinAmount] = useState<string>('');
  const [tempMaxAmount, setTempMaxAmount] = useState<string>('');
  const [tempServiceTypes, setTempServiceTypes] = useState<string[]>([]);
  const [tempSortBy, setTempSortBy] = useState<'date' | 'amount'>('date');
  const [tempSortOrder, setTempSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tempIncludeReversed, setTempIncludeReversed] = useState<boolean>(true);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    console.log('[Transactions] Fetching data, viewingUserId:', viewingUserId);
    fetchData();
  }, [
    viewingUserId,
    selectedTypes,
    selectedCategories,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    selectedServiceTypes,
    includeReversed,
    sortBy,
    sortOrder,
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params: any = {
        limit: 100,
      };

      // Add userId parameter if viewing dependent
      if (viewingUserId) {
        params.userId = viewingUserId;
      }

      if (selectedTypes.length > 0) {
        params.type = selectedTypes.join(',');
      }
      if (selectedCategories.length > 0) {
        params.categoryCode = selectedCategories.join(',');
      }
      if (dateFrom) {
        params.dateFrom = dateFrom;
      }
      if (dateTo) {
        params.dateTo = dateTo;
      }
      if (minAmount) {
        params.minAmount = minAmount;
      }
      if (maxAmount) {
        params.maxAmount = maxAmount;
      }
      if (selectedServiceTypes.length > 0) {
        params.serviceType = selectedServiceTypes.join(',');
      }
      params.includeReversed = includeReversed.toString();
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      console.log('[Transactions] Fetching with params:', params);

      // Fetch both transactions and balance in parallel
      const [transactionsResponse, balanceResponse] = await Promise.all([
        apiClient.get('/wallet/transactions', { params }),
        apiClient.get('/wallet/balance', {
          params: viewingUserId ? { userId: viewingUserId } : {},
        }),
      ]);

      console.log('[Transactions] Transactions response:', transactionsResponse.data);
      console.log('[Transactions] Balance response:', balanceResponse.data);

      setTransactions(transactionsResponse.data.transactions || []);
      setWalletBalance(balanceResponse.data);

      // Extract unique service types for filter options
      const uniqueServiceTypes = Array.from(
        new Set(
          (transactionsResponse.data.transactions || [])
            .map((t: Transaction) => t.serviceType)
            .filter((st: string | undefined) => st)
        )
      ) as string[];
      setAvailableServiceTypes(uniqueServiceTypes);
    } catch (error: any) {
      console.error('[Transactions] Error fetching data:', error);
      console.error('[Transactions] Error details:', error.response?.data);

      // Set empty data on error
      setTransactions([]);
      setWalletBalance({
        totalBalance: { allocated: 0, current: 0, consumed: 0 },
        categories: [],
      });
      setAvailableServiceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        searchQuery === '' ||
        txn.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.serviceProvider?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [transactions, searchQuery]);

  // Helper functions
  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedServiceTypes([]);
    setIncludeReversed(true);
    setSortBy('date');
    setSortOrder('desc');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length > 0) count++;
    if (selectedCategories.length > 0) count++;
    if (dateFrom || dateTo) count++;
    if (minAmount || maxAmount) count++;
    if (selectedServiceTypes.length > 0) count++;
    if (!includeReversed) count++;
    if (sortBy !== 'date' || sortOrder !== 'desc') count++;
    return count;
  }, [
    selectedTypes,
    selectedCategories,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    selectedServiceTypes,
    includeReversed,
    sortBy,
    sortOrder,
  ]);

  const openPopup = (popupName: string) => {
    setActivePopup(popupName);

    switch (popupName) {
      case 'transactionType':
        setTempTypes([...selectedTypes]);
        break;
      case 'category':
        setTempCategories([...selectedCategories]);
        break;
      case 'dateRange':
        setTempDateFrom(dateFrom);
        setTempDateTo(dateTo);
        break;
      case 'amountRange':
        setTempMinAmount(minAmount);
        setTempMaxAmount(maxAmount);
        break;
      case 'serviceType':
        setTempServiceTypes([...selectedServiceTypes]);
        break;
      case 'sortBy':
        setTempSortBy(sortBy);
        setTempSortOrder(sortOrder);
        break;
    }
  };

  const confirmPopup = (popupName: string) => {
    switch (popupName) {
      case 'transactionType':
        setSelectedTypes([...tempTypes]);
        break;
      case 'category':
        setSelectedCategories([...tempCategories]);
        break;
      case 'dateRange':
        setDateFrom(tempDateFrom);
        setDateTo(tempDateTo);
        break;
      case 'amountRange':
        setMinAmount(tempMinAmount);
        setMaxAmount(tempMaxAmount);
        break;
      case 'serviceType':
        setSelectedServiceTypes([...tempServiceTypes]);
        break;
      case 'sortBy':
        setSortBy(tempSortBy);
        setSortOrder(tempSortOrder);
        break;
    }
    setActivePopup(null);
  };

  const cancelPopup = () => {
    setActivePopup(null);
  };

  const toggleTempType = (type: string) => {
    if (tempTypes.includes(type)) {
      setTempTypes(tempTypes.filter((t) => t !== type));
    } else {
      setTempTypes([...tempTypes, type]);
    }
  };

  const toggleTempCategory = (category: string) => {
    if (tempCategories.includes(category)) {
      setTempCategories(tempCategories.filter((c) => c !== category));
    } else {
      setTempCategories([...tempCategories, category]);
    }
  };

  const toggleTempServiceType = (serviceType: string) => {
    if (tempServiceTypes.includes(serviceType)) {
      setTempServiceTypes(tempServiceTypes.filter((st) => st !== serviceType));
    } else {
      setTempServiceTypes([...tempServiceTypes, serviceType]);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(selectedTypes.filter((t) => t !== type));
  };

  const toggleCategory = (categoryCode: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== categoryCode));
  };

  const toggleServiceType = (serviceType: string) => {
    setSelectedServiceTypes(selectedServiceTypes.filter((st) => st !== serviceType));
  };

  const getCategoryName = (categoryCode: string): string => {
    const category = walletBalance?.categories.find((c) => c.categoryCode === categoryCode);
    return category?.name || categoryCode;
  };

  const setQuickDateRange = (range: 'today' | '7days' | '30days' | '3months') => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];

    let fromDate = '';
    switch (range) {
      case 'today':
        fromDate = toDate;
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        fromDate = sevenDaysAgo.toISOString().split('T')[0];
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        fromDate = thirtyDaysAgo.toISOString().split('T')[0];
        break;
      case '3months':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setMonth(today.getMonth() - 3);
        fromDate = ninetyDaysAgo.toISOString().split('T')[0];
        break;
    }

    setTempDateFrom(fromDate);
    setTempDateTo(toDate);
  };

  // Calculate totals
  const totals = useMemo(() => {
    const debits = filteredTransactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const credits = filteredTransactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);

    return { debits, credits, net: credits - debits };
  }, [filteredTransactions]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // 1. Transaction Volume by Type
    const typeData = [
      {
        name: 'Credits',
        count: filteredTransactions.filter((t) => t.type === 'CREDIT').length,
        amount: totals.credits,
        fill: '#E8FFF5',
        stroke: '#046D40',
      },
      {
        name: 'Debits',
        count: filteredTransactions.filter((t) => t.type === 'DEBIT').length,
        amount: totals.debits,
        fill: '#FFF2E7',
        stroke: '#CD6D19',
      },
      {
        name: 'Refunds',
        count: filteredTransactions.filter((t) => t.type === 'REFUND').length,
        amount: filteredTransactions
          .filter((t) => t.type === 'REFUND')
          .reduce((sum, t) => sum + t.amount, 0),
        fill: '#F5EAFF',
        stroke: '#4A147B',
      },
    ];

    // 2. Category Distribution
    const categoryMap = new Map<string, number>();
    filteredTransactions.forEach((txn) => {
      if (txn.categoryCode) {
        const categoryName = getCategoryName(txn.categoryCode);
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + txn.amount);
      }
    });
    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      x: name,
      y: Math.abs(value),
    }));

    // 3. Daily Transaction Trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyData = last7Days.map((date) => {
      const dayTransactions = filteredTransactions.filter((txn) =>
        txn.createdAt.startsWith(date)
      );
      return {
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        credits: dayTransactions
          .filter((t) => t.type === 'CREDIT')
          .reduce((sum, t) => sum + t.amount, 0),
        debits: dayTransactions
          .filter((t) => t.type === 'DEBIT')
          .reduce((sum, t) => sum + t.amount, 0),
      };
    });

    // 4. Balance Trend
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const balanceTrend = sortedTransactions.slice(-10).map((txn, index) => ({
      x: index + 1,
      y: txn.newBalance?.total || 0,
      label: new Date(txn.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
    }));

    return { typeData, categoryData, dailyData, balanceTrend };
  }, [filteredTransactions, totals, walletBalance]);

  const COLORS = [
    { fill: '#FFF2E7', stroke: '#CD6D19' },
    { fill: '#FFFAE7', stroke: '#AF8C02' },
    { fill: '#E8FFF5', stroke: '#046D40' },
    { fill: '#F5EAFF', stroke: '#4A147B' },
    { fill: '#EBEBEB', stroke: '#444444' },
    { fill: '#F4F9FF', stroke: '#013978' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f7f7fc',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#0F5FDC" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
          ...Platform.select({
            web: {
              position: 'sticky' as any,
              top: 0,
              zIndex: 10,
            },
          }),
        }}
      >
        <SafeAreaView edges={['top']}>
          <View
            style={{
              maxWidth: 480,
              marginHorizontal: 'auto',
              width: '100%',
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  padding: 8,
                  borderRadius: 8,
                }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={24} height={24} color="#0E51A2" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2' }}>
                  Transaction History
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                  View your complete transaction record
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          paddingBottom: 100,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* Summary Cards */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {/* Current Balance */}
            <View style={{ width: '48%' }}>
              <LinearGradient
                colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <WalletIcon width={20} height={20} color="#0F5FDC" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>
                  Current Balance
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2' }}>
                  ₹{(walletBalance?.totalBalance?.current || 0).toLocaleString('en-IN')}
                </Text>
              </LinearGradient>
            </View>

            {/* Total Credits */}
            <View style={{ width: '48%' }}>
              <LinearGradient
                colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <ArrowUpIcon width={20} height={20} color="#16a34a" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>
                  Total Credits
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2' }}>
                  ₹{totals.credits.toLocaleString('en-IN')}
                </Text>
              </LinearGradient>
            </View>

            {/* Total Debits */}
            <View style={{ width: '48%' }}>
              <LinearGradient
                colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <ArrowDownIcon width={20} height={20} color="#ef4444" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>
                  Total Debits
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2' }}>
                  ₹{totals.debits.toLocaleString('en-IN')}
                </Text>
              </LinearGradient>
            </View>

            {/* Net Change */}
            <View style={{ width: '48%' }}>
              <LinearGradient
                colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <BanknotesIcon width={20} height={20} color="#0F5FDC" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>
                  Net Change
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: totals.net >= 0 ? '#16a34a' : '#ef4444',
                  }}
                >
                  {totals.net >= 0 ? '+' : ''}₹{totals.net.toLocaleString('en-IN')}
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Analytics Charts Section */}
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2', marginBottom: 16 }}>
              Analytics Overview
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
            >
              {/* Chart 1: Transaction Volume by Type */}
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 280,
                  height: 220,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#0E51A2', marginBottom: 8, letterSpacing: 0.5 }}>
                  TRANSACTION VOLUME
                </Text>
                <View style={{ height: 160 }}>
                  {chartData.typeData.some(d => d.amount > 0) ? (
                    <BarChart
                      data={{
                        labels: chartData.typeData.map(d => d.name),
                        datasets: [
                          {
                            data: chartData.typeData.map(d => d.amount || 0.1),
                          },
                        ],
                      }}
                      width={248}
                      height={160}
                      yAxisLabel="₹"
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'rgba(224, 233, 255, 0.1)',
                        backgroundGradientTo: 'rgba(200, 216, 255, 0.1)',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(15, 95, 220, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(14, 81, 162, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForLabels: {
                          fontSize: 9,
                        },
                        barPercentage: 0.6,
                      }}
                      style={{
                        borderRadius: 8,
                      }}
                      showValuesOnTopOfBars
                      fromZero
                    />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#6b7280' }}>No data</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              {/* Chart 2: 7-Day Trend */}
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 280,
                  height: 220,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#0E51A2', marginBottom: 8, letterSpacing: 0.5 }}>
                  7-DAY TREND
                </Text>
                <View style={{ height: 160 }}>
                  {chartData.dailyData.some(d => d.credits > 0 || d.debits > 0) ? (
                    <BarChart
                      data={{
                        labels: chartData.dailyData.map(d => d.date.split(' ')[0]),
                        datasets: [
                          {
                            data: chartData.dailyData.map(d => Math.max(d.credits, d.debits) || 0.1),
                          },
                        ],
                      }}
                      width={248}
                      height={160}
                      yAxisLabel="₹"
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'rgba(224, 233, 255, 0.1)',
                        backgroundGradientTo: 'rgba(200, 216, 255, 0.1)',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(4, 109, 64, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForLabels: {
                          fontSize: 8,
                        },
                        barPercentage: 0.5,
                      }}
                      style={{
                        borderRadius: 8,
                      }}
                      fromZero
                    />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#6b7280' }}>No data</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              {/* Chart 3: Category Distribution */}
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 280,
                  height: 220,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#0E51A2', marginBottom: 8, letterSpacing: 0.5 }}>
                  CATEGORY SPLIT
                </Text>
                <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
                  {chartData.categoryData.length > 0 ? (
                    <PieChart
                      data={chartData.categoryData.map((cat, idx) => ({
                        name: cat.x,
                        population: cat.y,
                        color: COLORS[idx % COLORS.length].stroke,
                        legendFontColor: '#6b7280',
                        legendFontSize: 9,
                      }))}
                      width={248}
                      height={160}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(15, 95, 220, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="0"
                      center={[60, 0]}
                      absolute
                    />
                  ) : (
                    <Text style={{ color: '#6b7280', fontSize: 10 }}>No category data</Text>
                  )}
                </View>
              </LinearGradient>

              {/* Chart 4: Balance Trend */}
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 280,
                  height: 220,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#0E51A2', marginBottom: 8, letterSpacing: 0.5 }}>
                  BALANCE TREND
                </Text>
                <View style={{ height: 160 }}>
                  {chartData.balanceTrend.length > 0 ? (
                    <LineChart
                      data={{
                        labels: chartData.balanceTrend.map(d => d.label),
                        datasets: [
                          {
                            data: chartData.balanceTrend.map(d => d.y || 0),
                          },
                        ],
                      }}
                      width={248}
                      height={160}
                      yAxisLabel="₹"
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'rgba(224, 233, 255, 0.1)',
                        backgroundGradientTo: 'rgba(200, 216, 255, 0.1)',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(74, 20, 123, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForLabels: {
                          fontSize: 8,
                        },
                        propsForDots: {
                          r: '4',
                          strokeWidth: '2',
                          stroke: '#4A147B',
                        },
                      }}
                      bezier
                      style={{
                        borderRadius: 8,
                      }}
                      fromZero
                    />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#6b7280' }}>No balance data</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </ScrollView>
          </Animated.View>

          {/* Search and Filters */}
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            <LinearGradient
              colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderColor: '#86ACD8',
                marginBottom: 16,
              }}
            >
              {/* Search Bar */}
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <View style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}>
                  <MagnifyingGlassIcon width={20} height={20} color="#9ca3af" />
                </View>
                <TextInput
                  placeholder="Search by transaction ID, description, or provider..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    width: '100%',
                    paddingLeft: 40,
                    paddingRight: 16,
                    paddingVertical: 12,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#303030',
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Filter Buttons Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {/* Transaction Type Filter */}
                <TouchableOpacity
                  onPress={() => openPopup('transactionType')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: selectedTypes.length > 0 ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 2,
                    borderColor: selectedTypes.length > 0 ? '#0F5FDC' : '#86ACD8',
                  }}
                >
                  <FunnelIcon width={14} height={14} color={selectedTypes.length > 0 ? '#FFFFFF' : '#0E51A2'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: selectedTypes.length > 0 ? '#FFFFFF' : '#0E51A2' }}>
                    Type
                  </Text>
                  {selectedTypes.length > 0 && (
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{selectedTypes.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Date Range Filter */}
                <TouchableOpacity
                  onPress={() => openPopup('dateRange')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: (dateFrom || dateTo) ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 2,
                    borderColor: (dateFrom || dateTo) ? '#0F5FDC' : '#86ACD8',
                  }}
                >
                  <CalendarIcon width={14} height={14} color={(dateFrom || dateTo) ? '#FFFFFF' : '#0E51A2'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: (dateFrom || dateTo) ? '#FFFFFF' : '#0E51A2' }}>
                    Date
                  </Text>
                  {(dateFrom || dateTo) && (
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Amount Range Filter */}
                <TouchableOpacity
                  onPress={() => openPopup('amountRange')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: (minAmount || maxAmount) ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 2,
                    borderColor: (minAmount || maxAmount) ? '#0F5FDC' : '#86ACD8',
                  }}
                >
                  <BanknotesIcon width={14} height={14} color={(minAmount || maxAmount) ? '#FFFFFF' : '#0E51A2'} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: (minAmount || maxAmount) ? '#FFFFFF' : '#0E51A2' }}>
                    Amount
                  </Text>
                  {(minAmount || maxAmount) && (
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Category Filter */}
                {walletBalance && walletBalance.categories.length > 0 && (
                  <TouchableOpacity
                    onPress={() => openPopup('category')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: selectedCategories.length > 0 ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                      borderWidth: 2,
                      borderColor: selectedCategories.length > 0 ? '#0F5FDC' : '#86ACD8',
                    }}
                  >
                    <TagIcon width={14} height={14} color={selectedCategories.length > 0 ? '#FFFFFF' : '#0E51A2'} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: selectedCategories.length > 0 ? '#FFFFFF' : '#0E51A2' }}>
                      Category
                    </Text>
                    {selectedCategories.length > 0 && (
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{selectedCategories.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* Service Type Filter */}
                {availableServiceTypes.length > 0 && (
                  <TouchableOpacity
                    onPress={() => openPopup('serviceType')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: selectedServiceTypes.length > 0 ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                      borderWidth: 2,
                      borderColor: selectedServiceTypes.length > 0 ? '#0F5FDC' : '#86ACD8',
                    }}
                  >
                    <TagIcon width={14} height={14} color={selectedServiceTypes.length > 0 ? '#FFFFFF' : '#0E51A2'} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: selectedServiceTypes.length > 0 ? '#FFFFFF' : '#0E51A2' }}>
                      Service
                    </Text>
                    {selectedServiceTypes.length > 0 && (
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{selectedServiceTypes.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* Sort By Filter */}
                <TouchableOpacity
                  onPress={() => openPopup('sortBy')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: (sortBy !== 'date' || sortOrder !== 'desc') ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 2,
                    borderColor: (sortBy !== 'date' || sortOrder !== 'desc') ? '#0F5FDC' : '#86ACD8',
                  }}
                >
                  {sortOrder === 'desc' ? (
                    <ArrowDownIcon width={14} height={14} color={(sortBy !== 'date' || sortOrder !== 'desc') ? '#FFFFFF' : '#0E51A2'} />
                  ) : (
                    <ArrowUpIcon width={14} height={14} color={(sortBy !== 'date' || sortOrder !== 'desc') ? '#FFFFFF' : '#0E51A2'} />
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '600', color: (sortBy !== 'date' || sortOrder !== 'desc') ? '#FFFFFF' : '#0E51A2' }}>
                    Sort
                  </Text>
                  {(sortBy !== 'date' || sortOrder !== 'desc') && (
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Clear All */}
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    onPress={clearAllFilters}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: '#ef4444',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                      Clear All ({activeFilterCount})
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </LinearGradient>
          </Animated.View>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <Animated.View entering={FadeInDown.duration(300).delay(250)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {/* Transaction Type Tags */}
              {selectedTypes.map((type) => (
                <View
                  key={type}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#DBEAFE',
                    borderRadius: 8,
                  }}
                >
                  <TagIcon width={12} height={12} color="#1E40AF" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E40AF' }}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </Text>
                  <TouchableOpacity onPress={() => toggleType(type)}>
                    <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Category Tags */}
              {selectedCategories.map((catCode) => (
                <View
                  key={catCode}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#D1FAE5',
                    borderRadius: 8,
                  }}
                >
                  <TagIcon width={12} height={12} color="#065F46" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#065F46' }}>
                    {getCategoryName(catCode)}
                  </Text>
                  <TouchableOpacity onPress={() => toggleCategory(catCode)}>
                    <Text style={{ fontSize: 12, color: '#065F46', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Date Tags */}
              {dateFrom && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#E9D5FF',
                    borderRadius: 8,
                  }}
                >
                  <CalendarIcon width={12} height={12} color="#6B21A8" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B21A8' }}>
                    From: {new Date(dateFrom).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity onPress={() => setDateFrom('')}>
                    <Text style={{ fontSize: 12, color: '#6B21A8', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {dateTo && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#E9D5FF',
                    borderRadius: 8,
                  }}
                >
                  <CalendarIcon width={12} height={12} color="#6B21A8" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B21A8' }}>
                    To: {new Date(dateTo).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity onPress={() => setDateTo('')}>
                    <Text style={{ fontSize: 12, color: '#6B21A8', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Amount Tags */}
              {minAmount && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#FED7AA',
                    borderRadius: 8,
                  }}
                >
                  <BanknotesIcon width={12} height={12} color="#9A3412" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#9A3412' }}>Min: ₹{minAmount}</Text>
                  <TouchableOpacity onPress={() => setMinAmount('')}>
                    <Text style={{ fontSize: 12, color: '#9A3412', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {maxAmount && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#FED7AA',
                    borderRadius: 8,
                  }}
                >
                  <BanknotesIcon width={12} height={12} color="#9A3412" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#9A3412' }}>Max: ₹{maxAmount}</Text>
                  <TouchableOpacity onPress={() => setMaxAmount('')}>
                    <Text style={{ fontSize: 12, color: '#9A3412', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Service Type Tags */}
              {selectedServiceTypes.map((st) => (
                <View
                  key={st}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#C7D2FE',
                    borderRadius: 8,
                  }}
                >
                  <TagIcon width={12} height={12} color="#3730A3" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3730A3' }}>{st}</Text>
                  <TouchableOpacity onPress={() => toggleServiceType(st)}>
                    <Text style={{ fontSize: 12, color: '#3730A3', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Reversed Transactions Tag */}
              {!includeReversed && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>Excluding Reversed</Text>
                  <TouchableOpacity onPress={() => setIncludeReversed(true)}>
                    <Text style={{ fontSize: 12, color: '#374151', fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          )}

          {/* Transactions List */}
          <Animated.View entering={FadeInDown.duration(300).delay(300)}>
            {filteredTransactions.length === 0 ? (
              <LinearGradient
                colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 48,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <DocumentArrowDownIcon width={32} height={32} color="#9ca3af" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2', marginBottom: 8, textAlign: 'center' }}>
                  No transactions found
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                  Try adjusting your search or filters to find transactions
                </Text>
              </LinearGradient>
            ) : (
              <View style={{ gap: 16 }}>
                {filteredTransactions.map((txn, index) => (
                  <Animated.View key={txn._id} entering={FadeInDown.duration(300).delay(300 + index * 50)}>
                    <LinearGradient
                      colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 2,
                        borderColor: '#86ACD8',
                      }}
                    >
                      {/* Main Content */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <View style={{ flex: 1 }}>
                          {/* Transaction Title */}
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2', marginBottom: 4 }} numberOfLines={2}>
                            {txn.notes || `${txn.serviceType || 'Transaction'}`}
                          </Text>

                          {/* Provider */}
                          {txn.serviceProvider && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                              <View style={{ width: 6, height: 6, backgroundColor: '#6b7280', borderRadius: 3 }} />
                              <Text style={{ fontSize: 14, color: '#6b7280' }} numberOfLines={1}>
                                {txn.serviceProvider}
                              </Text>
                            </View>
                          )}

                          {/* Transaction ID */}
                          <View
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.6)',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              alignSelf: 'flex-start',
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#6b7280', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                              {txn.transactionId}
                            </Text>
                          </View>
                        </View>

                        {/* Amount Badge */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 12,
                            borderWidth: 2,
                            backgroundColor:
                              txn.type === 'CREDIT'
                                ? '#F0FDF4'
                                : txn.type === 'REFUND'
                                ? '#EFF6FF'
                                : '#FEF2F2',
                            borderColor:
                              txn.type === 'CREDIT'
                                ? '#BBF7D0'
                                : txn.type === 'REFUND'
                                ? '#BFDBFE'
                                : '#FECACA',
                          }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              backgroundColor: '#FFFFFF',
                              borderRadius: 12,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {txn.type === 'CREDIT' ? (
                              <ArrowUpIcon width={16} height={16} color="#16a34a" />
                            ) : (
                              <ArrowDownIcon width={16} height={16} color="#ef4444" />
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '700',
                              color: txn.type === 'CREDIT' ? '#16a34a' : txn.type === 'REFUND' ? '#2563eb' : '#ef4444',
                            }}
                          >
                            {txn.type === 'CREDIT' || txn.type === 'REFUND' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      {/* Metadata Row */}
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 12,
                          paddingTop: 16,
                          borderTopWidth: 2,
                          borderTopColor: '#86ACD8',
                        }}
                      >
                        {/* Date */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 12,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: '#FFFFFF',
                              borderRadius: 16,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <CalendarIcon width={16} height={16} color="#0F5FDC" />
                          </View>
                          <View>
                            <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '500' }}>Date</Text>
                            <Text style={{ fontSize: 14, color: '#303030', fontWeight: '700' }}>{formatDate(txn.createdAt)}</Text>
                          </View>
                        </View>

                        {/* Time */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 12,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: '#FFFFFF',
                              borderRadius: 16,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <ClockIcon width={16} height={16} color="#0F5FDC" />
                          </View>
                          <View>
                            <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '500' }}>Time</Text>
                            <Text style={{ fontSize: 14, color: '#303030', fontWeight: '700' }}>{formatTime(txn.createdAt)}</Text>
                          </View>
                        </View>

                        {/* Category Badge */}
                        {txn.categoryCode && (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              backgroundColor: 'rgba(255, 255, 255, 0.6)',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 12,
                              marginLeft: 'auto',
                            }}
                          >
                            <TagIcon width={16} height={16} color="#0F5FDC" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0E51A2' }}>{getCategoryName(txn.categoryCode)}</Text>
                          </View>
                        )}
                      </View>

                      {/* Balance After Transaction */}
                      {txn.newBalance && (
                        <View
                          style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTopWidth: 2,
                            borderTopColor: '#86ACD8',
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.6)',
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              borderRadius: 12,
                            }}
                          >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>Balance After Transaction</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2' }}>
                              ₹{txn.newBalance.total.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>
                      )}
                    </LinearGradient>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Results Count */}
            {filteredTransactions.length > 0 && (
              <Text style={{ textAlign: 'center', marginTop: 24, fontSize: 14, fontWeight: '500', color: '#6b7280' }}>
                Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
              </Text>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Filter Popups */}
      {/* Transaction Type Popup */}
      <FilterPopup
        visible={activePopup === 'transactionType'}
        title="Transaction Type"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('transactionType')}
      >
        <View style={{ gap: 12 }}>
          {['DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => toggleTempType(type)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: tempTypes.includes(type) ? '#EFF6FF' : 'transparent',
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: tempTypes.includes(type) ? '#0F5FDC' : '#86ACD8',
                  backgroundColor: tempTypes.includes(type) ? '#0F5FDC' : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {tempTypes.includes(type) && (
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>✓</Text>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FilterPopup>

      {/* Date Range Popup */}
      <FilterPopup
        visible={activePopup === 'dateRange'}
        title="Date Range"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('dateRange')}
      >
        <View style={{ gap: 16 }}>
          {/* Quick Filters */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Today', value: 'today' },
              { label: 'Last 7 Days', value: '7days' },
              { label: 'Last 30 Days', value: '30days' },
              { label: 'Last 3 Months', value: '3months' },
            ].map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                onPress={() => setQuickDateRange(value as any)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#0E51A2' }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Date Inputs */}
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6 }}>From</Text>
              <TextInput
                value={tempDateFrom}
                onChangeText={setTempDateFrom}
                placeholder="YYYY-MM-DD"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#303030',
                }}
              />
              {Platform.OS !== 'web' && (
                <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>Use quick presets above or enter YYYY-MM-DD</Text>
              )}
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6 }}>To</Text>
              <TextInput
                value={tempDateTo}
                onChangeText={setTempDateTo}
                placeholder="YYYY-MM-DD"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#303030',
                }}
              />
            </View>
          </View>
        </View>
      </FilterPopup>

      {/* Amount Range Popup */}
      <FilterPopup
        visible={activePopup === 'amountRange'}
        title="Amount Range"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('amountRange')}
      >
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6 }}>Min Amount</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="₹0"
              value={tempMinAmount}
              onChangeText={setTempMinAmount}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 2,
                borderColor: '#86ACD8',
                borderRadius: 8,
                fontSize: 14,
                color: '#303030',
              }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6 }}>Max Amount</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="₹10000"
              value={tempMaxAmount}
              onChangeText={setTempMaxAmount}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 2,
                borderColor: '#86ACD8',
                borderRadius: 8,
                fontSize: 14,
                color: '#303030',
              }}
            />
          </View>
        </View>
      </FilterPopup>

      {/* Category Popup */}
      <FilterPopup
        visible={activePopup === 'category'}
        title="Category"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('category')}
      >
        <View style={{ gap: 8 }}>
          {walletBalance?.categories.map((cat) => (
            <TouchableOpacity
              key={cat.categoryCode}
              onPress={() => toggleTempCategory(cat.categoryCode)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: tempCategories.includes(cat.categoryCode) ? '#EFF6FF' : 'transparent',
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: tempCategories.includes(cat.categoryCode) ? '#0F5FDC' : '#86ACD8',
                  backgroundColor: tempCategories.includes(cat.categoryCode) ? '#0F5FDC' : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {tempCategories.includes(cat.categoryCode) && (
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>✓</Text>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FilterPopup>

      {/* Service Type Popup */}
      <FilterPopup
        visible={activePopup === 'serviceType'}
        title="Service Type"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('serviceType')}
      >
        <View style={{ gap: 8 }}>
          {availableServiceTypes.map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => toggleTempServiceType(st)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: tempServiceTypes.includes(st) ? '#EFF6FF' : 'transparent',
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: tempServiceTypes.includes(st) ? '#0F5FDC' : '#86ACD8',
                  backgroundColor: tempServiceTypes.includes(st) ? '#0F5FDC' : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {tempServiceTypes.includes(st) && (
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>✓</Text>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FilterPopup>

      {/* Sort By Popup */}
      <FilterPopup
        visible={activePopup === 'sortBy'}
        title="Sort By"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('sortBy')}
      >
        <View style={{ gap: 16 }}>
          {/* Sort Field */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0E51A2', marginBottom: 8, letterSpacing: 0.5 }}>
              SORT FIELD
            </Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setTempSortBy('date')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: tempSortBy === 'date' ? '#EFF6FF' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: tempSortBy === 'date' ? '#0F5FDC' : '#86ACD8',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {tempSortBy === 'date' && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F5FDC' }} />
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTempSortBy('amount')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: tempSortBy === 'amount' ? '#EFF6FF' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: tempSortBy === 'amount' ? '#0F5FDC' : '#86ACD8',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {tempSortBy === 'amount' && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F5FDC' }} />
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>Amount</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Order */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0E51A2', marginBottom: 8, letterSpacing: 0.5 }}>
              SORT ORDER
            </Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setTempSortOrder('desc')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: tempSortOrder === 'desc' ? '#EFF6FF' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: tempSortOrder === 'desc' ? '#0F5FDC' : '#86ACD8',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {tempSortOrder === 'desc' && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F5FDC' }} />
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                  {tempSortBy === 'date' ? 'Newest First' : 'High to Low'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTempSortOrder('asc')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: tempSortOrder === 'asc' ? '#EFF6FF' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: tempSortOrder === 'asc' ? '#0F5FDC' : '#86ACD8',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {tempSortOrder === 'asc' && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F5FDC' }} />
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                  {tempSortBy === 'date' ? 'Oldest First' : 'Low to High'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </FilterPopup>
    </View>
  );
}
