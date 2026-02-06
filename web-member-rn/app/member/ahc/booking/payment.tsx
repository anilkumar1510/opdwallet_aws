import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  HomeIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
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
  warning: '#F59E0B',
};

// Types
interface AHCPackage {
  id: string;
  packageId: string;
  name: string;
  totalLabTests?: number;
  totalDiagnosticTests?: number;
}

interface LabBookingData {
  packageId?: string;
  vendorId: string;
  vendorName: string;
  collectionType: 'HOME_COLLECTION' | 'CENTER_VISIT';
  slotDate: string;
  slotTime: string;
  slotId: string;
  price?: number;
  totalDiscountedPrice?: number;
  totalActualPrice?: number;
  homeCollectionCharges?: number;
  pricing?: any[];
  address?: {
    // New format (preferred)
    addressLine1?: string;
    addressLine2?: string;
    state?: string;
    // Old format (for backwards compatibility)
    line1?: string;
    line2?: string;
    landmark?: string;
    city: string;
    pincode: string;
  };
}

interface DiagnosticBookingData {
  vendorId: string;
  vendorName: string;
  collectionType: string;
  slotDate: string;
  slotTime: string;
  slotId: string;
  price?: number;
  totalDiscountedPrice?: number;
  totalActualPrice?: number;
  homeCollectionCharges?: number;
  pricing?: any[];
}

// ============ BOOKING SUMMARY CARD ============
interface BookingSummaryProps {
  type: 'lab' | 'diagnostic';
  booking: LabBookingData | DiagnosticBookingData;
}

function BookingSummaryCard({ type, booking }: BookingSummaryProps) {
  const isLab = type === 'lab';
  const labBooking = booking as LabBookingData;

  return (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' }}>
          <CheckCircleIcon width={16} height={16} color="#FFF" />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark }}>
          {isLab ? 'Lab Tests' : 'Diagnostic Tests'}
        </Text>
      </View>

      <View style={{ paddingLeft: 32 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 }}>{booking.vendorName}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <CalendarIcon width={14} height={14} color={COLORS.textGray} />
          <Text style={{ fontSize: 13, color: COLORS.textGray }}>{booking.slotDate}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <ClockIcon width={14} height={14} color={COLORS.textGray} />
          <Text style={{ fontSize: 13, color: COLORS.textGray }}>{booking.slotTime}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {(booking as LabBookingData).collectionType === 'HOME_COLLECTION' ? (
            <>
              <HomeIcon width={14} height={14} color={COLORS.primary} />
              <Text style={{ fontSize: 13, color: COLORS.primary }}>Home Collection</Text>
            </>
          ) : (
            <>
              <BuildingOfficeIcon width={14} height={14} color={COLORS.primary} />
              <Text style={{ fontSize: 13, color: COLORS.primary }}>Center Visit</Text>
            </>
          )}
        </View>

        {isLab && labBooking.collectionType === 'HOME_COLLECTION' && labBooking.address && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <MapPinIcon width={14} height={14} color={COLORS.textGray} />
            <Text style={{ fontSize: 13, color: COLORS.textGray, flex: 1 }} numberOfLines={2}>
              {labBooking.address.line1 || labBooking.address.addressLine1}
              {labBooking.address.city && `, ${labBooking.address.city}`}
              {labBooking.address.pincode && ` - ${labBooking.address.pincode}`}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
        <Text style={{ fontSize: 14, color: COLORS.textGray }}>Amount</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>₹{booking.price || (booking as any).totalDiscountedPrice || 0}</Text>
      </View>
    </View>
  );
}

