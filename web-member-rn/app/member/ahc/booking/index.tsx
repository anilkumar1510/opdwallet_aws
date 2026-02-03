import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  HomeIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  PlusIcon,
} from '../../../../src/components/icons/InlineSVGs';
import apiClient from '../../../../src/lib/api/client';

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

interface AHCPackage {
  id: string;
  name: string;
  description?: string;
  tests?: Array<{ name: string }>;
  totalTests?: number;
  totalLabTests?: number;
  totalDiagnosticTests?: number;
}

interface Address {
  _id: string;
  addressId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

interface Vendor {
  _id: string;
  vendorId: string;
  name: string;
  code: string;
  homeCollection: boolean;
  centerVisit: boolean;
  homeCollectionCharges: number;
  totalActualPrice: number;
  totalDiscountedPrice: number;
  totalWithHomeCollection: number;
  pricing: Array<{
    serviceId: string;
    serviceName: string;
    serviceCode: string;
    actualPrice: number;
    discountedPrice: number;
  }>;
}

interface TimeSlot {
  slotId: string;
  date: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  maxBookings: number;
  currentBookings: number;
  isActive: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AHCBookingPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Add Address Modal state
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

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [collectionType, setCollectionType] = useState<'HOME_COLLECTION' | 'CENTER_VISIT'>('CENTER_VISIT');

  // Slot selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step tracking
  const [step, setStep] = useState(1); // 1: Vendor, 2: Slot, 3: Summary

  // Get selected address
  const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
  const pincode = selectedAddress?.pincode || '';

