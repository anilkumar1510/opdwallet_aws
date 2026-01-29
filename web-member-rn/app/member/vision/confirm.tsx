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
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BanknotesIcon,
  CheckCircleIcon,
  WalletIcon,
  EyeIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

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

export default function ConfirmVisionBookingPage() {
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
    console.log('[ConfirmVision] Component mounted');

    if (!clinicId || !serviceCode || !patientId || !slotId || !appointmentDate || !appointmentTime) {
      console.error('[ConfirmVision] Missing required params, redirecting to vision page');
      router.replace('/member/vision');
      return;
    }

    console.log('[ConfirmVision] Query params:', {
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
        console.log('[ConfirmVision] Fetching initial data...');
        setDataLoading(true);

        // Fetch user ID
        const authResponse = await apiClient.get<{ _id: string }>('/auth/me');
        const currentUserId = authResponse.data._id;
        setUserId(currentUserId);
        console.log('[ConfirmVision] User ID:', currentUserId);

        // Fetch patient profile to get name
        const profileResponse = await apiClient.get<{
          user: { _id: string; name: { firstName: string; lastName: string } };
          dependents?: Array<{ _id: string; name: { firstName: string; lastName: string } }>;
        }>('/member/profile');

        // Check if patient is self or dependent
        if (profileResponse.data.user._id === patientId) {
          const name = `${profileResponse.data.user.name.firstName} ${profileResponse.data.user.name.lastName}`;
          setPatientName(name);
          console.log('[ConfirmVision] Patient is self:', name);
        } else {
          const dependent = profileResponse.data.dependents?.find((d) => d._id === patientId);
          if (dependent) {
            const name = `${dependent.name.firstName} ${dependent.name.lastName}`;
            setPatientName(name);
            console.log('[ConfirmVision] Patient is dependent:', name);
          }
        }

        // Fetch service details (CAT007 for Vision)
        const servicesResponse = await apiClient.get<{ services: Service[] }>(
          '/member/benefits/CAT007/services'
        );
        const foundService = servicesResponse.data.services?.find((s) => s.code === serviceCode);
        setService(foundService || null);
        console.log('[ConfirmVision] Service found:', foundService?.name);

        // Fetch clinic details and price
        const clinicsResponse = await apiClient.get<{ clinics: Clinic[] }>(
          `/vision-bookings/clinics?serviceCode=${serviceCode}`
        );
        const foundClinic = clinicsResponse.data.clinics?.find((c) => c.clinicId === clinicId);
        setClinic(foundClinic || null);
        const servicePrice = foundClinic?.servicePrice || 0;
        setPrice(servicePrice);
        console.log('[ConfirmVision] Clinic found:', foundClinic?.clinicName, 'Price:', servicePrice);

        // Fetch wallet balance for patient
        try {
          const walletResponse = await apiClient.get<{
            totalBalance: { current: number; allocated: number; consumed: number };
          }>(`/wallet/balance?userId=${patientId}`);
          const balance = walletResponse.data.totalBalance?.current || 0;
          setWalletBalance(balance);
          console.log('[ConfirmVision] Wallet balance:', balance);
        } catch (walletErr) {
          console.warn('[ConfirmVision] Could not fetch wallet balance:', walletErr);
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
          console.log('[ConfirmVision] Copay percentage:', percentage);
        } catch (policyErr) {
          console.warn('[ConfirmVision] Could not fetch policy (no copay):', policyErr);
          setCopayPercentage(0);
        }

        // Calculate payment breakdown after fetching price, wallet, and copay
        // This will be done in a separate useEffect after price is set
      } catch (err: any) {
        console.error('[ConfirmVision] Error fetching data:', err);
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
      console.log('[ConfirmVision] Waiting for price to be set...');
      return;
    }

    console.log('[ConfirmVision] Calculating payment breakdown:', {
      price,
      walletBalance,
      copayPercentage,
      validationResult,
    });

    // Check if validation result has service limit breakdown
    if (validationResult?.breakdown) {
      const breakdown = validationResult.breakdown;
      console.log('[ConfirmVision] Using validation breakdown with service limits:', breakdown);

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

      console.log('[ConfirmVision] Payment breakdown calculated (with service limits):', {
        serviceLimit: breakdown.serviceTransactionLimit,
        insurancePayment: breakdown.insurancePayment,
        copayAmount: breakdown.copayAmount,
        excessAmount: breakdown.excessAmount,
        totalUserPayment,
        paymentMethod: method,
      });
    } else {
      // Fallback: Simple copay calculation without service limits
      console.log('[ConfirmVision] Using simple copay calculation (no service limits)');

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

      console.log('[ConfirmVision] Payment breakdown calculated (simple):', {
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
        console.log('[ConfirmVision] Waiting for data before validation...');
        return;
      }

      try {
        console.log('[ConfirmVision] Validating booking...');
        setValidating(true);

        const response = await apiClient.post<any>('/vision-bookings/validate', {
          patientId,
          clinicId,
          serviceCode,
          slotId,
          price,
        });

        console.log('[ConfirmVision] Validation result:', response.data);
        setValidationResult(response.data);
      } catch (err: any) {
        console.error('[ConfirmVision] Error validating booking:', err);
        // Validation errors are not critical - continue anyway
      } finally {
        setValidating(false);
      }
    };

    validateBooking();
  }, [userId, patientId, price, slotId, clinicId, serviceCode]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleConfirmBooking = useCallback(async () => {
    if (!patientId || !clinicId || !serviceCode || !slotId) {
      console.warn('[ConfirmVision] Missing data for booking');
      return;
    }

    console.log('[ConfirmVision] Creating booking...');
    setLoading(true);

    try {
      // Create booking directly (payment processed after confirmation by operations team)
      const bookingData = {
        patientId,
        clinicId,
        serviceCode,
        serviceName: service?.name || 'Vision Service',
        slotId,
        price,
        appointmentDate,
        appointmentTime,
      };

      console.log('[ConfirmVision] Booking data:', bookingData);

      const response = await apiClient.post<{ bookingId: string; message: string }>('/vision-bookings', bookingData);

      console.log('[ConfirmVision] Booking created successfully:', response.data);
      setBookingId(response.data.bookingId);
      setBookingSuccess(true);
    } catch (err: any) {
      console.error('[ConfirmVision] Error creating booking:', err);

      // Handle specific error cases
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create booking';

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
    patientId,
    clinicId,
    serviceCode,
    slotId,
    service,
    price,
    appointmentDate,
    appointmentTime,
  ]);

  const handleViewBookings = useCallback(() => {
    console.log('[ConfirmVision] Navigating to bookings');
    router.push('/member/bookings?tab=vision' as any);
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
            <View style={{ marginBottom: 24 }}>
              <IconCircle icon={CheckCircleIcon} size="lg" />
            </View>

            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0E51A2', marginBottom: 8, textAlign: 'center' }}>
              Booking Confirmed!
            </Text>

            {/* Booking ID */}
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>
              Booking ID: {bookingId}
            </Text>

            {/* Date & Time */}
            <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, textAlign: 'center' }}>
              {formatDate(appointmentDate)} at {appointmentTime}
            </Text>

            {/* View Bookings Button */}
            <TouchableOpacity
              onPress={handleViewBookings}
              activeOpacity={0.8}
              style={{ width: '100%' }}
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
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8, borderRadius: 8 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  Confirm Vision Booking
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
          paddingVertical: 24,
          paddingBottom: 96,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 16 }}>
          {/* ===== SERVICE DETAILS CARD ===== */}
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
              Service Details
            </Text>

            {/* Service Name & Description */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <IconCircle icon={EyeIcon} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2', marginBottom: 4 }}>
                  {service?.name || 'Vision Service'}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>
                  {service?.description || ''}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#F7DCAF', marginBottom: 16 }} />

            {/* Clinic Location */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <MapPinIcon width={20} height={20} color="#0F5FDC" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2', marginBottom: 2 }}>
                  {clinic?.clinicName || 'Vision Clinic'}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  {clinic?.address?.city || ''}
                </Text>
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
              Appointment Details
            </Text>

            <View style={{ gap: 12 }}>
              {/* Patient */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <UserIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Patient</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                  {patientName}
                </Text>
              </View>

              {/* Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CalendarIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Date</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                  {formatDate(appointmentDate)}
                </Text>
              </View>

              {/* Time */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ClockIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Time</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                  {appointmentTime}
                </Text>
              </View>

              {/* Service Fee */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BanknotesIcon width={20} height={20} color="#0F5FDC" />
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Service Fee</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>
                  ₹{price}
                </Text>
              </View>
            </View>

            {/* Payment Note */}
            <View
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                backgroundColor: '#FEF1E7',
                borderWidth: 1,
                borderColor: '#F9B376',
              }}
            >
              <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>
                Payment will be processed after your appointment is confirmed by our operations team.
              </Text>
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
                Payment Breakdown
              </Text>

              <View style={{ gap: 12 }}>
                {/* Service Fee */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Service Fee</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                    ₹{price}
                  </Text>
                </View>

                {/* Service Transaction Limit (if applicable) */}
                {serviceLimit > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Service Transaction Limit</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                      ₹{serviceLimit}
                    </Text>
                  </View>
                )}

                {/* Insurance Coverage */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Insurance Coverage</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#25A425' }}>
                    -₹{insurancePayment}
                  </Text>
                </View>

                {/* Copay */}
                {copayAmount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      Copay ({copayPercentage}%)
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                      ₹{copayAmount}
                    </Text>
                  </View>
                )}

                {/* Excess Amount (if service limit exceeded) */}
                {excessAmount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Excess Amount</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#F97316' }}>
                      ₹{excessAmount}
                    </Text>
                  </View>
                )}

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#F7DCAF', marginVertical: 4 }} />

                {/* Total You Pay */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                    Total You Pay
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                    ₹{userPayment}
                  </Text>
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
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                  Wallet Balance
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {/* Current Balance */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Current Balance</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2' }}>
                    ₹{walletBalance}
                  </Text>
                </View>

                {/* After This Booking */}
                {paymentMethod === 'WALLET_ONLY' || paymentMethod === 'COPAY' || paymentMethod === 'OUT_OF_POCKET' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>After This Booking</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#25A425' }}>
                      ₹{Math.max(0, walletBalance - (paymentMethod === 'WALLET_ONLY' ? price : walletCoverage))}
                    </Text>
                  </View>
                ) : null}
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
            <TouchableOpacity
              onPress={handleConfirmBooking}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9ca3af', '#9ca3af'] : ['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
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
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
