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
  BanknotesIcon,
  CheckCircleIcon,
  WalletIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  valid: boolean;
  breakdown?: {
    serviceTransactionLimit?: number;
    insuranceEligibleAmount?: number;
    insurancePayment?: number;
    excessAmount?: number;
    copayAmount?: number;
    totalMemberPayment?: number;
    wasServiceLimitApplied?: boolean;
  };
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

export default function ConfirmAppointmentPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract all query params
  const doctorId = params.doctorId as string;
  const doctorName = params.doctorName as string;
  const specialty = params.specialty as string;
  const clinicId = params.clinicId as string;
  const clinicName = params.clinicName as string;
  const clinicAddress = params.clinicAddress as string;
  const consultationFee = params.consultationFee as string;
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;
  const appointmentDate = params.appointmentDate as string;
  const timeSlot = params.timeSlot as string;
  const slotId = params.slotId as string;

  // State
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');
  const [userId, setUserId] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
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

  const price = parseFloat(consultationFee || '0');

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ============================================================================
  // VALIDATION: Redirect if missing required params
  // ============================================================================

  useEffect(() => {
    console.log('[ConfirmAppointment] Component mounted');

    if (!doctorId || !clinicId || !patientId || !appointmentDate || !timeSlot) {
      console.error('[ConfirmAppointment] Missing required params, redirecting');
      router.replace('/member/in-clinic-consultation');
      return;
    }

    console.log('[ConfirmAppointment] Query params:', {
      doctorId,
      doctorName,
      clinicId,
      patientId,
      appointmentDate,
      timeSlot,
      consultationFee,
    });
  }, [doctorId, clinicId, patientId, appointmentDate, timeSlot, router, doctorName, consultationFee]);

  // ============================================================================
  // FETCH INITIAL DATA: User, Wallet, Policy
  // ============================================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[ConfirmAppointment] Fetching initial data...');
        setDataLoading(true);

        // Fetch user ID
        const authResponse = await apiClient.get<{ _id: string }>('/auth/me');
        const currentUserId = authResponse.data._id;
        setUserId(currentUserId);
        console.log('[ConfirmAppointment] User ID:', currentUserId);

        // Fetch wallet balance for patient
        try {
          const walletResponse = await apiClient.get<{
            totalBalance: { current: number; allocated: number; consumed: number };
          }>(`/wallet/balance?userId=${patientId}`);
          const balance = walletResponse.data.totalBalance?.current || 0;
          setWalletBalance(balance);
          console.log('[ConfirmAppointment] Wallet balance:', balance);
        } catch (walletErr) {
          console.warn('[ConfirmAppointment] Could not fetch wallet balance:', walletErr);
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
          console.log('[ConfirmAppointment] Copay percentage:', percentage);
        } catch (policyErr) {
          console.warn('[ConfirmAppointment] Could not fetch policy (no copay):', policyErr);
          setCopayPercentage(0);
        }
      } catch (err: any) {
        console.error('[ConfirmAppointment] Error fetching data:', err);
        Alert.alert('Error', 'Failed to load booking details. Please try again.');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  // ============================================================================
  // VALIDATE BOOKING: After data loaded
  // ============================================================================

  useEffect(() => {
    const validateBooking = async () => {
      if (!userId || !patientId || !price) {
        console.log('[ConfirmAppointment] Waiting for data before validation...');
        return;
      }

      try {
        console.log('[ConfirmAppointment] Validating booking...');
        setValidating(true);

        const response = await apiClient.post<ValidationResult>('/appointments/validate-booking', {
          patientId,
          specialty,
          doctorId,
          consultationFee: price,
          appointmentType: 'IN_CLINIC',
        });

        console.log('[ConfirmAppointment] Validation result:', response.data);
        setValidationResult(response.data);
      } catch (err: any) {
        console.error('[ConfirmAppointment] Error validating booking:', err);
        // Validation errors are not critical - continue anyway
      } finally {
        setValidating(false);
      }
    };

    validateBooking();
  }, [userId, patientId, price, specialty, doctorId]);

  // ============================================================================
  // CALCULATE PAYMENT BREAKDOWN
  // ============================================================================

  useEffect(() => {
    if (price === 0) {
      console.log('[ConfirmAppointment] Waiting for price to be set...');
      return;
    }

    console.log('[ConfirmAppointment] Calculating payment breakdown:', {
      price,
      walletBalance,
      copayPercentage,
      validationResult,
    });

    // Check if validation result has service limit breakdown
    if (validationResult?.breakdown) {
      const breakdown = validationResult.breakdown;
      console.log('[ConfirmAppointment] Using validation breakdown with service limits:', breakdown);

      setServiceLimit(breakdown.serviceTransactionLimit || 0);
      setInsurancePayment(breakdown.insurancePayment || 0);
      setExcessAmount(breakdown.excessAmount || 0);
      setCopayAmount(breakdown.copayAmount || 0);

      const calculatedWalletCoverage = breakdown.insurancePayment || 0;
      setWalletCoverage(calculatedWalletCoverage);

      const totalUserPayment = breakdown.totalMemberPayment || (breakdown.copayAmount || 0) + (breakdown.excessAmount || 0);

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

      console.log('[ConfirmAppointment] Payment breakdown calculated (with service limits):', {
        serviceLimit: breakdown.serviceTransactionLimit,
        insurancePayment: breakdown.insurancePayment,
        copayAmount: breakdown.copayAmount,
        excessAmount: breakdown.excessAmount,
        totalUserPayment,
        paymentMethod: method,
      });
    } else {
      // Fallback: Simple copay calculation without service limits
      console.log('[ConfirmAppointment] Using simple copay calculation (no service limits)');

      const calculatedCopay = Math.round((price * copayPercentage) / 100);
      const calculatedWalletCoverage = price - calculatedCopay;
      setCopayAmount(calculatedCopay);
      setWalletCoverage(calculatedWalletCoverage);
      setServiceLimit(0);
      setExcessAmount(0);
      setInsurancePayment(calculatedWalletCoverage);

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

      console.log('[ConfirmAppointment] Payment breakdown calculated (simple):', {
        copayAmount: calculatedCopay,
        walletCoverage: calculatedWalletCoverage,
        paymentMethod: method,
        userPayment: userPays,
      });
    }
  }, [price, walletBalance, copayPercentage, validationResult]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleConfirmBooking = useCallback(async () => {
    if (!patientId || !doctorId || !clinicId || !appointmentDate || !timeSlot) {
      console.warn('[ConfirmAppointment] Missing data for booking');
      return;
    }

    console.log('[ConfirmAppointment] Processing booking...');
    setLoading(true);

    try {
      // CASE 1: Fully covered by wallet (no user payment required)
      if (userPayment === 0) {
        console.log('[ConfirmAppointment] Fully covered by wallet - creating appointment directly...');

        const appointmentData = {
          userId,
          patientName,
          patientId,
          doctorId,
          doctorName,
          specialty,
          slotId: slotId || `${doctorId}_${clinicId}_${appointmentDate}_${timeSlot}`,
          clinicId,
          clinicName,
          clinicAddress,
          appointmentType: 'IN_CLINIC',
          appointmentDate,
          timeSlot,
          consultationFee: price,
        };

        console.log('[ConfirmAppointment] Appointment data:', appointmentData);

        const response = await apiClient.post<{ appointmentId: string; message: string }>(
          '/appointments',
          appointmentData
        );

        console.log('[ConfirmAppointment] Appointment created successfully:', response.data);
        setAppointmentId(response.data.appointmentId);
        setBookingSuccess(true);
        return;
      }

      // CASE 2: User needs to pay copay/out-of-pocket
      console.log('[ConfirmAppointment] User needs to pay:', userPayment);

      // Create pending payment via API
      const paymentData = {
        amount: userPayment,
        paymentType: copayAmount > 0 ? 'COPAY' : 'OUT_OF_POCKET',
        serviceType: 'IN_CLINIC_APPOINTMENT',
        serviceReferenceId: `APPT_${Date.now()}`, // Temporary reference, will be updated after appointment creation
        description: `Doctor consultation: ${doctorName} - ${specialty}`,
        userId: userId,
        patientId: patientId,
        metadata: {
          doctorId,
          doctorName,
          specialty,
          clinicId,
          clinicName,
          clinicAddress,
          slotId: slotId || `${doctorId}_${clinicId}_${appointmentDate}_${timeSlot}`,
          appointmentDate,
          appointmentTime: timeSlot,
          consultationFee: price,
          walletCoverage: walletCoverage,
          copayAmount: copayAmount,
          excessAmount: excessAmount,
          serviceTransactionLimit: serviceLimit,
          insurancePayment: insurancePayment,
        },
      };

      console.log('[ConfirmAppointment] Creating pending payment:', paymentData);

      const paymentResponse = await apiClient.post<{
        paymentId: string;
        _id: string;
      }>('/payments', paymentData);

      const paymentId = paymentResponse.data.paymentId || paymentResponse.data._id;
      console.log('[ConfirmAppointment] Pending payment created:', paymentId);

      // Store appointment data in AsyncStorage for completion after payment
      const pendingBookingData = {
        serviceType: 'IN_CLINIC_APPOINTMENT',
        serviceDetails: {
          doctorId,
          doctorName,
          specialty,
          clinicId,
          clinicName,
          clinicAddress,
          slotId: slotId || `${doctorId}_${clinicId}_${appointmentDate}_${timeSlot}`,
          date: appointmentDate,
          time: timeSlot,
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

      console.log('[ConfirmAppointment] Storing pending booking in AsyncStorage:', pendingBookingData);
      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBookingData));

      // Redirect to payment gateway
      const redirectUrl = '/member/in-clinic-consultation';
      console.log('[ConfirmAppointment] Redirecting to payment gateway:', paymentId);
      router.push(`/member/payments/${paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
    } catch (err: any) {
      console.error('[ConfirmAppointment] Error processing booking:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Failed to process booking';

      if (err.response?.status === 400) {
        Alert.alert('Booking Failed', errorMessage);
      } else if (err.response?.status === 401) {
        Alert.alert('Authentication Failed', 'Please log in again.');
      } else if (err.response?.status === 409) {
        Alert.alert('Slot Unavailable', 'This time slot is no longer available. Please select a different slot.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        Alert.alert('Request Timeout', 'The request timed out. Please check your internet connection and try again.');
      } else if (!err.response) {
        Alert.alert('Network Error', 'Please check your internet connection.');
      } else {
        Alert.alert('Booking Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    patientId,
    patientName,
    doctorId,
    doctorName,
    specialty,
    clinicId,
    clinicName,
    clinicAddress,
    appointmentDate,
    timeSlot,
    slotId,
    price,
    userPayment,
    copayAmount,
    excessAmount,
    walletCoverage,
    serviceLimit,
    insurancePayment,
    router,
  ]);

  const handleViewAppointments = useCallback(() => {
    console.log('[ConfirmAppointment] Navigating to appointments list');
    router.push('/member/in-clinic-consultation' as any);
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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
              borderRadius: 12,
              padding: 24,
              borderWidth: 2,
              borderColor: '#F7DCAF',
              alignItems: 'center',
            }}
          >
            {/* Success Icon */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#25A425',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <CheckCircleIcon width={48} height={48} color="#FFFFFF" />
            </View>

            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2', marginBottom: 8, textAlign: 'center' }}>
              Booking Confirmed!
            </Text>

            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center' }}>
              Your appointment has been booked and is awaiting confirmation
            </Text>

            {/* Appointment ID */}
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 8,
                padding: 16,
                borderWidth: 1,
                borderColor: '#86ACD8',
                marginBottom: 24,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Appointment ID</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F5FDC' }}>{appointmentId}</Text>
            </LinearGradient>

            {/* Details */}
            <View style={{ gap: 12, width: '100%', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <UserIcon width={20} height={20} color="#0F5FDC" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Doctor</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }} numberOfLines={1}>
                    {doctorName}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CalendarIcon width={20} height={20} color="#0F5FDC" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Date</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                    {formatDate(appointmentDate)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ClockIcon width={20} height={20} color="#0F5FDC" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Time</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{timeSlot}</Text>
                </View>
              </View>
            </View>

            {/* View Appointments Button */}
            <TouchableOpacity onPress={handleViewAppointments} activeOpacity={0.8} style={{ width: '100%' }}>
              <LinearGradient
                colors={['#16a34a', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>View Appointments</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // ============================================================================
  // MAIN CONFIRMATION SCREEN
  // ============================================================================

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
              <TouchableOpacity onPress={handleBack} style={{ padding: 8, borderRadius: 8 }} activeOpacity={0.7}>
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>Confirm Appointment</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Review your booking details</Text>
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
          {/* ===== DOCTOR DETAILS CARD ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>Doctor Details</Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <IconCircle icon={UserIcon} size="lg" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>{doctorName}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{specialty}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#F7DCAF', marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <MapPinIcon width={20} height={20} color="#0F5FDC" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2', marginBottom: 2 }}>{clinicName}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{clinicAddress}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ===== APPOINTMENT DETAILS CARD ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>Appointment Details</Text>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <UserIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Patient</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{patientName}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CalendarIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Date</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{formatDate(appointmentDate)}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ClockIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Time</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>{timeSlot}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BanknotesIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Consultation Fee</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>₹{price}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ===== PAYMENT BREAKDOWN CARD ===== */}
          {!dataLoading && (copayPercentage > 0 || serviceLimit > 0) && (
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>Payment Breakdown</Text>

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Consultation Fee</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>₹{price}</Text>
                </View>

                {serviceLimit > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Service Transaction Limit</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>₹{serviceLimit}</Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Insurance Coverage</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>-₹{insurancePayment}</Text>
                </View>

                {copayAmount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Copay ({copayPercentage}%)</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>₹{copayAmount}</Text>
                  </View>
                )}

                {excessAmount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Excess Amount</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>₹{excessAmount}</Text>
                  </View>
                )}

                <View style={{ height: 1, backgroundColor: '#F7DCAF', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>Total You Pay</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>₹{userPayment}</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* ===== WALLET BALANCE CARD ===== */}
          {!dataLoading && (
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <WalletIcon width={20} height={20} color="#0F5FDC" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>Wallet Balance</Text>
              </View>

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Current Balance</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2' }}>₹{walletBalance}</Text>
                </View>

                {(paymentMethod === 'WALLET_ONLY' || paymentMethod === 'COPAY' || paymentMethod === 'OUT_OF_POCKET') && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>After This Booking</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#25A425' }}>
                      ₹{Math.max(0, walletBalance - (paymentMethod === 'WALLET_ONLY' ? price : walletCoverage))}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          )}

          {/* ===== CONFIRM BUTTON / LOADING ===== */}
          {dataLoading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator size="small" color="#0F5FDC" />
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Loading booking details...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={handleConfirmBooking} disabled={loading} activeOpacity={0.8}>
                <LinearGradient
                  colors={loading ? ['#9ca3af', '#9ca3af'] : userPayment === 0 ? ['#16a34a', '#22c55e'] : ['#1F63B4', '#5DA4FB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    borderRadius: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: loading ? 0 : 4 },
                    shadowOpacity: loading ? 0 : 0.2,
                    shadowRadius: 8,
                    elevation: loading ? 0 : 4,
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
                      : userPayment === 0
                      ? 'Confirm Appointment (Fully Covered)'
                      : `Pay ₹${userPayment} & Confirm`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Payment Note */}
              {userPayment > 0 && (
                <View
                  style={{
                    marginTop: 12,
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
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
