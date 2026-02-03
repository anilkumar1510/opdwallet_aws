import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  HomeIcon,
  BuildingOfficeIcon,
  WalletIcon,
  DocumentTextIcon,
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
  warning: '#F97316',
};

// ============================================================================
// CUSTOM ICONS - Stroke-based to match home page
// ============================================================================

function CheckCircleIconOutline({ size = 24, color = COLORS.success }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BanknotesIconOutline({ size = 24, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
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

interface DiagnosticCart {
  _id: string;
  cartId: string;
  userId: string;
  patientId: string;
  patientName: string;
  prescriptionId: string;
  items: Array<{
    serviceId: string;
    serviceName: string;
    serviceCode: string;
  }>;
  selectedVendorIds: string[];
  pincode: string;
  status: string;
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

interface PaymentBreakdown {
  billAmount: number;
  serviceTransactionLimit?: number;
  insuranceEligibleAmount: number;
  insurancePayment: number;
  copayPercentage?: number;
  copayAmount: number;
  excessAmount: number;
  walletDebitAmount: number;
  totalMemberPayment: number;
  categoryCode?: string;
  categoryBalance?: number;
}

// ============================================================================
// ICON CIRCLE COMPONENT
// ============================================================================

interface IconCircleProps {
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  size?: 'sm' | 'md' | 'lg';
}

const IconCircle: React.FC<IconCircleProps> = ({ icon: Icon, size = 'md' }) => {
  const sizeMap = {
    sm: { container: 40, icon: 20 },
    md: { container: 48, icon: 24 },
    lg: { container: 64, icon: 32 },
  };

  const dimensions = sizeMap[size];

  return (
    <View
      style={{
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(3, 77, 162, 0.1)',
      }}
    >
      <Icon width={dimensions.icon} height={dimensions.icon} color={COLORS.primary} />
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DiagnosticBookingPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartId = params.cartId as string;

  // State
  const [cart, setCart] = useState<DiagnosticCart | null>(null);
  const [vendors, setVendors] = useState<DiagnosticVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<DiagnosticVendor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [collectionType, setCollectionType] = useState<'IN_CLINIC' | 'HOME_COLLECTION'>('IN_CLINIC');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Vendor, 2: Slot, 3: Payment
  const [userId, setUserId] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchCartAndVendors();
    fetchUser();
  }, [cartId]);

  useEffect(() => {
    if (selectedVendor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedVendor, selectedDate]);

  useEffect(() => {
    const validateBooking = async () => {
      if (!userId || !selectedVendor || !selectedSlot || !cart || step !== 3) {
        return;
      }

      setValidating(true);
      setValidationResult(null);

      try {
        console.log('[DiagnosticBooking] Validating order...');
        const response = await apiClient.post('/member/diagnostics/orders/validate', {
          patientId: userId,
          vendorId: selectedVendor.vendorId,
          cartId: cart.cartId,
          slotId: selectedSlot.slotId,
          totalAmount: getTotalAmount(),
        });

        console.log('[DiagnosticBooking] Validation result:', response.data);
        setValidationResult(response.data);
      } catch (error: any) {
        console.error('[DiagnosticBooking] Validation error:', error);
        showAlert('Error', error.response?.data?.message || 'Failed to validate order');
      } finally {
        setValidating(false);
      }
    };

    validateBooking();
  }, [step, userId, selectedVendor, selectedSlot, cart]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchCartAndVendors = async () => {
    try {
      setLoading(true);

      // Fetch cart details
      const cartResponse = await apiClient.get(`/member/diagnostics/carts/${cartId}`);
      setCart(cartResponse.data.data);

      // Fetch assigned vendors for this cart
      const vendorsResponse = await apiClient.get(`/member/diagnostics/carts/${cartId}/vendors`);
      setVendors(vendorsResponse.data.data || []);

      // Set today's date as default
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    } catch (error) {
      console.error('[DiagnosticBooking] Error fetching data:', error);
      showAlert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUserId(response.data._id);

      // Fetch wallet balance
      try {
        const walletResponse = await apiClient.get(`/wallet/balance?userId=${response.data._id}`);
        setWalletBalance(walletResponse.data.totalBalance?.current || 0);
      } catch (walletErr) {
        console.warn('[DiagnosticBooking] Could not fetch wallet:', walletErr);
      }
    } catch (error) {
      console.error('[DiagnosticBooking] Error fetching user:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedVendor || !selectedDate || !cart?.pincode) return;

    try {
      const response = await apiClient.get(
        `/member/diagnostics/vendors/${selectedVendor.vendorId}/slots?pincode=${cart.pincode}&date=${selectedDate}`
      );
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('[DiagnosticBooking] Error fetching slots:', error);
      showAlert('Error', 'Failed to load available slots');
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getTotalAmount = () => {
    if (!selectedVendor) return 0;
    const basePrice = selectedVendor.totalDiscountedPrice;
    const homeCollectionCharge =
      collectionType === 'HOME_COLLECTION' ? (selectedVendor.homeCollectionCharges || 100) : 0;
    return basePrice + homeCollectionCharge;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

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

  const handleConfirmBooking = async () => {
    if (!cart || !selectedVendor || !selectedSlot || !userId) {
      showAlert('Error', 'Missing booking details');
      return;
    }

    const breakdown = validationResult?.breakdown as PaymentBreakdown | undefined;
    const totalMemberPayment = breakdown?.totalMemberPayment || 0;
    const isFullyCovered = totalMemberPayment === 0;

    setProcessing(true);

    try {
      // CASE 1: Fully covered by wallet/insurance - process directly
      if (isFullyCovered) {
        console.log('[DiagnosticBooking] Fully covered by wallet - creating order directly...');
        const bookingData = {
          cartId: cart.cartId,
          vendorId: selectedVendor.vendorId,
          slotId: selectedSlot.slotId,
          collectionType,
          appointmentDate: selectedDate,
          timeSlot: selectedSlot.timeSlot,
        };

        const response = await apiClient.post('/member/diagnostics/orders', bookingData);
        console.log('[DiagnosticBooking] Order created:', response.data);

        setOrderId(response.data.data.orderId);
        setBookingSuccess(true);
        return;
      }

      // CASE 2: User needs to pay copay/excess - redirect to payment gateway
      console.log('[DiagnosticBooking] User needs to pay:', totalMemberPayment);

      // Create pending payment via API
      const paymentData = {
        amount: totalMemberPayment,
        paymentType: (breakdown?.copayAmount || 0) > 0 ? 'COPAY' : 'OUT_OF_POCKET',
        serviceType: 'DIAGNOSTIC',
        serviceReferenceId: cart.cartId,
        description: `Diagnostic Services: ${cart.items.map(i => i.serviceName).join(', ')} from ${selectedVendor.name}`,
        userId: userId,
        patientId: cart.patientId,
        metadata: {
          cartId: cart.cartId,
          vendorId: selectedVendor.vendorId,
          vendorName: selectedVendor.name,
          slotId: selectedSlot.slotId,
          appointmentDate: selectedDate,
          appointmentTime: selectedSlot.timeSlot,
          collectionType,
          consultationFee: getTotalAmount(),
          walletCoverage: breakdown?.walletDebitAmount || 0,
          copayAmount: breakdown?.copayAmount || 0,
          excessAmount: breakdown?.excessAmount || 0,
          serviceTransactionLimit: breakdown?.serviceTransactionLimit || 0,
          insurancePayment: breakdown?.insurancePayment || 0,
        },
      };

      console.log('[DiagnosticBooking] Creating pending payment:', paymentData);

      const paymentResponse = await apiClient.post('/payments', paymentData);
      const paymentId = paymentResponse.data.paymentId || paymentResponse.data._id;
      console.log('[DiagnosticBooking] Pending payment created:', paymentId);

      // Store booking data in AsyncStorage for completion after payment
      const pendingBookingData = {
        serviceType: 'DIAGNOSTIC',
        serviceDetails: {
          cartId: cart.cartId,
          vendorId: selectedVendor.vendorId,
          vendorName: selectedVendor.name,
          slotId: selectedSlot.slotId,
          date: selectedDate,
          time: selectedSlot.timeSlot,
          collectionType,
        },
        patientId: cart.patientId,
        patientName: cart.patientName,
        userId: userId,
        consultationFee: getTotalAmount(),
        walletCoverage: breakdown?.walletDebitAmount || 0,
        copayAmount: breakdown?.copayAmount || 0,
        excessAmount: breakdown?.excessAmount || 0,
        serviceTransactionLimit: breakdown?.serviceTransactionLimit || 0,
        insurancePayment: breakdown?.insurancePayment || 0,
        paymentId: paymentId,
      };

      console.log('[DiagnosticBooking] Storing pending booking in AsyncStorage:', pendingBookingData);
      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBookingData));

      // Redirect to payment gateway
      const redirectUrl = '/member/bookings?tab=diagnostic';
      console.log('[DiagnosticBooking] Redirecting to payment gateway:', paymentId);
      router.push(`/member/payments/${paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
    } catch (error: any) {
      console.error('[DiagnosticBooking] Error creating order:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to create booking');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ============================================================================
  // CART NOT FOUND
  // ============================================================================

  if (!cart) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 16 }}>Cart not found</Text>
        <TouchableOpacity
          onPress={() => router.push('/member/diagnostics' as any)}
          activeOpacity={0.8}
          style={{
            backgroundColor: COLORS.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================================
  // SUCCESS SCREEN
  // ============================================================================

  if (bookingSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ maxWidth: 480, width: '100%' }}>
          <View
            style={{
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              backgroundColor: COLORS.white,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.08,
              shadowRadius: 23,
              elevation: 3,
            }}
          >
            {/* Success Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: COLORS.success,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <CheckCircleIconOutline size={40} color={COLORS.white} />
            </View>

            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}>
              Booking Confirmed!
            </Text>

            <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 4, textAlign: 'center' }}>
              Order ID: {orderId}
            </Text>

            <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, textAlign: 'center' }}>
              {formatDate(selectedDate)} at {selectedSlot?.timeSlot}
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/member/bookings?tab=diagnostic' as any)}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: COLORS.success,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>View Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MAIN UI
  // ============================================================================

  const dateOptions = getDateOptions();

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
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 12 }} activeOpacity={0.7}>
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Book Diagnostic</Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Cart ID: {cart.cartId}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ===== PROGRESS STEPS ===== */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.selectedBorder,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', maxWidth: 320, marginHorizontal: 'auto', width: '100%' }}>
          {/* Step 1 */}
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
                backgroundColor: step >= 1 ? COLORS.primary : '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 1 ? COLORS.white : '#9ca3af' }}>1</Text>
            </View>
            <Text style={{ fontSize: 12, color: step >= 1 ? COLORS.primary : '#9ca3af' }}>Vendor</Text>
          </View>

          {/* Line 1-2 */}
          <View style={{ flex: 1, height: 4, backgroundColor: step >= 2 ? COLORS.primary : '#e5e7eb', marginHorizontal: 8, marginBottom: 20 }} />

          {/* Step 2 */}
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
                backgroundColor: step >= 2 ? COLORS.primary : '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 2 ? COLORS.white : '#9ca3af' }}>2</Text>
            </View>
            <Text style={{ fontSize: 12, color: step >= 2 ? COLORS.primary : '#9ca3af' }}>Slot</Text>
          </View>

          {/* Line 2-3 */}
          <View style={{ flex: 1, height: 4, backgroundColor: step >= 3 ? COLORS.primary : '#e5e7eb', marginHorizontal: 8, marginBottom: 20 }} />

          {/* Step 3 */}
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
                backgroundColor: step >= 3 ? COLORS.primary : '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 3 ? COLORS.white : '#9ca3af' }}>3</Text>
            </View>
            <Text style={{ fontSize: 12, color: step >= 3 ? COLORS.primary : '#9ca3af' }}>Payment</Text>
          </View>
        </View>
      </View>

      {/* ===== CONTENT ===== */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 16 }}>
          {/* ===== SERVICES IN CART CARD ===== */}
          <View
            style={{
              borderRadius: 16,
              padding: 16,
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 12 }}>Services in Cart</Text>
            <View style={{ gap: 8 }}>
              {cart.items.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <DocumentTextIcon width={16} height={16} color={COLORS.primary} />
                  <Text style={{ fontSize: 13, color: '#374151' }}>{item.serviceName}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ===== STEP 1: VENDOR SELECTION ===== */}
          {step === 1 && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.primary }}>Select Diagnostic Center</Text>

              {vendors.length === 0 ? (
                <View
                  style={{
                    borderRadius: 16,
                    padding: 32,
                    borderWidth: 1,
                    borderColor: COLORS.cardBorder,
                    backgroundColor: COLORS.white,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: -2, height: 11 },
                    shadowOpacity: 0.08,
                    shadowRadius: 23,
                    elevation: 3,
                  }}
                >
                  <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
                    No vendors assigned yet. Please wait for operations team to assign vendors.
                  </Text>
                </View>
              ) : (
                vendors.map((vendor) => (
                  <View
                    key={vendor._id}
                    style={{
                      borderRadius: 16,
                      padding: 16,
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
                    {/* Vendor Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>{vendor.name}</Text>
                        <View
                          style={{
                            marginTop: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: 'rgba(3, 77, 162, 0.1)',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.primary }}>{vendor.code}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                          ₹{vendor.totalDiscountedPrice}
                        </Text>
                        <Text style={{ fontSize: 11, color: COLORS.textGray }}>Total</Text>
                      </View>
                    </View>

                    {/* Service Pricing */}
                    <View style={{ borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Service Pricing:</Text>
                      {vendor.pricing.map((item, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, color: COLORS.textGray }}>{item.serviceName}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.primary }}>₹{item.discountedPrice}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Select Button */}
                    <TouchableOpacity
                      onPress={() => handleVendorSelect(vendor)}
                      activeOpacity={0.8}
                      style={{
                        marginTop: 12,
                        backgroundColor: COLORS.primary,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>Select This Center</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ===== STEP 2: SLOT SELECTION ===== */}
          {step === 2 && selectedVendor && (
            <View style={{ gap: 16 }}>
              {/* Back Button */}
              <TouchableOpacity onPress={() => setStep(1)} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: COLORS.primary }}>← Change Center</Text>
              </TouchableOpacity>

              <View
                style={{
                  borderRadius: 16,
                  padding: 16,
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
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
                  Selected Center: {selectedVendor.name}
                </Text>

                {/* Collection Type */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 12 }}>Visit Type</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Center Visit */}
                    <TouchableOpacity
                      onPress={() => setCollectionType('IN_CLINIC')}
                      activeOpacity={0.8}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: collectionType === 'IN_CLINIC' ? COLORS.primary : COLORS.selectedBorder,
                          backgroundColor: collectionType === 'IN_CLINIC' ? 'rgba(3, 77, 162, 0.1)' : 'transparent',
                          alignItems: 'center',
                        }}
                      >
                        <BuildingOfficeIcon width={28} height={28} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary, marginTop: 8 }}>Center Visit</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textGray, textAlign: 'center', marginTop: 2 }}>
                          Visit diagnostic center
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Home Collection */}
                    <TouchableOpacity
                      onPress={() => setCollectionType('HOME_COLLECTION')}
                      activeOpacity={0.8}
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: collectionType === 'HOME_COLLECTION' ? COLORS.primary : COLORS.selectedBorder,
                          backgroundColor: collectionType === 'HOME_COLLECTION' ? 'rgba(3, 77, 162, 0.1)' : 'transparent',
                          alignItems: 'center',
                        }}
                      >
                        <HomeIcon width={28} height={28} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary, marginTop: 8 }}>Home Visit</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textGray, textAlign: 'center', marginTop: 2 }}>
                          +₹{selectedVendor.homeCollectionCharges || 100}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Date Selection */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 12 }}>Select Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {dateOptions.map((date) => (
                        <TouchableOpacity
                          key={date.value}
                          onPress={() => {
                            setSelectedDate(date.value);
                            setSelectedSlot(null);
                          }}
                          activeOpacity={0.8}
                        >
                          <View
                            style={{
                              width: 70,
                              paddingVertical: 12,
                              paddingHorizontal: 8,
                              borderRadius: 12,
                              borderWidth: 2,
                              borderColor: selectedDate === date.value ? COLORS.primary : COLORS.selectedBorder,
                              backgroundColor: selectedDate === date.value ? 'rgba(3, 77, 162, 0.1)' : 'transparent',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 11, color: COLORS.textGray }}>{date.day}</Text>
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: selectedDate === date.value ? COLORS.primary : COLORS.primary,
                                marginVertical: 2,
                              }}
                            >
                              {date.dateNum}
                            </Text>
                            {date.label === 'Today' && (
                              <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '500' }}>Today</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Time Slots */}
                {selectedDate && (
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 12 }}>Select Time Slot</Text>
                    {availableSlots.length === 0 ? (
                      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray }}>No slots available for this date</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {availableSlots.map((slot) => {
                          const isAvailable = slot.currentBookings < slot.maxBookings;
                          const isSelected = selectedSlot?.slotId === slot.slotId;

                          return (
                            <TouchableOpacity
                              key={slot.slotId}
                              onPress={() => isAvailable && handleSlotSelect(slot)}
                              disabled={!isAvailable}
                              activeOpacity={0.8}
                              style={{ width: '48%' }}
                            >
                              <View
                                style={{
                                  padding: 12,
                                  borderRadius: 8,
                                  borderWidth: 2,
                                  borderColor: isSelected ? COLORS.primary : isAvailable ? COLORS.selectedBorder : '#e5e7eb',
                                  backgroundColor: isSelected ? 'rgba(3, 77, 162, 0.1)' : isAvailable ? 'transparent' : '#f3f4f6',
                                  opacity: isAvailable ? 1 : 0.5,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  <ClockIcon width={16} height={16} color={COLORS.primary} />
                                  <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>{slot.timeSlot}</Text>
                                </View>
                                <Text style={{ fontSize: 11, color: COLORS.textGray, textAlign: 'center', marginTop: 4 }}>
                                  {isAvailable ? `${slot.maxBookings - slot.currentBookings} slots available` : 'Fully booked'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ===== STEP 3: PAYMENT / CONFIRMATION ===== */}
          {step === 3 && selectedVendor && selectedSlot && (
            <View style={{ gap: 16 }}>
              {/* Back Button */}
              <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: COLORS.primary }}>← Change Slot</Text>
              </TouchableOpacity>

              {/* Booking Summary Card */}
              <View
                style={{
                  borderRadius: 16,
                  padding: 16,
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
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>Booking Summary</Text>

                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Center:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>{selectedVendor.name}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Visit Type:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>
                      {collectionType === 'HOME_COLLECTION' ? 'Home Visit' : 'Center Visit'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Date:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>{formatDate(selectedDate)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Time:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>{selectedSlot.timeSlot}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Breakdown Card */}
              <View
                style={{
                  borderRadius: 16,
                  padding: 16,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BanknotesIconOutline size={20} color={COLORS.primary} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>Payment Breakdown</Text>
                </View>

                {validating ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 8 }}>Calculating payment...</Text>
                  </View>
                ) : validationResult?.breakdown ? (
                  <View style={{ gap: 12 }}>
                    {/* Bill Amount */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, color: COLORS.textGray }}>Bill Amount</Text>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                        ₹{validationResult.breakdown.billAmount || getTotalAmount()}
                      </Text>
                    </View>

                    {/* Service Transaction Limit (if applicable) */}
                    {validationResult.breakdown.serviceTransactionLimit !== undefined &&
                     validationResult.breakdown.serviceTransactionLimit > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray }}>Per Transaction Limit</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                          ₹{validationResult.breakdown.serviceTransactionLimit}
                        </Text>
                      </View>
                    )}

                    {/* Insurance Coverage */}
                    {validationResult.breakdown.insurancePayment > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray }}>Insurance Coverage</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.success }}>
                          -₹{validationResult.breakdown.insurancePayment}
                        </Text>
                      </View>
                    )}

                    {/* Copay */}
                    {validationResult.breakdown.copayAmount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray }}>
                          Co-pay {validationResult.breakdown.copayPercentage ? `(${validationResult.breakdown.copayPercentage}%)` : ''}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                          ₹{validationResult.breakdown.copayAmount}
                        </Text>
                      </View>
                    )}

                    {/* Excess Amount */}
                    {validationResult.breakdown.excessAmount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray }}>Excess Amount</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                          ₹{validationResult.breakdown.excessAmount}
                        </Text>
                      </View>
                    )}

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

                    {/* Wallet Deduction */}
                    {validationResult.breakdown.walletDebitAmount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray }}>Wallet Deduction</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.success }}>
                          -₹{validationResult.breakdown.walletDebitAmount}
                        </Text>
                      </View>
                    )}

                    {/* Total You Pay */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>Total You Pay</Text>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: validationResult.breakdown.totalMemberPayment === 0 ? COLORS.success : COLORS.primary
                      }}>
                        {validationResult.breakdown.totalMemberPayment === 0
                          ? 'Fully Covered'
                          : `₹${validationResult.breakdown.totalMemberPayment}`}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Fallback - show simple breakdown
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, color: COLORS.textGray }}>Service Amount</Text>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹{selectedVendor.totalDiscountedPrice}</Text>
                    </View>

                    {collectionType === 'HOME_COLLECTION' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray }}>Home Visit Charges</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                          ₹{selectedVendor.homeCollectionCharges || 100}
                        </Text>
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>Total Amount</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>₹{getTotalAmount()}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Wallet Balance Card */}
              <View
                style={{
                  borderRadius: 16,
                  padding: 16,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <WalletIcon width={20} height={20} color={COLORS.primary} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>Wallet Balance</Text>
                </View>

                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Current Balance</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>₹{walletBalance}</Text>
                  </View>

                  {validationResult?.breakdown?.walletDebitAmount > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, color: COLORS.textGray }}>After Payment</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                        ₹{Math.max(0, walletBalance - (validationResult.breakdown.walletDebitAmount || 0))}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Validation Warnings */}
              {!validating && validationResult?.warnings && validationResult.warnings.length > 0 && (
                <View
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#FEF3C7',
                    borderWidth: 1,
                    borderColor: '#FDE68A',
                  }}
                >
                  {validationResult.warnings.map((warning: string, idx: number) => (
                    <Text key={idx} style={{ fontSize: 12, color: '#92400E', lineHeight: 18, textAlign: 'center' }}>
                      {warning}
                    </Text>
                  ))}
                </View>
              )}

              {/* Validation Error */}
              {!validating && validationResult && !validationResult.valid && (
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.error, textAlign: 'center' }}>
                    Unable to validate order
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, textAlign: 'center', marginTop: 4 }}>
                    {validationResult.error || 'Please try again'}
                  </Text>
                </View>
              )}

              {/* Confirm Button */}
              {!validating && validationResult?.valid && (() => {
                const breakdown = validationResult?.breakdown as PaymentBreakdown | undefined;
                const totalMemberPayment = breakdown?.totalMemberPayment || 0;
                const isFullyCovered = totalMemberPayment === 0;

                return (
                  <TouchableOpacity
                    onPress={handleConfirmBooking}
                    disabled={processing}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: processing ? '#9ca3af' : isFullyCovered ? COLORS.success : COLORS.primary,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {processing && <ActivityIndicator size="small" color={COLORS.white} />}
                    <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>
                      {processing
                        ? 'Processing...'
                        : isFullyCovered
                        ? 'Confirm Booking (Fully Covered)'
                        : `Pay ₹${totalMemberPayment} & Confirm`}
                    </Text>
                  </TouchableOpacity>
                );
              })()}

              {/* Payment Note */}
              {!validating && validationResult?.valid && (() => {
                const breakdown = validationResult?.breakdown as PaymentBreakdown | undefined;
                const totalMemberPayment = breakdown?.totalMemberPayment || 0;
                const isFullyCovered = totalMemberPayment === 0;

                return isFullyCovered ? (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: '#DCFCE7',
                      borderWidth: 1,
                      borderColor: '#BBF7D0',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#166534', lineHeight: 18, textAlign: 'center' }}>
                      Your booking is fully covered by your wallet balance. No additional payment required.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: 'rgba(3, 77, 162, 0.1)',
                      borderWidth: 1,
                      borderColor: COLORS.selectedBorder,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: COLORS.primary, lineHeight: 18, textAlign: 'center' }}>
                      You will be redirected to a dummy payment gateway for testing
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
