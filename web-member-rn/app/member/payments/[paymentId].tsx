import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
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

function BuildingIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 22H23M19 22V6C19 4.9 18.1 4 17 4H7C5.9 4 5 4.9 5 6V22M9 22V18C9 16.9 9.9 16 11 16H13C14.1 16 15 16.9 15 18V22M9 8H10M14 8H15M9 12H10M14 12H15"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
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

function WarningIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9V14M12 21.41H5.94C2.47 21.41.91 18.93 2.47 15.9l3.08-5.66 2.92-5.37C9.97 2.05 12.03 2.05 13.53 4.87l2.92 5.37 3.08 5.66c1.56 3.03.01 5.51-3.46 5.51H12z"
        stroke={COLORS.error}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.995 17H12.004"
        stroke={COLORS.error}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// TYPES
// ============================================================================

type ServiceType = 'DENTAL' | 'VISION' | 'LAB' | 'DIAGNOSTIC' | 'AHC' | 'APPOINTMENT' | 'IN_CLINIC_APPOINTMENT' | 'ONLINE_CONSULTATION';
type PaymentMethod = 'WALLET_ONLY' | 'COPAY' | 'OUT_OF_POCKET' | 'FULL_PAYMENT';
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface PaymentMetadata {
  clinicId?: string;
  clinicName?: string;
  clinicAddress?: string;
  serviceCode?: string;
  serviceName?: string;
  slotId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  consultationFee?: number;
  walletCoverage?: number;
  copayAmount?: number;
  excessAmount?: number;
  serviceTransactionLimit?: number;
  insurancePayment?: number;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  cartId?: string;
  vendorId?: string;
  vendorName?: string;
  collectionType?: string;
  contactNumber?: string;
  callPreference?: 'VOICE' | 'VIDEO' | 'BOTH';
  patientName?: string;
}

interface PendingBookingData {
  serviceType: ServiceType;
  serviceDetails: {
    bookingId?: string;
    clinicId?: string;
    clinicName?: string;
    clinicAddress?: string;
    serviceCode?: string;
    serviceName?: string;
    slotId: string;
    date: string;
    time: string;
    doctorId?: string;
    doctorName?: string;
    specialty?: string;
    cartId?: string;
    vendorId?: string;
    vendorName?: string;
    collectionType?: 'IN_CLINIC' | 'HOME_COLLECTION';
    contactNumber?: string;
    callPreference?: 'VOICE' | 'VIDEO' | 'BOTH';
    packageId?: string;
    packageName?: string;
    labVendorId?: string;
    labVendorName?: string;
    labSlotId?: string;
    labCollectionType?: string;
    labDate?: string;
    labTime?: string;
    labCollectionAddress?: any;
    diagnosticVendorId?: string;
    diagnosticVendorName?: string;
    diagnosticSlotId?: string;
    diagnosticDate?: string;
    diagnosticTime?: string;
  };
  patientId: string;
  patientName: string;
  userId: string;
  consultationFee: number;
  walletCoverage: number;
  copayAmount?: number;
  excessAmount?: number;
  serviceTransactionLimit?: number;
  insurancePayment?: number;
  paymentId: string;
  bookingId?: string;
}

interface Payment {
  _id: string;
  paymentId?: string;
  user: string;
  userId?: string;
  patientId?: string;
  amount: number;
  status: PaymentStatus;
  paymentType: PaymentMethod;
  serviceType: ServiceType;
  serviceReferenceId?: string;
  description?: string;
  metadata?: PaymentMetadata;
  createdAt: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PaymentGatewayPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const paymentId = params.paymentId as string;
  const redirectUrl = (params.redirect as string) || '/member/bookings?tab=dental';

  // State
  const [payment, setPayment] = useState<Payment | null>(null);
  const [pendingBookingData, setPendingBookingData] = useState<PendingBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [countdown, setCountdown] = useState(3);

  // ============================================================================
  // FETCH PAYMENT DETAILS
  // ============================================================================

