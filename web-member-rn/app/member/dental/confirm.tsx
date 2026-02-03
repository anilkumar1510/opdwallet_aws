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
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
} from '../../../src/components/icons/InlineSVGs';
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
  warning: '#F97316',
};

// ============================================================================
// ICONS - Matching Home Page Style
// ============================================================================

function UserIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M20 21a8 8 0 10-16 0"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M12 7V12L15 15"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MapPinIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 13.43a3.12 3.12 0 100-6.24 3.12 3.12 0 000 6.24z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <Path
        d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76.01 1.15 5.08-2.01 9.38-4.78 12.04a5.193 5.193 0 01-7.21 0c-2.76-2.66-5.92-6.97-4.77-12.05z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

function BanknotesIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 8.5H22M6 16.5H8M10.5 16.5H14.5"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 5.5V18.5C22 21 20.5 22 18 22H6C3.5 22 2 21 2 18.5V5.5C2 3 3.5 2 6 2H18C20.5 2 22 3 22 5.5Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 10.97V13.03C22 13.58 21.56 14.03 21 14.05H19.04C17.96 14.05 16.97 13.26 16.88 12.18C16.82 11.55 17.06 10.96 17.48 10.55C17.85 10.17 18.36 9.95 18.92 9.95H21C21.56 9.97 22 10.42 22 10.97Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 10.5V8.5C2 5.78 3.64 3.88 6.19 3.56C6.45 3.52 6.72 3.5 7 3.5H16C16.26 3.5 16.51 3.51 16.75 3.55C19.33 3.85 21 5.76 21 8.5V9.95H18.92C18.36 9.95 17.85 10.17 17.48 10.55C17.06 10.96 16.82 11.55 16.88 12.18C16.97 13.26 17.96 14.05 19.04 14.05H21V15.5C21 18.5 19 20.5 16 20.5H7C4 20.5 2 18.5 2 15.5V14.5"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={COLORS.success} strokeWidth={1.5} />
      <Path
        d="M9 12l2 2 4-4"
        stroke={COLORS.success}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ToothIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C9.5 2 7.5 3.5 7 5.5C6.5 7.5 5 8 4 9C3 10 3 11.5 3.5 13C4 14.5 4.5 16 5 18C5.5 20 6.5 22 8 22C9.5 22 10 20.5 10 19C10 17.5 10.5 16 12 16C13.5 16 14 17.5 14 19C14 20.5 14.5 22 16 22C17.5 22 18.5 20 19 18C19.5 16 20 14.5 20.5 13C21 11.5 21 10 20 9C19 8 17.5 7.5 17 5.5C16.5 3.5 14.5 2 12 2Z"
        stroke={COLORS.primary}
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

interface Service {
  code: string;
  name: string;
  description: string;
}

interface Clinic {
  clinicId: string;
  clinicName: string;
  address: {
    city: string;
  };
  servicePrice: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ConfirmDentalBookingPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const clinicId = params.clinicId as string;
  const serviceCode = params.serviceCode as string;
  const patientId = params.patientId as string;
  const slotId = params.slotId as string;
  const appointmentDate = params.appointmentDate as string;
  const appointmentTime = params.appointmentTime as string;

