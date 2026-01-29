import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { useFamily } from '../../../src/contexts/FamilyContext';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface Prescription {
  _id: string;
  prescriptionId: string;
  fileName: string;
  status: string;
  uploadedAt: string;
  cartId?: string;
  doctorName?: string;
  prescriptionDate?: string;
  labTests?: Array<{ testName: string } | string>;
  hasOrder?: boolean;
}

interface Cart {
  cartId: string;
  items: Array<{
    serviceName: string;
  }>;
  status: string;
  createdAt: string;
}

interface HealthRecordPrescription {
  _id: string;
  prescriptionId: string;
  doctorName: string;
  createdAt: string;
  prescribedDate: string;
  patientName: string;
  type: 'digital' | 'pdf';
}

// ============================================================================
// SVG ICONS
// ============================================================================

const ArrowLeftIcon = ({ width = 24, height = 24, color = '#111827' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BeakerIcon = ({ width = 24, height = 24, color = '#0a529f' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l.8 2a.75.75 0 01-.7 1.05H4.1a.75.75 0 01-.7-1.05l.8-2M5 14.5l.8 2"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentPlusIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 12v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 01-3.375-3.375V6.75m19.5 0v10.5a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25V6.375a2.25 2.25 0 012.25-2.25h7.5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FolderOpenIcon = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShoppingCartIcon = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClockIcon = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckCircleIcon = ({ width = 24, height = 24, color = '#25A425' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UserIcon = ({ width = 24, height = 24, color = '#6B7280' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIcon = ({ width = 24, height = 24, color = '#6B7280' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const XMarkIcon = ({ width = 24, height = 24, color = '#6B7280' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 18L18 6M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================================
// CONSTANTS
// ============================================================================

const LAB_SERVICES = [
  'Complete Blood Count (CBC)',
  'Thyroid Function Tests',
  'Liver Function Tests',
  'Kidney Function Tests',
  'Blood Sugar Tests',
  'Lipid Profile',
  'Vitamin D & B12',
  'And many more...',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LabTestsPage() {
  const router = useRouter();
  const { viewingUserId, profileData } = useFamily();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [healthRecordPrescriptions, setHealthRecordPrescriptions] = useState<HealthRecordPrescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<HealthRecordPrescription | null>(null);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchData = useCallback(async () => {
    try {
      const userId = viewingUserId || profileData?.user?._id;
      console.log('[LabTests] Fetching data for userId:', userId);

      // Fetch prescriptions
      const prescriptionsRes = await apiClient.get('/member/lab/prescriptions', {
        params: userId ? { userId } : undefined,
      });
      if (prescriptionsRes.data?.data) {
        setPrescriptions(prescriptionsRes.data.data);
        console.log('[LabTests] Prescriptions:', prescriptionsRes.data.data.length);
      }

      // Fetch active carts
      const cartsRes = await apiClient.get('/member/lab/carts', {
        params: userId ? { userId } : undefined,
      });
      if (cartsRes.data?.data) {
        setCarts(cartsRes.data.data);
        console.log('[LabTests] Carts:', cartsRes.data.data.length);
      }
    } catch (error) {
      console.error('[LabTests] Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewingUserId, profileData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // ============================================================================
  // PRESCRIPTION SELECTOR MODAL
  // ============================================================================

  const fetchHealthRecordPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const allPrescriptions: HealthRecordPrescription[] = [];

      // Fetch digital prescriptions
      try {
        const digitalRes = await apiClient.get('/member/digital-prescriptions', {
          params: { filterUsed: true },
        });
        if (digitalRes.data?.prescriptions) {
          const digitalPrescriptions = digitalRes.data.prescriptions.map((p: any) => ({
            _id: p._id,
            prescriptionId: p.prescriptionId || p._id,
            doctorName: p.doctorName || 'Unknown Doctor',
            createdAt: p.createdAt,
            prescribedDate: p.prescribedDate || p.createdAt,
            patientName: p.patientName || '',
            type: 'digital' as const,
          }));
          allPrescriptions.push(...digitalPrescriptions);
        }
      } catch (e) {
        console.log('[LabTests] No digital prescriptions');
      }

      // Fetch PDF prescriptions
      try {
        const pdfRes = await apiClient.get('/member/prescriptions', {
          params: { filterUsed: true },
        });
        if (pdfRes.data?.prescriptions) {
          const pdfPrescriptions = pdfRes.data.prescriptions.map((p: any) => ({
            _id: p._id,
            prescriptionId: p.prescriptionId || p._id,
            doctorName: p.doctorName || 'Unknown Doctor',
            createdAt: p.createdAt,
            prescribedDate: p.prescriptionDate || p.createdAt,
            patientName: p.patientName || '',
            type: 'pdf' as const,
          }));
          allPrescriptions.push(...pdfPrescriptions);
        }
      } catch (e) {
        console.log('[LabTests] No PDF prescriptions');
      }

      // Sort by date (newest first)
      allPrescriptions.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setHealthRecordPrescriptions(allPrescriptions);
    } catch (error) {
      console.error('[LabTests] Error fetching health record prescriptions:', error);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleOpenSelectorModal = () => {
    setShowSelectorModal(true);
    fetchHealthRecordPrescriptions();
  };

  const handlePrescriptionSelect = async () => {
    if (!selectedPrescription) return;

    setShowSelectorModal(false);
    setSubmittingPrescription(true);
    setShowConfirmationModal(true);

    try {
      const requestBody = {
        healthRecordId: selectedPrescription._id,
        prescriptionType: selectedPrescription.type.toUpperCase(),
        patientId: 'current',
        patientName: 'Current Member',
        patientRelationship: 'Self',
        pincode: '',
        prescriptionDate: new Date().toISOString(),
      };

      await apiClient.post('/member/lab/prescriptions/submit-existing', requestBody);
      await fetchData();
    } catch (error) {
      console.error('[LabTests] Error submitting prescription:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to submit prescription');
      } else {
        Alert.alert('Error', 'Failed to submit prescription');
      }
    } finally {
      setSubmittingPrescription(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'DIGITIZING':
        return { backgroundColor: '#DBEAFE', color: '#2563EB' };
      case 'DIGITIZED':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'CREATED':
        return { backgroundColor: '#DBEAFE', color: '#2563EB' };
      case 'REVIEWED':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7fc', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F5FDC" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0E51A2' }}>
        <LinearGradient
          colors={['#0E51A2', '#1565C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: 16, padding: 4 }}
            >
              <ArrowLeftIcon width={24} height={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                Lab Tests
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                Book lab tests with ease
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F5FDC']} />
        }
      >
        {/* Service Description Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#e8f2fc',
                marginRight: 16,
              }}
            >
              <BeakerIcon width={32} height={32} color="#0a529f" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
                Available Lab Tests
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12, lineHeight: 20 }}>
                Get accurate and timely lab test results from certified laboratories
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {LAB_SERVICES.map((service, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      width: '50%',
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#0a529f',
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ fontSize: 13, color: '#374151', flex: 1 }}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Get Started Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
            Get Started
          </Text>

          <View style={{ gap: 12 }}>
            {/* Upload New Prescription */}
            <TouchableOpacity
              onPress={() => router.push('/member/lab-tests/upload')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <DocumentPlusIcon width={28} height={28} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginTop: 12 }}>
                  Upload New Prescription
                </Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
                  Upload a new prescription from your device
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Use Existing Prescription */}
            <TouchableOpacity
              onPress={handleOpenSelectorModal}
              activeOpacity={0.8}
              style={{
                borderRadius: 12,
                padding: 20,
                borderWidth: 2,
                borderColor: '#0F5FDC',
                backgroundColor: '#FFFFFF',
              }}
            >
              <FolderOpenIcon width={28} height={28} color="#0F5FDC" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#0E51A2', marginTop: 12 }}>
                Use Existing Prescription
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                Select from your health records
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Carts */}
        {carts.length > 0 && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <ShoppingCartIcon width={20} height={20} color="#0F5FDC" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginLeft: 8 }}>
                Your Carts ({carts.length})
              </Text>
            </View>

            {carts.map((cart) => (
              <TouchableOpacity
                key={cart.cartId}
                onPress={() => router.push('/member/bookings?tab=lab')}
                activeOpacity={0.8}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  backgroundColor: '#FFFFFF',
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                      {cart.items.length} test{cart.items.length > 1 ? 's' : ''} added
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                      Cart ID: {cart.cartId}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                      Created: {formatDate(cart.createdAt)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 9999,
                        ...getStatusColor(cart.status),
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '500', color: getStatusColor(cart.status).color }}>
                        {cart.status}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#0F5FDC' }}>
                      Review Cart →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Prescriptions */}
        {prescriptions.length > 0 && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
              Recent Prescriptions
            </Text>

            {prescriptions.slice(0, 2).map((prescription) => (
              <View
                key={prescription.prescriptionId}
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                      {prescription.fileName}
                    </Text>

                    {prescription.doctorName && (
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                        Dr. {prescription.doctorName}
                        {prescription.prescriptionDate && ` • ${formatDate(prescription.prescriptionDate)}`}
                      </Text>
                    )}

                    {/* Lab Tests Included */}
                    {prescription.labTests && prescription.labTests.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                          Tests Included:
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                          {prescription.labTests.map((test, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: '#EFF4FF',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '500', color: '#0F5FDC' }}>
                                {typeof test === 'string' ? test : test.testName}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Upload Date and Status */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                        Uploaded: {formatDateTime(prescription.uploadedAt)}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 9999,
                          ...getStatusColor(prescription.status),
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '500', color: getStatusColor(prescription.status).color }}>
                          {prescription.status}
                        </Text>
                      </View>
                      {prescription.hasOrder && (
                        <View
                          style={{
                            backgroundColor: '#F3E8FF',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 9999,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '500', color: '#7C3AED' }}>
                            Lab Order Created
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status Icons */}
                  <View style={{ marginLeft: 12 }}>
                    {prescription.status === 'DIGITIZING' && (
                      <ClockIcon width={20} height={20} color="#0F5FDC" />
                    )}
                    {prescription.status === 'DIGITIZED' && prescription.cartId && (
                      <CheckCircleIcon width={20} height={20} color="#25A425" />
                    )}
                  </View>
                </View>

                {/* Review Cart Button */}
                {prescription.status === 'DIGITIZED' && prescription.cartId && (
                  <TouchableOpacity
                    onPress={() => router.push('/member/bookings?tab=lab')}
                    activeOpacity={0.8}
                    style={{
                      marginTop: 12,
                      backgroundColor: '#0F5FDC',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                      Review Cart
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* View Lab Bookings Button */}
        <TouchableOpacity
          onPress={() => router.push('/member/bookings?tab=lab')}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#0F5FDC',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
            View Lab Bookings
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Prescription Selector Modal */}
      <Modal
        visible={showSelectorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSelectorModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
              padding: 20,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                Select Prescription
              </Text>
              <TouchableOpacity onPress={() => setShowSelectorModal(false)} style={{ padding: 4 }}>
                <XMarkIcon width={24} height={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              Choose a prescription to book lab tests
            </Text>

            {/* Prescriptions List */}
            {loadingPrescriptions ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0F5FDC" />
              </View>
            ) : healthRecordPrescriptions.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <FolderOpenIcon width={48} height={48} color="#9CA3AF" />
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12, textAlign: 'center' }}>
                  No prescriptions found in your health records
                </Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                  Upload a new prescription to get started
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {healthRecordPrescriptions.map((prescription) => (
                  <TouchableOpacity
                    key={prescription._id}
                    onPress={() => setSelectedPrescription(prescription)}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 2,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderColor: selectedPrescription?._id === prescription._id ? '#0F5FDC' : '#E5E7EB',
                      backgroundColor: selectedPrescription?._id === prescription._id ? '#EFF4FF' : '#FFFFFF',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <UserIcon width={16} height={16} color="#6B7280" />
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                            Dr. {prescription.doctorName}
                          </Text>
                          <View
                            style={{
                              backgroundColor: '#F3F4F6',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: '#6B7280' }}>
                              {prescription.type === 'digital' ? 'Digital' : 'PDF'}
                            </Text>
                          </View>
                        </View>
                        {prescription.patientName && (
                          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                            Patient: {prescription.patientName}
                          </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <CalendarIcon width={14} height={14} color="#9CA3AF" />
                          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                            {formatDate(prescription.prescribedDate)}
                          </Text>
                        </View>
                      </View>
                      {selectedPrescription?._id === prescription._id && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: '#0F5FDC',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <CheckCircleIcon width={16} height={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <TouchableOpacity
                onPress={() => setShowSelectorModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrescriptionSelect}
                disabled={!selectedPrescription}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  backgroundColor: selectedPrescription ? '#0F5FDC' : '#D1D5DB',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !submittingPrescription && setShowConfirmationModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              alignItems: 'center',
            }}
          >
            {submittingPrescription ? (
              <>
                <ActivityIndicator size="large" color="#0F5FDC" style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Submitting your prescription...</Text>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#e8f2fc',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <CheckCircleIcon width={40} height={40} color="#0a529f" />
                </View>

                <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                  Prescription Submitted Successfully!
                </Text>

                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, textAlign: 'center', lineHeight: 20 }}>
                  Your prescription has been submitted for digitization. Our operations team will review it and create a cart with available lab vendors for you to choose from.
                </Text>

                <View
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    width: '100%',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ClockIcon width={20} height={20} color="#2563EB" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#1E40AF', marginBottom: 8 }}>
                        What happens next?
                      </Text>
                      <Text style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 18 }}>
                        • Our team will digitize your prescription{'\n'}
                        • We'll find the best labs for you{'\n'}
                        • You'll receive a notification when ready{'\n'}
                        • Review vendors and book your slot
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setShowConfirmationModal(false)}
                  style={{
                    width: '100%',
                    paddingVertical: 14,
                    borderRadius: 8,
                    backgroundColor: '#0F5FDC',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Got it, thanks!</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
