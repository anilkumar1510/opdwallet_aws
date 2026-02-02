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
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// COLORS - Matching Dashboard
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
  error: '#ef4444',
  warning: '#f59e0b',
};

// ============================================================================
// SVG ICONS - Matching Dashboard Style (Blue + Orange accents)
// ============================================================================

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

function DocumentIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 13H8M16 17H8M10 9H8"
        stroke={COLORS.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="15" r="2" fill={COLORS.orange} />
    </Svg>
  );
}

function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={COLORS.primary} strokeWidth={1.5} />
      <Circle cx="12" cy="7" r="1.5" fill={COLORS.orange} />
    </Svg>
  );
}

function CurrencyIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M8 12h8M8 8h4a4 4 0 010 8H8"
        stroke={COLORS.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M9 12l2 2 4-4"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XCircleIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color || COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={color || COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M12 6v6l4 2"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M12 8v4M12 16h.01"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={COLORS.orange} strokeWidth={1.5} />
    </Svg>
  );
}

function ChevronDownIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={COLORS.textGray}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronUpIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15l-6-6-6 6"
        stroke={COLORS.textGray}
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
}

interface TimelineEntry {
  status: string;
  changedAt: string;
  changedBy: string;
  changedByRole: string;
  reason?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'APPROVED':
    case 'PARTIALLY_APPROVED':
    case 'PAYMENT_COMPLETED':
      return { label: 'Approved', color: COLORS.success, bg: '#E8F5E9' };
    case 'REJECTED':
      return { label: 'Rejected', color: COLORS.error, bg: '#FFEBEE' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: COLORS.textGray, bg: '#F3F4F6' };
    case 'DOCUMENTS_REQUIRED':
      return { label: 'Documents Required', color: COLORS.warning, bg: '#FEF3C7' };
    case 'UNDER_REVIEW':
    case 'ASSIGNED':
      return { label: 'Under Review', color: COLORS.orange, bg: '#FEF1E7' };
    case 'PAYMENT_PENDING':
    case 'PAYMENT_PROCESSING':
      return { label: 'Payment Processing', color: COLORS.primary, bg: '#EFF4FF' };
    default:
      return { label: 'Submitted', color: COLORS.primary, bg: '#EFF4FF' };
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// ============================================================================
// DETAIL ROW COMPONENT
// ============================================================================

interface DetailRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function DetailRow({ label, value, isLast = false }: DetailRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Text style={{ fontSize: 13, color: COLORS.textGray }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark }}>{value}</Text>
    </View>
  );
}

// ============================================================================
// EXPANDABLE SECTION COMPONENT
// ============================================================================

