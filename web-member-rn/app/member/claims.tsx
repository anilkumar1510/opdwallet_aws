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
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useFamily } from '../../src/contexts/FamilyContext';
import apiClient from '../../src/lib/api/client';

// ============================================================================
// ICONS
// ============================================================================

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
  const [dateRange, setDateRange] = useState('all');
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

  // Fetch claims on mount and when viewingUserId changes
  useEffect(() => {
    console.log('[Claims] Fetching data, viewingUserId:', viewingUserId);
    fetchClaims();
  }, [fetchClaims]);

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

      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

      return matchesSearch && matchesStatus;
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
  }, [claims, searchQuery, statusFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClaims.length / itemsPerPage);
  const paginatedClaims = filteredAndSortedClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
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
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                padding: 8,
                borderRadius: 12,
              }}
            >
              <ChevronLeftIcon width={24} height={24} color="#0E51A2" />
            </TouchableOpacity>
            <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }} numberOfLines={1}>
                Claims History
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>
                Track and manage your medical claims
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/member/claims/new')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                flexShrink: 0,
              }}
            >
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 12,
                }}
              />
              <DocumentTextIcon width={16} height={16} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>New</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        {/* Quick Stats */}
        {loading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            {[...Array(4)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: '48%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
              >
                <ActivityIndicator size="small" color="#0F5FDC" />
              </View>
            ))}
          </View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}
          >
            {/* Approved Card */}
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: '48%',
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderColor: '#86ACD8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <LinearGradient
                  colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(164, 191, 254, 0.48)',
                  }}
                >
                  <CheckCircleIcon width={20} height={20} color="#0F5FDC" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>{stats.approved}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Approved</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Processing Card */}
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: '48%',
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderColor: '#86ACD8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <LinearGradient
                  colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(164, 191, 254, 0.48)',
                  }}
                >
                  <ClockIcon width={20} height={20} color="#0F5FDC" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>{stats.processing}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Processing</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Under Review Card */}
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: '48%',
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderColor: '#86ACD8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <LinearGradient
                  colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(164, 191, 254, 0.48)',
                  }}
                >
                  <ExclamationCircleIcon width={20} height={20} color="#0F5FDC" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>{stats.underReview}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Under Review</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Total Amount Card */}
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: '48%',
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderColor: '#86ACD8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <LinearGradient
                  colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(164, 191, 254, 0.48)',
                  }}
                >
                  <DocumentTextIcon width={20} height={20} color="#0F5FDC" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    ₹{stats.totalAmount.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Total Claims</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Controls Bar */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            {/* Search */}
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <View style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}>
                <MagnifyingGlassIcon width={20} height={20} color="#9ca3af" />
              </View>
              <TextInput
                placeholder="Search claims..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  width: '100%',
                  paddingLeft: 40,
                  paddingRight: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  fontSize: 14,
                  color: '#111827',
                }}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Status Filter & View Toggle */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', padding: 12 }}>
                    Status: {statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* View Mode Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#f3f4f6',
                  borderRadius: 12,
                  padding: 4,
                }}
              >
                <TouchableOpacity
                  onPress={() => setViewMode('table')}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  }}
                >
                  <TableCellsIcon width={16} height={16} color={viewMode === 'table' ? '#0F5FDC' : '#6b7280'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode('cards')}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                  }}
                >
                  <Squares2X2Icon width={16} height={16} color={viewMode === 'cards' ? '#0F5FDC' : '#6b7280'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filters & Export Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                }}
              >
                <FunnelIcon width={16} height={16} color="#111827" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={exportData}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                }}
              >
                <ArrowDownTrayIcon width={16} height={16} color="#111827" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Advanced Filters */}
          {showFilters && (
            <View style={{ padding: 16, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                    Date Range
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#111827' }}>All Time</Text>
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Category</Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#111827' }}>All Categories</Text>
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8 }}>
                    Amount Range
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#111827' }}>All Amounts</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Animated.View>

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
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
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
            <ActivityIndicator size="large" color="#0F5FDC" />
            <Text style={{ color: '#111827', fontWeight: '600', marginTop: 16 }}>Loading claims...</Text>
          </LinearGradient>
        ) : viewMode === 'cards' ? (
          // Card View
          <Animated.View entering={FadeInDown.duration(300).delay(200)} style={{ gap: 16 }}>
            {paginatedClaims.map((claim) => {
              const statusColors = getStatusColor(claim.status);
              return (
                <TouchableOpacity
                  key={claim.id}
                  onPress={() => router.push(`/member/claims/${claim.id}`)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      padding: 20,
                      borderWidth: 2,
                      borderColor: '#86ACD8',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{claim.claimNumber}</Text>
                        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          {new Date(claim.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: statusColors.background,
                        }}
                      >
                        {getStatusIcon(claim.status)}
                        <Text style={{ fontSize: 12, fontWeight: '600', color: statusColors.color, textTransform: 'capitalize' }}>
                          {claim.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <View style={{ gap: 12, marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{claim.provider}</Text>
                      <Text style={{ fontSize: 14, color: '#6b7280' }} numberOfLines={2}>
                        {claim.description}
                      </Text>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: 'rgba(107, 114, 128, 0.2)',
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: '#dbeafe',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#1d4ed8' }}>{claim.type}</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                          ₹{claim.amount.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 16,
                        borderTopWidth: 1,
                        borderTopColor: '#e5e7eb',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>
                        {claim.documents} document{claim.documents !== 1 ? 's' : ''}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F5FDC' }}>View Details →</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        ) : (
          // Table View (simplified for mobile)
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                overflow: 'hidden',
              }}
            >
              {paginatedClaims.map((claim, index) => {
                const statusColors = getStatusColor(claim.status);
                return (
                  <TouchableOpacity
                    key={claim.id}
                    onPress={() => router.push(`/member/claims/${claim.id}`)}
                    style={{
                      padding: 16,
                      borderBottomWidth: index < paginatedClaims.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{claim.claimNumber}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                        ₹{claim.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{claim.provider}</Text>
                        <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                          {new Date(claim.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: statusColors.background,
                        }}
                      >
                        {getStatusIcon(claim.status)}
                        <Text
                          style={{ fontSize: 10, fontWeight: '600', color: statusColors.color, textTransform: 'capitalize' }}
                        >
                          {claim.status.replace('_', ' ')}
                        </Text>
                      </View>
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
            <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600', textAlign: 'center' }}>
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
                  borderColor: '#e5e7eb',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeftIcon width={16} height={16} color="#111827" />
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
                      backgroundColor: currentPage === page ? '#0F5FDC' : 'transparent',
                      borderWidth: 1,
                      borderColor: currentPage === page ? '#0F5FDC' : '#e5e7eb',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: currentPage === page ? '#FFFFFF' : '#374151',
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
                  borderColor: '#e5e7eb',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRightIcon width={16} height={16} color="#111827" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Empty State */}
        {!loading && filteredAndSortedClaims.length === 0 && (
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
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
            <LinearGradient
              colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <DocumentTextIcon width={32} height={32} color="#0F5FDC" />
            </LinearGradient>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2', marginBottom: 8 }}>No claims found</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, maxWidth: 280 }}>
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
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 12,
                }}
              />
              <DocumentTextIcon width={20} height={20} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                {claims.length === 0 ? 'Create First Claim' : 'New Claim'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>
    </ScrollView>
  );
}
