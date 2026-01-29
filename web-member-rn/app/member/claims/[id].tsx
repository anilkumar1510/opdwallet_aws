'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// SVG ICONS
// ============================================================================

function ArrowLeftIcon({ size = 24, color = '#0E51A2' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentTextIcon({ size = 24, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 24, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CurrencyRupeeIcon({ size = 24, color = '#9333EA' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 8H15M9 12H15M9 16L15 22M9 12V22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon({ size = 24, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 24, color = '#F59E0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 24, color = '#16A34A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XCircleIcon({ size = 24, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExclamationCircleIcon({ size = 24, color = '#F97316' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PhoneIcon({ size = 24, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EnvelopeIcon({ size = 24, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 24, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloudArrowUpIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 16V8M12 8L9 11M12 8L15 11M6.5 20C4.01472 20 2 17.9853 2 15.5C2 13.5 3.2 11.7 5 11C5 7.13401 8.13401 4 12 4C15.866 4 19 7.13401 19 11C20.8 11.7 22 13.5 22 15.5C22 17.9853 19.9853 20 17.5 20H6.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InformationCircleIcon({ size = 24, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// INTERFACES
// ============================================================================

interface ClaimDocument {
  _id: string;
  fileName: string;
  filePath: string;
  documentType: string;
  uploadedAt: string;
  notes?: string;
}

interface Claim {
  _id: string;
  claimId: string;
  userId: string;
  memberName: string;
  patientName: string;
  relationToMember: string;
  treatmentDate: string;
  category: string;
  providerName: string;
  providerLocation?: string;
  billAmount: number;
  originalBillAmount?: number;
  cappedAmount?: number;
  wasAutoCapped?: boolean;
  perClaimLimitApplied?: number;
  billNumber?: string;
  treatmentDescription?: string;
  approvedAmount?: number;
  status: string;
  documents: ClaimDocument[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  documentsRequested?: any[];
  requiredDocumentsList?: string[];
  documentsRequiredReason?: string;
  createdAt: string;
  updatedAt: string;
  claimType?: string;
  isUrgent?: boolean;
  requiresPreAuth?: boolean;
  preAuthNumber?: string;
}

interface TimelineEntry {
  status: string;
  changedAt: string;
  changedBy: string;
  changedByRole: string;
  reason?: string;
}

interface TPANote {
  type: string;
  message: string;
  timestamp?: string;
  documents?: Array<{ documentType: string; reason: string }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
    case 'PARTIALLY_APPROVED':
    case 'PAYMENT_COMPLETED':
      return { background: '#E8F5E9', color: '#25A425', borderColor: '#25A425' };
    case 'REJECTED':
      return { background: '#FFEBEE', color: '#E53535', borderColor: '#E53535' };
    case 'CANCELLED':
      return { background: '#F3F4F6', color: '#6B7280', borderColor: '#6B7280' };
    case 'DOCUMENTS_REQUIRED':
    case 'UNDER_REVIEW':
    case 'ASSIGNED':
      return { background: '#FEF1E7', color: '#E67E22', borderColor: '#E67E22' };
    case 'PAYMENT_PENDING':
    case 'PAYMENT_PROCESSING':
      return { background: '#F3E8FF', color: '#9333EA', borderColor: '#9333EA' };
    default:
      return { background: '#EFF4FF', color: '#0F5FDC', borderColor: '#0F5FDC' };
  }
};

const getStatusIcon = (status: string, size = 20) => {
  switch (status) {
    case 'APPROVED':
    case 'PARTIALLY_APPROVED':
    case 'PAYMENT_COMPLETED':
      return <CheckCircleIcon size={size} color="#25A425" />;
    case 'REJECTED':
      return <XCircleIcon size={size} color="#E53535" />;
    case 'CANCELLED':
      return <XCircleIcon size={size} color="#6B7280" />;
    case 'DOCUMENTS_REQUIRED':
      return <ExclamationCircleIcon size={size} color="#E67E22" />;
    case 'UNDER_REVIEW':
    case 'ASSIGNED':
      return <ClockIcon size={size} color="#E67E22" />;
    case 'PAYMENT_PENDING':
    case 'PAYMENT_PROCESSING':
      return <CurrencyRupeeIcon size={size} color="#9333EA" />;
    default:
      return <DocumentTextIcon size={size} color="#0F5FDC" />;
  }
};

const formatStatusName = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClaimDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [tpaNotes, setTpaNotes] = useState<TPANote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Fetch claim details
  const fetchClaimDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/member/claims/${id}`);
      setClaim(response.data.claim);
    } catch (err: any) {
      console.error('Error fetching claim:', err);
      setError(err.response?.data?.message || 'Failed to load claim details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch timeline
  const fetchTimeline = useCallback(async () => {
    if (!id) return;
    try {
      const response = await apiClient.get(`/member/claims/${id}/timeline`);
      setTimeline(response.data.timeline || []);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  }, [id]);

  // Fetch TPA notes
  const fetchTPANotes = useCallback(async () => {
    if (!id) return;
    try {
      const response = await apiClient.get(`/member/claims/${id}/tpa-notes`);
      setTpaNotes(response.data.notes || []);
    } catch (err) {
      console.error('Error fetching TPA notes:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchClaimDetails();
    fetchTimeline();
    fetchTPANotes();
  }, [id, fetchClaimDetails, fetchTimeline, fetchTPANotes]);

  const canCancelClaim = () => {
    if (!claim) return false;
    const nonCancellableStatuses = [
      'APPROVED',
      'PARTIALLY_APPROVED',
      'REJECTED',
      'CANCELLED',
      'PAYMENT_COMPLETED',
      'PAYMENT_PROCESSING',
    ];
    return !nonCancellableStatuses.includes(claim.status);
  };

  const handleCancelClaim = async () => {
    if (!claim) return;

    setCancelling(true);
    try {
      await apiClient.patch(`/member/claims/${claim.claimId}/cancel`, {
        reason: cancelReason || 'Cancelled by member',
      });

      setShowCancelModal(false);
      if (Platform.OS === 'web') {
        window.alert('Claim cancelled successfully');
        router.replace('/member/claims');
      } else {
        Alert.alert('Success', 'Claim cancelled successfully', [
          { text: 'OK', onPress: () => router.replace('/member/claims') },
        ]);
      }
    } catch (err: any) {
      console.error('Error cancelling claim:', err);
      const errorMsg = err.response?.data?.message || 'Failed to cancel claim';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setCancelling(false);
    }
  };

  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  const handleViewDocument = async (doc: ClaimDocument) => {
    if (!claim) return;

    setViewingDocId(doc._id);

    try {
      const fileUrl = `/member/claims/files/${claim.userId}/${doc.fileName}`;

      // Fetch with auth headers
      const response = await apiClient.get(fileUrl, {
        responseType: 'blob',
      });

      const blob = response.data;

      if (Platform.OS === 'web') {
        // For web: create blob URL and open in new tab
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        // For native: convert to base64 and open
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          // Open using data URI for native
          Linking.openURL(base64Data);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err: any) {
      console.error('Error viewing document:', err);
      const errorMsg = err.response?.data?.message || 'Failed to open document';
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setViewingDocId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F7FC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0E51A2" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading claim details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !claim) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F7FC', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <XCircleIcon size={48} color="#DC2626" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 16 }}>
          Error Loading Claim
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
          {error || 'Claim not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/member/claims')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#0E51A2',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 24,
          }}
        >
          <ArrowLeftIcon size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 8 }}>Back to Claims</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors = getStatusColor(claim.status);
  const ContainerComponent = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <ContainerComponent style={{ flex: 1, backgroundColor: '#F7F7FC' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/member/claims')}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
        >
          <ArrowLeftIcon size={20} color="#0E51A2" />
          <Text style={{ color: '#0E51A2', fontWeight: '500', marginLeft: 8 }}>Back to Claims</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>
              Claim {claim.claimId}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              Submitted on {formatDate(claim.submittedAt)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: statusColors.borderColor,
              backgroundColor: statusColors.background,
            }}
          >
            {getStatusIcon(claim.status, 18)}
            <Text style={{ color: statusColors.color, fontWeight: '600', marginLeft: 6, fontSize: 13 }}>
              {formatStatusName(claim.status)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Cancel Claim Button */}
        {canCancelClaim() && (
          <TouchableOpacity
            onPress={() => setShowCancelModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 2,
              borderColor: '#FECACA',
              borderRadius: 12,
              backgroundColor: '#FEF2F2',
              marginBottom: 16,
            }}
          >
            <XCircleIcon size={20} color="#DC2626" />
            <Text style={{ color: '#DC2626', fontWeight: '600', marginLeft: 8 }}>Cancel Claim</Text>
          </TouchableOpacity>
        )}

        {/* Documents Required Alert */}
        {(claim.status === 'DOCUMENTS_REQUIRED' || claim.status === 'RESUBMISSION_REQUIRED') && (
          <View
            style={{
              backgroundColor: '#FFF7ED',
              borderWidth: 2,
              borderColor: '#FDBA74',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <ExclamationCircleIcon size={24} color="#EA580C" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#9A3412', marginBottom: 8 }}>
                  Additional Documents Required
                </Text>
                {claim.documentsRequiredReason && (
                  <Text style={{ fontSize: 14, color: '#C2410C', marginBottom: 8 }}>
                    <Text style={{ fontWeight: '600' }}>Reason: </Text>
                    {claim.documentsRequiredReason}
                  </Text>
                )}
                {claim.requiredDocumentsList && claim.requiredDocumentsList.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#C2410C', marginBottom: 4 }}>
                      Required Documents:
                    </Text>
                    {claim.requiredDocumentsList.map((doc, idx) => (
                      <Text key={idx} style={{ fontSize: 14, color: '#C2410C', marginLeft: 8 }}>
                        • {doc}
                      </Text>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EA580C',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}
                >
                  <CloudArrowUpIcon size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 8 }}>
                    Upload Documents
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Claim Summary Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Claim Summary</Text>
          </View>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {/* Patient Name */}
              <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Patient Name
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {claim.patientName || claim.memberName}
                </Text>
              </View>

              {/* Relationship */}
              <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Relationship
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {claim.relationToMember || 'SELF'}
                </Text>
              </View>

              {/* Treatment Date */}
              <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Treatment Date
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CalendarIcon size={16} color="#6B7280" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginLeft: 6 }}>
                    {formatDate(claim.treatmentDate)}
                  </Text>
                </View>
              </View>

              {/* Bill Amount */}
              <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Bill Amount
                </Text>
                {claim.wasAutoCapped && claim.originalBillAmount ? (
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                      {formatCurrency(claim.originalBillAmount)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <ExclamationCircleIcon size={12} color="#D97706" />
                      <Text style={{ fontSize: 11, color: '#D97706', marginLeft: 4 }}>
                        Capped to {formatCurrency(claim.billAmount)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                    {formatCurrency(claim.billAmount)}
                  </Text>
                )}
              </View>

              {/* Amount Submitted */}
              <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Amount for Approval
                </Text>
                {claim.wasAutoCapped && claim.perClaimLimitApplied ? (
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#16A34A' }}>
                      {formatCurrency(claim.billAmount)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <CheckCircleIcon size={12} color="#16A34A" />
                      <Text style={{ fontSize: 11, color: '#16A34A', marginLeft: 4 }}>
                        Limit: {formatCurrency(claim.perClaimLimitApplied)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                    {formatCurrency(claim.billAmount)}
                  </Text>
                )}
              </View>

              {/* Approved Amount */}
              {claim.approvedAmount !== undefined && claim.approvedAmount > 0 && (
                <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                    Approved Amount
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#16A34A' }}>
                    {formatCurrency(claim.approvedAmount)}
                  </Text>
                </View>
              )}

              {/* Category */}
              <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Category
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {claim.category}
                </Text>
              </View>

              {/* Bill Number */}
              {claim.billNumber && (
                <View style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                    Bill Number
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                    {claim.billNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Provider & Treatment Details */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
              Provider & Treatment Details
            </Text>
          </View>
          <View style={{ padding: 16 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                Provider Name
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                {claim.providerName}
              </Text>
            </View>

            {claim.providerLocation && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Provider Location
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {claim.providerLocation}
                </Text>
              </View>
            )}

            {claim.treatmentDescription && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Treatment Description
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {claim.treatmentDescription}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              <View style={{ width: '50%', paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                  Claim Type
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {claim.claimType || 'REIMBURSEMENT'}
                </Text>
              </View>

              {claim.isUrgent && (
                <View style={{ width: '50%', paddingHorizontal: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 4 }}>
                    Priority
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#FEE2E2',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#991B1B' }}>Urgent</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Uploaded Documents */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Uploaded Documents</Text>
          </View>
          <View style={{ padding: 16 }}>
            {claim.documents && claim.documents.length > 0 ? (
              <View style={{ gap: 12 }}>
                {claim.documents.map((doc) => (
                  <View
                    key={doc._id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 12,
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <DocumentTextIcon size={32} color="#2563EB" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                          {doc.documentType}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}
                          numberOfLines={1}
                        >
                          {doc.fileName}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleViewDocument(doc)}
                      disabled={viewingDocId === doc._id}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        opacity: viewingDocId === doc._id ? 0.6 : 1,
                      }}
                    >
                      {viewingDocId === doc._id ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                      ) : (
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563EB' }}>View</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 16 }}>
                No documents uploaded yet
              </Text>
            )}
          </View>
        </View>

        {/* Status Timeline */}
        {timeline.length > 0 && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                Claim Status Timeline
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                Track your claim's progress
              </Text>
            </View>
            <View style={{ padding: 16 }}>
              <View style={{ position: 'relative' }}>
                {/* Vertical Line */}
                <View
                  style={{
                    position: 'absolute',
                    left: 15,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    backgroundColor: '#E5E7EB',
                  }}
                />

                {timeline.map((entry, index) => {
                  const isLatest = index === 0;
                  const entryStatusColors = getStatusColor(entry.status);

                  return (
                    <View key={index} style={{ flexDirection: 'row', marginBottom: index < timeline.length - 1 ? 16 : 0 }}>
                      {/* Icon */}
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: entryStatusColors.borderColor,
                          backgroundColor: entryStatusColors.background,
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                        }}
                      >
                        {getStatusIcon(entry.status, 16)}
                      </View>

                      {/* Content */}
                      <View
                        style={{
                          flex: 1,
                          marginLeft: 12,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: isLatest ? 2 : 1,
                          borderColor: isLatest ? entryStatusColors.borderColor : '#E5E7EB',
                          backgroundColor: isLatest ? entryStatusColors.background : '#F9FAFB',
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                            {formatStatusName(entry.status)}
                          </Text>
                          {isLatest && (
                            <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#1D4ED8' }}>Current</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>
                          <Text style={{ fontWeight: '600' }}>By:</Text> {entry.changedBy}
                          {entry.changedByRole && ` (${entry.changedByRole})`}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          <Text style={{ fontWeight: '600' }}>When:</Text> {formatDateTime(entry.changedAt)}
                        </Text>
                        {entry.reason && (
                          <Text style={{ fontSize: 12, color: '#374151', marginTop: 6 }}>
                            <Text style={{ fontWeight: '600' }}>Note:</Text> {entry.reason}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* TPA Notes */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Notes from TPA</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Important information from your claim reviewer
            </Text>
          </View>
          <View style={{ padding: 16 }}>
            {tpaNotes.length > 0 ? (
              <View style={{ gap: 12 }}>
                {tpaNotes.map((note, index) => {
                  const noteColors =
                    note.type === 'approval'
                      ? { bg: '#F0FDF4', border: '#BBF7D0' }
                      : note.type === 'rejection'
                      ? { bg: '#FEF2F2', border: '#FECACA' }
                      : note.type === 'documents_required'
                      ? { bg: '#FFF7ED', border: '#FDBA74' }
                      : { bg: '#EFF6FF', border: '#BFDBFE' };

                  return (
                    <View
                      key={index}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: noteColors.border,
                        backgroundColor: noteColors.bg,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {note.type === 'approval' && <CheckCircleIcon size={24} color="#16A34A" />}
                        {note.type === 'rejection' && <XCircleIcon size={24} color="#DC2626" />}
                        {note.type === 'documents_required' && <DocumentTextIcon size={24} color="#EA580C" />}
                        {!['approval', 'rejection', 'documents_required'].includes(note.type) && (
                          <InformationCircleIcon size={24} color="#2563EB" />
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                              {note.type === 'approval'
                                ? 'Claim Approved'
                                : note.type === 'rejection'
                                ? 'Claim Rejected'
                                : note.type === 'documents_required'
                                ? 'Additional Documents Required'
                                : 'Note from TPA'}
                            </Text>
                            {note.timestamp && (
                              <Text style={{ fontSize: 11, color: '#6B7280' }}>
                                {formatDateTime(note.timestamp)}
                              </Text>
                            )}
                          </View>
                          <Text style={{ fontSize: 14, color: '#374151' }}>{note.message}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 16 }}>
                No notes from TPA yet
              </Text>
            )}
          </View>
        </View>

        {/* Claim Stats */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>Claim Stats</Text>
          </View>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>Documents</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                {claim.documents?.length || 0}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>Submitted</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                {formatDate(claim.submittedAt)}
              </Text>
            </View>
            {claim.reviewedAt && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>Reviewed</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {formatDate(claim.reviewedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Need Help */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>Need Help?</Text>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              If you have questions about your claim, our support team is here to help.
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <PhoneIcon size={18} color="#6B7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 8 }}>
                Call Support
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
              }}
            >
              <EnvelopeIcon size={18} color="#6B7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 8 }}>
                Email Support
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Cancel Claim Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircleIcon size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Cancel Claim</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  Are you sure you want to cancel this claim? This action cannot be undone.
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                Reason for Cancellation (Optional)
              </Text>
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Please provide a reason for cancelling this claim..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: '#111827',
                  textAlignVertical: 'top',
                  minHeight: 80,
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={cancelling}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: cancelling ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Keep Claim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelClaim}
                disabled={cancelling}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  backgroundColor: '#DC2626',
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: cancelling ? 0.7 : 1,
                }}
              >
                {cancelling && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                  {cancelling ? 'Cancelling...' : 'Cancel Claim'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ContainerComponent>
  );
}
