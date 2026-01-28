import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronLeftIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  CheckIcon,
  SparklesIcon,
  FunnelIcon,
  CalendarIcon,
  TagIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  HeartIcon,
} from '../../src/components/icons/InlineSVGs';
import apiClient from '../../src/lib/api/client';
import { useFamily } from '../../src/contexts/FamilyContext';
import { fetchWalletBalance, WalletBalance as APIWalletBalance, WalletCategory } from '../../src/lib/api/wallet';

// ============================================================================
// TYPES
// ============================================================================

interface TotalBalance {
  allocated: number;
  current: number;
  consumed: number;
}

interface Category {
  categoryCode: string;
  name: string;
  total: number;
  available: number;
  consumed: number;
}

interface Transaction {
  _id: string;
  type: 'DEBIT' | 'CREDIT' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  notes: string;
  serviceType: string;
  serviceProvider: string;
  createdAt: string;
  newBalance: {
    total: number;
  };
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const getCategoryIcon = (categoryCode: string, categoryName?: string) => {
  const code = categoryCode?.toUpperCase() || '';
  const name = categoryName?.toUpperCase() || '';
  const combined = `${code} ${name}`;

  // Lab/Diagnostics
  if (
    code === 'CAT003' ||
    code === 'DIAGNOSTICS' ||
    code === 'LAB' ||
    combined.includes('LABORATORY') ||
    combined.includes('DIAGNOSTIC') ||
    combined.includes('LAB TEST') ||
    combined.includes('PATHOLOGY') ||
    combined.includes('RADIOLOGY')
  ) {
    return BeakerIcon;
  }

  // Pharmacy/Medicine
  if (
    code === 'CAT002' ||
    code === 'PHARMACY' ||
    code === 'MEDICINE' ||
    combined.includes('PHARMACY') ||
    combined.includes('MEDICINE')
  ) {
    return BuildingStorefrontIcon;
  }

  // Dental/Vision
  if (
    code === 'CAT004' ||
    code === 'DENTAL' ||
    code === 'VISION' ||
    combined.includes('DENTAL') ||
    combined.includes('VISION') ||
    combined.includes('EYE CARE')
  ) {
    return EyeIcon;
  }

  // Default
  return HeartIcon;
};

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

export default function WalletScreen() {
  const router = useRouter();
  const { familyMembers, activeMember, viewingUserId, loggedInUser, canSwitchProfiles } = useFamily();

  // State
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  const [walletData, setWalletData] = useState<{
    totalBalance: TotalBalance;
    categories: Category[];
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedWalletMember, setSelectedWalletMember] = useState<any>(null);

  // Filter state
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

  // Sync selectedWalletMember with activeMember
  useEffect(() => {
    if (activeMember) {
      setSelectedWalletMember(activeMember);
    }
  }, [activeMember]);

  // Determine effective user ID for wallet (local selection or global active member)
  const effectiveUserId = selectedWalletMember?._id || viewingUserId || activeMember?._id || loggedInUser?._id || '';

  // Determine if family dropdown should be shown
  const shouldShowFamilyDropdown = useMemo(() => {
    // Show dropdown only if:
    // 1. The currently active profile (global) is the primary member
    // 2. Has family members to show
    // 3. Can switch profiles
    const currentlyViewingPrimary = activeMember?.isPrimary || activeMember?._id === loggedInUser?._id;
    const hasFamilyMembers = familyMembers.length > 1;
    return currentlyViewingPrimary && hasFamilyMembers && canSwitchProfiles;
  }, [activeMember, loggedInUser, familyMembers, canSwitchProfiles]);

  // Count active filters
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
        setTempIncludeReversed(includeReversed);
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
        setIncludeReversed(tempIncludeReversed);
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

  const setQuickDateRange = (range: 'today' | '7days' | '30days' | '90days') => {
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
      case '90days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        fromDate = ninetyDaysAgo.toISOString().split('T')[0];
        break;
    }

    setTempDateFrom(fromDate);
    setTempDateTo(toDate);
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

  const getCategoryName = (categoryCode: string) => {
    const category = walletData?.categories?.find((cat) => cat.categoryCode === categoryCode);
    return category?.name || categoryCode;
  };

  const handleMemberSelect = (member: any) => {
    setSelectedWalletMember(member);
    setIsDropdownOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch wallet data whenever effectiveUserId or filters change
  useEffect(() => {
    if (effectiveUserId) {
      console.log('[Wallet] Fetching wallet data for userId:', effectiveUserId);
      fetchWalletDataForUser(effectiveUserId);
    }
  }, [
    effectiveUserId,
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

  // Single unified function to fetch all wallet data for a user
  const fetchWalletDataForUser = async (userId: string) => {
    setLoading(true);

    try {
      // Build query parameters for transactions
      const params: any = {
        userId,
        limit: 100, // Fetch more transactions for better filtering
      };

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

      console.log('[Wallet] Fetching with params:', params);

      // Fetch both wallet balance AND transactions in parallel
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetchWalletBalance(userId),
        apiClient.get('/wallet/transactions', { params }),
      ]);

      console.log('[Wallet] Balance response:', balanceResponse);
      console.log('[Wallet] Transactions response:', transactionsResponse.data);

      // Set wallet balance
      setWalletData({
        totalBalance: balanceResponse.totalBalance,
        categories: balanceResponse.categories,
      });

      // Set transactions
      const transactionData = transactionsResponse.data.transactions || [];
      setTransactions(transactionData);

      // Extract unique service types
      const uniqueServiceTypes = Array.from(
        new Set(
          transactionData
            .map((t: any) => t.serviceType)
            .filter((st: string | undefined) => st)
        )
      ) as string[];
      setAvailableServiceTypes(uniqueServiceTypes);
    } catch (error: any) {
      console.error('[Wallet] Error fetching wallet data:', error);
      console.error('[Wallet] Error details:', error.response?.data);

      // Set empty data on error
      setWalletData({
        totalBalance: { allocated: 0, current: 0, consumed: 0 },
        categories: [],
      });
      setTransactions([]);
      setAvailableServiceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
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

  const totalBalance = walletData?.totalBalance || { allocated: 0, current: 0, consumed: 0 };
  const categories = walletData?.categories || [];

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
                style={{ padding: 8, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <ChevronLeftIcon width={24} height={24} color="#0E51A2" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  My Wallet
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Manage your health benefits
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
          paddingBottom: 80,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 24 }}>
          {/* Family Member Selector */}
          {shouldShowFamilyDropdown && (
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
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2', marginBottom: 12 }}>
                View Wallet For:
              </Text>
              <TouchableOpacity
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#0F5FDC',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#303030' }}>
                  {selectedWalletMember?.name?.firstName} {selectedWalletMember?.name?.lastName} ({selectedWalletMember?.isPrimary ? 'Self' : selectedWalletMember?.relationship})
                </Text>
                <ChevronDownIcon
                  width={20}
                  height={20}
                  color="#0F5FDC"
                  style={{
                    transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }],
                  }}
                />
              </TouchableOpacity>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {familyMembers.map((member) => {
                    const isSelected = selectedWalletMember?._id === member._id;
                    return (
                      <TouchableOpacity
                        key={member._id}
                        onPress={() => handleMemberSelect(member)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: isSelected
                            ? 'rgba(224, 233, 255, 0.48)'
                            : '#FFFFFF',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#303030' }}>
                          {member.name.firstName} {member.name.lastName} ({member.isPrimary ? 'Self' : member.relationship})
                        </Text>
                        {isSelected && <CheckIcon width={20} height={20} color="#0F5FDC" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </LinearGradient>
          )}

          {/* Balance Card */}
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 20,
              borderWidth: 2,
              borderColor: '#F7DCAF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Icon */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <LinearGradient
                colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(164, 191, 254, 0.48)',
                }}
              >
                <BanknotesIcon width={28} height={28} color="#0F5FDC" />
              </LinearGradient>
            </View>

            {/* Total Balance */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Available Balance
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#0E51A2' }}>
                  ₹{totalBalance.current.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  / ₹{totalBalance.allocated.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                  Total Allocated
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2' }}>
                  ₹{totalBalance.allocated.toLocaleString()}
                </Text>
              </LinearGradient>

              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                  Total Used
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0E51A2' }}>
                  ₹{totalBalance.consumed.toLocaleString()}
                </Text>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Tabs */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#e5e7eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              overflow: 'hidden',
            }}
          >
            {/* Tab Headers */}
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 2,
                borderBottomColor: '#e5e7eb',
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveTab('transactions')}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderBottomWidth: activeTab === 'transactions' ? 4 : 0,
                  borderBottomColor: '#0F5FDC',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === 'transactions' ? '#0E51A2' : '#6b7280',
                  }}
                >
                  Transactions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('categories')}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderBottomWidth: activeTab === 'categories' ? 4 : 0,
                  borderBottomColor: '#0F5FDC',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === 'categories' ? '#0E51A2' : '#6b7280',
                  }}
                >
                  Categories
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={{ padding: 20 }}>
              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <View>
                  {/* Filter Buttons Row */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 16, marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                  >
                    {/* Transaction Type Filter */}
                    <TouchableOpacity
                      onPress={() => openPopup('transactionType')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: selectedTypes.length > 0 ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                        borderWidth: 2,
                        borderColor: selectedTypes.length > 0 ? '#0F5FDC' : '#86ACD8',
                        gap: 6,
                      }}
                    >
                      <FunnelIcon
                        width={14}
                        height={14}
                        color={selectedTypes.length > 0 ? '#FFFFFF' : '#0E51A2'}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: selectedTypes.length > 0 ? '#FFFFFF' : '#0E51A2',
                        }}
                      >
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
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                            {selectedTypes.length}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Date Range Filter */}
                    <TouchableOpacity
                      onPress={() => openPopup('dateRange')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: (dateFrom || dateTo) ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                        borderWidth: 2,
                        borderColor: (dateFrom || dateTo) ? '#0F5FDC' : '#86ACD8',
                        gap: 6,
                      }}
                    >
                      <CalendarIcon
                        width={14}
                        height={14}
                        color={(dateFrom || dateTo) ? '#FFFFFF' : '#0E51A2'}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: (dateFrom || dateTo) ? '#FFFFFF' : '#0E51A2',
                        }}
                      >
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
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: (minAmount || maxAmount) ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                        borderWidth: 2,
                        borderColor: (minAmount || maxAmount) ? '#0F5FDC' : '#86ACD8',
                        gap: 6,
                      }}
                    >
                      <BanknotesIcon
                        width={14}
                        height={14}
                        color={(minAmount || maxAmount) ? '#FFFFFF' : '#0E51A2'}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: (minAmount || maxAmount) ? '#FFFFFF' : '#0E51A2',
                        }}
                      >
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
                    {categories.length > 0 && (
                      <TouchableOpacity
                        onPress={() => openPopup('category')}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: selectedCategories.length > 0 ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                          borderWidth: 2,
                          borderColor: selectedCategories.length > 0 ? '#0F5FDC' : '#86ACD8',
                          gap: 6,
                        }}
                      >
                        <TagIcon
                          width={14}
                          height={14}
                          color={selectedCategories.length > 0 ? '#FFFFFF' : '#0E51A2'}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: selectedCategories.length > 0 ? '#FFFFFF' : '#0E51A2',
                          }}
                        >
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
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                              {selectedCategories.length}
                            </Text>
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
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: selectedServiceTypes.length > 0 ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                          borderWidth: 2,
                          borderColor: selectedServiceTypes.length > 0 ? '#0F5FDC' : '#86ACD8',
                          gap: 6,
                        }}
                      >
                        <TagIcon
                          width={14}
                          height={14}
                          color={selectedServiceTypes.length > 0 ? '#FFFFFF' : '#0E51A2'}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: selectedServiceTypes.length > 0 ? '#FFFFFF' : '#0E51A2',
                          }}
                        >
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
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                              {selectedServiceTypes.length}
                            </Text>
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
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: (sortBy !== 'date' || sortOrder !== 'desc') ? '#0F5FDC' : 'rgba(255, 255, 255, 0.6)',
                        borderWidth: 2,
                        borderColor: (sortBy !== 'date' || sortOrder !== 'desc') ? '#0F5FDC' : '#86ACD8',
                        gap: 6,
                      }}
                    >
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon
                          width={14}
                          height={14}
                          color={(sortBy !== 'date' || sortOrder !== 'desc') ? '#FFFFFF' : '#0E51A2'}
                        />
                      ) : (
                        <ArrowUpIcon
                          width={14}
                          height={14}
                          color={(sortBy !== 'date' || sortOrder !== 'desc') ? '#FFFFFF' : '#0E51A2'}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: (sortBy !== 'date' || sortOrder !== 'desc') ? '#FFFFFF' : '#0E51A2',
                        }}
                      >
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

                    {/* Clear All Filters */}
                    {activeFilterCount > 0 && (
                      <TouchableOpacity
                        onPress={clearAllFilters}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: '#ef4444',
                          gap: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>
                          Clear All ({activeFilterCount})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>

                  {/* Active Filter Tags */}
                  {activeFilterCount > 0 && (
                    <View style={{ marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {/* Transaction Type Tags */}
                      {selectedTypes.map((type) => (
                        <View
                          key={type}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#DBEAFE',
                            borderRadius: 8,
                            gap: 6,
                          }}
                        >
                          <TagIcon width={12} height={12} color="#1E40AF" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#1E40AF' }}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleType(type)}
                            style={{
                              padding: 2,
                              borderRadius: 999,
                            }}
                          >
                            <XCircleIcon width={14} height={14} color="#1E40AF" />
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
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#D1FAE5',
                            borderRadius: 8,
                            gap: 6,
                          }}
                        >
                          <TagIcon width={12} height={12} color="#047857" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#047857' }}>
                            {getCategoryName(catCode)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleCategory(catCode)}
                            style={{
                              padding: 2,
                              borderRadius: 999,
                            }}
                          >
                            <XCircleIcon width={14} height={14} color="#047857" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Date Range Tags */}
                      {dateFrom && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#E9D5FF',
                            borderRadius: 8,
                            gap: 6,
                          }}
                        >
                          <CalendarIcon width={12} height={12} color="#6B21A8" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B21A8' }}>
                            From: {new Date(dateFrom).toLocaleDateString()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setDateFrom('')}
                            style={{
                              padding: 2,
                              borderRadius: 999,
                            }}
                          >
                            <XCircleIcon width={14} height={14} color="#6B21A8" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {dateTo && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#E9D5FF',
                            borderRadius: 8,
                            gap: 6,
                          }}
                        >
                          <CalendarIcon width={12} height={12} color="#6B21A8" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B21A8' }}>
                            To: {new Date(dateTo).toLocaleDateString()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setDateTo('')}
                            style={{
                              padding: 2,
                              borderRadius: 999,
                            }}
                          >
                            <XCircleIcon width={14} height={14} color="#6B21A8" />
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Amount Range Tags */}
                      {minAmount && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#FED7AA',
                            borderRadius: 8,
                            gap: 6,
                          }}
                        >
                          <BanknotesIcon width={12} height={12} color="#9A3412" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#9A3412' }}>
                            Min: ₹{minAmount}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setMinAmount('')}
                            style={{
                              padding: 2,
                              borderRadius: 999,
                            }}
                          >
                            <XCircleIcon width={14} height={14} color="#9A3412" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {maxAmount && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#FED7AA',
                            borderRadius: 8,
                            gap: 6,
                          }}
                        >
                          <BanknotesIcon width={12} height={12} color="#9A3412" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#9A3412' }}>
                            Max: ₹{maxAmount}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setMaxAmount('')}
                            style={{
                              padding: 2,
                              borderRadius: 999,
                            }}
                          >
                            <XCircleIcon width={14} height={14} color="#9A3412" />
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
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#C7D2FE',
                            borderRadius: 8,
                            gap: 6,
                          }}
                        >
                          <TagIcon width={12} height={12} color="#3730A3" />
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#3730A3' }}>
                            {st}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleServiceType(st)}
                            style={{
                              padding: 2,
                              borderRadius: 999,
                            }}
                          >
                            <XCircleIcon width={14} height={14} color="#3730A3" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Transaction List or Empty State */}
                  {transactions.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                      <LinearGradient
                        colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(164, 191, 254, 0.48)',
                          marginBottom: 16,
                        }}
                      >
                        <ClockIcon width={32} height={32} color="#0F5FDC" />
                      </LinearGradient>
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>No transactions yet</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {/* Transaction Cards */}
                      {transactions.map((transaction) => (
                        <LinearGradient
                          key={transaction._id}
                          colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 2,
                            borderColor: '#86ACD8',
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '600',
                                  color: '#0E51A2',
                                  marginBottom: 4,
                                }}
                              >
                                {transaction.notes || transaction.serviceType}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                                {transaction.serviceProvider}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    backgroundColor:
                                      transaction.type === 'DEBIT' ? '#FEE2E2' : '#D1FAE5',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: '600',
                                      color: transaction.type === 'DEBIT' ? '#991B1B' : '#065F46',
                                    }}
                                  >
                                    {transaction.type}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                                  {formatDate(transaction.createdAt)} • {formatTime(transaction.createdAt)}
                                </Text>
                              </View>
                            </View>
                            <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: '700',
                                  color: transaction.type === 'DEBIT' ? '#DC2626' : '#059669',
                                }}
                              >
                                {transaction.type === 'DEBIT' ? '-' : '+'}₹
                                {transaction.amount.toLocaleString()}
                              </Text>
                              <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                                Bal: ₹{transaction.newBalance.total.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      ))}

                      {/* View All Transactions CTA */}
                      <TouchableOpacity
                        onPress={() => router.push('/member/transactions' as any)}
                        style={{
                          marginTop: 8,
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <LinearGradient
                          colors={['#1F63B4', '#5DA4FB']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            paddingVertical: 12,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                            View All Transactions →
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <View style={{ gap: 16 }}>
                  {categories.map((category) => {
                    const Icon = getCategoryIcon(category.categoryCode, category.name);
                    const availablePercentage =
                      category.total > 0 ? (category.available / category.total) * 100 : 0;

                    return (
                      <LinearGradient
                        key={category.categoryCode}
                        colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 2,
                          borderColor: '#86ACD8',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 12,
                            gap: 12,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 12,
                              flex: 1,
                            }}
                          >
                            <LinearGradient
                              colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(164, 191, 254, 0.48)',
                              }}
                            >
                              <Icon width={24} height={24} color="#0F5FDC" />
                            </LinearGradient>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '600',
                                  color: '#0E51A2',
                                  marginBottom: 4,
                                }}
                              >
                                {category.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                {category.isUnlimited
                                  ? 'Unlimited'
                                  : `Limit: ₹${category.total.toLocaleString()}`}
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                              ₹{category.available.toLocaleString()}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#6b7280' }}>Available</Text>
                          </View>
                        </View>

                        {!category.isUnlimited && (
                          <>
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                Used: ₹{category.consumed.toLocaleString()}
                              </Text>
                              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
                                {availablePercentage.toFixed(0)}% Available
                              </Text>
                            </View>
                            <View
                              style={{
                                width: '100%',
                                height: 10,
                                backgroundColor: '#E5E7EB',
                                borderRadius: 999,
                                overflow: 'hidden',
                              }}
                            >
                              <View
                                style={{
                                  width: `${Math.min(availablePercentage, 100)}%`,
                                  height: '100%',
                                  backgroundColor: '#22C55E',
                                  borderRadius: 999,
                                }}
                              />
                            </View>
                          </>
                        )}
                      </LinearGradient>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
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
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  backgroundColor: tempTypes.includes(type) ? '#0F5FDC' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tempTypes.includes(type) && <CheckIcon width={12} height={12} color="#FFFFFF" />}
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
          {/* Quick Presets */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setQuickDateRange('today')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2' }}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setQuickDateRange('7days')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2' }}>Last 7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setQuickDateRange('30days')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2' }}>Last 30 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setQuickDateRange('90days')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2' }}>Last 90 Days</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Date Inputs - Platform specific */}
          {Platform.OS === 'web' ? (
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2', marginBottom: 6 }}>
                  From Date
                </Text>
                <TextInput
                  value={tempDateFrom}
                  onChangeText={setTempDateFrom}
                  placeholder="YYYY-MM-DD"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    fontSize: 14,
                  }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2', marginBottom: 6 }}>
                  To Date
                </Text>
                <TextInput
                  value={tempDateTo}
                  onChangeText={setTempDateTo}
                  placeholder="YYYY-MM-DD"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    fontSize: 14,
                  }}
                />
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              Use quick presets above
            </Text>
          )}
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
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2', marginBottom: 6 }}>
              Minimum Amount (₹)
            </Text>
            <TextInput
              value={tempMinAmount}
              onChangeText={setTempMinAmount}
              placeholder="0"
              keyboardType="numeric"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: '#86ACD8',
                fontSize: 14,
              }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2', marginBottom: 6 }}>
              Maximum Amount (₹)
            </Text>
            <TextInput
              value={tempMaxAmount}
              onChangeText={setTempMaxAmount}
              placeholder="No limit"
              keyboardType="numeric"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: '#86ACD8',
                fontSize: 14,
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
        <View style={{ gap: 12 }}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.categoryCode}
              onPress={() => toggleTempCategory(category.categoryCode)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  backgroundColor: tempCategories.includes(category.categoryCode)
                    ? '#0F5FDC'
                    : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tempCategories.includes(category.categoryCode) && (
                  <CheckIcon width={12} height={12} color="#FFFFFF" />
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                {category.name}
              </Text>
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
        <View style={{ gap: 12 }}>
          {availableServiceTypes.map((serviceType) => (
            <TouchableOpacity
              key={serviceType}
              onPress={() => toggleTempServiceType(serviceType)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  backgroundColor: tempServiceTypes.includes(serviceType) ? '#0F5FDC' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tempServiceTypes.includes(serviceType) && (
                  <CheckIcon width={12} height={12} color="#FFFFFF" />
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                {serviceType}
              </Text>
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
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
              Sort Field
            </Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setTempSortBy('date')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    backgroundColor: tempSortBy === 'date' ? '#0F5FDC' : '#FFFFFF',
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTempSortBy('amount')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    backgroundColor: tempSortBy === 'amount' ? '#0F5FDC' : '#FFFFFF',
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>Amount</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Order */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
              Sort Order
            </Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setTempSortOrder('desc')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    backgroundColor: tempSortOrder === 'desc' ? '#0F5FDC' : '#FFFFFF',
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                  Newest First (Descending)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTempSortOrder('asc')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    backgroundColor: tempSortOrder === 'asc' ? '#0F5FDC' : '#FFFFFF',
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                  Oldest First (Ascending)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </FilterPopup>
    </View>
  );
}