interface ExpandableSectionProps {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function ExpandableSection({ title, count, children, defaultExpanded = false }: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(217, 217, 217, 0.48)',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textDark, letterSpacing: 0.5 }}>
            {title.toUpperCase()}
          </Text>
          {count !== undefined && (
            <View
              style={{
                backgroundColor: COLORS.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.white }}>{count}</Text>
            </View>
          )}
        </View>
        {isExpanded ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
      </TouchableOpacity>

      {isExpanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: COLORS.border }}>
          {children}
        </View>
      )}
    </View>
  );
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ClaimDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState(false);

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

  useEffect(() => {
    fetchClaimDetails();
    fetchTimeline();
  }, [id, fetchClaimDetails, fetchTimeline]);

  const canCancelClaim = () => {
    if (!claim) return false;
    const nonCancellableStatuses = [
      'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'CANCELLED',
      'PAYMENT_COMPLETED', 'PAYMENT_PROCESSING',
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

  const handleViewDocument = async (doc: ClaimDocument) => {
    if (!claim) return;
    setViewingDocId(doc._id);
    setPdfLoading(true);

    try {
      const fileUrl = `/member/claims/files/${claim.userId}/${doc.fileName}`;
      const response = await apiClient.get(fileUrl, { responseType: 'blob' });
      const blob = response.data;
      const isPdf = doc.fileName.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf';

      if (Platform.OS === 'web') {
        // On web, open in new tab
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        setViewingDocId(null);
        setPdfLoading(false);
      } else if (isPdf) {
        // For PDFs on native, save to file system and open with system viewer
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const fileUri = `${FileSystem.cacheDirectory}${doc.fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'application/pdf',
                dialogTitle: 'View Document',
                UTI: 'com.adobe.pdf',
              });
            } else {
              Alert.alert('Error', 'Sharing is not available on this device');
            }
          } catch (shareErr) {
            console.error('Error sharing PDF:', shareErr);
            Alert.alert('Error', 'Failed to open PDF');
          } finally {
            setViewingDocId(null);
            setPdfLoading(false);
          }
        };
        reader.onerror = () => {
          Alert.alert('Error', 'Failed to load document');
          setViewingDocId(null);
          setPdfLoading(false);
        };
        reader.readAsDataURL(blob);
      } else {
        // For images, show in WebView modal
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setPdfUrl(base64Data);
          setPdfName(doc.documentType || doc.fileName);
          setShowPdfViewer(true);
          setViewingDocId(null);
          setPdfLoading(false);
        };
        reader.onerror = () => {
          Alert.alert('Error', 'Failed to load document');
          setViewingDocId(null);
          setPdfLoading(false);
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
      setViewingDocId(null);
      setPdfLoading(false);
    }
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setPdfUrl(null);
    setPdfName('');
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, fontSize: 13, color: COLORS.textGray }}>Loading claim details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !claim) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View
            style={{
              width: 56,
              height: 56,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <XCircleIcon size={28} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 }}>
            Error Loading Claim
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textGray, textAlign: 'center', marginBottom: 24 }}>
            {error || 'Claim not found'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/member/claims')}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '600' }}>Back to Claims</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const statusConfig = getStatusConfig(claim.status);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => router.push('/member/claims')}
                style={{ padding: 8, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark }}>
                Claim Details
              </Text>
              {canCancelClaim() ? (
                <TouchableOpacity
                  onPress={() => setShowCancelModal(true)}
                  style={{ padding: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.orange }}>
                    Cancel Claim
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 90 }} />
              )}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
            {/* Claim Summary Title */}
            <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textDark, textAlign: 'center' }}>
                My Claim Summary
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textGray, textAlign: 'center', marginTop: 6 }}>
                Treatment Date: {formatDate(claim.treatmentDate)}
              </Text>
            </View>

            {/* Claim Details Card */}
            <View style={{ paddingHorizontal: 16 }}>
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(217, 217, 217, 0.48)',
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
                }}
              >
                <DetailRow label="Claim ID" value={claim.claimId} />
                <DetailRow label="Patient Name" value={claim.patientName || claim.memberName} />
                <DetailRow label="Relationship" value={claim.relationToMember || 'Self'} />
                <DetailRow label="Category" value={claim.category} />
                <DetailRow label="Provider" value={claim.providerName} />
                <DetailRow label="Bill Amount" value={formatCurrency(claim.billAmount)} />
                {claim.approvedAmount !== undefined && claim.approvedAmount > 0 && (
                  <DetailRow label="Approved Amount" value={formatCurrency(claim.approvedAmount)} />
                )}
                <DetailRow
                  label="Status"
                  value={statusConfig.label}
                  isLast
                />
              </View>

              {/* Status Badge */}
              <View
                style={{
                  backgroundColor: statusConfig.bg,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {claim.status.includes('APPROVED') || claim.status === 'PAYMENT_COMPLETED' ? (
                  <CheckCircleIcon size={20} />
                ) : claim.status === 'REJECTED' || claim.status === 'CANCELLED' ? (
                  <XCircleIcon size={20} />
                ) : claim.status === 'DOCUMENTS_REQUIRED' ? (
                  <AlertIcon size={20} />
                ) : (
                  <ClockIcon size={20} />
                )}
                <Text style={{ fontSize: 14, fontWeight: '600', color: statusConfig.color }}>
                  {statusConfig.label}
                </Text>
              </View>

              {/* Documents Required Alert */}
              {claim.status === 'DOCUMENTS_REQUIRED' && (
                <View
                  style={{
                    backgroundColor: '#FEF3C7',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: '#FCD34D',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E', marginBottom: 6 }}>
                    Additional Documents Required
                  </Text>
                  {claim.documentsRequiredReason && (
                    <Text style={{ fontSize: 12, color: '#A16207', marginBottom: 6 }}>
                      {claim.documentsRequiredReason}
                    </Text>
                  )}
                  {claim.requiredDocumentsList && claim.requiredDocumentsList.length > 0 && (
                    <View>
                      {claim.requiredDocumentsList.map((doc, idx) => (
                        <Text key={idx} style={{ fontSize: 12, color: '#A16207' }}>
                          • {doc}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Documents Section */}
              <ExpandableSection
                title="Documents"
                count={claim.documents?.length || 0}
                defaultExpanded={true}
              >
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
                            backgroundColor: COLORS.background,
                            borderRadius: 12,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                backgroundColor: 'rgba(3, 77, 162, 0.08)',
                                borderRadius: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <DocumentIcon size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark }}>
                                {doc.documentType}
                              </Text>
                              <Text style={{ fontSize: 11, color: COLORS.textGray }} numberOfLines={1}>
                                {doc.fileName}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleViewDocument(doc)}
                            disabled={viewingDocId === doc._id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              opacity: viewingDocId === doc._id ? 0.6 : 1,
                            }}
                          >
                            {viewingDocId === doc._id ? (
                              <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                              <>
                                <EyeIcon size={14} />
                                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }}>View</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: COLORS.textGray, textAlign: 'center', paddingVertical: 16 }}>
                      No documents uploaded
                    </Text>
                  )}
                </View>
              </ExpandableSection>

              {/* Timeline Section */}
              {timeline.length > 0 && (
                <ExpandableSection title="Status Timeline" defaultExpanded={false}>
                  <View style={{ padding: 16 }}>
                    {timeline.map((entry, index) => {
                      const entryStatus = getStatusConfig(entry.status);
                      return (
                        <View
                          key={index}
                          style={{
                            flexDirection: 'row',
                            marginBottom: index < timeline.length - 1 ? 16 : 0,
                          }}
                        >
                          <View style={{ alignItems: 'center', marginRight: 12 }}>
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: index === 0 ? COLORS.primary : COLORS.border,
                              }}
                            />
                            {index < timeline.length - 1 && (
                              <View
                                style={{
                                  width: 2,
                                  flex: 1,
                                  backgroundColor: COLORS.border,
                                  marginTop: 4,
                                }}
                              />
                            )}
                          </View>
                          <View style={{ flex: 1, paddingBottom: 8 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark }}>
                              {entryStatus.label}
                            </Text>
                            <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 2 }}>
                              {formatDate(entry.changedAt)}
                            </Text>
                            {entry.reason && (
                              <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 4 }}>
                                {entry.reason}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ExpandableSection>
              )}

              {/* Treatment Details */}
              {claim.treatmentDescription && (
                <ExpandableSection title="Treatment Details" defaultExpanded={false}>
                  <View style={{ padding: 16 }}>
                    <Text style={{ fontSize: 13, color: COLORS.textGray, lineHeight: 20 }}>
                      {claim.treatmentDescription}
                    </Text>
                  </View>
                </ExpandableSection>
              )}
            </View>
          </View>
        </ScrollView>

      </SafeAreaView>

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
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <XCircleIcon size={24} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 }}>
                Cancel Claim
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textGray, textAlign: 'center' }}>
                Are you sure you want to cancel this claim? This action cannot be undone.
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 }}>
                Reason (Optional)
              </Text>
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Please provide a reason..."
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  color: COLORS.textDark,
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
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark }}>Keep Claim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelClaim}
                disabled={cancelling}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: COLORS.error,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: cancelling ? 0.7 : 1,
                }}
              >
                {cancelling && <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 8 }} />}
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>
                  {cancelling ? 'Cancelling...' : 'Cancel Claim'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal visible={showPdfViewer} animationType="slide" onRequestClose={closePdfViewer}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          {/* PDF Viewer Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
              backgroundColor: COLORS.white,
            }}
          >
            <TouchableOpacity
              onPress={closePdfViewer}
              style={{ padding: 8, borderRadius: 12 }}
              activeOpacity={0.7}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={COLORS.textDark}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.textDark,
                textAlign: 'center',
                marginHorizontal: 12,
              }}
              numberOfLines={1}
            >
              {pdfName}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Image Content */}
          {pdfUrl ? (
            <WebView
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      html, body {
                        width: 100%;
                        height: 100%;
                        background: #f7f7fc;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      }
                      .container {
                        width: 100%;
                        padding: 16px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      }
                      img {
                        max-width: 100%;
                        max-height: 90vh;
                        object-fit: contain;
                        border-radius: 8px;
                        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <img src="${pdfUrl}" alt="Document" />
                    </div>
                  </body>
                  </html>
                `,
              }}
              style={{ flex: 1, backgroundColor: COLORS.background }}
              startInLoadingState={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              renderLoading={() => (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.background,
                  }}
                >
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={{ marginTop: 12, fontSize: 13, color: COLORS.textGray }}>
                    Loading image...
                  </Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert('Error', 'Failed to display image');
                closePdfViewer();
              }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.background,
              }}
            >
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 12, fontSize: 13, color: COLORS.textGray }}>
                Loading document...
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
