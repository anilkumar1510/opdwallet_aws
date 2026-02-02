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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import {
  ChevronDownIcon,
  CheckIcon,
  XCircleIcon,
} from '../../src/components/icons/InlineSVGs';
import apiClient from '../../src/lib/api/client';
import { useFamily } from '../../src/contexts/FamilyContext';
import { fetchWalletBalance } from '../../src/lib/api/wallet';

// ============================================================================
// COLORS - Matching Home Page
// ============================================================================
const COLORS = {
  primary: '#034DA2',
  orange: '#F5821E',
  textDark: '#303030',
  textGray: '#545454',
  textLight: '#6b7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  debit: '#FD524F',
  credit: '#40B15C',
};

// ============================================================================
// SVG ICONS - Matching Home Page Style
// ============================================================================

// Wallet Icon (matches home page)
function WalletIcon({ size = 18, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 7H3C2.45 7 2 7.45 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 7.45 21.55 7 21 7ZM20 18H4V9H20V18ZM17 14C17 13.45 17.45 13 18 13C18.55 13 19 13.45 19 14C19 14.55 18.55 15 18 15C17.45 15 17 14.55 17 14Z"
        fill={color}
      />
      <Path d="M20 4H4C2.9 4 2 4.9 2 6V7H22V6C22 4.9 21.1 4 20 4Z" fill={color} />
    </Svg>
  );
}

