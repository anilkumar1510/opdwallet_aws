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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeftIcon,
  CartIcon,
  ClockIcon,
  CalendarIcon,
  XMarkIcon,
} from '../../../src/components/icons/InlineSVGs';
import { useFamily } from '../../../src/contexts/FamilyContext';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// COLORS - Matching Home Page
// ============================================================================
const COLORS = {
  primary: '#034DA2',
  primaryLight: '#0E51A2',
  textDark: '#1c1c1c',
  textGray: '#6B7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  cardBorder: 'rgba(217, 217, 217, 0.48)',
  success: '#16a34a',
  error: '#DC2626',
  selectedBorder: '#86ACD8',
};

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

interface Address {
  _id: string;
  addressId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ============================================================================
// CUSTOM SVG ICONS (not available in InlineSVGs)
// ============================================================================

const FolderOpenIcon = ({ width = 24, height = 24, color = '#0F5FDC' }: { width?: number; height?: number; color?: string }) => (
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

const UserIconOutline = ({ width = 24, height = 24, color = '#6B7280' }: { width?: number; height?: number; color?: string }) => (
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

const CheckCircleIconOutline = ({ width = 24, height = 24, color = '#16a34a' }: { width?: number; height?: number; color?: string }) => (
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
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [healthRecordPrescriptions, setHealthRecordPrescriptions] = useState<HealthRecordPrescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<HealthRecordPrescription | null>(null);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressType: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false,
  });

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

  // Fetch addresses
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await apiClient.get('/member/addresses');
      if (response.data?.data) {
        setAddresses(response.data.data);
        // Auto-select default address
        const defaultAddr = response.data.data.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        } else if (response.data.data.length > 0) {
          setSelectedAddressId(response.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('[LabTests] Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Handle adding new address
  const handleAddAddress = async () => {
    if (!newAddress.addressLine1.trim()) {
      Alert.alert('Missing Field', 'Please enter address line 1');
      return;
    }
    if (!newAddress.city.trim()) {
      Alert.alert('Missing Field', 'Please enter city');
      return;
    }
    if (!newAddress.state.trim()) {
      Alert.alert('Missing Field', 'Please enter state');
      return;
    }
    if (!newAddress.pincode.trim() || newAddress.pincode.length !== 6) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode');
      return;
    }

    setAddingAddress(true);
    try {
      const response = await apiClient.post('/member/addresses', {
        addressType: newAddress.addressType,
        addressLine1: newAddress.addressLine1.trim(),
        addressLine2: newAddress.addressLine2.trim() || undefined,
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
        landmark: newAddress.landmark.trim() || undefined,
        isDefault: newAddress.isDefault,
      });

      if (response.data?.data) {
        setNewAddress({
          addressType: 'HOME',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
          isDefault: false,
        });
        setShowAddAddressModal(false);
        await fetchAddresses();
        // Select newly added address
        if (response.data.data._id) {
          setSelectedAddressId(response.data.data._id);
        }
        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error: any) {
      console.error('[LabTests] Error adding address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

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
    fetchAddresses();
  };

  // When user selects a prescription, show address modal
  const handlePrescriptionSelected = () => {
    if (!selectedPrescription) return;
    setShowSelectorModal(false);
    setShowAddressModal(true);
  };

  // Submit prescription with selected address
  const handlePrescriptionSelect = async () => {
    if (!selectedPrescription) return;

    if (!selectedAddressId) {
      Alert.alert('Missing Address', 'Please select an address for sample collection');
      return;
    }

    const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
    if (!selectedAddress) {
      Alert.alert('Error', 'Selected address not found');
      return;
    }

    setShowAddressModal(false);
    setSubmittingPrescription(true);
    setShowConfirmationModal(true);

    try {
      const userId = viewingUserId || profileData?.user?._id;
      const userName = profileData?.user?.name || 'Member';

      const requestBody = {
        healthRecordId: selectedPrescription._id,
        prescriptionType: selectedPrescription.type.toUpperCase(),
        patientId: userId,
        patientName: userName,
        patientRelationship: 'Self',
        pincode: selectedAddress.pincode,
        prescriptionDate: new Date().toISOString(),
      };

      console.log('[LabTests] Submitting prescription with body:', JSON.stringify(requestBody, null, 2));
      await apiClient.post('/member/lab/prescriptions/submit-existing', requestBody);
      await fetchData();
    } catch (error: any) {
      console.error('[LabTests] Error submitting prescription:', error);
      console.error('[LabTests] Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to submit prescription';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
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
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* ===== HEADER (STICKY) ===== */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          ...Platform.select({
            web: {
              position: 'sticky',
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
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  Pathology (Lab)
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Book pathology tests with ease
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
          paddingVertical: 20,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* Service Description Card */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.08,
              shadowRadius: 23,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary, marginBottom: 8 }}>
              Available Lab Tests
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 12, lineHeight: 20 }}>
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
                      backgroundColor: COLORS.primary,
                      marginRight: 8,
                    }}
                  />
                  <Text style={{ fontSize: 13, color: COLORS.textDark, flex: 1 }}>{service}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Get Started Card */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.08,
              shadowRadius: 23,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
              Get Started
            </Text>

            <View style={{ gap: 12 }}>
              {/* Upload New Prescription */}
              <TouchableOpacity
                onPress={() => router.push('/member/pathology-lab/upload')}
                activeOpacity={0.8}
                style={{
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                  backgroundColor: COLORS.white,
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                  Upload New Prescription
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 4 }}>
                  Upload a new prescription from your device
                </Text>
              </TouchableOpacity>

              {/* Use Existing Prescription */}
              <TouchableOpacity
                onPress={handleOpenSelectorModal}
                activeOpacity={0.8}
                style={{
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                  backgroundColor: COLORS.white,
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                  Use Existing Prescription
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 4 }}>
                  Select from your health records
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Carts */}
          {carts.length > 0 && (
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <CartIcon width={20} height={20} color={COLORS.primary} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginLeft: 8 }}>
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
                    borderColor: COLORS.selectedBorder,
                    backgroundColor: COLORS.white,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>
                        {cart.items.length} test{cart.items.length > 1 ? 's' : ''} added
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 4 }}>
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
                      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
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
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
                Recent Prescriptions
              </Text>

              {prescriptions.slice(0, 2).map((prescription) => (
                <View
                  key={prescription.prescriptionId}
                  style={{
                    backgroundColor: COLORS.background,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>
                        {prescription.fileName}
                      </Text>

                      {prescription.doctorName && (
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 4 }}>
                          Dr. {prescription.doctorName}
                          {prescription.prescriptionDate && ` • ${formatDate(prescription.prescriptionDate)}`}
                        </Text>
                      )}

                      {/* Lab Tests Included */}
                      {prescription.labTests && prescription.labTests.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.textDark, marginBottom: 4 }}>
                            Tests Included:
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                            {prescription.labTests.map((test, idx) => (
                              <View
                                key={idx}
                                style={{
                                  backgroundColor: 'rgba(3, 77, 162, 0.1)',
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.primary }}>
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
                        <ClockIcon width={20} height={20} color={COLORS.primary} />
                      )}
                      {prescription.status === 'DIGITIZED' && prescription.cartId && (
                        <CheckCircleIconOutline width={20} height={20} color={COLORS.success} />
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
                        backgroundColor: COLORS.primary,
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
              backgroundColor: COLORS.primary,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
              View Lab Bookings
            </Text>
          </TouchableOpacity>
        </View>
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
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
              padding: 20,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary }}>
                Select Prescription
              </Text>
              <TouchableOpacity onPress={() => setShowSelectorModal(false)} style={{ padding: 4 }}>
                <XMarkIcon width={24} height={24} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 20 }}>
              Choose a prescription to book lab tests
            </Text>

            {/* Prescriptions List */}
            {loadingPrescriptions ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : healthRecordPrescriptions.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <FolderOpenIcon width={48} height={48} color="#9CA3AF" />
                <Text style={{ fontSize: 14, color: COLORS.textGray, marginTop: 12, textAlign: 'center' }}>
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
                      borderColor: selectedPrescription?._id === prescription._id ? COLORS.selectedBorder : COLORS.border,
                      backgroundColor: selectedPrescription?._id === prescription._id ? 'rgba(3, 77, 162, 0.05)' : COLORS.white,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <UserIconOutline width={16} height={16} color={COLORS.textGray} />
                          <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                            Dr. {prescription.doctorName}
                          </Text>
                          <View
                            style={{
                              backgroundColor: COLORS.background,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: COLORS.textGray }}>
                              {prescription.type === 'digital' ? 'Digital' : 'PDF'}
                            </Text>
                          </View>
                        </View>
                        {prescription.patientName && (
                          <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 4 }}>
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
                            backgroundColor: COLORS.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <CheckCircleIconOutline width={16} height={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <TouchableOpacity
                onPress={() => setShowSelectorModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrescriptionSelected}
                disabled={!selectedPrescription}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  backgroundColor: selectedPrescription ? COLORS.primary : '#9CA3AF',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
              padding: 20,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textDark }}>
                Select Address
              </Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)} style={{ padding: 4 }}>
                <XMarkIcon width={24} height={24} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 20 }}>
              Select address for sample collection
            </Text>

