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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  MapPinIcon,
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
// ICONS - Matching Home Page Style
// ============================================================================

function EyeIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={COLORS.primary} strokeWidth={1.5} />
    </Svg>
  );
}

function UserIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path d="M20 21a8 8 0 10-16 0" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <Path d="M12 6v6l4 2" stroke={COLORS.primary} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function BanknotesIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={COLORS.primary} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="3" stroke={COLORS.primary} strokeWidth={1.5} />
    </Svg>
  );
}

function WalletIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M21 12a2 2 0 00-2-2h-4a2 2 0 00-2 2v0a2 2 0 002 2h4a2 2 0 002-2v0z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={COLORS.success} strokeWidth={1.5} />
      <Path d="M9 12l2 2 4-4" stroke={COLORS.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ maxWidth: 480, width: '100%' }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
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
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <CheckCircleIcon size={32} />
            </View>

            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}>
              Payment Successful!
            </Text>

            {/* Booking ID */}
            <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 4, textAlign: 'center' }}>
              Booking ID: {booking.bookingId}
            </Text>

            {/* Wallet Amount */}
            {booking.walletDebitAmount > 0 && (
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.success, marginBottom: 16, textAlign: 'center' }}>
                {booking.walletDebitAmount} deducted from wallet
              </Text>
            )}

            {/* View Bookings Button */}
            <TouchableOpacity
              onPress={handleViewBookings}
              activeOpacity={0.8}
              style={{
                width: '100%',
                marginTop: 8,
                backgroundColor: COLORS.success,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                View Bookings
              </Text>
            </TouchableOpacity>
          </View>
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
                  Vision Service Payment
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
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
          paddingVertical: 20,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 16 }}>
          {/* ===== BOOKING DETAILS CARD ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
              Booking Details
            </Text>

            {/* Service */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(3, 77, 162, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <EyeIcon size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 4 }}>
                  {booking.serviceName}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                  {booking.clinicName}
                </Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <UserIcon size={16} />
                  <Text style={{ fontSize: 13, color: COLORS.textGray }}>Patient</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
                  {booking.patientName}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CalendarIcon size={16} />
                  <Text style={{ fontSize: 13, color: COLORS.textGray }}>Date</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
                  {formatDate(booking.appointmentDate)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ClockIcon size={16} />
                  <Text style={{ fontSize: 13, color: COLORS.textGray }}>Time</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
                  {booking.appointmentTime}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MapPinIcon width={16} height={16} color={COLORS.textGray} />
                  <Text style={{ fontSize: 13, color: COLORS.textGray }}>Location</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>
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
                borderTopColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                Booking ID: <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: COLORS.primary }}>{booking.bookingId}</Text>
              </Text>
            </View>
          </View>

          {/* ===== PAYMENT BREAKDOWN CARD ===== */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BanknotesIcon size={20} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                Payment Breakdown
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {/* Bill Amount */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Bill Amount</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                  {booking.billAmount}
                </Text>
              </View>

              {/* Service Transaction Limit (if applicable) */}
              {booking.serviceTransactionLimit !== undefined && booking.serviceTransactionLimit > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Service Limit</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                    {booking.serviceTransactionLimit}
                  </Text>
                </View>
              )}

              {/* Insurance Coverage */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Insurance Coverage</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.success }}>
                  -{booking.insurancePayment}
                </Text>
              </View>

              {/* Copay */}
              {booking.copayAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Copay</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                    {booking.copayAmount}
                  </Text>
                </View>
              )}

              {/* Excess Amount */}
              {booking.excessAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Excess Amount</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                    {booking.excessAmount}
                  </Text>
                </View>
              )}

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

              {/* Wallet Deduction */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Wallet Deduction</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.success }}>
                  -{booking.walletDebitAmount}
                </Text>
              </View>

              {/* Total You Pay */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                  Total You Pay
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: isFullyCovered ? COLORS.success : COLORS.primary }}>
                  {isFullyCovered ? 'Fully Covered' : `${userPayment}`}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== WALLET BALANCE CARD ===== */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.selectedBorder,
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.08,
              shadowRadius: 23,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <WalletIcon size={20} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                Wallet Balance
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Current Balance</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                  {walletBalance}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>After Payment</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                  {Math.max(0, walletBalance - booking.walletDebitAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== PROCESS PAYMENT BUTTON ===== */}
          <TouchableOpacity
            onPress={handleProcessPayment}
            disabled={processing}
            activeOpacity={0.8}
            style={{
              backgroundColor: processing ? '#9CA3AF' : (isFullyCovered ? COLORS.success : COLORS.primary),
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
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
                : `Pay ${userPayment} & Confirm`}
            </Text>
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
                You will be redirected to a dummy payment gateway for testing
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