  // Generate next 7 days for date selection
  const getDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: date.getDate(),
      });
    }
    return dates;
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadInitialData();
    fetchAddresses();
    // Set today's date as default
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedVendor && selectedDate && pincode) {
      fetchAvailableSlots();
    }
  }, [selectedVendor, selectedDate, pincode]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const packageData = await AsyncStorage.getItem('ahc_package');
      console.log('[AHCBooking] Package from AsyncStorage:', packageData);
      if (packageData) {
        setAhcPackage(JSON.parse(packageData));
      }
    } catch (err: any) {
      console.error('[AHCBooking] Error loading data:', err);
      setError(err.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await apiClient.get('/member/addresses');
      console.log('[AHCBooking] Addresses response:', response.data);

      if (response.data?.success && Array.isArray(response.data.data)) {
        setAddresses(response.data.data);

        // Auto-select default address
        const defaultAddress = response.data.data.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
          await fetchVendors(defaultAddress.pincode);
        }
      }
    } catch (error) {
      console.error('[AHCBooking] Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchVendors = async (userPincode: string) => {
    try {
      console.log('[AHCBooking] Fetching vendors for pincode:', userPincode);
      const response = await apiClient.get(`/member/ahc/vendors/lab?pincode=${userPincode}`);
      console.log('[AHCBooking] Vendors API response:', response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        setVendors(response.data.data);
        console.log('[AHCBooking] Found vendors:', response.data.data.length);
      } else if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        setVendors(response.data.vendors);
      } else if (Array.isArray(response.data)) {
        setVendors(response.data);
      } else {
        console.log('[AHCBooking] No vendors in response');
        setVendors([]);
      }
    } catch (err: any) {
      console.error('[AHCBooking] Error fetching vendors:', err);
      setVendors([]);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedVendor || !selectedDate || !pincode) return;

    setLoadingSlots(true);
    try {
      console.log('[AHCBooking] Fetching slots for vendor:', selectedVendor.vendorId, 'date:', selectedDate);
      const response = await apiClient.get(
        `/member/lab/vendors/${selectedVendor.vendorId}/slots?pincode=${pincode}&date=${selectedDate}`
      );
      console.log('[AHCBooking] Slots API response:', response.data);
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('[AHCBooking] Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

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

      if (response.data?.success) {
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

        if (response.data.data?._id) {
          setSelectedAddressId(response.data.data._id);
          await fetchVendors(response.data.data.pincode);
        }

        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error: any) {
      console.error('[AHCBooking] Error adding address:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleAddressSelect = async (address: Address) => {
    setSelectedAddressId(address._id);
    setShowAddressDropdown(false);
    setSelectedVendor(null);
    setSelectedSlot(null);
    setStep(1);
    await fetchVendors(address.pincode);
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSelectedSlot(null);
    // Set default collection type based on vendor options
    if (vendor.centerVisit) {
      setCollectionType('CENTER_VISIT');
    } else if (vendor.homeCollection) {
      setCollectionType('HOME_COLLECTION');
    }
    setStep(2);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const getTotalAmount = () => {
    if (!selectedVendor) return 0;
    const basePrice = selectedVendor.totalDiscountedPrice;
    const homeCollectionCharge =
      collectionType === 'HOME_COLLECTION' ? (selectedVendor.homeCollectionCharges || 0) : 0;
    return basePrice + homeCollectionCharge;
  };

  const handleContinue = async () => {
    if (!selectedVendor || !selectedSlot || !selectedAddress) {
      return;
    }

    const bookingData = {
      packageId: ahcPackage?.id,
      vendorId: selectedVendor.vendorId,
      vendorName: selectedVendor.name,
      collectionType,
      slotDate: selectedDate,
      slotTime: selectedSlot.timeSlot,
      slotId: selectedSlot.slotId,
      price: getTotalAmount(),
      pricing: selectedVendor.pricing,
      totalActualPrice: selectedVendor.totalActualPrice,
      totalDiscountedPrice: selectedVendor.totalDiscountedPrice,
      homeCollectionCharges: collectionType === 'HOME_COLLECTION' ? selectedVendor.homeCollectionCharges : 0,
      // Store address in backend DTO format (fullName and phone will be added in payment page)
      address: {
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2 || '',
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city,
        state: selectedAddress.state || '',
        pincode: selectedAddress.pincode,
      },
    };

    await AsyncStorage.setItem('ahc_booking_data', JSON.stringify(bookingData));

    // Navigate to diagnostic booking or payment
    if (ahcPackage?.totalDiagnosticTests && ahcPackage.totalDiagnosticTests > 0) {
      router.push('/member/ahc/booking/diagnostic');
    } else {
      router.push('/member/ahc/booking/payment');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    if (pincode) {
      await fetchVendors(pincode);
    }
    setRefreshing(false);
  }, [pincode]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const dateOptions = getDateOptions();

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            ...Platform.select({
              web: { position: 'sticky' as any, top: 0, zIndex: 10 },
            }),
          }}
        >
          <SafeAreaView edges={['top']}>
            <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 12 }} activeOpacity={0.7}>
                  <ArrowLeftIcon width={20} height={20} color="#374151" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Book Lab Tests</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Select vendor and time slot</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, fontSize: 14, color: COLORS.textGray }}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            ...Platform.select({
              web: { position: 'sticky' as any, top: 0, zIndex: 10 },
            }),
          }}
        >
          <SafeAreaView edges={['top']}>
            <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 12 }} activeOpacity={0.7}>
                  <ArrowLeftIcon width={20} height={20} color="#374151" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Book Lab Tests</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Select vendor and time slot</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, color: COLORS.error, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity
            onPress={loadInitialData}
            style={{ backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          ...Platform.select({
            web: { position: 'sticky' as any, top: 0, zIndex: 10 },
          }),
        }}
      >
        <SafeAreaView edges={['top']}>
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 12 }} activeOpacity={0.7}>
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Book Lab Tests</Text>
                {ahcPackage && <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>{ahcPackage.name}</Text>}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Progress Steps */}
      <View style={{ backgroundColor: COLORS.white, paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', maxWidth: 320, marginHorizontal: 'auto' }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: step >= 1 ? COLORS.primary : '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 1 ? '#FFF' : '#9CA3AF' }}>1</Text>
            </View>
            <Text style={{ fontSize: 12, color: step >= 1 ? COLORS.primary : '#9CA3AF' }}>Vendor</Text>
          </View>
          <View style={{ flex: 1, height: 4, backgroundColor: step >= 2 ? COLORS.primary : '#E5E7EB', marginHorizontal: 8, marginBottom: 20 }} />
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: step >= 2 ? COLORS.primary : '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 2 ? '#FFF' : '#9CA3AF' }}>2</Text>
            </View>
            <Text style={{ fontSize: 12, color: step >= 2 ? COLORS.primary : '#9CA3AF' }}>Slot</Text>
          </View>
          <View style={{ flex: 1, height: 4, backgroundColor: step >= 3 ? COLORS.primary : '#E5E7EB', marginHorizontal: 8, marginBottom: 20 }} />
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: step >= 3 ? COLORS.primary : '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 3 ? '#FFF' : '#9CA3AF' }}>3</Text>
            </View>
            <Text style={{ fontSize: 12, color: step >= 3 ? COLORS.primary : '#9CA3AF' }}>Confirm</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* Address Selection */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 12 }}>Collection Address</Text>

            {loadingAddresses ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Loading addresses...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowAddressDropdown(!showAddressDropdown)}
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 2,
                    borderColor: COLORS.selectedBorder,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <MapPinIcon width={20} height={20} color={COLORS.primary} />
                    <Text style={{ fontSize: 14, color: selectedAddress ? COLORS.textDark : '#999', flex: 1 }} numberOfLines={1}>
                      {selectedAddress
                        ? `${selectedAddress.addressLine1}, ${selectedAddress.city} - ${selectedAddress.pincode}`
                        : 'Select an address'}
                    </Text>
                  </View>
                  <ChevronDownIcon width={20} height={20} color="#666" />
                </TouchableOpacity>

                {showAddressDropdown && (
                  <View style={{ backgroundColor: COLORS.white, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: COLORS.border, elevation: 3 }}>
                    {addresses.length === 0 ? (
                      <View style={{ padding: 16, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: '#999' }}>No addresses found</Text>
                      </View>
                    ) : (
                      addresses.map((address) => (
                        <TouchableOpacity
                          key={address._id}
                          onPress={() => handleAddressSelect(address)}
                          style={{
                            padding: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6',
                            backgroundColor: selectedAddressId === address._id ? 'rgba(3, 77, 162, 0.05)' : COLORS.white,
                          }}
                        >
                          <Text style={{ fontSize: 14, color: COLORS.textDark }}>
                            {address.addressLine1}, {address.city} - {address.pincode}
                            {address.isDefault && ' (Default)'}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setShowAddAddressModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 12, gap: 8 }}
                >
                  <PlusIcon width={18} height={18} color={COLORS.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>Add New Address</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* STEP 1: Vendor Selection */}
          {step === 1 && selectedAddress && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 12 }}>Select Lab Vendor ({vendors.length})</Text>

              {vendors.length === 0 ? (
                <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>No vendors available in your area for pincode {pincode}</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {vendors.map((vendor) => (
                    <View
                      key={vendor._id}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: COLORS.cardBorder,
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      {/* Vendor Header */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary, marginBottom: 4 }}>{vendor.name}</Text>
                          <View style={{ backgroundColor: 'rgba(3, 77, 162, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' }}>
                            <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.primary }}>{vendor.code}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>₹{vendor.totalDiscountedPrice}</Text>
                          {vendor.totalActualPrice > vendor.totalDiscountedPrice && (
                            <Text style={{ fontSize: 13, color: '#999', textDecorationLine: 'line-through' }}>₹{vendor.totalActualPrice}</Text>
                          )}
                        </View>
                      </View>

                      {/* Test Pricing Breakdown */}
                      {vendor.pricing && vendor.pricing.length > 0 && (
                        <View style={{ borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textGray, marginBottom: 8 }}>Test Pricing:</Text>
                          {vendor.pricing.map((item, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ fontSize: 12, color: COLORS.textGray, flex: 1 }}>{item.serviceName}</Text>
                              <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textDark }}>₹{item.discountedPrice}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Collection Options */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {vendor.homeCollection && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(3, 77, 162, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                            <HomeIcon width={14} height={14} color={COLORS.primary} />
                            <Text style={{ fontSize: 12, color: COLORS.primary }}>Home Collection</Text>
                            {vendor.homeCollectionCharges > 0 && (
                              <Text style={{ fontSize: 11, color: COLORS.textGray }}>(+₹{vendor.homeCollectionCharges})</Text>
                            )}
                          </View>
                        )}
                        {vendor.centerVisit && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(3, 77, 162, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                            <BuildingOfficeIcon width={14} height={14} color={COLORS.primary} />
                            <Text style={{ fontSize: 12, color: COLORS.primary }}>Center Visit</Text>
                          </View>
                        )}
                      </View>

                      {/* Select Button */}
                      <TouchableOpacity
                        onPress={() => handleVendorSelect(vendor)}
                        style={{ backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>Select This Vendor</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* STEP 2: Slot Selection */}
          {step === 2 && selectedVendor && (
            <View style={{ marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setStep(1)} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: COLORS.primary }}>← Change Vendor</Text>
              </TouchableOpacity>

              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>Selected: {selectedVendor.name}</Text>

                {/* Collection Type */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textGray, marginBottom: 12 }}>Collection Type</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {selectedVendor.centerVisit && (
                      <TouchableOpacity
                        onPress={() => setCollectionType('CENTER_VISIT')}
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: collectionType === 'CENTER_VISIT' ? COLORS.selectedBorder : COLORS.border,
                          backgroundColor: collectionType === 'CENTER_VISIT' ? 'rgba(3, 77, 162, 0.05)' : COLORS.white,
                          alignItems: 'center',
                        }}
                      >
                        <BuildingOfficeIcon width={28} height={28} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginTop: 8 }}>Lab Visit</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 2 }}>Visit lab for sample</Text>
                      </TouchableOpacity>
                    )}
                    {selectedVendor.homeCollection && (
                      <TouchableOpacity
                        onPress={() => setCollectionType('HOME_COLLECTION')}
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: collectionType === 'HOME_COLLECTION' ? COLORS.selectedBorder : COLORS.border,
                          backgroundColor: collectionType === 'HOME_COLLECTION' ? 'rgba(3, 77, 162, 0.05)' : COLORS.white,
                          alignItems: 'center',
                        }}
                      >
                        <HomeIcon width={28} height={28} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginTop: 8 }}>Home Collection</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textGray, marginTop: 2 }}>+₹{selectedVendor.homeCollectionCharges || 0}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Date Selection */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textGray, marginBottom: 12 }}>Select Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {dateOptions.map((date) => (
                        <TouchableOpacity
                          key={date.value}
                          onPress={() => {
                            setSelectedDate(date.value);
                            setSelectedSlot(null);
                          }}
                          style={{
                            width: 70,
                            paddingVertical: 12,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: selectedDate === date.value ? COLORS.selectedBorder : COLORS.border,
                            backgroundColor: selectedDate === date.value ? 'rgba(3, 77, 162, 0.05)' : COLORS.white,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 11, color: selectedDate === date.value ? COLORS.primary : COLORS.textGray }}>{date.day}</Text>
                          <Text style={{ fontSize: 18, fontWeight: '600', color: selectedDate === date.value ? COLORS.primary : COLORS.textDark, marginVertical: 2 }}>{date.dateNum}</Text>
                          {date.label === 'Today' && <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '500' }}>Today</Text>}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Time Slots */}
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textGray, marginBottom: 12 }}>Select Time Slot</Text>
                  {loadingSlots ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 }}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={{ fontSize: 14, color: COLORS.textGray }}>Loading slots...</Text>
                    </View>
                  ) : availableSlots.length === 0 ? (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#999' }}>No slots available for this date</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {availableSlots.map((slot) => {
                        const isAvailable = slot.currentBookings < slot.maxBookings;
                        const slotsRemaining = slot.maxBookings - slot.currentBookings;
                        const isSelected = selectedSlot?.slotId === slot.slotId;

                        return (
                          <TouchableOpacity
                            key={slot.slotId}
                            onPress={() => isAvailable && handleSlotSelect(slot)}
                            disabled={!isAvailable}
                            style={{
                              width: '48%',
                              padding: 12,
                              borderRadius: 8,
                              borderWidth: 2,
                              borderColor: isSelected ? COLORS.selectedBorder : COLORS.border,
                              backgroundColor: isSelected ? COLORS.primary : !isAvailable ? '#F9FAFB' : COLORS.white,
                              opacity: !isAvailable ? 0.6 : 1,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <ClockIcon width={16} height={16} color={isSelected ? '#FFF' : COLORS.primary} />
                              <Text style={{ fontSize: 13, fontWeight: '500', color: isSelected ? '#FFF' : COLORS.textDark }}>{slot.timeSlot}</Text>
                            </View>
                            <Text style={{ fontSize: 11, textAlign: 'center', marginTop: 4, color: isSelected ? 'rgba(255,255,255,0.9)' : !isAvailable ? COLORS.error : COLORS.textGray }}>
                              {isAvailable ? `${slotsRemaining} slots available` : 'Fully booked'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: Booking Summary */}
          {step === 3 && selectedVendor && selectedSlot && (
            <View style={{ marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setStep(2)} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: COLORS.primary }}>← Change Slot</Text>
              </TouchableOpacity>

              {/* Summary Card */}
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.08,
                  shadowRadius: 23,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>Booking Summary</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Vendor:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>{selectedVendor.name}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Collection Type:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                    {collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Date:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>{formatDate(selectedDate)}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Time:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>{selectedSlot.timeSlot}</Text>
                </View>

                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Test Amount:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹{selectedVendor.totalDiscountedPrice}</Text>
                </View>

                {collectionType === 'HOME_COLLECTION' && selectedVendor.homeCollectionCharges > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Home Collection:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹{selectedVendor.homeCollectionCharges}</Text>
                  </View>
                )}

                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark }}>Total Amount:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>₹{getTotalAmount()}</Text>
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleContinue}
                style={{ backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                  {ahcPackage?.totalDiagnosticTests && ahcPackage.totalDiagnosticTests > 0
                    ? 'Continue to Diagnostic Booking'
                    : 'Proceed to Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddAddressModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textDark }}>Add New Address</Text>
              <TouchableOpacity onPress={() => setShowAddAddressModal(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, color: '#666', lineHeight: 28 }}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              {/* Address Type */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>Address Type</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setNewAddress(prev => ({ ...prev, addressType: type }))}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: newAddress.addressType === type ? COLORS.primary : COLORS.border,
                        backgroundColor: newAddress.addressType === type ? 'rgba(3, 77, 162, 0.1)' : COLORS.white,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: newAddress.addressType === type ? COLORS.primary : COLORS.textGray, fontWeight: newAddress.addressType === type ? '500' : '400' }}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Address Line 1 */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>
                  Address Line 1 <Text style={{ color: COLORS.error }}>*</Text>
                </Text>
                <TextInput
                  value={newAddress.addressLine1}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine1: text }))}
                  placeholder="House/Flat no., Building name"
                  placeholderTextColor="#999"
                  style={{ backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border }}
                  editable={!addingAddress}
                />
              </View>

              {/* Address Line 2 */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>Address Line 2 (Optional)</Text>
                <TextInput
                  value={newAddress.addressLine2}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine2: text }))}
                  placeholder="Street, Area"
                  placeholderTextColor="#999"
                  style={{ backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border }}
                  editable={!addingAddress}
                />
              </View>

              {/* City and State */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>
                    City <Text style={{ color: COLORS.error }}>*</Text>
                  </Text>
                  <TextInput
                    value={newAddress.city}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                    placeholder="City"
                    placeholderTextColor="#999"
                    style={{ backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border }}
                    editable={!addingAddress}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>
                    State <Text style={{ color: COLORS.error }}>*</Text>
                  </Text>
                  <TextInput
                    value={newAddress.state}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, state: text }))}
                    placeholder="State"
                    placeholderTextColor="#999"
                    style={{ backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border }}
                    editable={!addingAddress}
                  />
                </View>
              </View>

              {/* Pincode and Landmark */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>
                    Pincode <Text style={{ color: COLORS.error }}>*</Text>
                  </Text>
                  <TextInput
                    value={newAddress.pincode}
                    onChangeText={(text) => {
                      const numericText = text.replace(/\D/g, '').slice(0, 6);
                      setNewAddress(prev => ({ ...prev, pincode: numericText }));
                    }}
                    placeholder="6-digit pincode"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={6}
                    style={{ backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border }}
                    editable={!addingAddress}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 8 }}>Landmark (Optional)</Text>
                  <TextInput
                    value={newAddress.landmark}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, landmark: text }))}
                    placeholder="Nearby landmark"
                    placeholderTextColor="#999"
                    style={{ backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border }}
                    editable={!addingAddress}
                  />
                </View>
              </View>

              {/* Set as Default */}
              <TouchableOpacity
                onPress={() => setNewAddress(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 }}
                disabled={addingAddress}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: newAddress.isDefault ? COLORS.primary : COLORS.border,
                    backgroundColor: newAddress.isDefault ? COLORS.primary : COLORS.white,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {newAddress.isDefault && <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={{ fontSize: 14, color: COLORS.textDark }}>Set as default address</Text>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAddAddress}
                disabled={addingAddress}
                style={{ backgroundColor: addingAddress ? '#CCC' : COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
              >
                {addingAddress ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Add Address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