// Back Arrow Icon
function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={COLORS.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Transaction Type Icon - Blue stroke with orange accent (matching home page style)
function TransactionTypeIcon({ color = COLORS.primary }: { color?: string }) {
  const isWhite = color === COLORS.white || color === '#FFFFFF';
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      {/* Arrows up and down - blue stroke */}
      <Path
        d="M4 10L4 3M4 3L1.5 5.5M4 3L6.5 5.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6L12 13M12 13L9.5 10.5M12 13L14.5 10.5"
        stroke={isWhite ? color : COLORS.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Category Icon (grid) - Blue stroke with orange filled square
function CategoryIcon({ color = COLORS.primary }: { color?: string }) {
  const isWhite = color === COLORS.white || color === '#FFFFFF';
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke={color} strokeWidth={1.5} />
      <Rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke={color} strokeWidth={1.5} />
      <Rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke={color} strokeWidth={1.5} />
      {/* Orange filled square */}
      <Rect x="9.5" y="9.5" width="5" height="5" rx="1" fill={isWhite ? color : COLORS.orange} />
    </Svg>
  );
}

// Service Icon - Clock/time based (matching home page style)
function ServiceIcon({ color = COLORS.primary }: { color?: string }) {
  const isWhite = color === COLORS.white || color === '#FFFFFF';
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      {/* Circle outline - blue stroke */}
      <Circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth={1.5} />
      {/* Clock hands - orange accent */}
      <Path
        d="M8 4.5V8L10.5 10.5"
        stroke={isWhite ? color : COLORS.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Date Icon (calendar) - Blue stroke with orange accent
function DateIcon({ color = COLORS.primary }: { color?: string }) {
  const isWhite = color === COLORS.white || color === '#FFFFFF';
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      {/* Calendar outline - blue stroke */}
      <Rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke={color} strokeWidth={1.5} />
      <Path d="M1.5 6.5H14.5" stroke={color} strokeWidth={1.5} />
      <Path d="M5 1V4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M11 1V4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Orange checkmark */}
      <Path
        d="M5 9.5L7 11.5L11 8.5"
        stroke={isWhite ? color : COLORS.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Small Chevron Down
function SmallChevronDown({ color = COLORS.textGray }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Path
        d="M3 4.5L6 7.5L9 4.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
// FILTER DROPDOWN COMPONENT
// ============================================================================

interface FilterDropdownProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
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
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            minWidth: 300,
            maxWidth: 400,
            width: '100%',
            maxHeight: '70%',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <XCircleIcon width={20} height={20} color={COLORS.textGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 16, paddingVertical: 12, maxHeight: 300 }}>
            {children}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor: '#f3f4f6',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textGray }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor: COLORS.primary,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.white }}>
                Apply
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
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([]);

  // Popup state
  const [activePopup, setActivePopup] = useState<string | null>(null);

  // Temp filter states
  const [tempTypes, setTempTypes] = useState<string[]>([]);
  const [tempCategories, setTempCategories] = useState<string[]>([]);
  const [tempDateFrom, setTempDateFrom] = useState<string>('');
  const [tempDateTo, setTempDateTo] = useState<string>('');
  const [tempServiceTypes, setTempServiceTypes] = useState<string[]>([]);

  // Sync selectedWalletMember with activeMember
  useEffect(() => {
    if (activeMember) {
      setSelectedWalletMember(activeMember);
    }
  }, [activeMember]);

  const effectiveUserId = selectedWalletMember?._id || viewingUserId || activeMember?._id || loggedInUser?._id || '';

  const shouldShowFamilyDropdown = useMemo(() => {
    const currentlyViewingPrimary = activeMember?.isPrimary || activeMember?._id === loggedInUser?._id;
    const hasFamilyMembers = familyMembers.length > 1;
    return currentlyViewingPrimary && hasFamilyMembers && canSwitchProfiles;
  }, [activeMember, loggedInUser, familyMembers, canSwitchProfiles]);

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Paid Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return `Paid ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  };

  const formatMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Group transactions by month and calculate totals
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: Transaction[]; totalSpent: number } } = {};
    transactions.forEach((t) => {
      const monthKey = formatMonthYear(t.createdAt);
      if (!groups[monthKey]) {
        groups[monthKey] = { transactions: [], totalSpent: 0 };
      }
      groups[monthKey].transactions.push(t);
      if (t.type === 'DEBIT') {
        groups[monthKey].totalSpent += t.amount;
      }
    });
    return groups;
  }, [transactions]);

  const handleMemberSelect = (member: any) => {
    setSelectedWalletMember(member);
    setIsDropdownOpen(false);
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
      case 'serviceType':
        setTempServiceTypes([...selectedServiceTypes]);
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
      case 'serviceType':
        setSelectedServiceTypes([...tempServiceTypes]);
        break;
    }
    setActivePopup(null);
  };

  const cancelPopup = () => {
    setActivePopup(null);
  };

  const toggleTempType = (type: string) => {
    setTempTypes(tempTypes.includes(type) ? tempTypes.filter((t) => t !== type) : [...tempTypes, type]);
  };

  const toggleTempCategory = (category: string) => {
    setTempCategories(tempCategories.includes(category) ? tempCategories.filter((c) => c !== category) : [...tempCategories, category]);
  };

  const toggleTempServiceType = (serviceType: string) => {
    setTempServiceTypes(tempServiceTypes.includes(serviceType) ? tempServiceTypes.filter((st) => st !== serviceType) : [...tempServiceTypes, serviceType]);
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

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    if (effectiveUserId) {
      fetchWalletDataForUser(effectiveUserId);
    }
  }, [effectiveUserId, selectedTypes, selectedCategories, dateFrom, dateTo, selectedServiceTypes]);

  const fetchWalletDataForUser = async (userId: string) => {
    setLoading(true);
    try {
      const params: any = { userId, limit: 100 };
      if (selectedTypes.length > 0) params.type = selectedTypes.join(',');
      if (selectedCategories.length > 0) params.categoryCode = selectedCategories.join(',');
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (selectedServiceTypes.length > 0) params.serviceType = selectedServiceTypes.join(',');

      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetchWalletBalance(userId),
        apiClient.get('/wallet/transactions', { params }),
      ]);

      setWalletData({
        totalBalance: balanceResponse.totalBalance,
        categories: balanceResponse.categories,
      });

      const transactionData = transactionsResponse.data.transactions || [];
      setTransactions(transactionData);

      const uniqueServiceTypes = Array.from(
        new Set(transactionData.map((t: any) => t.serviceType).filter((st: string | undefined) => st))
      ) as string[];
      setAvailableServiceTypes(uniqueServiceTypes);
    } catch (error: any) {
      console.error('[Wallet] Error fetching wallet data:', error);
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
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalBalance = walletData?.totalBalance || { allocated: 0, current: 0, consumed: 0 };
  const categories = walletData?.categories || [];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header with Back Button */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                OPD Wallet
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingTop: 16 }}>

          {/* View Wallet For - Family Selector */}
          {shouldShowFamilyDropdown && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textGray, marginBottom: 8 }}>
                View Wallet For
              </Text>
              <TouchableOpacity
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  backgroundColor: COLORS.white,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                  {selectedWalletMember?.name?.firstName} {selectedWalletMember?.name?.lastName}
                  {selectedWalletMember?.isPrimary ? ' (Self)' : ` (${selectedWalletMember?.relationship})`}
                </Text>
                <View style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}>
                  <ChevronDownIcon width={18} height={18} color={COLORS.textGray} />
                </View>
              </TouchableOpacity>

              {isDropdownOpen && (
                <View
                  style={{
                    marginTop: 4,
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 8,
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
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          backgroundColor: isSelected ? '#f0f7ff' : COLORS.white,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: isSelected ? '600' : '400', color: COLORS.textDark }}>
                          {member.name.firstName} {member.name.lastName}
                          {member.isPrimary ? ' (Self)' : ` (${member.relationship})`}
                        </Text>
                        {isSelected && <CheckIcon width={16} height={16} color={COLORS.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Balance Card - Matching Bookings Page Blue Card Style */}
          <LinearGradient
            colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: '#86ACD8',
            }}
          >
            {/* Total Available Balance Label */}
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>
              Total Available Balance
            </Text>

            {/* Balance Amount - Format: ₹Y / X Left */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 14 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#0E51A2' }}>
                ₹{totalBalance.current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>
                {' '}/ {totalBalance.allocated.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textGray }}>
                {' '}Left
              </Text>
            </View>

            {/* Total Money Used Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: COLORS.white,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <WalletIcon size={16} color={COLORS.orange} />
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
                  Total Money Used
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.orange }}>
                {totalBalance.consumed.toLocaleString('en-IN')} /-
              </Text>
            </View>
          </LinearGradient>

          {/* Transaction History Section */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 16 }}>
            Transaction History
          </Text>

          {/* Filter Pills - Figma Style */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20, marginHorizontal: -16 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {/* Transaction Type Filter */}
            <TouchableOpacity
              onPress={() => openPopup('transactionType')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedTypes.length > 0 ? COLORS.primary : COLORS.white,
                borderWidth: 1,
                borderColor: selectedTypes.length > 0 ? COLORS.primary : COLORS.border,
                gap: 6,
              }}
            >
              <TransactionTypeIcon color={selectedTypes.length > 0 ? COLORS.white : COLORS.textGray} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: selectedTypes.length > 0 ? COLORS.white : COLORS.textGray }}>
                Transaction Type
              </Text>
              <SmallChevronDown color={selectedTypes.length > 0 ? COLORS.white : COLORS.textGray} />
            </TouchableOpacity>

            {/* Category Filter */}
            <TouchableOpacity
              onPress={() => openPopup('category')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedCategories.length > 0 ? COLORS.primary : COLORS.white,
                borderWidth: 1,
                borderColor: selectedCategories.length > 0 ? COLORS.primary : COLORS.border,
                gap: 6,
              }}
            >
              <CategoryIcon color={selectedCategories.length > 0 ? COLORS.white : COLORS.textGray} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategories.length > 0 ? COLORS.white : COLORS.textGray }}>
                Category
              </Text>
              <SmallChevronDown color={selectedCategories.length > 0 ? COLORS.white : COLORS.textGray} />
            </TouchableOpacity>

            {/* Service Filter */}
            <TouchableOpacity
              onPress={() => openPopup('serviceType')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedServiceTypes.length > 0 ? COLORS.primary : COLORS.white,
                borderWidth: 1,
                borderColor: selectedServiceTypes.length > 0 ? COLORS.primary : COLORS.border,
                gap: 6,
              }}
            >
              <ServiceIcon color={selectedServiceTypes.length > 0 ? COLORS.white : COLORS.textGray} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: selectedServiceTypes.length > 0 ? COLORS.white : COLORS.textGray }}>
                Service
              </Text>
              <SmallChevronDown color={selectedServiceTypes.length > 0 ? COLORS.white : COLORS.textGray} />
            </TouchableOpacity>

            {/* Date Filter */}
            <TouchableOpacity
              onPress={() => openPopup('dateRange')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: (dateFrom || dateTo) ? COLORS.primary : COLORS.white,
                borderWidth: 1,
                borderColor: (dateFrom || dateTo) ? COLORS.primary : COLORS.border,
                gap: 6,
              }}
            >
              <DateIcon color={(dateFrom || dateTo) ? COLORS.white : COLORS.textGray} />
              <Text style={{ fontSize: 13, fontWeight: '500', color: (dateFrom || dateTo) ? COLORS.white : COLORS.textGray }}>
                Date
              </Text>
              <SmallChevronDown color={(dateFrom || dateTo) ? COLORS.white : COLORS.textGray} />
            </TouchableOpacity>
          </ScrollView>

          {/* Transaction List */}
          {Object.keys(groupedTransactions).length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <WalletIcon size={48} color={COLORS.textLight} />
              <Text style={{ fontSize: 14, color: COLORS.textGray, marginTop: 12 }}>
                No transactions yet
              </Text>
            </View>
          ) : (
            Object.entries(groupedTransactions).map(([month, { transactions: monthTransactions, totalSpent }]) => (
              <View key={month} style={{ marginBottom: 24 }}>
                {/* Month Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                    {month}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textGray }}>
                    Total Spent{' '}
                    <Text style={{ fontWeight: '600', color: COLORS.textDark }}>
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </Text>
                  </Text>
                </View>

                {/* Transaction Items */}
                <View
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {monthTransactions.map((transaction, index) => {
                    const isDebit = transaction.type === 'DEBIT';
                    const isLast = index === monthTransactions.length - 1;

                    return (
                      <View
                        key={transaction._id}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          borderBottomWidth: isLast ? 0 : 1,
                          borderBottomColor: COLORS.border,
                        }}
                      >
                        {/* Left - Transaction Details */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark, marginBottom: 2 }}>
                            {transaction.notes || transaction.serviceType || 'Transaction'}
                          </Text>
                          <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                            {transaction.serviceProvider || 'Service Provider'}
                          </Text>
                        </View>

                        {/* Right - Amount & Date */}
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: isDebit ? COLORS.debit : COLORS.credit,
                              marginBottom: 2,
                            }}
                          >
                            {isDebit ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
                          </Text>
                          <Text style={{ fontSize: 11, color: COLORS.textLight }}>
                            {formatDate(transaction.createdAt)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      </SafeAreaView>

      {/* Filter Popups */}
      {/* Transaction Type Popup */}
      <FilterDropdown
        visible={activePopup === 'transactionType'}
        title="Transaction Type"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('transactionType')}
      >
        <View style={{ gap: 8 }}>
          {['DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => toggleTempType(type)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: tempTypes.includes(type) ? COLORS.primary : COLORS.border,
                  backgroundColor: tempTypes.includes(type) ? COLORS.primary : COLORS.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tempTypes.includes(type) && <CheckIcon width={12} height={12} color={COLORS.white} />}
              </View>
              <Text style={{ fontSize: 14, color: COLORS.textDark }}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FilterDropdown>

      {/* Category Popup */}
      <FilterDropdown
        visible={activePopup === 'category'}
        title="Category"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('category')}
      >
        <View style={{ gap: 8 }}>
          {categories.length === 0 ? (
            <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', paddingVertical: 16 }}>
              No categories available
            </Text>
          ) : (
            categories.map((category) => (
              <TouchableOpacity
                key={category.categoryCode}
                onPress={() => toggleTempCategory(category.categoryCode)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: tempCategories.includes(category.categoryCode) ? COLORS.primary : COLORS.border,
                    backgroundColor: tempCategories.includes(category.categoryCode) ? COLORS.primary : COLORS.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tempCategories.includes(category.categoryCode) && <CheckIcon width={12} height={12} color={COLORS.white} />}
                </View>
                <Text style={{ fontSize: 14, color: COLORS.textDark }}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </FilterDropdown>

      {/* Service Type Popup */}
      <FilterDropdown
        visible={activePopup === 'serviceType'}
        title="Service"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('serviceType')}
      >
        <View style={{ gap: 8 }}>
          {availableServiceTypes.length === 0 ? (
            <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', paddingVertical: 16 }}>
              No services available
            </Text>
          ) : (
            availableServiceTypes.map((serviceType) => (
              <TouchableOpacity
                key={serviceType}
                onPress={() => toggleTempServiceType(serviceType)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: tempServiceTypes.includes(serviceType) ? COLORS.primary : COLORS.border,
                    backgroundColor: tempServiceTypes.includes(serviceType) ? COLORS.primary : COLORS.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tempServiceTypes.includes(serviceType) && <CheckIcon width={12} height={12} color={COLORS.white} />}
                </View>
                <Text style={{ fontSize: 14, color: COLORS.textDark }}>
                  {serviceType}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </FilterDropdown>

      {/* Date Range Popup */}
      <FilterDropdown
        visible={activePopup === 'dateRange'}
        title="Date Range"
        onClose={cancelPopup}
        onConfirm={() => confirmPopup('dateRange')}
      >
        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textGray, marginBottom: 10 }}>
              Quick Select
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Today', value: 'today' },
                { label: 'Last 7 Days', value: '7days' },
                { label: 'Last 30 Days', value: '30days' },
                { label: 'Last 90 Days', value: '90days' },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  onPress={() => setQuickDateRange(preset.value as any)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.primary }}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {Platform.OS === 'web' && (
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textGray, marginBottom: 6 }}>
                  From Date
                </Text>
                <TextInput
                  value={tempDateFrom}
                  onChangeText={setTempDateFrom}
                  placeholder="YYYY-MM-DD"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    fontSize: 14,
                    backgroundColor: COLORS.white,
                  }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textGray, marginBottom: 6 }}>
                  To Date
                </Text>
                <TextInput
                  value={tempDateTo}
                  onChangeText={setTempDateTo}
                  placeholder="YYYY-MM-DD"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    fontSize: 14,
                    backgroundColor: COLORS.white,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </FilterDropdown>
    </View>
  );
}
