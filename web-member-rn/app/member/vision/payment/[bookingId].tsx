import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
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
  EyeIcon,
  WalletIcon,
  BanknotesIcon,
  CheckCircleIcon,
} from '../../../../src/components/icons/InlineSVGs';
import apiClient from '../../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface VisionBooking {
  _id: string;
  bookingId: string;
  patientName: string;
  patientId: string;
  serviceCode: string;
  serviceName: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: {
    street?: string;
    line1?: string;
    city: string;
    state: string;
    pincode: string;
  };
  clinicContact: string;
  appointmentDate: string;
  appointmentTime: string;
  servicePrice: number;
  billAmount: number;
  copayAmount: number;
  insurancePayment: number;
  insuranceEligibleAmount?: number;
  serviceTransactionLimit?: number;
  excessAmount: number;
  walletDebitAmount: number;
  totalMemberPayment: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  billGenerated?: boolean;
  slotId?: string;
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

export default function VisionPaymentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [booking, setBooking] = useState<VisionBooking | null>(null);
  const [userId, setUserId] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ============================================================================
  // FETCH BOOKING DETAILS
  // ============================================================================

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        console.log('[VisionPayment] Fetching booking:', bookingId);
        setLoading(true);

        // Get user ID
        const authResponse = await apiClient.get<{ _id: string }>('/auth/me');
        const currentUserId = authResponse.data._id;
        setUserId(currentUserId);
        console.log('[VisionPayment] User ID:', currentUserId);

        // Get booking details
        const bookingResponse = await apiClient.get<VisionBooking>(`/vision-bookings/${bookingId}`);
        const bookingData = bookingResponse.data;
        console.log('[VisionPayment] Booking data:', bookingData);

        // Validate booking has bill generated
        if (!bookingData.billGenerated) {
          Alert.alert('Error', 'Bill has not been generated for this booking yet');
          router.replace('/member/bookings?tab=vision');
          return;
        }

        // Check if already paid
        if (bookingData.paymentStatus === 'COMPLETED') {
          Alert.alert('Info', 'Payment has already been completed');
          router.replace('/member/bookings?tab=vision');
          return;
        }

        // Validate payment breakdown exists
        if (
          bookingData.copayAmount === undefined ||
          bookingData.insurancePayment === undefined ||
          bookingData.totalMemberPayment === undefined ||
          bookingData.walletDebitAmount === undefined
        ) {
          Alert.alert('Error', 'Payment breakdown not available. Please contact support.');
          router.replace('/member/bookings?tab=vision');
          return;
        }

        setBooking(bookingData);

        // Fetch wallet balance
        try {
          const walletResponse = await apiClient.get<{
            totalBalance: { current: number };
          }>(`/wallet/balance?userId=${bookingData.patientId}`);
          setWalletBalance(walletResponse.data.totalBalance?.current || 0);
        } catch (walletErr) {
          console.warn('[VisionPayment] Could not fetch wallet balance:', walletErr);
          setWalletBalance(0);
        }
      } catch (error: any) {
        console.error('[VisionPayment] Error fetching booking:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to load booking details');
        router.replace('/member/bookings?tab=vision');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, router]);

  // ============================================================================
  // PROCESS PAYMENT
  // ============================================================================

  const handleProcessPayment = useCallback(async () => {
    if (!booking || !userId) {
      console.warn('[VisionPayment] Missing booking or userId');
      return;
    }

    console.log('[VisionPayment] Processing payment...');
    setProcessing(true);

    try {
      // Determine if user needs to pay copay externally
      const userPayment = booking.totalMemberPayment || 0;

      // CASE 1: Fully covered by wallet/insurance (no copay)
      if (userPayment === 0) {
        console.log('[VisionPayment] Fully covered by wallet - processing directly...');

        // Call process-payment endpoint for wallet-only payment
        const response = await apiClient.post<{
          message: string;
          booking: VisionBooking;
        }>(`/vision-bookings/${bookingId}/process-payment`);

        console.log('[VisionPayment] Wallet payment processed:', response.data);
        setPaymentSuccess(true);
        return;
      }

      // CASE 2: User needs to pay copay/out-of-pocket
      console.log('[VisionPayment] User needs to pay:', userPayment);

      // Create pending payment via API
      const paymentData = {
        amount: userPayment,
        paymentType: booking.copayAmount > 0 ? 'COPAY' : 'OUT_OF_POCKET',
        serviceType: 'VISION',
        serviceReferenceId: booking.bookingId,
        description: `Vision service: ${booking.serviceName} at ${booking.clinicName}`,
        userId: userId,
        patientId: booking.patientId,
        metadata: {
          clinicId: booking.clinicId,
          clinicName: booking.clinicName,
          serviceCode: booking.serviceCode,
          serviceName: booking.serviceName,
          slotId: booking.slotId || '',
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          consultationFee: booking.billAmount,
          walletCoverage: booking.walletDebitAmount,
          copayAmount: booking.copayAmount,
          excessAmount: booking.excessAmount,
          serviceTransactionLimit: booking.serviceTransactionLimit || 0,
          insurancePayment: booking.insurancePayment,
        },
      };

      console.log('[VisionPayment] Creating pending payment:', paymentData);

      const paymentResponse = await apiClient.post<{
        paymentId: string;
        _id: string;
      }>('/payments', paymentData);

      const paymentId = paymentResponse.data.paymentId || paymentResponse.data._id;
      console.log('[VisionPayment] Pending payment created:', paymentId);

      // Store booking data in AsyncStorage for completion after payment
      const pendingBookingData = {
        serviceType: 'VISION',
        serviceDetails: {
          bookingId: booking.bookingId, // VISION bookings already exist
          clinicId: booking.clinicId,
          clinicName: booking.clinicName,
          serviceCode: booking.serviceCode,
          serviceName: booking.serviceName,
          slotId: booking.slotId || '',
          date: booking.appointmentDate,
          time: booking.appointmentTime,
        },
        patientId: booking.patientId,
        patientName: booking.patientName,
        userId: userId,
        consultationFee: booking.billAmount,
        walletCoverage: booking.walletDebitAmount,
        copayAmount: booking.copayAmount,
        excessAmount: booking.excessAmount,
        serviceTransactionLimit: booking.serviceTransactionLimit || 0,
        insurancePayment: booking.insurancePayment,
        paymentId: paymentId,
        bookingId: booking.bookingId,
      };

      console.log('[VisionPayment] Storing pending booking in AsyncStorage:', pendingBookingData);
      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBookingData));

      // Redirect to payment gateway
      const redirectUrl = '/member/bookings?tab=vision';
      console.log('[VisionPayment] Redirecting to payment gateway:', paymentId);
      router.push(`/member/payments/${paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
    } catch (error: any) {
      console.error('[VisionPayment] Error processing payment:', error);
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  }, [booking, userId, bookingId, router]);

  const handleViewBookings = useCallback(() => {
    console.log('[VisionPayment] Navigating to bookings');
    router.push('/member/bookings?tab=vision' as any);
  }, [router]);

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

  if (!booking) {
    return null;
  }

  // ============================================================================
  // SUCCESS SCREEN
  // ============================================================================

  if (paymentSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7fc', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ maxWidth: 480, width: '100%' }}>
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              padding: 24,
              borderWidth: 2,
              borderColor: '#F7DCAF',
              alignItems: 'center',
            }}
          >
            {/* Success Icon */}
            <View style={{ marginBottom: 24 }}>
              <IconCircle icon={CheckCircleIcon} size="lg" />
            </View>

            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2', marginBottom: 8, textAlign: 'center' }}>
              Payment Successful!
            </Text>

            {/* Booking ID */}
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>
              Booking ID: {booking.bookingId}
            </Text>

            {/* Wallet Amount */}
            {booking.walletDebitAmount > 0 && (
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#25A425', marginBottom: 16, textAlign: 'center' }}>
                ₹{booking.walletDebitAmount} deducted from wallet
              </Text>
            )}

            {/* View Bookings Button */}
            <TouchableOpacity
              onPress={handleViewBookings}
              activeOpacity={0.8}
              style={{ width: '100%', marginTop: 8 }}
            >
              <LinearGradient
                colors={['#16a34a', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                  View Bookings
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MAIN PAYMENT SCREEN
  // ============================================================================

  const userPayment = booking.totalMemberPayment || 0;
  const isFullyCovered = userPayment === 0;

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
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8, borderRadius: 8 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  Vision Service Payment
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Complete your payment
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ===== MAIN CONTENT ===== */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          paddingBottom: 96,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 16 }}>
          {/* ===== BOOKING DETAILS CARD ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
              Booking Details
            </Text>

            {/* Service */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <IconCircle icon={EyeIcon} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2', marginBottom: 4 }}>
                  {booking.serviceName}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {booking.clinicName}
                </Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <UserIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Patient</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#0E51A2' }}>
                  {booking.patientName}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CalendarIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Date</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#0E51A2' }}>
                  {formatDate(booking.appointmentDate)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ClockIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Time</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#0E51A2' }}>
                  {booking.appointmentTime}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MapPinIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Location</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#0E51A2' }}>
                  {booking.clinicAddress.city}
                </Text>
              </View>
            </View>

            {/* Booking ID */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: '#F7DCAF',
              }}
            >
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                Booking ID: <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#0F5FDC' }}>{booking.bookingId}</Text>
              </Text>
            </View>
          </LinearGradient>

          {/* ===== PAYMENT BREAKDOWN CARD ===== */}
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                Payment Breakdown
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {/* Bill Amount */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Bill Amount</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                  ₹{booking.billAmount}
                </Text>
              </View>

              {/* Service Transaction Limit (if applicable) */}
              {booking.serviceTransactionLimit !== undefined && booking.serviceTransactionLimit > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Service Limit</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                    ₹{booking.serviceTransactionLimit}
                  </Text>
                </View>
              )}

              {/* Insurance Coverage */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Insurance Coverage</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>
                  -₹{booking.insurancePayment}
                </Text>
              </View>

              {/* Copay */}
              {booking.copayAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Copay</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                    ₹{booking.copayAmount}
                  </Text>
                </View>
              )}

              {/* Excess Amount */}
              {booking.excessAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Excess Amount</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                    ₹{booking.excessAmount}
                  </Text>
                </View>
              )}

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#F7DCAF', marginVertical: 4 }} />

              {/* Wallet Deduction */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Wallet Deduction</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>
                  -₹{booking.walletDebitAmount}
                </Text>
              </View>

              {/* Total You Pay */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                  Total You Pay
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: isFullyCovered ? '#25A425' : '#0E51A2' }}>
                  {isFullyCovered ? 'Fully Covered' : `₹${userPayment}`}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ===== WALLET BALANCE CARD ===== */}
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                Wallet Balance
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Current Balance</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2' }}>
                  ₹{walletBalance}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>After Payment</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#25A425' }}>
                  ₹{Math.max(0, walletBalance - booking.walletDebitAmount)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ===== PROCESS PAYMENT BUTTON ===== */}
          <TouchableOpacity
            onPress={handleProcessPayment}
            disabled={processing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={processing ? ['#9ca3af', '#9ca3af'] : isFullyCovered ? ['#16a34a', '#22c55e'] : ['#1F63B4', '#5DA4FB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: processing ? 0 : 0.2,
                shadowRadius: 8,
                elevation: processing ? 0 : 4,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {processing && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                {processing
                  ? 'Processing...'
                  : isFullyCovered
                  ? 'Confirm Booking (Fully Covered)'
                  : `Pay ₹${userPayment} & Confirm`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Payment Note */}
          {!isFullyCovered && (
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
          )}
        </View>
      </ScrollView>
    </View>
  );
}