  useEffect(() => {
    console.log('[PaymentGateway] Component mounted');
    console.log('[PaymentGateway] Payment ID:', paymentId);
    console.log('[PaymentGateway] Redirect URL:', redirectUrl);

    if (!paymentId) {
      console.error('[PaymentGateway] Missing payment ID');
      setError('Invalid payment link');
      setLoading(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        console.log('[PaymentGateway] Fetching payment details...');

        try {
          const bookingDataString = await AsyncStorage.getItem('pendingBooking');
          if (bookingDataString) {
            const bookingData: PendingBookingData = JSON.parse(bookingDataString);
            console.log('[PaymentGateway] Pending booking data loaded:', bookingData);
            setPendingBookingData(bookingData);
          }
        } catch (storageErr) {
          console.warn('[PaymentGateway] Error loading pending booking data:', storageErr);
        }

        const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
        const paymentData = response.data;

        console.log('[PaymentGateway] Payment loaded:', paymentData);

        if (paymentData.status === 'COMPLETED') {
          console.warn('[PaymentGateway] Payment already completed');
          setError('This payment has already been processed');
          setLoading(false);
          return;
        }

        if (paymentData.status === 'CANCELLED' || paymentData.status === 'FAILED') {
          console.warn('[PaymentGateway] Payment cancelled or failed');
          setError(`Payment ${paymentData.status.toLowerCase()}`);
          setLoading(false);
          return;
        }

        setPayment(paymentData);
        setLoading(false);
      } catch (err: any) {
        console.error('[PaymentGateway] Error fetching payment:', err);

        let errorMessage = 'Failed to load payment details';

        if (err.response?.data) {
          const data = err.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (typeof data === 'object') {
            if (data.message && typeof data.message === 'object' && typeof data.message.message === 'string') {
              errorMessage = data.message.message;
            } else if (typeof data.message === 'string') {
              errorMessage = data.message;
            } else if (data.message && typeof data.message === 'object' && typeof data.message.error === 'string') {
              errorMessage = data.message.error;
            } else if (typeof data.error === 'string') {
              errorMessage = data.error;
            }
          }
        } else if (err.message && typeof err.message === 'string') {
          errorMessage = err.message;
        }

        if (err.response?.status === 404) {
          errorMessage = 'Payment not found';
        } else if (err.response?.status === 401) {
          errorMessage = 'Please log in to continue';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to access this payment';
        } else if (err.message === 'Network request failed') {
          errorMessage = 'Network error. Please check your connection';
        }

        if (typeof errorMessage !== 'string') {
          errorMessage = 'Failed to load payment details';
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId, redirectUrl]);

  // ============================================================================
  // SUCCESS COUNTDOWN & AUTO-REDIRECT
  // ============================================================================

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      console.log('[PaymentGateway] Auto-redirecting to:', redirectUrl);
      router.replace(redirectUrl as any);
    }
  }, [success, countdown, redirectUrl, router]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleMarkAsPaid = async () => {
    if (!payment) return;

    console.log('[PaymentGateway] Mark as Paid clicked');
    setProcessing(true);
    setError('');

    try {
      console.log('[PaymentGateway] Reading booking data from AsyncStorage...');
      const bookingDataString = await AsyncStorage.getItem('pendingBooking');

      if (!bookingDataString) {
        console.error('[PaymentGateway] No pending booking data found in AsyncStorage');
        throw new Error('Booking data not found. Please try booking again.');
      }

      const bookingData: PendingBookingData = JSON.parse(bookingDataString);
      console.log('[PaymentGateway] Booking data loaded from AsyncStorage:', bookingData);

      if (bookingData.paymentId !== paymentId) {
        console.error('[PaymentGateway] Payment ID mismatch:', {
          expected: paymentId,
          found: bookingData.paymentId,
        });
        throw new Error('Payment ID mismatch. Please try again.');
      }

      let createdBookingId = '';

      // Handle DENTAL bookings
      if (bookingData.serviceType === 'DENTAL') {
        console.log('[PaymentGateway] Creating DENTAL booking...');

        const dentalBookingPayload = {
          patientId: bookingData.patientId,
          clinicId: bookingData.serviceDetails.clinicId,
          serviceCode: bookingData.serviceDetails.serviceCode,
          serviceName: bookingData.serviceDetails.serviceName,
          slotId: bookingData.serviceDetails.slotId,
          price: bookingData.consultationFee,
          appointmentDate: bookingData.serviceDetails.date,
          appointmentTime: bookingData.serviceDetails.time,
          paymentAlreadyProcessed: true,
        };

        console.log('[PaymentGateway] Dental booking payload:', dentalBookingPayload);

        const bookingResponse = await apiClient.post('/dental-bookings', dentalBookingPayload);
        createdBookingId = bookingResponse.data?.bookingId || bookingResponse.data?._id || '';
        console.log('[PaymentGateway] Dental booking created:', createdBookingId);
      }
      // Handle VISION bookings
      else if (bookingData.serviceType === 'VISION') {
        console.log('[PaymentGateway] Vision booking payment - will complete after mark-paid');

        const visionBookingId =
          bookingData.bookingId ||
          bookingData.serviceDetails?.bookingId ||
          payment.serviceReferenceId ||
          '';

        if (!visionBookingId) {
          console.error('[PaymentGateway] No vision booking ID found!');
          throw new Error('Vision booking ID not found. Please try again.');
        }

        createdBookingId = visionBookingId;
      }
      // Handle IN_CLINIC_APPOINTMENT bookings
      else if (bookingData.serviceType === 'IN_CLINIC_APPOINTMENT') {
        console.log('[PaymentGateway] Creating IN_CLINIC_APPOINTMENT...');

        const appointmentPayload = {
          userId: bookingData.userId,
          patientId: bookingData.patientId,
          patientName: bookingData.patientName,
          doctorId: bookingData.serviceDetails.doctorId,
          doctorName: bookingData.serviceDetails.doctorName,
          specialty: bookingData.serviceDetails.specialty,
          slotId: bookingData.serviceDetails.slotId,
          clinicId: bookingData.serviceDetails.clinicId,
          clinicName: bookingData.serviceDetails.clinicName,
          clinicAddress: bookingData.serviceDetails.clinicAddress,
          appointmentType: 'IN_CLINIC',
          appointmentDate: bookingData.serviceDetails.date,
          timeSlot: bookingData.serviceDetails.time,
          consultationFee: bookingData.consultationFee,
          paymentAlreadyProcessed: true,
          existingPaymentId: paymentId,
        };

        const appointmentResponse = await apiClient.post('/appointments', appointmentPayload);
        createdBookingId = appointmentResponse.data?.appointmentId || appointmentResponse.data?._id || '';
        console.log('[PaymentGateway] In-clinic appointment created:', createdBookingId);
      }
      // Handle LAB bookings
      else if (bookingData.serviceType === 'LAB') {
        console.log('[PaymentGateway] Creating LAB order...');

        const labOrderPayload = {
          cartId: bookingData.serviceDetails.cartId,
          vendorId: bookingData.serviceDetails.vendorId,
          slotId: bookingData.serviceDetails.slotId,
          collectionType: bookingData.serviceDetails.collectionType,
          appointmentDate: bookingData.serviceDetails.date,
          timeSlot: bookingData.serviceDetails.time,
          paymentAlreadyProcessed: true,
        };

        const labOrderResponse = await apiClient.post('/member/lab/orders', labOrderPayload);
        createdBookingId = labOrderResponse.data?.data?.orderId || labOrderResponse.data?.orderId || '';
        console.log('[PaymentGateway] Lab order created:', createdBookingId);
      }
      // Handle DIAGNOSTIC bookings
      else if (bookingData.serviceType === 'DIAGNOSTIC') {
        console.log('[PaymentGateway] Creating DIAGNOSTIC order...');

        const diagnosticOrderPayload = {
          cartId: bookingData.serviceDetails.cartId,
          vendorId: bookingData.serviceDetails.vendorId,
          slotId: bookingData.serviceDetails.slotId,
          collectionType: bookingData.serviceDetails.collectionType,
          appointmentDate: bookingData.serviceDetails.date,
          timeSlot: bookingData.serviceDetails.time,
          paymentAlreadyProcessed: true,
        };

        const diagnosticOrderResponse = await apiClient.post('/member/diagnostics/orders', diagnosticOrderPayload);
        createdBookingId = diagnosticOrderResponse.data?.data?.orderId || diagnosticOrderResponse.data?.orderId || '';
        console.log('[PaymentGateway] Diagnostic order created:', createdBookingId);
      }
      // Handle AHC bookings
      else if (bookingData.serviceType === 'AHC') {
        console.log('[PaymentGateway] Creating AHC order...');

        const sd = bookingData.serviceDetails;

        let formattedLabAddress = undefined;
        if (sd.labCollectionType === 'HOME_COLLECTION' && sd.labCollectionAddress) {
          const addr = sd.labCollectionAddress;
          const addressLine1 = addr.addressLine1 || addr.line1 || '';
          const city = addr.city || '';
          const pincode = addr.pincode || '';
          const state = addr.state || 'N/A';
          const fullName = addr.fullName || bookingData.patientName || 'Member';
          const phone = addr.phone || '0000000000';

          if (addressLine1 && city && pincode) {
            formattedLabAddress = {
              fullName,
              phone,
              addressLine1,
              addressLine2: addr.addressLine2 || addr.line2 || '',
              pincode,
              city,
              state,
            };
          }
        }

        const ahcOrderPayload = {
          packageId: sd.packageId,
          labVendorId: sd.labVendorId,
          labSlotId: sd.labSlotId,
          labCollectionType: sd.labCollectionType,
          labCollectionDate: sd.labDate,
          labCollectionTime: sd.labTime,
          labCollectionAddress: formattedLabAddress,
          diagnosticVendorId: sd.diagnosticVendorId,
          diagnosticSlotId: sd.diagnosticSlotId,
          diagnosticAppointmentDate: sd.diagnosticDate,
          diagnosticAppointmentTime: sd.diagnosticTime,
          paymentAlreadyProcessed: true,
        };

        const ahcBookingResponse = await apiClient.post('/member/ahc/orders', ahcOrderPayload);
        createdBookingId = ahcBookingResponse.data?.data?.orderId || ahcBookingResponse.data?.orderId || ahcBookingResponse.data?.data?._id || ahcBookingResponse.data?._id || '';
        console.log('[PaymentGateway] AHC booking created:', createdBookingId);

        const completedBooking = {
          _id: ahcBookingResponse.data?.data?._id || ahcBookingResponse.data?._id || `ahc-${Date.now()}`,
          orderId: createdBookingId || `AHC-${Date.now()}`,
          packageName: bookingData.serviceDetails?.packageName || 'Annual Health Check',
          status: 'PLACED',
          createdAt: new Date().toISOString(),
          labPortion: bookingData.serviceDetails?.labVendorId ? {
            vendorId: bookingData.serviceDetails.labVendorId,
            vendorName: bookingData.serviceDetails.labVendorName,
            collectionDate: bookingData.serviceDetails.labDate,
            timeSlot: bookingData.serviceDetails.labTime,
            collectionType: bookingData.serviceDetails.labCollectionType,
            collectionAddress: bookingData.serviceDetails.labCollectionAddress,
          } : null,
          diagnosticPortion: bookingData.serviceDetails?.diagnosticVendorId ? {
            vendorId: bookingData.serviceDetails.diagnosticVendorId,
            vendorName: bookingData.serviceDetails.diagnosticVendorName,
            collectionDate: bookingData.serviceDetails.diagnosticDate,
            timeSlot: bookingData.serviceDetails.diagnosticTime,
            collectionType: 'CENTER_VISIT',
          } : null,
          totalAmount: bookingData.consultationFee,
          walletDeduction: bookingData.walletCoverage,
          copayAmount: bookingData.copayAmount,
        };

        await AsyncStorage.setItem('ahc_completed_booking', JSON.stringify(completedBooking));
      }
      // Handle ONLINE_CONSULTATION bookings
      else if (bookingData.serviceType === 'ONLINE_CONSULTATION') {
        console.log('[PaymentGateway] Creating ONLINE_CONSULTATION appointment...');

        const onlineAppointmentPayload = {
          userId: bookingData.userId,
          patientId: bookingData.patientId,
          patientName: bookingData.patientName,
          doctorId: bookingData.serviceDetails.doctorId,
          doctorName: bookingData.serviceDetails.doctorName,
          specialty: bookingData.serviceDetails.specialty,
          slotId: bookingData.serviceDetails.slotId,
          clinicId: '',
          clinicName: '',
          clinicAddress: '',
          appointmentType: 'ONLINE',
          appointmentDate: bookingData.serviceDetails.date,
          timeSlot: bookingData.serviceDetails.time,
          consultationFee: bookingData.consultationFee,
          contactNumber: bookingData.serviceDetails.contactNumber,
          callPreference: bookingData.serviceDetails.callPreference,
          paymentAlreadyProcessed: true,
          existingPaymentId: paymentId,
        };

        const appointmentResponse = await apiClient.post('/appointments', onlineAppointmentPayload);
        createdBookingId = appointmentResponse.data?.appointmentId || appointmentResponse.data?._id || '';
        console.log('[PaymentGateway] Online consultation appointment created:', createdBookingId);
      }
      else {
        console.warn('[PaymentGateway] Service type not yet supported for booking creation:', bookingData.serviceType);
      }

      // Mark payment as paid
      console.log('[PaymentGateway] Marking payment as paid...');
      const markPaidResponse = await apiClient.post(`/payments/${paymentId}/mark-paid`, {
        method: 'DUMMY_GATEWAY',
      });
      console.log('[PaymentGateway] Payment marked as paid:', markPaidResponse.data);

      // For VISION bookings, ensure booking status is updated
      if (bookingData.serviceType === 'VISION' && createdBookingId) {
        console.log('[PaymentGateway] Calling complete-wallet-payment for VISION booking:', createdBookingId);
        try {
          const completeResponse = await apiClient.post(`/vision-bookings/${createdBookingId}/complete-wallet-payment`);
          console.log('[PaymentGateway] Vision booking payment completed:', completeResponse.data);
        } catch (completeError: any) {
          const errorMsg = completeError.response?.data?.message || completeError.message;
          console.warn('[PaymentGateway] complete-wallet-payment warning:', errorMsg);
          if (!errorMsg?.toLowerCase().includes('already')) {
            console.error('[PaymentGateway] Failed to complete vision booking payment:', completeError);
          }
        }
      }

      // Clear AsyncStorage
      console.log('[PaymentGateway] Clearing pending booking from AsyncStorage...');
      await AsyncStorage.removeItem('pendingBooking');

      if (bookingData.serviceType === 'AHC') {
        console.log('[PaymentGateway] Clearing AHC session data...');
        await AsyncStorage.multiRemove(['ahc_package', 'ahc_booking_data', 'ahc_diagnostic_booking']);
      }

      if (createdBookingId) {
        setBookingId(createdBookingId);
      }
      setProcessing(false);
      setSuccess(true);

      setTimeout(() => {
        if (bookingData.serviceType === 'IN_CLINIC_APPOINTMENT') {
          router.replace('/member/in-clinic-consultation' as any);
        } else if (bookingData.serviceType === 'ONLINE_CONSULTATION') {
          router.replace('/member/online-consultation' as any);
        } else {
          const tabMap: Record<ServiceType, string> = {
            DENTAL: 'dental',
            VISION: 'vision',
            LAB: 'lab',
            DIAGNOSTIC: 'diagnostic',
            AHC: 'ahc',
            APPOINTMENT: 'doctors',
            IN_CLINIC_APPOINTMENT: 'doctors',
            ONLINE_CONSULTATION: 'doctors',
          };
          const tab = tabMap[bookingData.serviceType] || 'dental';
          router.replace(`/member/bookings?tab=${tab}` as any);
        }
      }, 2000);
    } catch (err: any) {
      console.error('[PaymentGateway] Error processing payment:', err);

      let errorMessage = 'Failed to process payment';

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
          if (data.message && typeof data.message === 'object') {
            if (Array.isArray(data.message.message)) {
              errorMessage = data.message.message.join(', ');
            } else if (typeof data.message.message === 'string') {
              errorMessage = data.message.message;
            } else if (typeof data.message.error === 'string') {
              errorMessage = data.message.error;
            }
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
        }
      } else if (err.message && typeof err.message === 'string') {
        errorMessage = err.message;
      }

      if (err.response?.status === 404) {
        errorMessage = 'Payment not found';
      } else if (err.response?.status === 409) {
        errorMessage = 'Payment already processed';
      }

      if (typeof errorMessage !== 'string') {
        errorMessage = 'An error occurred during payment processing';
      }

      setError(errorMessage);
      setProcessing(false);
    }
  };