            {/* Address List */}
            {loadingAddresses ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : addresses.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 12 }}>
                  No addresses found. Please add an address.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddAddressModal(true)}
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: COLORS.white, fontWeight: '500' }}>Add New Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address._id}
                    onPress={() => setSelectedAddressId(address._id)}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 2,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderColor: selectedAddressId === address._id ? COLORS.primary : COLORS.border,
                      backgroundColor: selectedAddressId === address._id ? '#EFF4FF' : COLORS.white,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 4 }}>
                      {address.city}, {address.state} - {address.pincode}
                    </Text>
                    {address.isDefault && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '500' }}>Default Address</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Add Address Button */}
            {addresses.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowAddAddressModal(true)}
                style={{
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '500' }}>+ Add New Address</Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrescriptionSelect}
                disabled={!selectedAddressId}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  backgroundColor: selectedAddressId ? COLORS.primary : '#D1D5DB',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.white }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !addingAddress && setShowAddAddressModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
              padding: 20,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textDark }}>
                Add New Address
              </Text>
              <TouchableOpacity onPress={() => !addingAddress && setShowAddAddressModal(false)} style={{ padding: 4 }}>
                <XMarkIcon width={24} height={24} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Address Type */}
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: COLORS.textDark }}>Address Type</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewAddress(prev => ({ ...prev, addressType: type }))}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: newAddress.addressType === type ? COLORS.primary : COLORS.border,
                      backgroundColor: newAddress.addressType === type ? 'rgba(3, 77, 162, 0.1)' : COLORS.white,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, color: newAddress.addressType === type ? COLORS.primary : COLORS.textGray }}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Address Line 1 */}
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: COLORS.textDark }}>Address Line 1 *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 16 }}>
                <TextInput
                  value={newAddress.addressLine1}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine1: text }))}
                  placeholder="House/Flat No., Building Name"
                  placeholderTextColor="#9CA3AF"
                  style={{ padding: 12, fontSize: 14, color: COLORS.textDark }}
                />
              </View>

              {/* Address Line 2 */}
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: COLORS.textDark }}>Address Line 2</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 16 }}>
                <TextInput
                  value={newAddress.addressLine2}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine2: text }))}
                  placeholder="Street, Area, Locality"
                  placeholderTextColor="#9CA3AF"
                  style={{ padding: 12, fontSize: 14, color: COLORS.textDark }}
                />
              </View>

              {/* City */}
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: COLORS.textDark }}>City *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 16 }}>
                <TextInput
                  value={newAddress.city}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  style={{ padding: 12, fontSize: 14, color: COLORS.textDark }}
                />
              </View>

              {/* State */}
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: COLORS.textDark }}>State *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 16 }}>
                <TextInput
                  value={newAddress.state}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, state: text }))}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                  style={{ padding: 12, fontSize: 14, color: COLORS.textDark }}
                />
              </View>

              {/* Pincode */}
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: COLORS.textDark }}>Pincode *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 16 }}>
                <TextInput
                  value={newAddress.pincode}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setNewAddress(prev => ({ ...prev, pincode: numericText }));
                  }}
                  placeholder="6-digit pincode"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={6}
                  style={{ padding: 12, fontSize: 14, color: COLORS.textDark }}
                />
              </View>

              {/* Landmark */}
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: COLORS.textDark }}>Landmark</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 16 }}>
                <TextInput
                  value={newAddress.landmark}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, landmark: text }))}
                  placeholder="Near landmark (optional)"
                  placeholderTextColor="#9CA3AF"
                  style={{ padding: 12, fontSize: 14, color: COLORS.textDark }}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowAddAddressModal(false)}
                disabled={addingAddress}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddAddress}
                disabled={addingAddress}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                }}
              >
                {addingAddress ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.white }}>Add Address</Text>
                )}
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
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              alignItems: 'center',
            }}
          >
            {submittingPrescription ? (
              <>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Submitting your prescription...</Text>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: 'rgba(3, 77, 162, 0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <CheckCircleIconOutline width={40} height={40} color={COLORS.success} />
                </View>

                <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}>
                  Prescription Submitted Successfully!
                </Text>

                <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 20, textAlign: 'center', lineHeight: 20 }}>
                  Your prescription has been submitted for digitization. Our operations team will review it and create a cart with available lab vendors for you to choose from.
                </Text>

                <View
                  style={{
                    backgroundColor: 'rgba(3, 77, 162, 0.05)',
                    borderWidth: 1,
                    borderColor: COLORS.selectedBorder,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    width: '100%',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <ClockIcon width={20} height={20} color={COLORS.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary, marginBottom: 8 }}>
                        What happens next?
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textGray, lineHeight: 18 }}>
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
                    backgroundColor: COLORS.primary,
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
