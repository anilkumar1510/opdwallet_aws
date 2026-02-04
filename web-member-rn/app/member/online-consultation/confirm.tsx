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
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  BanknotesIcon,
  WalletIcon,
  XMarkIcon,
} from '../../../src/components/icons/InlineSVGs';
import { useFamily } from '../../../src/contexts/FamilyContext';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
  primary: '#034DA2',
  primaryLight: '#0E51A2',
  textDark: '#1c1c1c',
  textGray: '#6B7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  cardBorder: '#E5E7EB',
  success: '#16a34a',
  error: '#DC2626',
  selectedBorder: '#86ACD8',
  iconBg: 'rgba(3, 77, 162, 0.1)',
};

// ============================================================================
// TYPES
// ============================================================================

interface FamilyMember {
  _id: string;
  userId: string;
  name: string;
  relation: string;
  gender: string;
  dateOfBirth: string;
  isPrimary: boolean;
}

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

interface TimeSlot {
  slotId: string;
  date: string;
  time: string;
  available: boolean;
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
        backgroundColor: COLORS.iconBg,
      }}
    >
      <Icon width={dimensions.icon} height={dimensions.icon} color={COLORS.primary} />
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnlineConfirmPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { viewingUserId } = useFamily();

  // Extract query params
  const doctorId = params.doctorId as string;
  const doctorName = params.doctorName as string;
  const specialty = params.specialty as string;
  const consultationFee = params.consultationFee as string;
  const availableInMinutes = parseInt(params.availableInMinutes as string || '0');
  const defaultPatient = params.defaultPatient as string | undefined;

  const price = parseFloat(consultationFee || '0');

  // State
  const [loading, setLoading] = useState(false);
  const [loadingRelationships, setLoadingRelationships] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<FamilyMember | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [callPreference, setCallPreference] = useState<'VOICE' | 'VIDEO' | 'BOTH'>('BOTH');
  const [timeChoice, setTimeChoice] = useState<'NOW' | 'LATER'>('NOW');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // Payment state
  const [walletBalance, setWalletBalance] = useState(0);
  const [copayPercentage, setCopayPercentage] = useState(0);
  const [copayAmount, setCopayAmount] = useState(0);
  const [walletCoverage, setWalletCoverage] = useState(0);
  const [userPayment, setUserPayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('COPAY');
  const [serviceLimit, setServiceLimit] = useState<number>(0);
  const [excessAmount, setExcessAmount] = useState(0);
  const [insurancePayment, setInsurancePayment] = useState(0);

  // Booked slots state
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ============================================================================
  // FETCH FAMILY MEMBERS
  // ============================================================================

  const fetchRelationships = useCallback(async () => {
    try {
      console.log('[OnlineConfirm] Fetching family members from /member/profile');
      const response = await apiClient.get<{
        user: { _id: string; name: { firstName: string; lastName: string }; gender?: string; dob?: string; phone?: string; mobileNumber?: string };
        dependents?: Array<{ _id: string; name: { firstName: string; lastName: string }; relationship?: string; gender?: string; dob?: string }>;
      }>('/member/profile');

      const data = response.data;
      console.log('[OnlineConfirm] Profile data received:', {
        userId: data.user?._id,
        dependentsCount: data.dependents?.length || 0,
      });

      // Build self member
      const selfMember: FamilyMember = {
        _id: data.user._id,
        userId: data.user._id,
        name: `${data.user.name.firstName} ${data.user.name.lastName}`,
        relation: 'Self',
        gender: data.user.gender || 'Other',
        dateOfBirth: data.user.dob || '',
        isPrimary: true,
      };

      // Build dependent members
      const dependentMembers: FamilyMember[] = (data.dependents || []).map((dep) => ({
        _id: dep._id,
        userId: dep._id,
        name: `${dep.name.firstName} ${dep.name.lastName}`,
        relation: dep.relationship || 'Family Member',
        gender: dep.gender || 'Other',
        dateOfBirth: dep.dob || '',
        isPrimary: false,
      }));

      const allMembers = [selfMember, ...dependentMembers];
      console.log('[OnlineConfirm] Total family members:', allMembers.length);

      setFamilyMembers(allMembers);
      setLoggedInUserId(data.user._id);
      setContactNumber(data.user.phone || data.user.mobileNumber || '');

      // Auto-select patient based on viewingUserId or defaultPatient
      const targetId = defaultPatient || viewingUserId;
      if (targetId && allMembers.length > 0) {
        const defaultMember = allMembers.find((m) => m.userId === targetId);
        if (defaultMember) {
          setSelectedPatient(defaultMember);
          console.log('[OnlineConfirm] Auto-selected patient:', defaultMember.name);
        } else {
          setSelectedPatient(selfMember);
        }
      } else {
        setSelectedPatient(selfMember);
      }
    } catch (error) {
      console.error('[OnlineConfirm] Error fetching family members:', error);
    } finally {
      setLoadingRelationships(false);
    }
  }, [viewingUserId, defaultPatient]);

  useEffect(() => {
    console.log('[OnlineConfirm] Params:', { doctorId, doctorName, specialty, availableInMinutes });
    fetchRelationships();
  }, [doctorId, doctorName, specialty, availableInMinutes, fetchRelationships]);

  // ============================================================================
  // FETCH WALLET & POLICY DATA
  // ============================================================================

  useEffect(() => {
    const fetchWalletAndPolicy = async () => {
      if (!selectedPatient) return;

      try {
        // Fetch wallet balance for patient
        try {
          const walletResponse = await apiClient.get<{
            totalBalance: { current: number; allocated: number; consumed: number };
          }>(`/wallet/balance?userId=${selectedPatient.userId}`);
          const balance = walletResponse.data.totalBalance?.current || 0;
          setWalletBalance(balance);
          console.log('[OnlineConfirm] Wallet balance:', balance);
        } catch (walletErr) {
          console.warn('[OnlineConfirm] Could not fetch wallet balance:', walletErr);
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
          console.log('[OnlineConfirm] Copay percentage:', percentage);
        } catch (policyErr) {
          console.warn('[OnlineConfirm] Could not fetch policy (no copay):', policyErr);
          setCopayPercentage(0);
        }
      } catch (err: any) {
        console.error('[OnlineConfirm] Error fetching wallet/policy:', err);
      }
    };

    fetchWalletAndPolicy();
  }, [selectedPatient]);

  // ============================================================================
  // VALIDATE BOOKING
  // ============================================================================

  useEffect(() => {
    const validateBooking = async () => {
      if (!loggedInUserId || !selectedPatient || !price) {
        return;
      }

      try {
        console.log('[OnlineConfirm] Validating booking...');
        setValidating(true);

        const response = await apiClient.post<ValidationResult>('/appointments/validate-booking', {
          patientId: selectedPatient.userId,
          specialty,
          doctorId,
          consultationFee: price,
          appointmentType: 'ONLINE',
        });

        console.log('[OnlineConfirm] Validation result:', response.data);
        setValidationResult(response.data);
      } catch (err: any) {
        console.error('[OnlineConfirm] Error validating booking:', err);
      } finally {
        setValidating(false);
      }
    };

    validateBooking();
  }, [loggedInUserId, selectedPatient, price, specialty, doctorId]);

  // ============================================================================
  // CALCULATE PAYMENT BREAKDOWN
  // ============================================================================

  useEffect(() => {
    if (price === 0) return;

    if (validationResult?.breakdown) {
      const breakdown = validationResult.breakdown;
      setServiceLimit(breakdown.serviceTransactionLimit || 0);
      setInsurancePayment(breakdown.insurancePayment || 0);
      setExcessAmount(breakdown.excessAmount || 0);
      setCopayAmount(breakdown.copayAmount || 0);
      setWalletCoverage(breakdown.insurancePayment || 0);

      const totalUserPayment = breakdown.totalMemberPayment || (breakdown.copayAmount || 0) + (breakdown.excessAmount || 0);

      let method = 'COPAY';
      let userPays = totalUserPayment;

      if (totalUserPayment === 0) {
        method = 'WALLET_ONLY';
        userPays = 0;
      } else if (walletBalance >= (breakdown.insurancePayment || 0)) {
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
    } else {
      // Simple copay calculation
      const calculatedCopay = Math.round((price * copayPercentage) / 100);
      const calculatedWalletCoverage = price - calculatedCopay;
      setCopayAmount(calculatedCopay);
      setWalletCoverage(calculatedWalletCoverage);
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
    }
  }, [price, walletBalance, copayPercentage, validationResult]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const fetchBookedSlots = useCallback(async () => {
    try {
      setLoadingSlots(true);
      console.log('[OnlineConfirm] Fetching booked slots for doctor:', doctorId);

      // Fetch booked slots for this doctor (ONLINE appointments)
      const response = await apiClient.get<{ date: string; timeSlot: string }[]>(
        `/appointments/doctor/${doctorId}/booked-slots?type=ONLINE`
      );

      // Build set of booked slot keys (date_time format)
      const booked = new Set<string>();
      (response.data || []).forEach((slot) => {
        const slotKey = `${slot.date}_${slot.timeSlot}`;
        booked.add(slotKey);
        console.log('[OnlineConfirm] Slot booked:', slotKey);
      });

      setBookedSlots(booked);
      console.log('[OnlineConfirm] Total booked slots:', booked.size);
    } catch (error) {
      console.error('[OnlineConfirm] Error fetching booked slots:', error);
      // Continue with empty booked slots on error
      setBookedSlots(new Set());
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId]);

  const handleScheduleLater = () => {
    console.log('[OnlineConfirm] Schedule later clicked');
    fetchBookedSlots();
    setShowSlotModal(true);
  };

  const handleSlotSelected = (date: string, time: string, slotId: string) => {
    console.log('[OnlineConfirm] Slot selected:', { date, time, slotId });
    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedSlotId(slotId);
    setTimeChoice('LATER');
    setShowSlotModal(false);
  };

  const handleConfirmBooking = async () => {
    if (!selectedPatient || !contactNumber) {
      Alert.alert('Error', 'Please select patient and enter contact number');
      return;
    }

    if (timeChoice === 'LATER' && (!selectedDate || !selectedTime)) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setLoading(true);

    try {
      // Get local date in YYYY-MM-DD format (not UTC)
      const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const appointmentDate = timeChoice === 'NOW' ? getLocalDateString(new Date()) : selectedDate;
      const appointmentTime = timeChoice === 'NOW' ? 'Immediate' : selectedTime;
      const slotId =
        timeChoice === 'LATER' && selectedSlotId
          ? selectedSlotId
          : `${doctorId}_ONLINE_${appointmentDate}_${appointmentTime.replace(/[:\s]/g, '_')}`;

      // CASE 1: Fully covered by wallet (based on frontend calculation)
      if (userPayment === 0) {
        console.log('[OnlineConfirm] Attempting wallet-only booking...');

        const appointmentData = {
          userId: loggedInUserId,
          patientId: selectedPatient.userId,
          patientName: selectedPatient.name,
          doctorId,
          doctorName,
          specialty,
          appointmentType: 'ONLINE',
          appointmentDate,
          timeSlot: appointmentTime,
          slotId,
          consultationFee: price,
          contactNumber,
          callPreference,
          clinicId: '',
          clinicName: '',
          clinicAddress: '',
        };

        const response = await apiClient.post<{
          appointment: { appointmentId: string };
          paymentRequired: boolean;
          paymentId: string | null;
          transactionId: string | null;
          copayAmount: number;
          walletDebitAmount: number;
        }>('/appointments', appointmentData);

        console.log('[OnlineConfirm] Appointment API response:', response.data);

        // Check if payment is still required (backend may have different balance info)
        if (response.data.paymentRequired && response.data.paymentId) {
          console.log('[OnlineConfirm] Backend requires payment - redirecting to payment page');
          const redirectUrl = '/member/online-consultation';
          router.push(`/member/payments/${response.data.paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
          return;
        }

        // Booking successful with wallet only
        const createdAppointmentId = response.data.appointment?.appointmentId || (response.data as any).appointmentId;
        console.log('[OnlineConfirm] Appointment created successfully:', createdAppointmentId);
        setAppointmentId(createdAppointmentId);
        setBookingSuccess(true);
        return;
      }

      // CASE 2: User needs to pay
      console.log('[OnlineConfirm] User needs to pay:', userPayment);

      const paymentData = {
        amount: userPayment,
        paymentType: copayAmount > 0 ? 'COPAY' : 'OUT_OF_POCKET',
        serviceType: 'ONLINE_CONSULTATION',
        serviceReferenceId: `ONLINE_APPT_${Date.now()}`,
        description: `Online consultation: ${doctorName} - ${specialty}`,
        userId: loggedInUserId,
        patientId: selectedPatient.userId,
        metadata: {
          doctorId,
          doctorName,
          specialty,
          slotId,
          appointmentDate,
          appointmentTime,
          consultationFee: price,
          walletCoverage,
          copayAmount,
          excessAmount,
          serviceTransactionLimit: serviceLimit,
          insurancePayment,
          contactNumber,
          callPreference,
          patientName: selectedPatient.name,
        },
      };

      const paymentResponse = await apiClient.post<{ paymentId: string; _id: string }>('/payments', paymentData);
      const paymentId = paymentResponse.data.paymentId || paymentResponse.data._id;
      console.log('[OnlineConfirm] Pending payment created:', paymentId);

      // Store pending booking data
      const pendingBookingData = {
        serviceType: 'ONLINE_CONSULTATION',
        serviceDetails: {
          doctorId,
          doctorName,
          specialty,
          slotId,
          date: appointmentDate,
          time: appointmentTime,
          contactNumber,
          callPreference,
        },
        patientId: selectedPatient.userId,
        patientName: selectedPatient.name,
        userId: loggedInUserId,
        consultationFee: price,
        walletCoverage,
        copayAmount,
        excessAmount,
        serviceTransactionLimit: serviceLimit,
        insurancePayment,
        paymentId,
      };

      await AsyncStorage.setItem('pendingBooking', JSON.stringify(pendingBookingData));

      // Redirect to payment gateway
      const redirectUrl = '/member/online-consultation';
      router.push(`/member/payments/${paymentId}?redirect=${encodeURIComponent(redirectUrl)}` as any);
    } catch (err: any) {
      console.error('[OnlineConfirm] Error processing booking:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process booking';
      Alert.alert('Booking Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointments = () => {
    // Use replace to remove confirm page from history stack
    router.replace('/member/online-consultation' as any);
  };

  const handleBack = () => {
    router.back();
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateStr: string) => {
    // Get today's date in local timezone (YYYY-MM-DD format)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (!dateStr || dateStr === todayStr) {
      return 'Today';
    }
    const date = new Date(dateStr + 'T00:00:00'); // Parse as local time
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loadingRelationships) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ============================================================================
  // SUCCESS SCREEN
  // ============================================================================

  if (bookingSuccess) {
    // Get local date in YYYY-MM-DD format (not UTC)
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const successDate = timeChoice === 'NOW' ? localDateStr : selectedDate;
    const successTime = timeChoice === 'NOW' ? 'Immediate' : selectedTime;

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
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: COLORS.success,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <CheckCircleIcon width={48} height={48} color={COLORS.white} />
            </View>

            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primaryLight, marginBottom: 8, textAlign: 'center' }}>
              Booking Confirmed!
            </Text>

            <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 24, textAlign: 'center' }}>
              Your online consultation has been booked and is awaiting confirmation
            </Text>

            {/* Appointment ID */}
            <View
              style={{
                borderRadius: 12,
                padding: 16,
                backgroundColor: COLORS.iconBg,
                marginBottom: 24,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 4 }}>Appointment ID</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>{appointmentId}</Text>
            </View>

            {/* Details */}
            <View style={{ gap: 12, width: '100%', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <UserIcon width={20} height={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Doctor</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }} numberOfLines={1}>
                    {doctorName}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CalendarIcon width={20} height={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Date</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>{formatDate(successDate)}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ClockIcon width={20} height={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Time</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>{successTime}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <PhoneIcon width={20} height={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Contact Number</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>{contactNumber}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <VideoCameraIcon width={20} height={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Call Preference</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>
                    {callPreference === 'BOTH' ? 'Voice & Video' : callPreference.charAt(0) + callPreference.slice(1).toLowerCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* View Appointments Button */}
            <TouchableOpacity
              onPress={handleViewAppointments}
              activeOpacity={0.8}
              style={{
                width: '100%',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: COLORS.success,
              }}
            >
              <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>View Online Consultations</Text>
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
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>Confirm Booking</Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>Review and confirm details</Text>
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 16 }}>Doctor Details</Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <IconCircle icon={UserIcon} size="lg" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight }}>{doctorName}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>{specialty}</Text>
                {availableInMinutes !== null && availableInMinutes <= 5 && (
                  <View
                    style={{
                      marginTop: 8,
                      backgroundColor: '#E8F5E9',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <ClockIcon width={12} height={12} color={COLORS.success} />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.success }}>
                      Available {availableInMinutes === 0 ? 'now' : `in ${availableInMinutes} mins`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ===== SELECT PATIENT ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 16 }}>Select Patient</Text>
            <View style={{ gap: 8 }}>
              {familyMembers.map((member) => (
                <TouchableOpacity key={member._id} onPress={() => setSelectedPatient(member)} activeOpacity={0.8}>
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selectedPatient?._id === member._id ? COLORS.primary : COLORS.border,
                      backgroundColor: selectedPatient?._id === member._id ? COLORS.iconBg : COLORS.white,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>{member.name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                      {member.relation}
                      {member.isPrimary && ' (You)'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ===== CONTACT NUMBER ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 16 }}>Contact Number</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                paddingHorizontal: 12,
              }}
            >
              <PhoneIcon width={20} height={20} color="#9CA3AF" />
              <TextInput
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="Enter contact number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  fontSize: 14,
                  color: COLORS.textDark,
                }}
              />
            </View>
            <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 8 }}>Doctor will call you on this number</Text>
          </View>

          {/* ===== CALL PREFERENCE ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 16 }}>Call Preference</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Voice */}
              <TouchableOpacity onPress={() => setCallPreference('VOICE')} activeOpacity={0.8} style={{ flex: 1 }}>
                <View
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: callPreference === 'VOICE' ? COLORS.primary : COLORS.border,
                    backgroundColor: callPreference === 'VOICE' ? COLORS.primary : COLORS.white,
                    alignItems: 'center',
                  }}
                >
                  <PhoneIcon width={24} height={24} color={callPreference === 'VOICE' ? COLORS.white : COLORS.primaryLight} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      marginTop: 4,
                      color: callPreference === 'VOICE' ? COLORS.white : COLORS.primaryLight,
                    }}
                  >
                    Voice
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Video */}
              <TouchableOpacity onPress={() => setCallPreference('VIDEO')} activeOpacity={0.8} style={{ flex: 1 }}>
                <View
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: callPreference === 'VIDEO' ? COLORS.primary : COLORS.border,
                    backgroundColor: callPreference === 'VIDEO' ? COLORS.primary : COLORS.white,
                    alignItems: 'center',
                  }}
                >
                  <VideoCameraIcon width={24} height={24} color={callPreference === 'VIDEO' ? COLORS.white : COLORS.primaryLight} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      marginTop: 4,
                      color: callPreference === 'VIDEO' ? COLORS.white : COLORS.primaryLight,
                    }}
                  >
                    Video
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Both */}
              <TouchableOpacity onPress={() => setCallPreference('BOTH')} activeOpacity={0.8} style={{ flex: 1 }}>
                <View
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: callPreference === 'BOTH' ? COLORS.primary : COLORS.border,
                    backgroundColor: callPreference === 'BOTH' ? COLORS.primary : COLORS.white,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: callPreference === 'BOTH' ? COLORS.white : COLORS.primaryLight,
                    }}
                  >
                    Both
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      marginTop: 2,
                      color: callPreference === 'BOTH' ? 'rgba(255,255,255,0.8)' : COLORS.textGray,
                    }}
                  >
                    Voice & Video
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== WHEN TO CONSULT ===== */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 16 }}>
              When do you want to consult?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {/* Consult Now */}
              <TouchableOpacity onPress={() => setTimeChoice('NOW')} activeOpacity={0.8} style={{ flex: 1 }}>
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: timeChoice === 'NOW' ? COLORS.primary : COLORS.border,
                    backgroundColor: timeChoice === 'NOW' ? COLORS.primary : COLORS.white,
                    alignItems: 'center',
                  }}
                >
                  <ClockIcon width={24} height={24} color={timeChoice === 'NOW' ? COLORS.white : COLORS.primaryLight} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      marginTop: 8,
                      color: timeChoice === 'NOW' ? COLORS.white : COLORS.primaryLight,
                    }}
                  >
                    Consult Now
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: timeChoice === 'NOW' ? 'rgba(255,255,255,0.8)' : COLORS.textGray,
                    }}
                  >
                    Immediate
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Schedule Later */}
              <TouchableOpacity onPress={handleScheduleLater} activeOpacity={0.8} style={{ flex: 1 }}>
                <View
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: timeChoice === 'LATER' ? COLORS.primary : COLORS.border,
                    backgroundColor: timeChoice === 'LATER' ? COLORS.primary : COLORS.white,
                    alignItems: 'center',
                  }}
                >
                  <CalendarIcon width={24} height={24} color={timeChoice === 'LATER' ? COLORS.white : COLORS.primaryLight} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      marginTop: 8,
                      color: timeChoice === 'LATER' ? COLORS.white : COLORS.primaryLight,
                    }}
                  >
                    Schedule Later
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: timeChoice === 'LATER' ? 'rgba(255,255,255,0.8)' : COLORS.textGray,
                    }}
                  >
                    Choose time
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Selected Slot Display */}
            {timeChoice === 'LATER' && selectedDate && selectedTime && (
              <View
                style={{
                  backgroundColor: '#E8F5E9',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.success,
                }}
              >
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>Selected Time:</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primaryLight, marginTop: 4 }}>
                  {selectedDate} at {selectedTime}
                </Text>
                <TouchableOpacity onPress={handleScheduleLater}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.primary, marginTop: 8 }}>Change slot</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ===== PAYMENT SUMMARY ===== */}
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
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Consultation Fee</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹{price}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>Platform Fee</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>₹0</Text>
              </View>

              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark }}>Total Amount</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.success }}>₹{price}</Text>
              </View>
            </View>
          </View>

          {/* ===== CONFIRM BUTTON ===== */}
          <TouchableOpacity
            onPress={handleConfirmBooking}
            disabled={loading || !selectedPatient || !contactNumber}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: loading || !selectedPatient || !contactNumber ? '#9ca3af' : COLORS.primary,
            }}
          >
            {loading && <ActivityIndicator size="small" color={COLORS.white} />}
            <BanknotesIcon width={20} height={20} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===== SLOT SELECTION MODAL ===== */}
      <Modal visible={showSlotModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>Select Time Slot</Text>
              <TouchableOpacity onPress={() => setShowSlotModal(false)}>
                <XMarkIcon width={24} height={24} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>

            {/* Simplified Slot Selection */}
            <ScrollView style={{ padding: 16 }}>
              <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 16 }}>
                Select your preferred date and time for the online consultation.
              </Text>

              {/* Loading indicator */}
              {loadingSlots && (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 8 }}>Loading available slots...</Text>
                </View>
              )}

              {/* Quick Date Options */}
              {!loadingSlots && (
              <View style={{ gap: 12 }}>
                {[0, 1, 2].map((dayOffset) => {
                  const date = new Date();
                  date.setDate(date.getDate() + dayOffset);
                  // Use local date format instead of UTC
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;
                  const dayName = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });

                  // Filter time slots - for today, only show future times
                  const allSlots = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '5:00 PM'];
                  const availableSlots = dayOffset === 0
                    ? allSlots.filter((time) => {
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();

                        // Parse time slot
                        const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                        if (!timeMatch) return true;

                        let hour = parseInt(timeMatch[1], 10);
                        const minute = parseInt(timeMatch[2], 10);
                        const period = timeMatch[3].toUpperCase();

                        // Convert to 24-hour format
                        if (period === 'PM' && hour !== 12) {
                          hour += 12;
                        } else if (period === 'AM' && hour === 12) {
                          hour = 0;
                        }

                        // Compare with current time
                        if (hour > currentHour) return true;
                        if (hour === currentHour && minute > currentMinute) return true;
                        return false;
                      })
                    : allSlots;

                  // Don't show the day if no slots are available
                  if (availableSlots.length === 0) return null;

                  return (
                    <View key={dayOffset}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 8 }}>{dayName}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {availableSlots.map((time) => {
                          const slotKey = `${dateStr}_${time}`;
                          const isBooked = bookedSlots.has(slotKey);

                          return (
                            <TouchableOpacity
                              key={`${dateStr}-${time}`}
                              onPress={() => !isBooked && handleSlotSelected(dateStr, time, `${doctorId}_ONLINE_${dateStr}_${time.replace(/[:\s]/g, '_')}`)}
                              activeOpacity={isBooked ? 1 : 0.8}
                              disabled={isBooked}
                            >
                              <View
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: isBooked ? '#E5E7EB' : COLORS.border,
                                  backgroundColor: isBooked ? '#F3F4F6' : COLORS.white,
                                }}
                              >
                                <Text style={{ fontSize: 14, color: isBooked ? '#9CA3AF' : COLORS.primaryLight }}>
                                  {time}
                                </Text>
                                {isBooked && (
                                  <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Booked</Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
