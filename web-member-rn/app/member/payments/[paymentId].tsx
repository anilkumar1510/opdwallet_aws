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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CheckCircleIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

type ServiceType = 'DENTAL' | 'VISION' | 'LAB' | 'DIAGNOSTIC' | 'AHC' | 'APPOINTMENT' | 'IN_CLINIC_APPOINTMENT';
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
  // IN_CLINIC_APPOINTMENT specific fields
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  // LAB specific fields
  cartId?: string;
  vendorId?: string;
  vendorName?: string;
  collectionType?: string;
}

interface PendingBookingData {
  serviceType: ServiceType;
  serviceDetails: {
    bookingId?: string; // For VISION - booking already exists
    clinicId?: string;
    clinicName?: string;
    clinicAddress?: string; // For IN_CLINIC_APPOINTMENT
    serviceCode?: string;
    serviceName?: string;
    slotId: string;
    date: string;
    time: string;
    // IN_CLINIC_APPOINTMENT specific fields
    doctorId?: string;
    doctorName?: string;
    specialty?: string;
    // LAB specific fields
    cartId?: string;
    vendorId?: string;
    vendorName?: string;
    collectionType?: 'IN_CLINIC' | 'HOME_COLLECTION';
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
  bookingId?: string; // For VISION - booking already exists
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

export default function PaymentGatewayPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const paymentId = params.paymentId as string;
  const redirectUrl = (params.redirect as string) || '/member/bookings?tab=dental';

  // State
  const [payment, setPayment] = useState<Payment | null>(null);
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

    // Validate payment ID
    if (!paymentId) {
      console.error('[PaymentGateway] Missing payment ID');
      setError('Invalid payment link');
      setLoading(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        console.log('[PaymentGateway] Fetching payment details...');
        const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
        const paymentData = response.data;

        console.log('[PaymentGateway] Payment loaded:', paymentData);
        console.log('[PaymentGateway] Payment metadata:', paymentData.metadata);
        console.log('[PaymentGateway] Payment serviceType:', paymentData.serviceType);
        console.log('[PaymentGateway] Payment paymentType:', paymentData.paymentType);

        // Validate payment status
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
        console.error('[PaymentGateway] Error response:', err.response?.data);

        let errorMessage = 'Failed to load payment details';

        // Extract error message from response
        if (err.response?.data) {
          const data = err.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (typeof data === 'object') {
            // Handle nested message structure: data.message.message
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

        // Override with specific status messages
        if (err.response?.status === 404) {
          errorMessage = 'Payment not found';
        } else if (err.response?.status === 401) {
          errorMessage = 'Please log in to continue';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to access this payment';
        } else if (err.message === 'Network request failed') {
          errorMessage = 'Network error. Please check your connection';
        }

        // Final safety check - ensure it's a string
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
      // Step 1: Read booking data from AsyncStorage
      console.log('[PaymentGateway] Reading booking data from AsyncStorage...');
      const bookingDataString = await AsyncStorage.getItem('pendingBooking');

      if (!bookingDataString) {
        console.error('[PaymentGateway] No pending booking data found in AsyncStorage');
        throw new Error('Booking data not found. Please try booking again.');
      }

      const bookingData: PendingBookingData = JSON.parse(bookingDataString);
      console.log('[PaymentGateway] Booking data loaded from AsyncStorage:', bookingData);

      // Verify payment ID matches
      if (bookingData.paymentId !== paymentId) {
        console.error('[PaymentGateway] Payment ID mismatch:', {
          expected: paymentId,
          found: bookingData.paymentId,
        });
        throw new Error('Payment ID mismatch. Please try again.');
      }

      let createdBookingId = '';

      // Step 2: Create booking based on service type
      // Handle DENTAL bookings - initial booking flow, need to create booking
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
          paymentAlreadyProcessed: true, // CRITICAL: Payment will be marked as paid separately
        };

        console.log('[PaymentGateway] Dental booking payload:', dentalBookingPayload);

        const bookingResponse = await apiClient.post('/dental-bookings', dentalBookingPayload);
        createdBookingId = bookingResponse.data?.bookingId || bookingResponse.data?._id || '';
        console.log('[PaymentGateway] Dental booking created:', createdBookingId);
      }
      // Handle VISION bookings - booking already exists (created during initial booking)
      // Operations team generates bill, member pays here
      else if (bookingData.serviceType === 'VISION') {
        console.log('[PaymentGateway] Vision booking payment - will complete after mark-paid');
        console.log('[PaymentGateway] Service Reference ID (booking ID):', payment.serviceReferenceId);
        console.log('[PaymentGateway] Booking data bookingId:', bookingData.bookingId);
        console.log('[PaymentGateway] Service details bookingId:', bookingData.serviceDetails?.bookingId);

        // Get the vision booking ID
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
        // Note: complete-wallet-payment will be called AFTER mark-paid below
      }
      // Handle IN_CLINIC_APPOINTMENT bookings - need to create appointment
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
        };

        console.log('[PaymentGateway] In-clinic appointment payload:', appointmentPayload);

        const appointmentResponse = await apiClient.post('/appointments', appointmentPayload);
        createdBookingId = appointmentResponse.data?.appointmentId || appointmentResponse.data?._id || '';
        console.log('[PaymentGateway] In-clinic appointment created:', createdBookingId);
      }
      // Handle LAB bookings - need to create lab order
      else if (bookingData.serviceType === 'LAB') {
        console.log('[PaymentGateway] Creating LAB order...');

        const labOrderPayload = {
          cartId: bookingData.serviceDetails.cartId,
          vendorId: bookingData.serviceDetails.vendorId,
          slotId: bookingData.serviceDetails.slotId,
          collectionType: bookingData.serviceDetails.collectionType,
          appointmentDate: bookingData.serviceDetails.date,
          timeSlot: bookingData.serviceDetails.time,
          paymentAlreadyProcessed: true, // Payment is being processed now
        };

        console.log('[PaymentGateway] Lab order payload:', labOrderPayload);

        const labOrderResponse = await apiClient.post('/member/lab/orders', labOrderPayload);
        createdBookingId = labOrderResponse.data?.data?.orderId || labOrderResponse.data?.orderId || '';
        console.log('[PaymentGateway] Lab order created:', createdBookingId);
      }
      // Handle other service types (DIAGNOSTIC, AHC, APPOINTMENT)
      else {
        console.warn('[PaymentGateway] Service type not yet supported for booking creation:', bookingData.serviceType);
        // For now, just mark payment as paid without creating booking
      }

      // Step 3: Mark payment as paid
      console.log('[PaymentGateway] Marking payment as paid...');
      const markPaidResponse = await apiClient.post(`/payments/${paymentId}/mark-paid`, {
        method: 'DUMMY_GATEWAY',
      });
      console.log('[PaymentGateway] Payment marked as paid:', markPaidResponse.data);

      // Step 4: For VISION bookings, ensure booking status is updated
      // The backend's mark-paid should call handlePaymentComplete, but as a fallback
      // we also call complete-wallet-payment directly to ensure the booking is updated
      if (bookingData.serviceType === 'VISION' && createdBookingId) {
        console.log('[PaymentGateway] Calling complete-wallet-payment for VISION booking:', createdBookingId);
        try {
          const completeResponse = await apiClient.post(`/vision-bookings/${createdBookingId}/complete-wallet-payment`);
          console.log('[PaymentGateway] Vision booking payment completed:', completeResponse.data);
        } catch (completeError: any) {
          // Log the error but don't fail - the mark-paid might have already handled it
          const errorMsg = completeError.response?.data?.message || completeError.message;
          console.warn('[PaymentGateway] complete-wallet-payment warning:', errorMsg);
          // If the error is "Payment has already been completed", that's fine
          if (!errorMsg?.toLowerCase().includes('already')) {
            console.error('[PaymentGateway] Failed to complete vision booking payment:', completeError);
          }
        }
      }

      // Step 5: Clear AsyncStorage
      console.log('[PaymentGateway] Clearing pending booking from AsyncStorage...');
      await AsyncStorage.removeItem('pendingBooking');

      // Step 6: Set success state
      if (createdBookingId) {
        setBookingId(createdBookingId);
      }
      setProcessing(false);
      setSuccess(true);

      // Step 7: Redirect to appropriate page after delay
      setTimeout(() => {
        // For IN_CLINIC_APPOINTMENT, redirect to in-clinic-consultation page
        if (bookingData.serviceType === 'IN_CLINIC_APPOINTMENT') {
          router.replace('/member/in-clinic-consultation' as any);
        } else {
          const tabMap: Record<ServiceType, string> = {
            DENTAL: 'dental',
            VISION: 'vision',
            LAB: 'lab',
            DIAGNOSTIC: 'diagnostic',
            AHC: 'ahc',
            APPOINTMENT: 'doctors',
            IN_CLINIC_APPOINTMENT: 'doctors',
          };
          const tab = tabMap[bookingData.serviceType] || 'dental';
          router.replace(`/member/bookings?tab=${tab}` as any);
        }
      }, 2000);
    } catch (err: any) {
      console.error('[PaymentGateway] Error processing payment:', err);
      console.error('[PaymentGateway] Error response:', err.response?.data);

      let errorMessage = 'Failed to process payment';

      // Extract error message from response
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
          // Handle nested message structure: data.message.message
          if (data.message && typeof data.message === 'object') {
            // If message.message is an array (validation errors)
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

      // Override with specific status messages if needed
      if (err.response?.status === 404) {
        errorMessage = 'Payment not found';
      } else if (err.response?.status === 409) {
        errorMessage = 'Payment already processed';
      }

      // Final safety check - ensure it's a string
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
      console.log('[PaymentGateway] Retrying payment fetch...');
      const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
      const paymentData = response.data;

      console.log('[PaymentGateway] Payment loaded on retry:', paymentData);

      // Validate payment status
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
      console.error('[PaymentGateway] Error response:', err.response?.data);

      let errorMessage = 'Failed to load payment details';

      // Extract error message from response
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data === 'object') {
          // Handle nested message structure: data.message.message
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

      // Final safety check - ensure it's a string
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
      <View style={{ flex: 1, backgroundColor: '#f7f7fc', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F5FDC" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280' }}>Loading payment details...</Text>
      </View>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error && !payment) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FEE2E2',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 32 }}>⚠️</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#DC2626', marginBottom: 8, textAlign: 'center' }}>
              Payment Error
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
              {typeof error === 'string' ? error : 'An error occurred'}
            </Text>
            <TouchableOpacity onPress={handleRetry} activeOpacity={0.8}>
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Retry</Text>
              </LinearGradient>
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
      <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
            <CheckCircleIcon width={80} height={80} color="#25A425" />
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#0E51A2', marginTop: 24, textAlign: 'center' }}>
              Payment Successful!
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
              Your booking has been confirmed
            </Text>

            {bookingId && (
              <View
                style={{
                  marginTop: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: '#EFF6FF',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#DBEAFE',
                }}
              >
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Booking ID</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>{bookingId}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleViewBooking}
              activeOpacity={0.8}
              style={{ marginTop: 32, width: '100%', maxWidth: 300 }}
            >
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>View Booking</Text>
              </LinearGradient>
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
              paddingVertical: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2', textAlign: 'center' }}>
              Complete Payment
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, textAlign: 'center' }}>
              Secure dummy payment gateway
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* ===== MAIN CONTENT ===== */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
          paddingBottom: 200,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* ===== ERROR BANNER ===== */}
          {error && (
            <View
              style={{
                backgroundColor: '#FEE2E2',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#FCA5A5',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: '#DC2626', textAlign: 'center' }}>
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </Text>
            </View>
          )}

          {/* ===== AMOUNT CARD ===== */}
          <LinearGradient
            colors={['#1F63B4', '#5DA4FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 12,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: '#E0F2FE', marginBottom: 8 }}>Total Amount</Text>
            <Text style={{ fontSize: 40, fontWeight: '700', color: '#FFFFFF' }}>₹{amount}</Text>
            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '500' }}>
                {payment.paymentType.replace(/_/g, ' ')}
              </Text>
            </View>
          </LinearGradient>

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
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <IconCircle icon={BanknotesIcon} size="md" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                  {payment.serviceType === 'IN_CLINIC_APPOINTMENT'
                    ? metadata.doctorName || payment.description || 'Doctor Consultation'
                    : metadata.serviceName || payment.description || 'Service'}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {payment.serviceType === 'IN_CLINIC_APPOINTMENT'
                    ? metadata.specialty || 'In-Clinic Consultation'
                    : `${payment.serviceType} Service`}
                </Text>
              </View>
            </View>

            <View>
              {/* Patient */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <UserIcon width={16} height={16} color="#6B7280" />
                <Text style={{ fontSize: 14, color: '#6B7280', flex: 1, marginLeft: 8 }}>Patient ID:</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                  {payment.patientId?.slice(-8) || 'N/A'}
                </Text>
              </View>

              {/* Date */}
              {metadata.appointmentDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <CalendarIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 14, color: '#6B7280', flex: 1, marginLeft: 8 }}>Date:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                    {formatDate(metadata.appointmentDate)}
                  </Text>
                </View>
              )}

              {/* Time */}
              {metadata.appointmentTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <ClockIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 14, color: '#6B7280', flex: 1, marginLeft: 8 }}>Time:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                    {formatTime(metadata.appointmentTime)}
                  </Text>
                </View>
              )}

              {/* Clinic Name (for IN_CLINIC_APPOINTMENT) */}
              {metadata.clinicName && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: metadata.clinicId ? 12 : 0 }}>
                  <BuildingOfficeIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 14, color: '#6B7280', flex: 1, marginLeft: 8 }}>Clinic:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }} numberOfLines={1}>
                    {metadata.clinicName}
                  </Text>
                </View>
              )}

              {/* Clinic ID (if no name available) */}
              {!metadata.clinicName && metadata.clinicId && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BuildingOfficeIcon width={16} height={16} color="#6B7280" />
                  <Text style={{ fontSize: 14, color: '#6B7280', flex: 1, marginLeft: 8 }}>Clinic ID:</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                    {metadata.clinicId}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ===== PAYMENT BREAKDOWN CARD ===== */}
          {payment.paymentType !== 'WALLET_ONLY' && (
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 12,
                padding: 16,
                borderWidth: 2,
                borderColor: '#86ACD8',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2', marginBottom: 12 }}>
                Payment Breakdown
              </Text>

              <View>
                {/* Service Limit */}
                {metadata?.serviceTransactionLimit && metadata.serviceTransactionLimit > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Service Transaction Limit</Text>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>
                      ₹{metadata.serviceTransactionLimit}
                    </Text>
                  </View>
                )}

                {/* Insurance Coverage */}
                {metadata?.insurancePayment !== undefined && metadata.insurancePayment > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Insurance Coverage</Text>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#25A425' }}>
                      -₹{metadata.insurancePayment}
                    </Text>
                  </View>
                )}

                {/* Copay */}
                {metadata?.copayAmount !== undefined && metadata.copayAmount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Copay Amount</Text>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>
                      ₹{metadata.copayAmount}
                    </Text>
                  </View>
                )}

                {/* Excess Amount */}
                {metadata?.excessAmount !== undefined && metadata.excessAmount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Excess Amount</Text>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>
                      ₹{metadata.excessAmount}
                    </Text>
                  </View>
                )}

                {/* Total */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#86ACD8',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2' }}>You Pay</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0E51A2' }}>₹{amount}</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* ===== DUMMY GATEWAY NOTE ===== */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <Text style={{ fontSize: 12, color: '#92400E', textAlign: 'center' }}>
              🧪 This is a dummy payment gateway for testing purposes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== FIXED BOTTOM BUTTON ===== */}
      <View
        style={{
          position: 'absolute',
          bottom: 140,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <SafeAreaView edges={[]}>
          <View
            style={{
              maxWidth: 480,
              marginHorizontal: 'auto',
              width: '100%',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <TouchableOpacity
              disabled={processing}
              onPress={handleMarkAsPaid}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={processing ? ['#9ca3af', '#9ca3af'] : ['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: processing ? 0 : 0.2,
                  shadowRadius: 8,
                  elevation: processing ? 0 : 4,
                }}
              >
                {processing && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {processing ? 'Processing Payment...' : 'Mark as Paid'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
