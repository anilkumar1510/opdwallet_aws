import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
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
  warning: '#EAB308',
};

// ============================================================================
// TYPES
// ============================================================================

interface AHCPackage {
  id: string;
  name: string;
  totalLabTests?: number;
  totalDiagnosticTests?: number;
}

interface LabBooking {
  packageId?: string;
  vendorId: string;
  vendorName: string;
  collectionType: string;
  slotDate: string;
  slotTime: string;
  slotId: string;
  price: number;
  pricing?: any[];
  totalActualPrice?: number;
  totalDiscountedPrice: number;
  homeCollectionCharges: number;
  address?: {
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    pincode: string;
  };
}

interface DiagnosticVendor {
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

export default function AHCDiagnosticBookingPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null);
  const [labBooking, setLabBooking] = useState<LabBooking | null>(null);
  const [vendors, setVendors] = useState<DiagnosticVendor[]>([]);
  const [pincode, setPincode] = useState('');

  const [selectedVendor, setSelectedVendor] = useState<DiagnosticVendor | null>(null);

  // Slot selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step tracking
  const [step, setStep] = useState(1); // 1: Vendor, 2: Slot, 3: Summary

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
      // Get AHC package
      const packageData = await AsyncStorage.getItem('ahc_package');
      console.log('[AHCDiagnostic] Package from AsyncStorage:', packageData);
      if (packageData) {
        setAhcPackage(JSON.parse(packageData));
      } else {
        setError('Package information not found');
        setLoading(false);
        return;
      }

      // Get lab booking data (should exist from previous step)
      const labData = await AsyncStorage.getItem('ahc_booking_data');
      let userPincode = '';

      if (labData) {
        const labBookingData = JSON.parse(labData);
        setLabBooking(labBookingData);
        console.log('[AHCDiagnostic] Lab booking data:', labBookingData);

        // Get pincode from lab booking address
        if (labBookingData.address?.pincode) {
          userPincode = labBookingData.address.pincode;
          console.log('[AHCDiagnostic] Pincode from lab booking address:', userPincode);
        }
      }

      // If no pincode from lab booking, fetch from user profile
      if (!userPincode) {
        console.log('[AHCDiagnostic] Fetching user profile for pincode...');
        const userResponse = await apiClient.get('/auth/me');
        const userData = userResponse.data;

        if (userData.address?.pincode) {
          userPincode = userData.address.pincode;
        } else if (userData.pincode) {
          userPincode = userData.pincode;
        }
      }

      if (!userPincode) {
        setError('No pincode found. Please go back and select an address.');
        setLoading(false);
        return;
      }

      setPincode(userPincode);
      await fetchVendors(userPincode);
    } catch (err: any) {
      console.error('[AHCDiagnostic] Error loading data:', err);
      setError(err.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async (userPincode: string) => {
    try {
      console.log('[AHCDiagnostic] Fetching vendors for pincode:', userPincode);
      const response = await apiClient.get(`/member/ahc/vendors/diagnostic?pincode=${userPincode}`);
      console.log('[AHCDiagnostic] Vendors API response:', response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        setVendors(response.data.data);
      } else if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        setVendors(response.data.vendors);
      } else if (Array.isArray(response.data)) {
        setVendors(response.data);
      } else {
        console.log('[AHCDiagnostic] No vendors in response');
        setVendors([]);
      }
    } catch (err: any) {
      console.error('[AHCDiagnostic] Error fetching vendors:', err);
      setVendors([]);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedVendor || !selectedDate || !pincode) return;

    setLoadingSlots(true);
    try {
      console.log('[AHCDiagnostic] Fetching slots for vendor:', selectedVendor.vendorId, 'date:', selectedDate);
      const response = await apiClient.get(
        `/member/diagnostics/vendors/${selectedVendor.vendorId}/slots?pincode=${pincode}&date=${selectedDate}`
      );
      console.log('[AHCDiagnostic] Slots API response:', response.data);
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('[AHCDiagnostic] Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleVendorSelect = (vendor: DiagnosticVendor) => {
    setSelectedVendor(vendor);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleContinue = async () => {
    if (!selectedVendor || !selectedSlot) {
      return;
    }

    const diagnosticBookingData = {
      vendorId: selectedVendor.vendorId,
      vendorName: selectedVendor.name,
      collectionType: 'CENTER_VISIT', // Diagnostics always center visit
      slotDate: selectedDate,
      slotTime: selectedSlot.timeSlot,
      slotId: selectedSlot.slotId,
      price: selectedVendor.totalDiscountedPrice, // For payment page compatibility
      pricing: selectedVendor.pricing,
      totalActualPrice: selectedVendor.totalActualPrice,
      totalDiscountedPrice: selectedVendor.totalDiscountedPrice,
      homeCollectionCharges: 0,
    };

    console.log('[AHCDiagnostic] Storing diagnostic booking data:', diagnosticBookingData);
    await AsyncStorage.setItem('ahc_diagnostic_booking', JSON.stringify(diagnosticBookingData));

    router.push('/member/ahc/booking/payment');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

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
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Book Diagnostic Tests</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Select center and time slot</Text>
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
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Book Diagnostic Tests</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Select center and time slot</Text>
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
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Book Diagnostic Tests</Text>
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
            <Text style={{ fontSize: 12, color: step >= 1 ? COLORS.primary : '#9CA3AF' }}>Center</Text>
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
          {/* Lab Booking Summary */}
          {labBooking && (
            <View
              style={{
                backgroundColor: 'rgba(3, 77, 162, 0.05)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.selectedBorder,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' }}>
                  <CheckCircleIcon width={16} height={16} color="#FFF" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>Lab Tests Booked</Text>
              </View>
              <Text style={{ fontSize: 13, color: COLORS.textDark, marginBottom: 4 }}>
                {labBooking.vendorName} • {formatDate(labBooking.slotDate)} • {labBooking.slotTime}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                {labBooking.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
              </Text>
            </View>
          )}

          {/* Info Note */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.textGray, lineHeight: 18 }}>
              <Text style={{ fontWeight: '600', color: COLORS.textDark }}>Note: </Text>
              Diagnostic tests require a center visit. Home collection is not available.
            </Text>
          </View>

          {/* STEP 1: Vendor Selection */}
          {step === 1 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 12 }}>Select Diagnostic Center ({vendors.length})</Text>

              {vendors.length === 0 ? (
                <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>No diagnostic centers available in your area for pincode {pincode}</Text>
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

                      {/* Center Visit Badge */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(3, 77, 162, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 12 }}>
                        <BuildingOfficeIcon width={14} height={14} color={COLORS.primary} />
                        <Text style={{ fontSize: 12, color: COLORS.primary }}>Center Visit Only</Text>
                      </View>

                      {/* Select Button */}
                      <TouchableOpacity
                        onPress={() => handleVendorSelect(vendor)}
                        style={{ backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>Select This Center</Text>
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
                <Text style={{ fontSize: 13, color: COLORS.primary }}>← Change Center</Text>
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
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>Diagnostic Booking Summary</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Center:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>{selectedVendor.name}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Visit Type:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>Center Visit</Text>
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

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark }}>Total Amount:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>₹{selectedVendor.totalDiscountedPrice}</Text>
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleContinue}
                style={{ backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Proceed to Payment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