  const handleViewBooking = () => {
    console.log('[PaymentGateway] View Booking clicked, redirecting to:', redirectUrl);
    router.replace(redirectUrl as any);
  };

  const handleRetry = async () => {
    console.log('[PaymentGateway] Retry clicked');
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
      const paymentData = response.data;

      if (paymentData.status === 'COMPLETED') {
        setError('This payment has already been processed');
        setLoading(false);
        return;
      }

      if (paymentData.status === 'CANCELLED' || paymentData.status === 'FAILED') {
        setError(`Payment ${paymentData.status.toLowerCase()}`);
        setLoading(false);
        return;
      }

      setPayment(paymentData);
      setLoading(false);
    } catch (err: any) {
      console.error('[PaymentGateway] Error on retry:', err);

      let errorMessage = 'Failed to load payment details';

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
          if (data.message && typeof data.message === 'object' && typeof data.message.message === 'string') {
            errorMessage = data.message.message;
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (data.message && typeof data.message === 'object' && typeof data.message.error === 'string') {
            errorMessage = data.message.error;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
        }
      } else if (err.message && typeof err.message === 'string') {
        errorMessage = err.message;
      }

      if (typeof errorMessage !== 'string') {
        errorMessage = 'Failed to load payment details';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // ============================================================================
  // FORMAT HELPERS
  // ============================================================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, fontSize: 14, color: COLORS.textGray }}>Loading payment details...</Text>
      </View>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error && !payment) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <WarningIcon size={32} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.error, marginBottom: 8, textAlign: 'center' }}>
              Payment Error
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', marginBottom: 24 }}>
              {typeof error === 'string' ? error : 'An error occurred'}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              activeOpacity={0.8}
              style={{
                backgroundColor: COLORS.primary,
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <CheckCircleIcon size={48} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary, marginTop: 8, textAlign: 'center' }}>
              Payment Successful!
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textGray, marginTop: 8, textAlign: 'center' }}>
              Your booking has been confirmed
            </Text>

            {bookingId && (
              <View
                style={{
                  marginTop: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: 'rgba(3, 77, 162, 0.1)',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.cardBorder,
                }}
              >
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 4 }}>Booking ID</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>{bookingId}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleViewBooking}
              activeOpacity={0.8}
              style={{
                marginTop: 32,
                width: '100%',
                maxWidth: 300,
                backgroundColor: COLORS.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>View Booking</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
              Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // PAYMENT STATE (MAIN UI)
  // ============================================================================

  if (!payment) {
    return null;
  }

  const metadata: PaymentMetadata = payment.metadata || ({} as PaymentMetadata);
  const { amount } = payment;

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
                  Complete Payment
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Secure payment gateway
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
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* ===== ERROR BANNER ===== */}
          {error && (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#FECACA',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: COLORS.error, textAlign: 'center' }}>
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </Text>
            </View>
          )}

          {/* ===== AMOUNT CARD ===== */}
          <View
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.15,
              shadowRadius: 23,
              elevation: 4,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>Total Amount</Text>
            <Text style={{ fontSize: 40, fontWeight: '700', color: '#FFFFFF' }}>₹{amount}</Text>
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '500' }}>
                {payment.paymentType.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

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
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(3, 77, 162, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <BanknotesIcon size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                  {payment.serviceType === 'IN_CLINIC_APPOINTMENT'
                    ? metadata.doctorName || payment.description || 'Doctor Consultation'
                    : metadata.serviceName || payment.description || 'Service'}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  {payment.serviceType === 'IN_CLINIC_APPOINTMENT'
                    ? metadata.specialty || 'In-Clinic Consultation'
                    : `${payment.serviceType} Service`}
                </Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {/* Patient */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <UserIcon size={16} />
                  <Text style={{ fontSize: 14, color: COLORS.textGray }}>Patient</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                  {metadata.patientName || pendingBookingData?.patientName || 'N/A'}
                </Text>
              </View>

              {/* Date */}
              {metadata.appointmentDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CalendarIcon size={16} />
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Date</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                    {formatDate(metadata.appointmentDate)}
                  </Text>
                </View>
              )}

              {/* Time */}
              {metadata.appointmentTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ClockIcon size={16} />
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Time</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                    {formatTime(metadata.appointmentTime)}
                  </Text>
                </View>
              )}

              {/* Clinic Name */}
              {metadata.clinicName && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <BuildingIcon size={16} />
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Clinic</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark, maxWidth: 180 }} numberOfLines={1}>
                    {metadata.clinicName}
                  </Text>
                </View>
              )}

              {/* Clinic ID (if no name available) */}
              {!metadata.clinicName && metadata.clinicId && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <BuildingIcon size={16} />
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Clinic ID</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                    {metadata.clinicId}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ===== PAYMENT BREAKDOWN CARD ===== */}
          {payment.paymentType !== 'WALLET_ONLY' && (
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
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
                Payment Breakdown
              </Text>

              <View style={{ gap: 12 }}>
                {/* Service Limit */}
                {metadata?.serviceTransactionLimit && metadata.serviceTransactionLimit > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Service Transaction Limit</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                      ₹{metadata.serviceTransactionLimit}
                    </Text>
                  </View>
                )}

                {/* Insurance Coverage */}
                {metadata?.insurancePayment !== undefined && metadata.insurancePayment > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Insurance Coverage</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.success }}>
                      -₹{metadata.insurancePayment}
                    </Text>
                  </View>
                )}

                {/* Copay */}
                {metadata?.copayAmount !== undefined && metadata.copayAmount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Copay Amount</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.warning }}>
                      ₹{metadata.copayAmount}
                    </Text>
                  </View>
                )}

                {/* Excess Amount */}
                {metadata?.excessAmount !== undefined && metadata.excessAmount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.textGray }}>Excess Amount</Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.error }}>
                      ₹{metadata.excessAmount}
                    </Text>
                  </View>
                )}

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

                {/* Total */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>You Pay</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>₹{amount}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ===== DUMMY GATEWAY NOTE ===== */}
          <View
            style={{
              backgroundColor: '#FEF9C3',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#FDE047',
            }}
          >
            <Text style={{ fontSize: 12, color: '#854D0E', textAlign: 'center' }}>
              This is a test payment gateway for development purposes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== FIXED BOTTOM BUTTON ===== */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        }}
      >
        <View
          style={{
            maxWidth: 480,
            marginHorizontal: 'auto',
            width: '100%',
            paddingHorizontal: 16,
            paddingTop: 12,
          }}
        >
          <TouchableOpacity
            disabled={processing}
            onPress={handleMarkAsPaid}
            activeOpacity={0.8}
            style={{
              backgroundColor: processing ? '#9CA3AF' : COLORS.primary,
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {processing && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
              {processing ? 'Processing Payment...' : `Pay ₹${amount}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
