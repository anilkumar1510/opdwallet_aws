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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BeakerIcon,
  HomeIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  BanknotesIcon,
  WalletIcon,
} from '../../../../src/components/icons/InlineSVGs';
import apiClient from '../../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface LabCart {
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

interface LabVendor {
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
    <LinearGradient
      colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(164, 191, 254, 0.48)',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.05,
        shadowRadius: 46.1,
        elevation: 4,
      }}
    >
      <Icon width={dimensions.icon} height={dimensions.icon} color="#0F5FDC" />
    </LinearGradient>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LabBookingPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartId = params.cartId as string;

  // State
  const [cart, setCart] = useState<LabCart | null>(null);
  const [vendors, setVendors] = useState<LabVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<LabVendor | null>(null);
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
        console.log('[LabBooking] Validating order...');
        const response = await apiClient.post('/member/lab/orders/validate', {
          patientId: userId,
          vendorId: selectedVendor.vendorId,
          cartId: cart.cartId,
          slotId: selectedSlot.slotId,
          totalAmount: getTotalAmount(),
        });

        console.log('[LabBooking] Validation result:', response.data);
        setValidationResult(response.data);
      } catch (error: any) {
        console.error('[LabBooking] Validation error:', error);
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
      const cartResponse = await apiClient.get(`/member/lab/carts/${cartId}`);
      setCart(cartResponse.data.data);

      // Fetch assigned vendors for this cart
      const vendorsResponse = await apiClient.get(`/member/lab/carts/${cartId}/vendors`);
      setVendors(vendorsResponse.data.data || []);

      // Set today's date as default
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    } catch (error) {
      console.error('[LabBooking] Error fetching data:', error);
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
        console.warn('[LabBooking] Could not fetch wallet:', walletErr);
      }
    } catch (error) {
      console.error('[LabBooking] Error fetching user:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedVendor || !selectedDate || !cart?.pincode) return;

    try {
      const response = await apiClient.get(
        `/member/lab/vendors/${selectedVendor.vendorId}/slots?pincode=${cart.pincode}&date=${selectedDate}`
      );
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('[LabBooking] Error fetching slots:', error);
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

  const handleVendorSelect = (vendor: LabVendor) => {
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
        console.log('[LabBooking] Fully covered by wallet - creating order directly...');
        const bookingData = {
          cartId: cart.cartId,
          vendorId: selectedVendor.vendorId,
          slotId: selectedSlot.slotId,
          collectionType,
          appointmentDate: selectedDate,
          timeSlot: selectedSlot.timeSlot,
        };

        const response = await apiClient.post('/member/lab/orders', bookingData);
        console.log('[LabBooking] Order created:', response.data);

        setOrderId(response.data.data.orderId);
        setBookingSuccess(true);
        return;
      }

      // CASE 2: User needs to pay copay/excess - redirect to payment gateway
      console.log('[LabBooking] User needs to pay:', totalMemberPayment);

      // Create pending payment via API
      const paymentData = {
        amount: totalMemberPayment,
        paymentType: (breakdown?.copayAmount || 0) > 0 ? 'COPAY' : 'OUT_OF_POCKET',
        serviceType: 'LAB',
        serviceReferenceId: cart.cartId,
        description: `Lab Tests: ${cart.items.map(i => i.serviceName).join(', ')} from ${selectedVendor.name}`,
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

      console.log('[LabBooking] Creating pending payment:', paymentData);

      const paymentResponse = await apiClient.post('/payments', paymentData);
      const paymentId = paymentResponse.data.paymentId || paymentResponse.data._id;
      console.log('[LabBooking] Pending payment created:', paymentId);

      // Store booking data in AsyncStorage for completion after payment
      const pendingBookingData = {
        serviceType: 'LAB',
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

      console.log('[LabBooking] Storing pending booking in AsyncStorage:', pendingBookingData);
      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBookingData));

      // Redirect to payment gateway
      const redirectUrl = '/member/bookings?tab=lab';
      console.log('[LabBooking] Redirecting to payment gateway:', paymentId);
      router.push(`/member/payments/${paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
    } catch (error: any) {
      console.error('[LabBooking] Error creating order:', error);
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
      <View style={{ flex: 1, backgroundColor: '#f7f7fc', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F5FDC" />
      </View>
    );
  }

  // ============================================================================
  // CART NOT FOUND
  // ============================================================================

  if (!cart) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7fc', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>Cart not found</Text>
        <TouchableOpacity onPress={() => router.push('/member/lab-tests' as any)} activeOpacity={0.8}>
          <LinearGradient
            colors={['#1F63B4', '#5DA4FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================================
  // SUCCESS SCREEN
  // ============================================================================

  if (bookingSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7fc', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ maxWidth: 480, width: '100%' }}>
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 24,
              borderWidth: 2,
              borderColor: '#F7DCAF',
              alignItems: 'center',
            }}
          >
            {/* Success Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#25A425',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <CheckCircleIcon width={40} height={40} color="#FFFFFF" />
            </View>

            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2', marginBottom: 8, textAlign: 'center' }}>
              Booking Confirmed!
            </Text>

            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>
              Order ID: {orderId}
            </Text>

            <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, textAlign: 'center' }}>
              {formatDate(selectedDate)} at {selectedSlot?.timeSlot}
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/member/bookings?tab=lab' as any)}
              activeOpacity={0.8}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={['#16a34a', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>View Bookings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MAIN UI
  // ============================================================================

  const dateOptions = getDateOptions();

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
      {/* ===== HEADER (STICKY) ===== */}
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
              paddingVertical: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 8 }} activeOpacity={0.7}>
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>Book Lab Tests</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Cart ID: {cart.cartId}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ===== PROGRESS STEPS ===== */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#86ACD8',
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', maxWidth: 320, marginHorizontal: 'auto', width: '100%' }}>
          {/* Step 1 */}
          <View style={{ alignItems: 'center' }}>
            <LinearGradient
              colors={step >= 1 ? ['#1F63B4', '#5DA4FB'] : ['#e5e7eb', '#e5e7eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 1 ? '#FFFFFF' : '#9ca3af' }}>1</Text>
            </LinearGradient>
            <Text style={{ fontSize: 12, color: step >= 1 ? '#0F5FDC' : '#9ca3af' }}>Vendor</Text>
          </View>

          {/* Line 1-2 */}
          <View style={{ flex: 1, height: 4, backgroundColor: step >= 2 ? '#0F5FDC' : '#e5e7eb', marginHorizontal: 8, marginBottom: 20 }} />

          {/* Step 2 */}
          <View style={{ alignItems: 'center' }}>
            <LinearGradient
              colors={step >= 2 ? ['#1F63B4', '#5DA4FB'] : ['#e5e7eb', '#e5e7eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 2 ? '#FFFFFF' : '#9ca3af' }}>2</Text>
            </LinearGradient>
            <Text style={{ fontSize: 12, color: step >= 2 ? '#0F5FDC' : '#9ca3af' }}>Slot</Text>
          </View>

          {/* Line 2-3 */}
          <View style={{ flex: 1, height: 4, backgroundColor: step >= 3 ? '#0F5FDC' : '#e5e7eb', marginHorizontal: 8, marginBottom: 20 }} />

          {/* Step 3 */}
          <View style={{ alignItems: 'center' }}>
            <LinearGradient
              colors={step >= 3 ? ['#1F63B4', '#5DA4FB'] : ['#e5e7eb', '#e5e7eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: step >= 3 ? '#FFFFFF' : '#9ca3af' }}>3</Text>
            </LinearGradient>
            <Text style={{ fontSize: 12, color: step >= 3 ? '#0F5FDC' : '#9ca3af' }}>Payment</Text>
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
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 16 }}>
          {/* ===== TESTS IN CART CARD ===== */}
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              padding: 16,
              borderWidth: 2,
              borderColor: '#F7DCAF',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 12 }}>Tests in Cart</Text>
            <View style={{ gap: 8 }}>
              {cart.items.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BeakerIcon width={16} height={16} color="#0F5FDC" />
                  <Text style={{ fontSize: 13, color: '#374151' }}>{item.serviceName}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* ===== STEP 1: VENDOR SELECTION ===== */}
          {step === 1 && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#0E51A2' }}>Select Lab Vendor</Text>

              {vendors.length === 0 ? (
                <LinearGradient
                  colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 12,
                    padding: 32,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                    No vendors assigned yet. Please wait for operations team to assign vendors.
                  </Text>
                </LinearGradient>
              ) : (
                vendors.map((vendor) => (
                  <LinearGradient
                    key={vendor._id}
                    colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: '#86ACD8',
                    }}
                  >
                    {/* Vendor Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>{vendor.name}</Text>
                        <View
                          style={{
                            marginTop: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: '#EFF4FF',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '500', color: '#0F5FDC' }}>{vendor.code}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                          ₹{vendor.totalDiscountedPrice}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>Total</Text>
                      </View>
                    </View>

                    {/* Test Pricing */}
                    <View style={{ borderTopWidth: 1, borderTopColor: '#86ACD8', paddingTop: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Test Pricing:</Text>
                      {vendor.pricing.map((item, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>{item.serviceName}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: '#0E51A2' }}>₹{item.discountedPrice}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Select Button */}
                    <TouchableOpacity onPress={() => handleVendorSelect(vendor)} activeOpacity={0.8} style={{ marginTop: 12 }}>
                      <LinearGradient
                        colors={['#1F63B4', '#5DA4FB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 12,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Select This Vendor</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                ))
              )}
            </View>
          )}

          {/* ===== STEP 2: SLOT SELECTION ===== */}
          {step === 2 && selectedVendor && (
            <View style={{ gap: 16 }}>
              {/* Back Button */}
              <TouchableOpacity onPress={() => setStep(1)} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: '#0F5FDC' }}>← Change Vendor</Text>
              </TouchableOpacity>

              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
                  Selected Vendor: {selectedVendor.name}
                </Text>

                {/* Collection Type */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 12 }}>Collection Type</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Lab Visit */}
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
                          borderColor: collectionType === 'IN_CLINIC' ? '#0F5FDC' : '#86ACD8',
                          backgroundColor: collectionType === 'IN_CLINIC' ? '#EFF4FF' : 'transparent',
                          alignItems: 'center',
                        }}
                      >
                        <BuildingOfficeIcon width={28} height={28} color="#0F5FDC" />
                        <Text style={{ fontSize: 13, fontWeight: '500', color: '#0E51A2', marginTop: 8 }}>Lab Visit</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 2 }}>
                          Visit lab for sample
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
                          borderColor: collectionType === 'HOME_COLLECTION' ? '#0F5FDC' : '#86ACD8',
                          backgroundColor: collectionType === 'HOME_COLLECTION' ? '#EFF4FF' : 'transparent',
                          alignItems: 'center',
                        }}
                      >
                        <HomeIcon width={28} height={28} color="#0F5FDC" />
                        <Text style={{ fontSize: 13, fontWeight: '500', color: '#0E51A2', marginTop: 8 }}>Home Collection</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 2 }}>
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
                              borderColor: selectedDate === date.value ? '#0F5FDC' : '#86ACD8',
                              backgroundColor: selectedDate === date.value ? '#EFF4FF' : 'transparent',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 11, color: '#6B7280' }}>{date.day}</Text>
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: selectedDate === date.value ? '#0F5FDC' : '#0E51A2',
                                marginVertical: 2,
                              }}
                            >
                              {date.dateNum}
                            </Text>
                            {date.label === 'Today' && (
                              <Text style={{ fontSize: 10, color: '#25A425', fontWeight: '500' }}>Today</Text>
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
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>No slots available for this date</Text>
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
                                  borderColor: isSelected ? '#0F5FDC' : isAvailable ? '#86ACD8' : '#e5e7eb',
                                  backgroundColor: isSelected ? '#EFF4FF' : isAvailable ? 'transparent' : '#f3f4f6',
                                  opacity: isAvailable ? 1 : 0.5,
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  <ClockIcon width={16} height={16} color="#0F5FDC" />
                                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#0E51A2' }}>{slot.timeSlot}</Text>
                                </View>
                                <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
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
              </LinearGradient>
            </View>
          )}

          {/* ===== STEP 3: PAYMENT / CONFIRMATION ===== */}
          {step === 3 && selectedVendor && selectedSlot && (
            <View style={{ gap: 16 }}>
              {/* Back Button */}
              <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, color: '#0F5FDC' }}>← Change Slot</Text>
              </TouchableOpacity>

              {/* Booking Summary Card */}
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>Booking Summary</Text>

                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Vendor:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{selectedVendor.name}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Collection Type:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                      {collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Lab Visit'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Date:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{formatDate(selectedDate)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Time:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{selectedSlot.timeSlot}</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Payment Breakdown Card */}
              <LinearGradient
                colors={['#FEF3E9', '#FEF3E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#F7DCAF',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BanknotesIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>Payment Breakdown</Text>
                </View>

                {validating ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#0F5FDC" />
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>Calculating payment...</Text>
                  </View>
                ) : validationResult?.breakdown ? (
                  <View style={{ gap: 12 }}>
                    {/* Bill Amount */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>Bill Amount</Text>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                        ₹{validationResult.breakdown.billAmount || getTotalAmount()}
                      </Text>
                    </View>

                    {/* Service Transaction Limit (if applicable) */}
                    {validationResult.breakdown.serviceTransactionLimit !== undefined &&
                     validationResult.breakdown.serviceTransactionLimit > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Per Transaction Limit</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                          ₹{validationResult.breakdown.serviceTransactionLimit}
                        </Text>
                      </View>
                    )}

                    {/* Insurance Coverage */}
                    {validationResult.breakdown.insurancePayment > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Insurance Coverage</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>
                          -₹{validationResult.breakdown.insurancePayment}
                        </Text>
                      </View>
                    )}

                    {/* Copay */}
                    {validationResult.breakdown.copayAmount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>
                          Co-pay {validationResult.breakdown.copayPercentage ? `(${validationResult.breakdown.copayPercentage}%)` : ''}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                          ₹{validationResult.breakdown.copayAmount}
                        </Text>
                      </View>
                    )}

                    {/* Excess Amount */}
                    {validationResult.breakdown.excessAmount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Excess Amount</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                          ₹{validationResult.breakdown.excessAmount}
                        </Text>
                      </View>
                    )}

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: '#F7DCAF', marginVertical: 4 }} />

                    {/* Wallet Deduction */}
                    {validationResult.breakdown.walletDebitAmount > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Wallet Deduction</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>
                          -₹{validationResult.breakdown.walletDebitAmount}
                        </Text>
                      </View>
                    )}

                    {/* Total You Pay */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>Total You Pay</Text>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: validationResult.breakdown.totalMemberPayment === 0 ? '#25A425' : '#0E51A2'
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
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>Test Amount</Text>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>₹{selectedVendor.totalDiscountedPrice}</Text>
                    </View>

                    {collectionType === 'HOME_COLLECTION' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Home Collection Charges</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                          ₹{selectedVendor.homeCollectionCharges || 100}
                        </Text>
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: '#F7DCAF', marginVertical: 4 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>Total Amount</Text>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>₹{getTotalAmount()}</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>

              {/* Wallet Balance Card */}
              <LinearGradient
                colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <WalletIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>Wallet Balance</Text>
                </View>

                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Current Balance</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2' }}>₹{walletBalance}</Text>
                  </View>

                  {validationResult?.breakdown?.walletDebitAmount > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>After Payment</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#25A425' }}>
                        ₹{Math.max(0, walletBalance - (validationResult.breakdown.walletDebitAmount || 0))}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

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
                      ⚠️ {warning}
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
                    backgroundColor: '#FEF1E7',
                    borderWidth: 1,
                    borderColor: '#F9B376',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#E53535', textAlign: 'center' }}>
                    Unable to validate order
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
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
                  >
                    <LinearGradient
                      colors={processing ? ['#9ca3af', '#9ca3af'] : isFullyCovered ? ['#16a34a', '#22c55e'] : ['#1F63B4', '#5DA4FB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: processing ? 0 : 0.2,
                        shadowRadius: 8,
                        elevation: processing ? 0 : 4,
                      }}
                    >
                      {processing && <ActivityIndicator size="small" color="#FFFFFF" />}
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                        {processing
                          ? 'Processing...'
                          : isFullyCovered
                          ? 'Confirm Booking (Fully Covered)'
                          : `Pay ₹${totalMemberPayment} & Confirm`}
                      </Text>
                    </LinearGradient>
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
                      ✓ Your booking is fully covered by your wallet balance. No additional payment required.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: '#FEF3C7',
                      borderWidth: 1,
                      borderColor: '#FDE68A',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18, textAlign: 'center' }}>
                      🧪 You will be redirected to a dummy payment gateway for testing
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