// ============ MAIN PAYMENT PAGE ============
export default function AHCPaymentPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null);
  const [labBooking, setLabBooking] = useState<LabBookingData | null>(null);
  const [diagnosticBooking, setDiagnosticBooking] = useState<DiagnosticBookingData | null>(null);

  const [userId, setUserId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadBookingData();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Use /auth/me endpoint to get user data
      const response = await apiClient.get('/auth/me');
      const userData = response.data;
      console.log('[AHCPayment] User data:', userData);

      setUserId(userData._id || userData.id);
      setPatientId(userData._id || userData.id);

      // Get patient name - handle different name formats
      let name = 'Member';
      if (userData.name?.firstName && userData.name?.lastName) {
        name = `${userData.name.firstName} ${userData.name.lastName}`;
      } else if (userData.firstName && userData.lastName) {
        name = `${userData.firstName} ${userData.lastName}`;
      } else if (userData.name && typeof userData.name === 'string') {
        name = userData.name;
      }
      setPatientName(name);

      // Get phone number
      const phone = userData.phone || userData.mobile || userData.contactNumber || '';
      setPatientPhone(phone);

      // Fetch wallet balance
      try {
        const walletResponse = await apiClient.get(`/wallet/balance?userId=${userData._id || userData.id}`);
        setWalletBalance(walletResponse.data.totalBalance?.current || walletResponse.data.balance || 0);
      } catch (walletErr) {
        console.warn('[AHCPayment] Could not fetch wallet balance:', walletErr);
      }
    } catch (error) {
      console.error('[AHCPayment] Error fetching user data:', error);
    }
  };

  const loadBookingData = async () => {
    try {
      // Get AHC package
      const packageData = await AsyncStorage.getItem('ahc_package');
      if (!packageData) {
        Alert.alert('Error', 'Package information not found');
        router.replace('/member/health-packages');
        return;
      }
      const packageInfo = JSON.parse(packageData);
      setAhcPackage(packageInfo);

      const hasLabTests = (packageInfo.totalLabTests || 0) > 0;
      const hasDiagnosticTests = (packageInfo.totalDiagnosticTests || 0) > 0;

      // Get lab booking (required if package has lab tests)
      if (hasLabTests) {
        const labData = await AsyncStorage.getItem('ahc_booking_data');
        if (!labData) {
          Alert.alert('Error', 'Lab booking information not found');
          router.replace('/member/ahc/booking');
          return;
        }
        setLabBooking(JSON.parse(labData));
      }

      // Get diagnostic booking (required if package has diagnostic tests)
      if (hasDiagnosticTests) {
        const diagnosticData = await AsyncStorage.getItem('ahc_diagnostic_booking');
        console.log('[AHCPayment] Diagnostic booking data from storage:', diagnosticData);
        if (!diagnosticData) {
          Alert.alert('Error', 'Diagnostic booking information not found');
          router.replace('/member/ahc/booking/diagnostic');
          return;
        }
        const parsedDiagnostic = JSON.parse(diagnosticData);
        console.log('[AHCPayment] Parsed diagnostic booking:', parsedDiagnostic);
        setDiagnosticBooking(parsedDiagnostic);
      }
    } catch (error) {
      console.error('[AHCPayment] Error loading booking data:', error);
      Alert.alert('Error', 'Failed to load booking information');
      router.replace('/member/health-packages');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing
  const calculatePricing = () => {
    const labTotal = labBooking?.price || labBooking?.totalDiscountedPrice || 0;
    const diagnosticTotal = diagnosticBooking?.price || diagnosticBooking?.totalDiscountedPrice || 0;
    const subtotal = labTotal + diagnosticTotal;

    console.log('[AHCPayment] Pricing calculation:', {
      labTotal,
      diagnosticTotal,
      subtotal,
      labBooking: labBooking ? { price: labBooking.price, totalDiscountedPrice: (labBooking as any).totalDiscountedPrice } : null,
      diagnosticBooking: diagnosticBooking ? { price: diagnosticBooking.price, totalDiscountedPrice: diagnosticBooking.totalDiscountedPrice } : null,
    });

    // Placeholder copay calculation (20%) - actual will be server-side
    const copayAmount = Math.round(subtotal * 0.2);
    const walletDeduction = Math.min(subtotal - copayAmount, walletBalance);
    const finalPayable = copayAmount;

    return {
      labTotal,
      diagnosticTotal,
      subtotal,
      copayAmount,
      walletDeduction,
      finalPayable,
    };
  };

  const pricing = calculatePricing();

  // Handle payment
  const handleProcessPayment = useCallback(async () => {
    if (!ahcPackage || (!labBooking && !diagnosticBooking)) {
      Alert.alert('Error', 'Booking data not found');
      return;
    }

    setProcessing(true);

    try {
      // Format lab collection address to match backend DTO
      const formattedLabAddress = labBooking?.address ? {
        fullName: patientName,
        phone: patientPhone,
        addressLine1: labBooking.address.addressLine1 || labBooking.address.line1 || '',
        addressLine2: labBooking.address.addressLine2 || labBooking.address.line2 || '',
        pincode: labBooking.address.pincode,
        city: labBooking.address.city,
        state: labBooking.address.state || '',
      } : undefined;

      // Prepare service details
      const serviceDetails = {
        packageId: ahcPackage.packageId || ahcPackage.id,
        packageName: ahcPackage.name,
        labVendorId: labBooking?.vendorId,
        labVendorName: labBooking?.vendorName,
        labSlotId: labBooking?.slotId,
        labDate: labBooking?.slotDate,
        labTime: labBooking?.slotTime,
        labCollectionType: labBooking?.collectionType,
        labCollectionAddress: formattedLabAddress,
        diagnosticVendorId: diagnosticBooking?.vendorId,
        diagnosticVendorName: diagnosticBooking?.vendorName,
        diagnosticSlotId: diagnosticBooking?.slotId,
        diagnosticDate: diagnosticBooking?.slotDate,
        diagnosticTime: diagnosticBooking?.slotTime,
      };

      // If fully covered by wallet
      if (pricing.finalPayable === 0) {
        console.log('[AHCPayment] Fully covered by wallet - processing directly...');

        // Map to the expected CreateAhcOrderDto format
        const ahcOrderPayload = {
          packageId: serviceDetails.packageId,
          // Lab portion
          labVendorId: serviceDetails.labVendorId,
          labSlotId: serviceDetails.labSlotId,
          labCollectionType: serviceDetails.labCollectionType,
          labCollectionDate: serviceDetails.labDate,
          labCollectionTime: serviceDetails.labTime,
          labCollectionAddress: serviceDetails.labCollectionAddress,
          // Diagnostic portion
          diagnosticVendorId: serviceDetails.diagnosticVendorId,
          diagnosticSlotId: serviceDetails.diagnosticSlotId,
          diagnosticAppointmentDate: serviceDetails.diagnosticDate,
          diagnosticAppointmentTime: serviceDetails.diagnosticTime,
        };

        // Create order directly
        const bookingResponse = await apiClient.post('/member/ahc/orders', ahcOrderPayload);

        console.log('[AHCPayment] Booking created:', bookingResponse.data);

        // Store completed booking for display on bookings page
        const completedBooking = {
          _id: bookingResponse.data?.data?._id || bookingResponse.data?._id || `ahc-${Date.now()}`,
          orderId: bookingResponse.data?.data?.orderId || bookingResponse.data?.orderId || `AHC-${Date.now()}`,
          packageName: ahcPackage?.name || 'Annual Health Check',
          status: 'PLACED',
          createdAt: new Date().toISOString(),
          labPortion: labBooking ? {
            vendorId: labBooking.vendorId,
            vendorName: labBooking.vendorName,
            collectionDate: labBooking.slotDate,
            timeSlot: labBooking.slotTime,
            collectionType: labBooking.collectionType,
            items: labBooking.pricing || [],
          } : null,
          diagnosticPortion: diagnosticBooking ? {
            vendorId: diagnosticBooking.vendorId,
            vendorName: diagnosticBooking.vendorName,
            collectionDate: diagnosticBooking.slotDate,
            timeSlot: diagnosticBooking.slotTime,
            collectionType: 'CENTER_VISIT',
            items: diagnosticBooking.pricing || [],
          } : null,
          totalAmount: pricing.subtotal,
          walletDeduction: pricing.walletDeduction,
        };

        console.log('[AHCPayment] Storing completed booking:', completedBooking);
        await AsyncStorage.setItem('ahc_completed_booking', JSON.stringify(completedBooking));

        // Clear session storage
        await AsyncStorage.multiRemove(['ahc_package', 'ahc_booking_data', 'ahc_diagnostic_booking']);

        setPaymentSuccess(true);
        return;
      }

      // Create pending payment
      const paymentData = {
        amount: pricing.finalPayable,
        paymentType: 'COPAY',
        serviceType: 'AHC',
        description: `AHC: ${ahcPackage.name}`,
        userId,
        patientId,
        metadata: serviceDetails,
      };

      console.log('[AHCPayment] Creating pending payment:', paymentData);

      const paymentResponse = await apiClient.post('/payments', paymentData);
      const paymentId = paymentResponse.data.paymentId || paymentResponse.data._id;

      console.log('[AHCPayment] Payment created:', paymentId);

      // Store pending booking data
      const pendingBookingData = {
        serviceType: 'AHC',
        serviceDetails,
        patientId,
        patientName,
        userId,
        consultationFee: pricing.subtotal,
        walletCoverage: pricing.walletDeduction,
        copayAmount: pricing.copayAmount,
        paymentId,
      };

      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBookingData));

      // Navigate to payment gateway
      const redirectUrl = '/member/bookings?tab=ahc';
      router.push(`/member/payments/${paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
    } catch (error: any) {
      console.error('[AHCPayment] Error processing payment:', error);
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  }, [ahcPackage, labBooking, diagnosticBooking, userId, patientId, patientName, pricing, router]);

  const handleViewBookings = useCallback(() => {
    router.push('/member/bookings?tab=ahc' as any);
  }, [router]);

  // ============ LOADING STATE ============
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
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Payment Summary</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Review and confirm</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, fontSize: 16, color: COLORS.textGray }}>Loading payment details...</Text>
        </View>
      </View>
    );
  }

  // ============ SUCCESS STATE ============
  if (paymentSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          <View style={{ marginBottom: 20 }}>
            <CheckCircleIcon width={48} height={48} color={COLORS.success} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.success, marginBottom: 8 }}>Booking Confirmed!</Text>
          <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', marginBottom: 8 }}>
            Your Annual Health Check has been booked successfully.
          </Text>
          {ahcPackage && (
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 }}>{ahcPackage.name}</Text>
          )}
          {pricing.walletDeduction > 0 && (
            <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 24 }}>
              ₹{pricing.walletDeduction} deducted from wallet
            </Text>
          )}
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 }}
            onPress={handleViewBookings}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>View Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============ MAIN RENDER ============
  const isFullyCovered = pricing.finalPayable === 0;

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
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>Payment Summary</Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Review & Pay</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* Package Info */}
          {ahcPackage && (
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: COLORS.selectedBorder,
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>{ahcPackage.name}</Text>
              <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 4 }}>Annual Health Check Package</Text>
            </View>
          )}

          {/* Booking Summaries */}
          {labBooking && <BookingSummaryCard type="lab" booking={labBooking} />}
          {diagnosticBooking && <BookingSummaryCard type="diagnostic" booking={diagnosticBooking} />}

          {/* Payment Breakdown */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 16,
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 16 }}>Payment Breakdown</Text>

            {labBooking && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Lab Tests</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹{pricing.labTotal}</Text>
              </View>
            )}

            {diagnosticBooking && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Diagnostic Tests</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹{pricing.diagnosticTotal}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4 }}>
              <Text style={{ fontSize: 14, color: COLORS.textGray }}>Subtotal</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹{pricing.subtotal}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: COLORS.textGray }}>Wallet Deduction</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.success }}>-₹{pricing.walletDeduction}</Text>
            </View>

            {pricing.copayAmount > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Copay (20%)</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>₹{pricing.copayAmount}</Text>
              </View>
            )}

            <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark }}>Total Payable</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: isFullyCovered ? COLORS.success : COLORS.textDark }}>
                {isFullyCovered ? 'Fully Covered' : `₹${pricing.finalPayable}`}
              </Text>
            </View>
          </View>

          {/* Wallet Balance */}
          <View
            style={{
              backgroundColor: 'rgba(3, 77, 162, 0.05)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: COLORS.selectedBorder,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginBottom: 12 }}>Wallet Balance</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: COLORS.textGray }}>Current Balance</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark }}>₹{walletBalance}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: COLORS.textGray }}>After Payment</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                ₹{Math.max(0, walletBalance - pricing.walletDeduction)}
              </Text>
            </View>
          </View>

          {/* Important Info */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ExclamationTriangleIcon width={18} height={18} color={COLORS.warning} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E' }}>Important Information</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>• This is a one-time annual health check benefit</Text>
              <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>• Once booked, you cannot cancel or modify the booking</Text>
              <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>• Please ensure all details are correct before proceeding</Text>
              <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>• Lab reports will be shared within 24-48 hours</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: COLORS.white,
          padding: 16,
          paddingBottom: 32,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: COLORS.textGray }}>Total Payable</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: isFullyCovered ? COLORS.success : COLORS.textDark }}>
            {isFullyCovered ? 'Fully Covered' : `₹${pricing.finalPayable}`}
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: processing ? '#CCC' : COLORS.primary,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
            minWidth: 140,
            alignItems: 'center',
          }}
          onPress={handleProcessPayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
              {isFullyCovered ? 'Confirm Booking' : `Pay ₹${pricing.finalPayable}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