  // State
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [userId, setUserId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [service, setService] = useState<Service | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [price, setPrice] = useState(0);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [copayPercentage, setCopayPercentage] = useState(0);
  const [copayAmount, setCopayAmount] = useState(0);
  const [walletCoverage, setWalletCoverage] = useState(0);
  const [userPayment, setUserPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('COPAY');
  const [serviceLimit, setServiceLimit] = useState<number>(0);
  const [excessAmount, setExcessAmount] = useState(0);
  const [insurancePayment, setInsurancePayment] = useState(0);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ============================================================================
  // VALIDATION: Redirect if missing required params
  // ============================================================================

  useEffect(() => {
    console.log('[ConfirmDental] Component mounted');

    if (!clinicId || !serviceCode || !patientId || !slotId || !appointmentDate || !appointmentTime) {
      console.error('[ConfirmDental] Missing required params, redirecting to dental page');
      router.replace('/member/dental');
      return;
    }

    console.log('[ConfirmDental] Query params:', {
      clinicId,
      serviceCode,
      patientId,
      slotId,
      appointmentDate,
      appointmentTime,
    });
  }, [clinicId, serviceCode, patientId, slotId, appointmentDate, appointmentTime, router]);

  // ============================================================================
  // FETCH INITIAL DATA: User, Patient, Service, Clinic, Wallet, Policy
  // ============================================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[ConfirmDental] Fetching initial data...');
        setDataLoading(true);

        // Fetch user ID
        const authResponse = await apiClient.get<{ _id: string }>('/auth/me');
        const currentUserId = authResponse.data._id;
        setUserId(currentUserId);
        console.log('[ConfirmDental] User ID:', currentUserId);

        // Fetch patient profile to get name
        const profileResponse = await apiClient.get<{
          user: { _id: string; name: { firstName: string; lastName: string } };
          dependents?: Array<{ _id: string; name: { firstName: string; lastName: string } }>;
        }>('/member/profile');

        // Check if patient is self or dependent
        if (profileResponse.data.user._id === patientId) {
          const name = `${profileResponse.data.user.name.firstName} ${profileResponse.data.user.name.lastName}`;
          setPatientName(name);
          console.log('[ConfirmDental] Patient is self:', name);
        } else {
          const dependent = profileResponse.data.dependents?.find((d) => d._id === patientId);
          if (dependent) {
            const name = `${dependent.name.firstName} ${dependent.name.lastName}`;
            setPatientName(name);
            console.log('[ConfirmDental] Patient is dependent:', name);
          }
        }

        // Fetch service details
        const servicesResponse = await apiClient.get<{ services: Service[] }>(
          '/member/benefits/CAT006/services'
        );
        const foundService = servicesResponse.data.services?.find((s) => s.code === serviceCode);
        setService(foundService || null);
        console.log('[ConfirmDental] Service found:', foundService?.name);

        // Fetch clinic details and price
        const clinicsResponse = await apiClient.get<{ clinics: Clinic[] }>(
          `/dental-bookings/clinics?serviceCode=${serviceCode}`
        );
        const foundClinic = clinicsResponse.data.clinics?.find((c) => c.clinicId === clinicId);
        setClinic(foundClinic || null);
        const servicePrice = foundClinic?.servicePrice || 0;
        setPrice(servicePrice);
        console.log('[ConfirmDental] Clinic found:', foundClinic?.clinicName, 'Price:', servicePrice);

        // Fetch wallet balance for patient
        try {
          const walletResponse = await apiClient.get<{
            totalBalance: { current: number; allocated: number; consumed: number };
          }>(`/wallet/balance?userId=${patientId}`);
          const balance = walletResponse.data.totalBalance?.current || 0;
          setWalletBalance(balance);
          console.log('[ConfirmDental] Wallet balance:', balance);
        } catch (walletErr) {
          console.warn('[ConfirmDental] Could not fetch wallet balance:', walletErr);
          setWalletBalance(0);
        }

        // Fetch user's policy for copay percentage
        try {
          const policyResponse = await apiClient.get<{
            copay?: { percentage: number; mode: string; value: number };
            planConfig?: { copay?: { percentage: number; mode: string; value: number } };
            walletEnabled: boolean;
          }>('/assignments/my-policy');
          const copay = policyResponse.data.copay || policyResponse.data.planConfig?.copay;
          const percentage = copay?.percentage || copay?.value || 0;
          setCopayPercentage(percentage);
          console.log('[ConfirmDental] Copay percentage:', percentage);
        } catch (policyErr) {
          console.warn('[ConfirmDental] Could not fetch policy (no copay):', policyErr);
          setCopayPercentage(0);
        }
      } catch (err: any) {
        console.error('[ConfirmDental] Error fetching data:', err);
        Alert.alert('Error', 'Failed to load booking details. Please try again.');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [serviceCode, clinicId, patientId]);

  // ============================================================================
  // CALCULATE PAYMENT BREAKDOWN: After price, wallet, copay, validation loaded
  // ============================================================================

  useEffect(() => {
    if (price === 0) {
      console.log('[ConfirmDental] Waiting for price to be set...');
      return;
    }

    console.log('[ConfirmDental] Calculating payment breakdown:', {
      price,
      walletBalance,
      copayPercentage,
      validationResult,
    });

    // Check if validation result has service limit breakdown
    if (validationResult?.breakdown) {
      const breakdown = validationResult.breakdown;
      console.log('[ConfirmDental] Using validation breakdown with service limits:', breakdown);

      // Use breakdown from validation API
      setServiceLimit(breakdown.serviceTransactionLimit || 0);
      setInsurancePayment(breakdown.insurancePayment || 0);
      setExcessAmount(breakdown.excessAmount || 0);
      setCopayAmount(breakdown.copayAmount || 0);

      // Calculate wallet coverage (insurance payment from breakdown)
      const calculatedWalletCoverage = breakdown.insurancePayment || 0;
      setWalletCoverage(calculatedWalletCoverage);

      // User payment = copay + excess (if service limit exceeded)
      const totalUserPayment = breakdown.totalMemberPayment || breakdown.copayAmount + breakdown.excessAmount;

      // Determine payment method
      let method = 'COPAY';
      let userPays = totalUserPayment;

      if (totalUserPayment === 0) {
        method = 'WALLET_ONLY';
        userPays = 0;
      } else if (walletBalance >= calculatedWalletCoverage) {
        method = 'COPAY';
        userPays = totalUserPayment;
      } else if (walletBalance > 0) {
        method = 'OUT_OF_POCKET';
        userPays = price - walletBalance;
      } else {
        method = 'FULL_PAYMENT';
        userPays = price;
      }

      setPaymentMethod(method);
      setUserPayment(userPays);

      console.log('[ConfirmDental] Payment breakdown calculated (with service limits):', {
        serviceLimit: breakdown.serviceTransactionLimit,
        insurancePayment: breakdown.insurancePayment,
        copayAmount: breakdown.copayAmount,
        excessAmount: breakdown.excessAmount,
        totalUserPayment,
        paymentMethod: method,
      });
    } else {
      // Fallback: Simple copay calculation without service limits
      console.log('[ConfirmDental] Using simple copay calculation (no service limits)');

      const calculatedCopay = Math.round((price * copayPercentage) / 100);
      const calculatedWalletCoverage = price - calculatedCopay;
      setCopayAmount(calculatedCopay);
      setWalletCoverage(calculatedWalletCoverage);
      setServiceLimit(0);
      setExcessAmount(0);
      setInsurancePayment(calculatedWalletCoverage);

      // Determine payment method and user payment
      let method = 'COPAY';
      let userPays = 0;

      if (calculatedCopay === 0) {
        if (walletBalance >= price) {
          method = 'WALLET_ONLY';
          userPays = 0;
        } else {
          method = 'OUT_OF_POCKET';
          userPays = price - walletBalance;
        }
      } else if (walletBalance >= calculatedWalletCoverage) {
        method = 'COPAY';
        userPays = calculatedCopay;
      } else if (walletBalance > 0) {
        method = 'OUT_OF_POCKET';
        userPays = price - walletBalance;
      } else {
        method = 'FULL_PAYMENT';
        userPays = price;
      }

      setPaymentMethod(method);
      setUserPayment(userPays);

      console.log('[ConfirmDental] Payment breakdown calculated (simple):', {
        copayAmount: calculatedCopay,
        walletCoverage: calculatedWalletCoverage,
        paymentMethod: method,
        userPayment: userPays,
      });
    }
  }, [price, walletBalance, copayPercentage, validationResult]);

  // ============================================================================
  // VALIDATE BOOKING: After data loaded
  // ============================================================================

  useEffect(() => {
    const validateBooking = async () => {
      if (!userId || !patientId || !price || !slotId) {
        console.log('[ConfirmDental] Waiting for data before validation...');
        return;
      }

      try {
        console.log('[ConfirmDental] Validating booking...');
        setValidating(true);

        const response = await apiClient.post<any>('/dental-bookings/validate', {
          patientId,
          clinicId,
          serviceCode,
          slotId,
          price,
        });

        console.log('[ConfirmDental] Validation result:', response.data);
        setValidationResult(response.data);
      } catch (err: any) {
        console.error('[ConfirmDental] Error validating booking:', err);
      } finally {
        setValidating(false);
      }
    };

    validateBooking();
  }, [userId, patientId, price, slotId, clinicId, serviceCode]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleConfirmPayment = useCallback(async () => {
    if (!userId || !patientId || !price) {
      console.warn('[ConfirmDental] Missing data for payment');
      return;
    }

    console.log('[ConfirmDental] Processing payment...', { paymentMethod, userPayment });
    setLoading(true);

    try {
      // SCENARIO 1: WALLET_ONLY - Create booking directly (no external payment needed)
      if (paymentMethod === 'WALLET_ONLY' && userPayment === 0) {
        console.log('[ConfirmDental] Creating booking with WALLET_ONLY payment...');

        const bookingData = {
          patientId,
          clinicId,
          serviceCode,
          serviceName: service?.name || '',
          slotId,
          price,
          appointmentDate,
          appointmentTime,
          paymentAlreadyProcessed: false,
        };

        const response = await apiClient.post<{ bookingId: string }>('/dental-bookings', bookingData);

        console.log('[ConfirmDental] Booking created successfully:', response.data);
        setBookingId(response.data.bookingId);
        setBookingSuccess(true);
        return;
      }

      // SCENARIO 2-4: COPAY, OUT_OF_POCKET, FULL_PAYMENT - Require external payment
      if (userPayment > 0) {
        console.log('[ConfirmDental] Creating pending payment for amount:', userPayment);

        const paymentData = {
          amount: userPayment,
          paymentType: paymentMethod,
          serviceType: 'DENTAL',
          serviceReferenceId: slotId,
          description: `Dental appointment at ${clinic?.clinicName || 'clinic'}`,
          userId,
          patientId,
        };

        const paymentResponse = await apiClient.post<{ paymentId: string }>(
          '/payments',
          paymentData
        );

        const paymentId = paymentResponse.data.paymentId;
        console.log('[ConfirmDental] Pending payment created:', paymentId);

        // Store booking data in AsyncStorage
        const bookingData = {
          serviceType: 'DENTAL',
          serviceDetails: {
            clinicId: clinicId || '',
            clinicName: clinic?.clinicName || '',
            serviceCode: serviceCode || '',
            serviceName: service?.name || '',
            slotId: slotId || '',
            date: appointmentDate || '',
            time: appointmentTime || '',
          },
          patientId,
          patientName,
          userId,
          consultationFee: price,
          walletCoverage,
          copayAmount,
          excessAmount,
          serviceTransactionLimit: serviceLimit,
          insurancePayment,
          paymentId,
        };

        console.log('[ConfirmDental] Storing booking data in AsyncStorage:', bookingData);
        await AsyncStorage.setItem('pendingBooking', JSON.stringify(bookingData));

        // Redirect to payment gateway
        const redirectUrl = '/member/bookings?tab=dental';
        router.push(`/member/payments/${paymentId}?redirect=${redirectUrl}` as any);
        return;
      }

      // Fallback
      Alert.alert('Error', 'Unable to process payment. Please try again.');
    } catch (err: any) {
      console.error('[ConfirmDental] Error processing payment:', err);

      if (err.response?.status === 400) {
        Alert.alert('Payment Failed', err.response.data?.message || 'Invalid payment data. Please try again.');
      } else if (err.response?.status === 401) {
        Alert.alert('Authentication Failed', 'Please log in again.');
      } else if (err.response?.status === 409) {
        Alert.alert('Slot Unavailable', 'This time slot is no longer available. Please select a different slot.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        Alert.alert('Request Timeout', 'The request timed out. Please check your internet connection and try again.');
      } else if (!err.response) {
        Alert.alert('Network Error', 'Please check your internet connection.');
      } else {
        Alert.alert('Payment Failed', err.response?.data?.message || 'Failed to process payment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    patientId,
    price,
    service,
    clinic,
    clinicId,
    serviceCode,
    slotId,
    appointmentDate,
    appointmentTime,
    paymentMethod,
    userPayment,
    walletCoverage,
    copayAmount,
    excessAmount,
    serviceLimit,
    insurancePayment,
    router,
  ]);

  const handleViewBookings = useCallback(() => {
    console.log('[ConfirmDental] Navigating to bookings');
    router.push('/member/bookings?tab=dental' as any);
  }, [router]);

  // ============================================================================
  // SUCCESS SCREEN
  // ============================================================================

  if (bookingSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ maxWidth: 480, width: '100%' }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 32,
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
                marginBottom: 20,
              }}
            >
              <CheckCircleIcon size={32} />
            </View>

            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}>
              Booking Confirmed!
            </Text>

            {/* Booking ID */}
            <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 4, textAlign: 'center' }}>
              Booking ID: {bookingId}
            </Text>

            {/* Date & Time */}
            <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 24, textAlign: 'center' }}>
              {formatDate(appointmentDate)} at {appointmentTime}
            </Text>

            {/* View Bookings Button */}
            <TouchableOpacity
              onPress={handleViewBookings}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: COLORS.success,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                View Bookings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MAIN CONFIRMATION SCREEN
  // ============================================================================

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
                  Confirm Booking
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Review your booking details
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
          {/* ===== SERVICE DETAILS CARD ===== */}
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
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(3, 77, 162, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ToothIcon size={18} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                Service Details
              </Text>
            </View>

            {/* Service Name & Description */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary, marginBottom: 4 }}>
                {service?.name || 'Dental Service'}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textGray, lineHeight: 18 }}>
                {service?.description || ''}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 12 }} />

            {/* Clinic Location */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <MapPinIcon size={18} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary, marginBottom: 2 }}>
                  {clinic?.clinicName || 'Dental Clinic'}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                  {clinic?.address?.city || ''}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== APPOINTMENT DETAILS CARD ===== */}
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
              Appointment Details
            </Text>

            <View style={{ gap: 12 }}>
              {/* Patient */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <UserIcon size={18} />
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Patient</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                  {patientName}
                </Text>
              </View>

              {/* Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CalendarIcon size={18} />
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Date</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                  {formatDate(appointmentDate)}
                </Text>
              </View>

              {/* Time */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ClockIcon size={18} />
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Time</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                  {appointmentTime}
                </Text>
              </View>

              {/* Service Fee */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BanknotesIcon size={18} />
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Service Fee</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                  ₹{price}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== PAYMENT BREAKDOWN CARD ===== */}
          {!dataLoading && (copayPercentage > 0 || serviceLimit > 0) && (
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
                Payment Breakdown
              </Text>

              <View style={{ gap: 12 }}>
                {/* Service Fee */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Service Fee</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                    ₹{price}
                  </Text>
                </View>

                {/* Service Transaction Limit (if applicable) */}
                {serviceLimit > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Service Transaction Limit</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                      ₹{serviceLimit}
                    </Text>
                  </View>
                )}

                {/* Insurance Coverage */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Insurance Coverage</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.success }}>
                    -₹{insurancePayment}
                  </Text>
                </View>

                {/* Copay */}
                {copayAmount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>
                      Copay ({copayPercentage}%)
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                      ₹{copayAmount}
                    </Text>
                  </View>
                )}

                {/* Excess Amount (if service limit exceeded) */}
                {excessAmount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Excess Amount</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                      ₹{excessAmount}
                    </Text>
                  </View>
                )}

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

                {/* Total You Pay */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                    Total You Pay
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                    ₹{userPayment}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ===== WALLET BALANCE CARD ===== */}
          {!dataLoading && (
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
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(3, 77, 162, 0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <WalletIcon size={18} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                  Wallet Balance
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {/* Current Balance */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Current Balance</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                    ₹{walletBalance}
                  </Text>
                </View>

                {/* After This Booking */}
                {(paymentMethod === 'WALLET_ONLY' || paymentMethod === 'COPAY' || paymentMethod === 'OUT_OF_POCKET') && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>After This Booking</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                      ₹{Math.max(0, walletBalance - (paymentMethod === 'WALLET_ONLY' ? price : walletCoverage))}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ===== PAYMENT BUTTON / LOADING ===== */}
          {dataLoading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ fontSize: 14, color: COLORS.textGray }}>Loading payment details...</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleConfirmPayment}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                backgroundColor: loading
                  ? '#9CA3AF'
                  : paymentMethod === 'WALLET_ONLY'
                  ? COLORS.success
                  : COLORS.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                {loading
                  ? 'Processing...'
                  : paymentMethod === 'WALLET_ONLY'
                  ? 'Confirm Booking'
                  : `Pay ₹${userPayment}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
