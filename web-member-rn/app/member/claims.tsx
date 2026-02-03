import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFamily } from '../../src/contexts/FamilyContext';
import apiClient from '../../src/lib/api/client';

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
  success: '#16a34a',
};

// ============================================================================
// ICONS - Matching Home Page Style (Blue + Orange accents)
// ============================================================================

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

const ChevronLeftIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DocumentTextIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckCircleIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ExclamationCircleIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XCircleIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MagnifyingGlassIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FunnelIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TableCellsIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M3 4h18M3 10h18M3 16h18M3 4v16M21 4v16M9 4v16M15 4v16" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const Squares2X2Icon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowDownTrayIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EyeIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronUpDownIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M8 15l4 4 4-4M8 9l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = ({ width = 24, height = 24, color = '#000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
    <Path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ============================================================================
// TYPES
// ============================================================================

type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'processing' | 'cancelled';
type ViewMode = 'table' | 'cards';
type SortField = 'date' | 'amount' | 'status' | 'type';
type SortOrder = 'asc' | 'desc';

interface Claim {
  id: string;
  claimNumber: string;
  date: string;
  type: string;
  provider: string;
  amount: number;
  originalBillAmount?: number;
  cappedAmount?: number;
  wasAutoCapped?: boolean;
  perClaimLimitApplied?: number;
  status: ClaimStatus;
  description: string;
  category: string;
  submittedDate: string;
  processedDate?: string;
  documents: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClaimsPage() {
  // Context
  const { viewingUserId } = useFamily();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'processing' | 'under_review' | 'rejected'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days' | '1year'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'consultation' | 'diagnostic' | 'pharmacy' | 'dental' | 'vision' | 'wellness'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dataView, setDataView] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Map backend status to frontend status
  const mapStatus = (backendStatus: string): ClaimStatus => {
    const statusMap: Record<string, ClaimStatus> = {
      'DRAFT': 'draft',
      'SUBMITTED': 'under_review',
      'UNDER_REVIEW': 'under_review',
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'CANCELLED': 'cancelled',
      'PAYMENT_PENDING': 'processing',
      'PAYMENT_PROCESSING': 'processing',
      'PAYMENT_COMPLETED': 'approved',
      'ASSIGNED': 'under_review',
      'UNASSIGNED': 'under_review',
      'draft': 'draft',
      'submitted': 'under_review',
      'under_review': 'under_review',
      'approved': 'approved',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'payment_pending': 'processing',
      'payment_processing': 'processing',
      'payment_completed': 'approved',
      'assigned': 'under_review',
      'unassigned': 'under_review',
      'PENDING': 'under_review',
      'pending': 'under_review',
      'IN_REVIEW': 'under_review',
      'in_review': 'under_review',
      'REVIEWING': 'under_review',
      'reviewing': 'under_review',
      'COMPLETED': 'approved',
      'completed': 'approved',
      'PROCESSING': 'processing',
      'processing': 'processing',
    };

    const mappedStatus =
      statusMap[backendStatus] || statusMap[backendStatus?.toUpperCase()] || 'under_review';

    return mappedStatus;
  };

  // Format category for display
  const formatCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'CONSULTATION': 'Consultation',
      'DIAGNOSTICS': 'Diagnostic',
      'PHARMACY': 'Pharmacy',
      'DENTAL': 'Dental',
      'VISION': 'Vision',
      'WELLNESS': 'Wellness',
      'IPD': 'IPD',
      'OPD': 'OPD',
    };
    return categoryMap[category] || category;
  };

  // Fetch claims from API
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 100,
      };

      // Add userId parameter if viewing a dependent
      if (viewingUserId) {
        params.userId = viewingUserId;
      }

      console.log('[Claims] Fetching claims with params:', params);

      const response = await apiClient.get('/member/claims', { params });

      console.log('[Claims] Received claims:', response.data.claims?.length || 0);

      // Map backend claims to frontend format
      const mappedClaims: Claim[] = (response.data.claims || []).map((claim: any) => ({
        id: claim._id,
        claimNumber: claim.claimId,
        date: new Date(claim.treatmentDate).toISOString().split('T')[0],
        type: formatCategory(claim.category),
        provider: claim.providerName || 'N/A',
        amount: claim.billAmount,
        originalBillAmount: claim.originalBillAmount,
        cappedAmount: claim.cappedAmount,
        wasAutoCapped: claim.wasAutoCapped,
        perClaimLimitApplied: claim.perClaimLimitApplied,
        status: mapStatus(claim.status),
        description: claim.treatmentDescription || claim.category,
        category: claim.category.toLowerCase(),
        submittedDate: claim.submittedAt
          ? new Date(claim.submittedAt).toISOString().split('T')[0]
          : new Date(claim.createdAt).toISOString().split('T')[0],
        processedDate: claim.processedAt
          ? new Date(claim.processedAt).toISOString().split('T')[0]
          : undefined,
        documents: claim.documents?.length || 0,
      }));

      setClaims(mappedClaims);
    } catch (err: any) {
      console.error('[Claims] Error fetching claims:', err);
      setError(err.message || 'Failed to load claims');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [viewingUserId]);

  // Refetch claims when screen gains focus (including initial mount and after submitting a new claim)
  useFocusEffect(
    useCallback(() => {
      console.log('[Claims] Screen focused, fetching claims. viewingUserId:', viewingUserId);
      fetchClaims();
    }, [fetchClaims, viewingUserId])
  );

  // Calculate statistics from real data
  const stats = useMemo(() => {
    return {
      approved: claims.filter((c) => c.status === 'approved').length,
      processing: claims.filter((c) => c.status === 'processing').length,
      underReview: claims.filter((c) => c.status === 'under_review').length,
      totalAmount: claims.reduce((sum, c) => sum + c.amount, 0),
    };
  }, [claims]);

  // Helper functions
  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon width={16} height={16} color="#25A425" />;
      case 'rejected':
      case 'cancelled':
        return <XCircleIcon width={16} height={16} color="#E53535" />;
      case 'processing':
        return <ClockIcon width={16} height={16} color="#0F5FDC" />;
      case 'under_review':
        return <ExclamationCircleIcon width={16} height={16} color="#E67E22" />;
      case 'draft':
        return <DocumentTextIcon width={16} height={16} color="#6b7280" />;
      default:
        return <DocumentTextIcon width={16} height={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case 'approved':
        return { background: '#E8F5E9', color: '#25A425' };
      case 'rejected':
        return { background: '#FFEBEE', color: '#E53535' };
      case 'cancelled':
        return { background: '#f3f4f6', color: '#6b7280' };
      case 'processing':
        return { background: '#EFF4FF', color: '#0F5FDC' };
      case 'under_review':
        return { background: '#FEF1E7', color: '#E67E22' };
      case 'draft':
        return { background: '#f3f4f6', color: '#6b7280' };
      default:
        return { background: '#f3f4f6', color: '#6b7280' };
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportData = () => {
    console.log('Exporting claims data...');
  };

  // Filter and sort
  const filteredAndSortedClaims = useMemo(() => {
    let filtered = claims.filter((claim) => {
      const matchesSearch =
        searchQuery === '' ||
        claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === 'all' || claim.status === activeTab;

      // Date Range Filter
      let matchesDateRange = true;
      if (dateRange !== 'all') {
        const claimDate = new Date(claim.date);
        const now = new Date();
        let daysAgo = 0;
        switch (dateRange) {
          case '7days': daysAgo = 7; break;
          case '30days': daysAgo = 30; break;
          case '90days': daysAgo = 90; break;
          case '1year': daysAgo = 365; break;
        }
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        matchesDateRange = claimDate >= cutoffDate;
      }

      // Category Filter
      const matchesCategory = categoryFilter === 'all' || claim.category === categoryFilter;

      return matchesSearch && matchesTab && matchesDateRange && matchesCategory;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [claims, searchQuery, activeTab, dateRange, categoryFilter, sortField, sortOrder]);

  // Tab configuration
  const statusTabs = [
    { id: 'all' as const, label: 'All', count: claims.length },
    { id: 'approved' as const, label: 'Approved', count: stats.approved },
    { id: 'processing' as const, label: 'Processing', count: stats.processing },
    { id: 'under_review' as const, label: 'Under Review', count: stats.underReview },
    { id: 'rejected' as const, label: 'Rejected', count: claims.filter(c => c.status === 'rejected').length },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClaims.length / itemsPerPage);
  const paginatedClaims = filteredAndSortedClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header with Back Button */}
        <View
          style={{
            backgroundColor: COLORS.white,
          }}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/member')}
                style={{
                  padding: 8,
                  borderRadius: 12,
                }}
                activeOpacity={0.7}
              >
                <BackArrowIcon />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  Claims History
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/member/claims/new')}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                activeOpacity={0.8}
              >
                <PlusIcon width={16} height={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Status Tabs */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              flexGrow: 1,
            }}
            style={{ width: '100%' }}
            nestedScrollEnabled={true}
          >
            <View style={{ flexDirection: 'row', gap: 0 }}>
              {statusTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => {
                      setActiveTab(tab.id);
                      setCurrentPage(1);
                    }}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderBottomWidth: 3,
                      borderBottomColor: isActive ? COLORS.primary : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? '600' : '500',
                          color: isActive ? COLORS.primary : COLORS.textGray,
                        }}
                      >
                        {tab.label}
                      </Text>
                      {tab.count > 0 && (
                        <View
                          style={{
                            backgroundColor: isActive ? COLORS.primary : COLORS.border,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 10,
                            minWidth: 20,
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '600',
                              color: isActive ? COLORS.white : COLORS.textGray,
                            }}
                          >
                            {tab.count}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Main Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 20,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
            {/* Controls Bar */}
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(217, 217, 217, 0.48)',
                marginBottom: 24,
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              <View style={{ padding: 12 }}>
                {/* Search & View Toggle Row */}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  {/* Search */}
                  <View style={{ position: 'relative', flex: 1 }}>
                    <View style={{ position: 'absolute', left: 12, top: 10, zIndex: 1 }}>
                      <MagnifyingGlassIcon width={18} height={18} color={COLORS.textGray} />
                    </View>
                    <TextInput
                      placeholder="Search claims..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={{
                        width: '100%',
                        paddingLeft: 38,
                        paddingRight: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.white,
                        borderRadius: 10,
                        fontSize: 13,
                        color: COLORS.textDark,
                      }}
                      placeholderTextColor={COLORS.textGray}
                    />
                  </View>

                  {/* View Mode Toggle */}
                  <View
                    style={{
                      flexDirection: 'row',
                      backgroundColor: COLORS.background,
                      borderRadius: 10,
                      padding: 3,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setViewMode('table')}
                      style={{
                        padding: 7,
                        borderRadius: 7,
                        backgroundColor: viewMode === 'table' ? COLORS.white : 'transparent',
                      }}
                    >
                      <TableCellsIcon width={16} height={16} color={viewMode === 'table' ? COLORS.primary : COLORS.textGray} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setViewMode('cards')}
                      style={{
                        padding: 7,
                        borderRadius: 7,
                        backgroundColor: viewMode === 'cards' ? COLORS.white : 'transparent',
                      }}
                    >
                      <Squares2X2Icon width={16} height={16} color={viewMode === 'cards' ? COLORS.primary : COLORS.textGray} />
                    </TouchableOpacity>
                  </View>

                  {/* Filters Button */}
                  <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: showFilters || dateRange !== 'all' || categoryFilter !== 'all' ? COLORS.primary : COLORS.border,
                      borderRadius: 10,
                      backgroundColor: showFilters || dateRange !== 'all' || categoryFilter !== 'all' ? 'rgba(3, 77, 162, 0.05)' : COLORS.white,
                      position: 'relative',
                    }}
                  >
                    <FunnelIcon width={16} height={16} color={showFilters || dateRange !== 'all' || categoryFilter !== 'all' ? COLORS.primary : COLORS.textGray} />
                    {(dateRange !== 'all' || categoryFilter !== 'all') && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: COLORS.orange,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Advanced Filters */}
              {showFilters && (
                <View style={{ padding: 16, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                  <View style={{ gap: 16 }}>
                    {/* Date Range Filter */}
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 }}>
                        Date Range
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {[
                            { id: 'all' as const, label: 'All Time' },
                            { id: '7days' as const, label: 'Last 7 Days' },
                            { id: '30days' as const, label: 'Last 30 Days' },
                            { id: '90days' as const, label: 'Last 90 Days' },
                            { id: '1year' as const, label: 'Last Year' },
                          ].map((option) => (
                            <TouchableOpacity
                              key={option.id}
                              onPress={() => {
                                setDateRange(option.id);
                                setCurrentPage(1);
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: dateRange === option.id ? COLORS.primary : COLORS.white,
                                borderWidth: 1,
                                borderColor: dateRange === option.id ? COLORS.primary : COLORS.border,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '500',
                                  color: dateRange === option.id ? COLORS.white : COLORS.textGray,
                                }}
                              >
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Category Filter */}
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 }}>Category</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {[
                            { id: 'all' as const, label: 'All' },
                            { id: 'consultation' as const, label: 'Consultation' },
                            { id: 'diagnostic' as const, label: 'Diagnostic' },
                            { id: 'pharmacy' as const, label: 'Pharmacy' },
                            { id: 'dental' as const, label: 'Dental' },
                            { id: 'vision' as const, label: 'Vision' },
                            { id: 'wellness' as const, label: 'Wellness' },
                          ].map((option) => (
                            <TouchableOpacity
                              key={option.id}
                              onPress={() => {
                                setCategoryFilter(option.id);
                                setCurrentPage(1);
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: categoryFilter === option.id ? COLORS.primary : COLORS.white,
                                borderWidth: 1,
                                borderColor: categoryFilter === option.id ? COLORS.primary : COLORS.border,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '500',
                                  color: categoryFilter === option.id ? COLORS.white : COLORS.textGray,
                                }}
                              >
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Clear Filters Button */}
                    {(dateRange !== 'all' || categoryFilter !== 'all') && (
                      <TouchableOpacity
                        onPress={() => {
                          setDateRange('all');
                          setCategoryFilter('all');
                          setCurrentPage(1);
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: 'rgba(229, 62, 62, 0.1)',
                          borderWidth: 1,
                          borderColor: 'rgba(229, 62, 62, 0.3)',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '500', color: '#E53E3E' }}>
                          Clear Filters
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Error State */}
            {error && (
              <View
                style={{
                  backgroundColor: '#fef2f2',
                  borderWidth: 1,
                  borderColor: '#fecaca',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <XCircleIcon width={20} height={20} color="#dc2626" />
                  <Text style={{ color: '#b91c1c', fontWeight: '600', flex: 1 }}>Failed to load claims: {error}</Text>
                </View>
              </View>
            )}

            {/* Content */}
            {loading ? (
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 48,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.textDark, fontWeight: '600', marginTop: 16 }}>Loading claims...</Text>
              </LinearGradient>
            ) : viewMode === 'cards' ? (
              // Card View - Compact design matching Health Benefits boxes
              <Animated.View entering={FadeInDown.duration(300).delay(200)} style={{ gap: 12 }}>
                {paginatedClaims.map((claim) => {
                  const statusColors = getStatusColor(claim.status);
                  return (
                    <TouchableOpacity
                      key={claim.id}
                      onPress={() => router.push(`/member/claims/${claim.id}`)}
                      activeOpacity={0.9}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      {/* Top Row: Claim Number, Type Badge, Status */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>{claim.claimNumber}</Text>
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                              backgroundColor: 'rgba(3, 77, 162, 0.1)',
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '600', color: COLORS.primary }}>{claim.type}</Text>
                          </View>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                            backgroundColor: statusColors.background,
                          }}
                        >
                          {getStatusIcon(claim.status)}
                          <Text style={{ fontSize: 10, fontWeight: '600', color: statusColors.color, textTransform: 'capitalize' }}>
                            {claim.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>

                      {/* Middle Row: Provider & Description */}
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }} numberOfLines={1}>
                          {claim.provider}
                        </Text>
                        <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 2 }} numberOfLines={1}>
                          {claim.description}
                        </Text>
                      </View>

                      {/* Bottom Row: Amount, Date, Documents */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            ₹{claim.amount.toLocaleString()}
                          </Text>
                          <Text style={{ fontSize: 10, color: COLORS.textLight }}>
                            {new Date(claim.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 10, color: COLORS.textGray }}>
                            {claim.documents} doc{claim.documents !== 1 ? 's' : ''}
                          </Text>
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: '#f6f6f6',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ChevronRightIcon width={12} height={12} color={COLORS.textGray} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            ) : (
              // Table View (compact list matching wallet transactions)
              <Animated.View entering={FadeInDown.duration(300).delay(200)}>
                <View
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(217, 217, 217, 0.48)',
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: -2, height: 11 },
                    shadowOpacity: 0.08,
                    shadowRadius: 23,
                    elevation: 3,
                  }}
                >
                  {paginatedClaims.map((claim, index) => {
                    const statusColors = getStatusColor(claim.status);
                    return (
                      <TouchableOpacity
                        key={claim.id}
                        onPress={() => router.push(`/member/claims/${claim.id}`)}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: index < paginatedClaims.length - 1 ? 1 : 0,
                          borderBottomColor: COLORS.border,
                        }}
                      >
                        {/* Left - Claim Details */}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>{claim.claimNumber}</Text>
                            <View
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 8,
                                backgroundColor: statusColors.background,
                              }}
                            >
                              <Text style={{ fontSize: 9, fontWeight: '600', color: statusColors.color, textTransform: 'capitalize' }}>
                                {claim.status.replace('_', ' ')}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, color: COLORS.textGray, marginBottom: 2 }} numberOfLines={1}>
                            {claim.provider}
                          </Text>
                          <Text style={{ fontSize: 10, color: COLORS.textLight }}>
                            {claim.type} • {claim.documents} doc{claim.documents !== 1 ? 's' : ''}
                          </Text>
                        </View>

                        {/* Right - Amount & Date */}
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: 2 }}>
                            ₹{claim.amount.toLocaleString()}
                          </Text>
                          <Text style={{ fontSize: 10, color: COLORS.textLight }}>
                            {new Date(claim.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(300)}
                style={{
                  marginTop: 24,
                  gap: 16,
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.textGray, fontWeight: '600', textAlign: 'center' }}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedClaims.length)} of {filteredAndSortedClaims.length}{' '}
                  claims
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeftIcon width={16} height={16} color={COLORS.textDark} />
                  </TouchableOpacity>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2);
                    return page <= totalPages ? (
                      <TouchableOpacity
                        key={page}
                        onPress={() => setCurrentPage(page)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: currentPage === page ? COLORS.primary : 'transparent',
                          borderWidth: 1,
                          borderColor: currentPage === page ? COLORS.primary : COLORS.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: currentPage === page ? COLORS.white : COLORS.textDark,
                          }}
                        >
                          {page}
                        </Text>
                      </TouchableOpacity>
                    ) : null;
                  })}

                  <TouchableOpacity
                    onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRightIcon width={16} height={16} color={COLORS.textDark} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Empty State */}
            {!loading && filteredAndSortedClaims.length === 0 && (
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 48,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: 'rgba(217, 217, 217, 0.48)',
                  }}
                >
                  <DocumentTextIcon width={40} height={40} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 8 }}>No claims found</Text>
                <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', marginBottom: 24, maxWidth: 280, lineHeight: 22 }}>
                  {claims.length === 0
                    ? 'You have not submitted any claims yet. Create your first claim to get started.'
                    : 'Try adjusting your search or filters to find claims.'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/member/claims/new')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <DocumentTextIcon width={20} height={20} color={COLORS.white} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>
                    {claims.length === 0 ? 'Create First Claim' : 'New Claim'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
