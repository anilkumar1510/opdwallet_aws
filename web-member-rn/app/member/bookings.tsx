import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  SparklesIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  HeartIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
} from '../../src/components/icons/InlineSVGs';
import apiClient, { tokenManager } from '../../src/lib/api/client';
import { useFamily } from '../../src/contexts/FamilyContext';

// ============================================================================
// TYPES
// ============================================================================

interface Appointment {
  _id: string;
  appointmentId: string;
  appointmentNumber: string;
  patientName: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  appointmentType: string;
  appointmentDate: string;
  timeSlot: string;
  consultationFee: number;
  status: string;
  requestedAt: string;
  createdAt: string;
  hasPrescription?: boolean;
  prescriptionId?: string;
}

interface DentalBooking {
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
  excessAmount: number;
  walletDebitAmount: number;
  totalMemberPayment: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  bookedAt: string;
  createdAt: string;
  invoiceGenerated?: boolean;
  invoiceId?: string;
  invoicePath?: string;
  invoiceFileName?: string;
}

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
  excessAmount: number;
  walletDebitAmount: number;
  totalMemberPayment: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  bookedAt: string;
  createdAt: string;
  billGenerated?: boolean;
  billGeneratedAt?: string;
  invoiceGenerated?: boolean;
  invoiceId?: string;
  invoicePath?: string;
  invoiceFileName?: string;
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
    sm: { container: 48, icon: 24 },
    md: { container: 56, icon: 28 },
    lg: { container: 80, icon: 40 },
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

export default function BookingsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { viewingUserId } = useFamily();
  const initialTab = (params.tab as string) || 'doctors';

  // State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);

  // Dental Bookings
  const [dentalBookings, setDentalBookings] = useState<DentalBooking[]>([]);
  const [upcomingDentalBookings, setUpcomingDentalBookings] = useState<DentalBooking[]>([]);
  const [pastDentalBookings, setPastDentalBookings] = useState<DentalBooking[]>([]);

  // Vision Bookings
  const [visionBookings, setVisionBookings] = useState<VisionBooking[]>([]);
  const [upcomingVisionBookings, setUpcomingVisionBookings] = useState<VisionBooking[]>([]);
  const [pastVisionBookings, setPastVisionBookings] = useState<VisionBooking[]>([]);

  // Lab Bookings
  const [labCarts, setLabCarts] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [labPrescriptions, setLabPrescriptions] = useState<any[]>([]);

  // Diagnostic Bookings
  const [diagnosticCarts, setDiagnosticCarts] = useState<any[]>([]);
  const [diagnosticOrders, setDiagnosticOrders] = useState<any[]>([]);
  const [diagnosticPrescriptions, setDiagnosticPrescriptions] = useState<any[]>([]);

  // ============================================================================
  // FETCH DATA ON MOUNT AND WHEN viewingUserId CHANGES
  // ============================================================================

  useEffect(() => {
    console.log('[Bookings] Component mounted or viewingUserId changed:', viewingUserId);
    fetchAppointments();
    fetchDentalBookings();
    fetchVisionBookings();
    fetchLabCarts();
    fetchLabOrders();
    fetchLabPrescriptions();
    fetchDiagnosticCarts();
    fetchDiagnosticOrders();
    fetchDiagnosticPrescriptions();
  }, [viewingUserId]);

  // Update active tab when URL changes
  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as string);
    }
  }, [params.tab]);

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  const fetchAppointments = async () => {
    try {
      console.log('[Bookings] Fetching appointments for viewingUserId:', viewingUserId);

      if (!viewingUserId) {
        console.log('[Bookings] No viewingUserId, skipping appointments fetch');
        return;
      }

      const response = await apiClient.get<Appointment[]>(`/appointments/user/${viewingUserId}`);
      const data = response.data;
      console.log('[Bookings] Appointments received:', data.length);

      // Sort by date (newest first)
      const sortedAppointments = data.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.timeSlot}`);
        const dateB = new Date(`${b.appointmentDate} ${b.timeSlot}`);
        return dateB.getTime() - dateA.getTime();
      });

      // Split into upcoming and past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming: Appointment[] = [];
      const past: Appointment[] = [];

      sortedAppointments.forEach((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        appointmentDate.setHours(0, 0, 0, 0);

        if (appointmentDate >= today) {
          upcoming.push(appointment);
        } else {
          past.push(appointment);
        }
      });

      // Sort upcoming in ascending order (earliest first)
      upcoming.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate} ${a.timeSlot}`);
        const dateB = new Date(`${b.appointmentDate} ${b.timeSlot}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(sortedAppointments);
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error: any) {
      console.error('[Bookings] Error fetching appointments:', error);
      setAppointments([]);
      setUpcomingAppointments([]);
      setPastAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentalBookings = async () => {
    try {
      console.log('[Bookings] Fetching dental bookings for viewingUserId:', viewingUserId);

      if (!viewingUserId) {
        console.log('[Bookings] No viewingUserId, skipping dental bookings fetch');
        return;
      }

      const response = await apiClient.get<DentalBooking[]>(`/dental-bookings/user/${viewingUserId}`);
      const data = response.data;
      console.log('[Bookings] Dental bookings received:', data.length);

      // Sort by date (newest first)
      const sortedBookings = data.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateB.getTime() - dateA.getTime();
      });

      // Split into upcoming and past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming: DentalBooking[] = [];
      const past: DentalBooking[] = [];

      sortedBookings.forEach((booking) => {
        const bookingDate = new Date(booking.appointmentDate);
        bookingDate.setHours(0, 0, 0, 0);

        if (bookingDate >= today) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      });

      // Sort upcoming in ascending order (earliest first)
      upcoming.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
      });

      setDentalBookings(sortedBookings);
      setUpcomingDentalBookings(upcoming);
      setPastDentalBookings(past);
    } catch (error: any) {
      console.error('[Bookings] Error fetching dental bookings:', error);
      setDentalBookings([]);
      setUpcomingDentalBookings([]);
      setPastDentalBookings([]);
    }
  };

  const fetchVisionBookings = async () => {
    try {
      console.log('[Bookings] Fetching vision bookings for viewingUserId:', viewingUserId);

      if (!viewingUserId) {
        console.log('[Bookings] No viewingUserId, skipping vision bookings fetch');
        return;
      }

      const response = await apiClient.get<VisionBooking[]>(`/vision-bookings/user/${viewingUserId}`);
      const data = response.data;
      console.log('[Bookings] Vision bookings received:', data.length);

      // Sort by date (newest first)
      const sortedBookings = data.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateB.getTime() - dateA.getTime();
      });

      // Split into upcoming and past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming: VisionBooking[] = [];
      const past: VisionBooking[] = [];

      sortedBookings.forEach((booking) => {
        const bookingDate = new Date(booking.appointmentDate);
        bookingDate.setHours(0, 0, 0, 0);

        if (bookingDate >= today) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      });

      // Sort upcoming in ascending order (earliest first)
      upcoming.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
      });

      setVisionBookings(sortedBookings);
      setUpcomingVisionBookings(upcoming);
      setPastVisionBookings(past);
    } catch (error: any) {
      console.error('[Bookings] Error fetching vision bookings:', error);
      setVisionBookings([]);
      setUpcomingVisionBookings([]);
      setPastVisionBookings([]);
    }
  };

  const fetchLabCarts = async () => {
    try {
      console.log('[LabCarts] Fetching lab carts for profile:', viewingUserId);

      if (!viewingUserId) {
        console.log('[LabCarts] No viewingUserId, skipping lab carts fetch');
        return;
      }

      const response = await apiClient.get(`/member/lab/carts?patientId=${viewingUserId}`);
      const data = response.data;

      if (!data || !data.data) {
        console.log('[LabCarts] No lab carts found or error fetching');
        setLabCarts([]);
        return;
      }

      console.log('[LabCarts] Lab carts received:', data.data);
      setLabCarts(data.data || []);
    } catch (error: any) {
      console.error('[LabCarts] Error fetching lab carts:', error);
      setLabCarts([]);
    }
  };

  const fetchLabOrders = async () => {
    try {
      console.log('[LabOrders] Fetching lab orders for profile:', viewingUserId);

      if (!viewingUserId) {
        console.log('[LabOrders] No viewingUserId, skipping lab orders fetch');
        return;
      }

      const response = await apiClient.get(`/member/lab/orders?patientId=${viewingUserId}`);
      const data = response.data;

      if (!data || !data.data) {
        console.log('[LabOrders] No lab orders found or error fetching');
        setLabOrders([]);
        return;
      }

      console.log('[LabOrders] Lab orders received:', data.data);
      setLabOrders(data.data || []);
    } catch (error: any) {
      console.error('[LabOrders] Error fetching lab orders:', error);
      setLabOrders([]);
    }
  };

  const fetchLabPrescriptions = async () => {
    try {
      console.log('[LabPrescriptions] Fetching lab prescriptions for profile:', viewingUserId);

      if (!viewingUserId) {
        console.log('[LabPrescriptions] No viewingUserId, skipping lab prescriptions fetch');
        return;
      }

      const response = await apiClient.get(`/member/lab/prescriptions?patientId=${viewingUserId}`);
      const data = response.data;

      if (!data || !data.data) {
        console.log('[LabPrescriptions] No lab prescriptions found or error fetching');
        setLabPrescriptions([]);
        return;
      }

      console.log('[LabPrescriptions] Lab prescriptions received:', data.data);
      setLabPrescriptions(data.data || []);
    } catch (error: any) {
      console.error('[LabPrescriptions] Error fetching lab prescriptions:', error);
      setLabPrescriptions([]);
    }
  };

  const fetchDiagnosticCarts = async () => {
    try {
      console.log('[DiagnosticCarts] Fetching diagnostic carts for profile:', viewingUserId);

      if (!viewingUserId) {
        console.log('[DiagnosticCarts] No viewingUserId, skipping diagnostic carts fetch');
        return;
      }

      const response = await apiClient.get(`/member/diagnostics/carts?patientId=${viewingUserId}`);
      const data = response.data;

      if (!data || !data.data) {
        console.log('[DiagnosticCarts] No diagnostic carts found or error fetching');
        setDiagnosticCarts([]);
        return;
      }

      console.log('[DiagnosticCarts] Diagnostic carts received:', data.data);
      setDiagnosticCarts(data.data || []);
    } catch (error: any) {
      console.error('[DiagnosticCarts] Error fetching diagnostic carts:', error);
      setDiagnosticCarts([]);
    }
  };

  const fetchDiagnosticOrders = async () => {
    try {
      console.log('[DiagnosticOrders] Fetching diagnostic orders for profile:', viewingUserId);

      if (!viewingUserId) {
        console.log('[DiagnosticOrders] No viewingUserId, skipping diagnostic orders fetch');
        return;
      }

      const response = await apiClient.get(`/member/diagnostics/orders?patientId=${viewingUserId}`);
      const data = response.data;

      if (!data || !data.data) {
        console.log('[DiagnosticOrders] No diagnostic orders found or error fetching');
        setDiagnosticOrders([]);
        return;
      }

      console.log('[DiagnosticOrders] Diagnostic orders received:', data.data);
      setDiagnosticOrders(data.data || []);
    } catch (error: any) {
      console.error('[DiagnosticOrders] Error fetching diagnostic orders:', error);
      setDiagnosticOrders([]);
    }
  };

  const fetchDiagnosticPrescriptions = async () => {
    try {
      console.log('[DiagnosticPrescriptions] Fetching diagnostic prescriptions for profile:', viewingUserId);

      if (!viewingUserId) {
        console.log('[DiagnosticPrescriptions] No viewingUserId, skipping diagnostic prescriptions fetch');
        return;
      }

      const response = await apiClient.get(`/member/diagnostics/prescriptions?patientId=${viewingUserId}`);
      const data = response.data;

      if (!data || !data.data) {
        console.log('[DiagnosticPrescriptions] No diagnostic prescriptions found or error fetching');
        setDiagnosticPrescriptions([]);
        return;
      }

      console.log('[DiagnosticPrescriptions] Diagnostic prescriptions received:', data.data);
      setDiagnosticPrescriptions(data.data || []);
    } catch (error: any) {
      console.error('[DiagnosticPrescriptions] Error fetching diagnostic prescriptions:', error);
      setDiagnosticPrescriptions([]);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCancelDentalBooking = async (bookingId: string, serviceName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel ${serviceName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Bookings] Cancelling dental booking:', bookingId);
              await apiClient.post(`/dental-bookings/${bookingId}/cancel`);
              Alert.alert('Success', 'Booking cancelled successfully');
              fetchDentalBookings(); // Refresh bookings
            } catch (error: any) {
              console.error('[Bookings] Error cancelling booking:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleCancelVisionBooking = async (bookingId: string, serviceName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel ${serviceName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Bookings] Cancelling vision booking:', bookingId);
              await apiClient.post(`/vision-bookings/${bookingId}/cancel`);
              Alert.alert('Success', 'Booking cancelled successfully');
              fetchVisionBookings(); // Refresh bookings
            } catch (error: any) {
              console.error('[Bookings] Error cancelling booking:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleCancelAppointment = async (appointmentId: string, doctorName: string) => {
    console.log('[Bookings] handleCancelAppointment called:', { appointmentId, doctorName });

    if (!appointmentId) {
      console.error('[Bookings] No appointmentId provided!');
      Alert.alert('Error', 'Invalid appointment ID');
      return;
    }

    // For web, use window.confirm as Alert may not work properly
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to cancel your appointment with ${doctorName}? Your wallet will be refunded.`);
      if (!confirmed) return;

      try {
        console.log('[Bookings] Cancelling appointment (web):', appointmentId);
        await apiClient.patch(`/appointments/${appointmentId}/user-cancel`);
        window.alert('Appointment cancelled successfully. Your wallet has been refunded.');
        fetchAppointments(); // Refresh appointments
      } catch (error: any) {
        console.error('[Bookings] Error cancelling appointment:', error);
        console.error('[Bookings] Error response:', error.response?.data);
        window.alert(error.response?.data?.message || 'Failed to cancel appointment');
      }
      return;
    }

    // For native platforms, use Alert
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment with ${doctorName}? Your wallet will be refunded.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Bookings] Cancelling appointment:', appointmentId);
              await apiClient.patch(`/appointments/${appointmentId}/user-cancel`);
              Alert.alert('Success', 'Appointment cancelled successfully. Your wallet has been refunded.');
              fetchAppointments(); // Refresh appointments
            } catch (error: any) {
              console.error('[Bookings] Error cancelling appointment:', error);
              console.error('[Bookings] Error response:', error.response?.data);
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  };

  const handleViewInvoice = async (booking: DentalBooking | VisionBooking) => {
    try {
      console.log('[Bookings] Downloading invoice for:', booking.bookingId);

      // Determine booking type based on bookingId prefix
      const isVision = booking.bookingId.startsWith('VIS-BOOK');
      const endpoint = isVision
        ? `/vision-bookings/${booking.bookingId}/invoice`
        : `/dental-bookings/${booking.bookingId}/invoice`;

      console.log('[Bookings] Fetching invoice from:', endpoint);

      // Get auth token
      const token = await tokenManager.getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      // Get base URL from apiClient
      const baseURL = apiClient.defaults.baseURL || '';
      const fullUrl = `${baseURL}${endpoint}`;

      console.log('[Bookings] Downloading from URL:', fullUrl);

      // Use fetch with Bearer token (following Next.js pattern but with token auth)
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[Bookings] Invoice download failed:', errorData);
        throw new Error(errorData?.message || 'Failed to download invoice');
      }

      if (Platform.OS === 'web') {
        // For web, create a download link (same as Next.js)
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = booking.invoiceFileName || `invoice-${booking.bookingId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log('[Bookings] Invoice downloaded successfully');
      } else {
        // For native mobile, show message
        Alert.alert(
          'Download Invoice',
          'Invoice download on mobile app is coming soon. Please use the web version to download invoices.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[Bookings] Error downloading invoice:', error);

      let errorMessage = 'Failed to download invoice';
      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancelLabPrescription = async (prescription: any) => {
    const getCancellationReason = (): Promise<string | null> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const reason = window.prompt(
            `Please provide a reason for cancelling prescription ${prescription.prescriptionId} (minimum 10 characters):`,
            'I no longer need this prescription'
          );
          resolve(reason);
        } else {
          // For native, use a default reason since Alert.prompt is iOS only
          Alert.alert(
            'Cancel Prescription',
            `Are you sure you want to cancel prescription ${prescription.prescriptionId}? This action cannot be undone.`,
            [
              { text: 'No', style: 'cancel', onPress: () => resolve(null) },
              { text: 'Yes, Cancel', style: 'destructive', onPress: () => resolve('User requested cancellation from mobile app') },
            ]
          );
        }
      });
    };

    const reason = await getCancellationReason();
    if (!reason) return;

    if (reason.length < 10) {
      if (Platform.OS === 'web') {
        window.alert('Cancellation reason must be at least 10 characters');
      } else {
        Alert.alert('Error', 'Cancellation reason must be at least 10 characters');
      }
      return;
    }

    try {
      console.log('[Bookings] Cancelling lab prescription:', prescription.prescriptionId);
      await apiClient.post(`/member/lab/prescriptions/${prescription.prescriptionId}/cancel`, { reason });

      if (Platform.OS === 'web') {
        window.alert('Prescription cancelled successfully');
      } else {
        Alert.alert('Success', 'Prescription cancelled successfully');
      }

      fetchLabPrescriptions();
    } catch (error: any) {
      console.error('[Bookings] Error cancelling prescription:', error);

      // Extract error message - handle nested message structures
      let errorMessage = 'Failed to cancel prescription';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (data.message && typeof data.message.message === 'string') {
          errorMessage = data.message.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleViewLabReport = async (order: any) => {
    try {
      console.log('[Bookings] Downloading lab report for order:', order.orderId);
      console.log('[Bookings] Report URL from order:', order.reportUrl);

      // Get the backend base URL
      const baseURL = apiClient.defaults.baseURL || '';

      // If order has a direct reportUrl, use it
      if (order.reportUrl) {
        // Construct full URL - reportUrl might be relative (e.g., /api/uploads/...)
        let fullReportUrl = order.reportUrl;
        if (order.reportUrl.startsWith('/')) {
          // It's a relative path, need to construct full URL
          // baseURL is like "http://localhost:5001/api"
          // reportUrl is like "/api/uploads/lab-reports/..."
          // We need to avoid double /api

          // Get the origin (protocol + host) from baseURL
          const urlObj = new URL(baseURL);
          const origin = urlObj.origin; // e.g., "http://localhost:5001"

          fullReportUrl = `${origin}${order.reportUrl}`;
        }

        console.log('[Bookings] Opening report URL:', fullReportUrl);

        if (Platform.OS === 'web') {
          // Open the report URL in a new tab
          window.open(fullReportUrl, '_blank');
        } else {
          // For native, open the URL
          Linking.openURL(fullReportUrl);
        }
        return;
      }

      // Fallback: Try to fetch from API endpoint
      const token = await tokenManager.getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      const endpoint = `/member/lab/orders/${order.orderId}/report`;
      const fullUrl = `${baseURL}${endpoint}`;

      console.log('[Bookings] Downloading report from URL:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[Bookings] Report download failed:', errorData);

        // Extract error message - handle nested message structures
        let errorMsg = 'Failed to download report. The report may not be available yet.';
        if (errorData) {
          if (typeof errorData === 'string') {
            errorMsg = errorData;
          } else if (typeof errorData.message === 'string') {
            errorMsg = errorData.message;
          } else if (errorData.message && typeof errorData.message.message === 'string') {
            errorMsg = errorData.message.message;
          } else if (typeof errorData.error === 'string') {
            errorMsg = errorData.error;
          }
        }
        throw new Error(errorMsg);
      }

      if (Platform.OS === 'web') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = order.reportFileName || `lab-report-${order.orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log('[Bookings] Report downloaded successfully');
      } else {
        Alert.alert(
          'Download Report',
          'Report download on mobile app is coming soon. Please use the web version to download reports.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[Bookings] Error downloading report:', error);

      let errorMessage = 'Failed to download report';
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleCancelDiagnosticPrescription = async (prescription: any) => {
    const getCancellationReason = (): Promise<string | null> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const reason = window.prompt(
            `Please provide a reason for cancelling prescription ${prescription.prescriptionId} (minimum 10 characters):`,
            'I no longer need this prescription'
          );
          resolve(reason);
        } else {
          // For native, use a default reason since Alert.prompt is iOS only
          Alert.alert(
            'Cancel Prescription',
            `Are you sure you want to cancel prescription ${prescription.prescriptionId}? This action cannot be undone.`,
            [
              { text: 'No', style: 'cancel', onPress: () => resolve(null) },
              { text: 'Yes, Cancel', style: 'destructive', onPress: () => resolve('User requested cancellation from mobile app') },
            ]
          );
        }
      });
    };

    const reason = await getCancellationReason();
    if (!reason) return;

    if (reason.length < 10) {
      if (Platform.OS === 'web') {
        window.alert('Cancellation reason must be at least 10 characters');
      } else {
        Alert.alert('Error', 'Cancellation reason must be at least 10 characters');
      }
      return;
    }

    try {
      console.log('[Bookings] Cancelling diagnostic prescription:', prescription.prescriptionId);
      await apiClient.post(`/member/diagnostics/prescriptions/${prescription.prescriptionId}/cancel`, { reason });

      if (Platform.OS === 'web') {
        window.alert('Prescription cancelled successfully');
      } else {
        Alert.alert('Success', 'Prescription cancelled successfully');
      }

      fetchDiagnosticPrescriptions();
    } catch (error: any) {
      console.error('[Bookings] Error cancelling prescription:', error);

      // Extract error message - handle nested message structures
      let errorMessage = 'Failed to cancel prescription';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (data.message && typeof data.message.message === 'string') {
          errorMessage = data.message.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleViewDiagnosticReport = async (order: any) => {
    try {
      console.log('[Bookings] Downloading diagnostic report for order:', order.orderId);
      console.log('[Bookings] Report URL from order:', order.reportUrl);

      // Get the backend base URL
      const baseURL = apiClient.defaults.baseURL || '';

      // If order has a direct reportUrl, use it
      if (order.reportUrl) {
        // Construct full URL - reportUrl might be relative (e.g., /api/uploads/...)
        let fullReportUrl = order.reportUrl;
        if (order.reportUrl.startsWith('/')) {
          // It's a relative path, need to construct full URL
          // Get the origin (protocol + host) from baseURL
          const urlObj = new URL(baseURL);
          const origin = urlObj.origin;

          fullReportUrl = `${origin}${order.reportUrl}`;
        }

        console.log('[Bookings] Opening report URL:', fullReportUrl);

        if (Platform.OS === 'web') {
          window.open(fullReportUrl, '_blank');
        } else {
          Linking.openURL(fullReportUrl);
        }
        return;
      }

      // Fallback: Try to fetch from API endpoint
      const token = await tokenManager.getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      const endpoint = `/member/diagnostics/orders/${order.orderId}/report`;
      const fullUrl = `${baseURL}${endpoint}`;

      console.log('[Bookings] Downloading report from URL:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[Bookings] Report download failed:', errorData);

        let errorMsg = 'Failed to download report. The report may not be available yet.';
        if (errorData) {
          if (typeof errorData === 'string') {
            errorMsg = errorData;
          } else if (typeof errorData.message === 'string') {
            errorMsg = errorData.message;
          } else if (errorData.message && typeof errorData.message.message === 'string') {
            errorMsg = errorData.message.message;
          } else if (typeof errorData.error === 'string') {
            errorMsg = errorData.error;
          }
        }
        throw new Error(errorMsg);
      }

      if (Platform.OS === 'web') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = order.reportFileName || `diagnostic-report-${order.orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log('[Bookings] Report downloaded successfully');
      } else {
        Alert.alert(
          'Download Report',
          'Report download on mobile app is coming soon. Please use the web version to download reports.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[Bookings] Error downloading report:', error);

      let errorMessage = 'Failed to download report';
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  // ============================================================================
  // HELPERS
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'PENDING_CONFIRMATION':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'COMPLETED':
        return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'CANCELLED':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'Pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'PENDING':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'FAILED':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151' };
    }
  };

  const getPaymentStatusText = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // ============================================================================
  // TAB DATA
  // ============================================================================

  const tabs = [
    { id: 'doctors', label: 'Doctors', icon: HeartIcon },
    { id: 'lab', label: 'Lab', icon: BeakerIcon },
    { id: 'diagnostic', label: 'Diagnostic', icon: BeakerIcon },
    { id: 'pharmacy', label: 'Pharmacy', icon: BuildingStorefrontIcon },
    { id: 'dental', label: 'Dental', icon: SparklesIcon },
    { id: 'vision', label: 'Vision', icon: EyeIcon },
    { id: 'ahc', label: 'AHC', icon: HeartIcon },
  ];

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderEmptyState = (type: string) => {
    const emptyConfig = {
      doctors: {
        title: 'No appointments yet',
        description: 'Book your first appointment to get started',
        buttonText: 'Book Appointment',
        route: '/member/appointments',
      },
      dental: {
        title: 'No dental bookings yet',
        description: 'Book your first dental service to get started',
        buttonText: 'Browse Dental Services',
        route: '/member/dental',
      },
      vision: {
        title: 'No vision bookings yet',
        description: 'Book your first vision service to get started',
        buttonText: 'Browse Vision Services',
        route: '/member/vision',
      },
      lab: {
        title: 'No lab tests yet',
        description: 'Upload a prescription to get started',
        buttonText: 'Go to Lab Tests',
        route: '/member/lab-tests',
      },
      diagnostic: {
        title: 'No diagnostic tests yet',
        description: 'Upload a prescription to book diagnostic services',
        buttonText: 'Go to Diagnostics',
        route: '/member/diagnostics',
      },
      pharmacy: {
        title: 'No pharmacy orders yet',
        description: 'Place your first order to get started',
        buttonText: 'Browse Medicines',
        route: '/member/pharmacy',
      },
      ahc: {
        title: 'No health checkups yet',
        description: 'Book your annual health checkup',
        buttonText: 'Browse AHC Packages',
        route: '/member/ahc',
      },
    };

    const config = emptyConfig[type as keyof typeof emptyConfig] || emptyConfig.doctors;

    return (
      <LinearGradient
        colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 48,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#86ACD8',
        }}
      >
        <IconCircle icon={SparklesIcon} size="lg" />
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#0E51A2',
            marginTop: 24,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {config.title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#6B7280',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          {config.description}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(config.route as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1F63B4', '#5DA4FB']}
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
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
              {config.buttonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  const renderDentalBookingCard = (booking: DentalBooking, isUpcoming: boolean) => {
    // Determine if booking can be cancelled
    const bookingDateObj = new Date(booking.appointmentDate);
    const timeParts = booking.appointmentTime.match(/(\d+):(\d+)/);
    if (timeParts) {
      const hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      bookingDateObj.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const isFuture = bookingDateObj > now;
    const canCancel =
      (booking.status === 'PENDING_CONFIRMATION' || booking.status === 'CONFIRMED') && isFuture;

    return (
      <LinearGradient
        colors={
          isUpcoming
            ? ['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']
            : ['#EFF4FF', '#FEF3E9', '#FEF3E9']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 2,
          borderColor: '#86ACD8',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(223, 232, 255, 0.75)',
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <SparklesIcon width={24} height={24} color="#0F5FDC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                {booking.serviceName}
              </Text>
              <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                {booking.clinicName}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                ...getStatusColor(booking.status),
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: getStatusColor(booking.status).color }}>
                {getStatusText(booking.status)}
              </Text>
            </View>
            {booking.paymentStatus && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  ...getPaymentStatusColor(booking.paymentStatus),
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '500',
                    color: getPaymentStatusColor(booking.paymentStatus).color,
                  }}
                >
                  {getPaymentStatusText(booking.paymentStatus)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Patient: {booking.patientName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{formatDate(booking.appointmentDate)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClockIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{booking.appointmentTime}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPinIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }} numberOfLines={1}>
              {booking.clinicAddress.city}, {booking.clinicAddress.state}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#111827' }}>
              ID: <Text style={{ fontWeight: '500' }}>{booking.bookingId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0a529f' }}>
              ₹{booking.servicePrice}
            </Text>
          </View>

          {/* Payment Info */}
          {booking.walletDebitAmount > 0 && (
            <View style={{ marginBottom: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#111827' }}>Wallet Deduction:</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>
                  ₹{booking.walletDebitAmount}
                </Text>
              </View>
              {booking.copayAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#111827' }}>Co-pay:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>
                    ₹{booking.copayAmount}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 8 }}>
            {canCancel && (
              <TouchableOpacity
                onPress={() => handleCancelDentalBooking(booking.bookingId, booking.serviceName)}
                style={{
                  backgroundColor: '#FEF2F2',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>Cancel Booking</Text>
              </TouchableOpacity>
            )}

            {/* Invoice Button - Only show when booking is completed and invoice is generated */}
            {booking.status === 'COMPLETED' && booking.invoiceGenerated && (
              <TouchableOpacity
                onPress={() => handleViewInvoice(booking)}
                style={{
                  backgroundColor: '#EFF6FF',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
                activeOpacity={0.7}
              >
                <DocumentArrowDownIcon width={16} height={16} color="#2563EB" />
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#2563EB' }}>View Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderVisionBookingCard = (booking: VisionBooking, isUpcoming: boolean) => {
    // Determine if booking can be cancelled
    // Can cancel if pending confirmation or confirmed but no bill generated yet
    const bookingDateObj = new Date(booking.appointmentDate);
    const timeParts = booking.appointmentTime.match(/(\d+):(\d+)/);
    if (timeParts) {
      const hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      bookingDateObj.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const isFuture = bookingDateObj > now;
    const canCancel =
      (booking.status === 'PENDING_CONFIRMATION' ||
       (booking.status === 'CONFIRMED' && !booking.billGenerated)) && isFuture;

    return (
      <LinearGradient
        colors={
          isUpcoming
            ? ['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']
            : ['#EFF4FF', '#FEF3E9', '#FEF3E9']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 2,
          borderColor: '#86ACD8',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(223, 232, 255, 0.75)',
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <EyeIcon width={24} height={24} color="#0F5FDC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                {booking.serviceName}
              </Text>
              <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                {booking.clinicName}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                ...getStatusColor(booking.status),
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: getStatusColor(booking.status).color }}>
                {getStatusText(booking.status)}
              </Text>
            </View>
            {booking.paymentStatus && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  ...getPaymentStatusColor(booking.paymentStatus),
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '500',
                    color: getPaymentStatusColor(booking.paymentStatus).color,
                  }}
                >
                  {getPaymentStatusText(booking.paymentStatus)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Patient: {booking.patientName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{formatDate(booking.appointmentDate)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClockIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{booking.appointmentTime}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPinIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }} numberOfLines={1}>
              {booking.clinicAddress.city}, {booking.clinicAddress.state}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#111827' }}>
              ID: <Text style={{ fontWeight: '500' }}>{booking.bookingId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0a529f' }}>
              ₹{booking.servicePrice}
            </Text>
          </View>

          {/* Payment Info */}
          {booking.walletDebitAmount > 0 && (
            <View style={{ marginBottom: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#111827' }}>Wallet Deduction:</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>
                  ₹{booking.walletDebitAmount}
                </Text>
              </View>
              {booking.copayAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#111827' }}>Co-pay:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>
                    ₹{booking.copayAmount}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 8 }}>
            {/* View and Pay Bill - Show when bill generated but payment pending */}
            {booking.billGenerated && booking.paymentStatus === 'PENDING' && (
              <TouchableOpacity
                onPress={() => router.push(`/member/vision/payment/${booking.bookingId}` as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#1F63B4', '#5DA4FB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>
                    View and Pay Bill
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Invoice Button - Show when payment completed and invoice generated */}
            {booking.paymentStatus === 'COMPLETED' && booking.invoiceGenerated && (
              <TouchableOpacity
                onPress={() => handleViewInvoice(booking)}
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
                activeOpacity={0.7}
              >
                <DocumentArrowDownIcon width={16} height={16} color="#166534" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#166534' }}>View/Download Invoice</Text>
              </TouchableOpacity>
            )}

            {/* Payment Complete - Show when payment completed but invoice not yet generated */}
            {booking.paymentStatus === 'COMPLETED' && !booking.invoiceGenerated && (
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <CheckCircleIcon width={16} height={16} color="#166534" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#166534' }}>Payment Complete</Text>
              </View>
            )}

            {/* Cancel Button - Show when pending or confirmed but no bill yet */}
            {canCancel && (
              <TouchableOpacity
                onPress={() => handleCancelVisionBooking(booking.bookingId, booking.serviceName)}
                style={{
                  backgroundColor: '#FEF2F2',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderAppointmentCard = (appointment: Appointment, isUpcoming: boolean) => {
    // Determine if appointment can be cancelled
    const appointmentDateObj = new Date(`${appointment.appointmentDate} ${appointment.timeSlot}`);
    const now = new Date();
    const isFuture = appointmentDateObj > now;
    const canCancel =
      (appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED') && isFuture;

    return (
      <LinearGradient
        colors={
          isUpcoming
            ? ['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']
            : ['#EFF4FF', '#FEF3E9', '#FEF3E9']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 2,
          borderColor: '#86ACD8',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(223, 232, 255, 0.75)',
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <HeartIcon width={24} height={24} color="#0F5FDC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                Dr. {appointment.doctorName}
              </Text>
              <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                {appointment.specialty}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                ...getStatusColor(appointment.status),
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: getStatusColor(appointment.status).color }}>
                {getStatusText(appointment.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Patient: {appointment.patientName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{formatDate(appointment.appointmentDate)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClockIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{appointment.timeSlot}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPinIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }} numberOfLines={1}>
              {appointment.clinicName}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#111827' }}>
              ID: <Text style={{ fontWeight: '500' }}>{appointment.appointmentNumber}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0a529f' }}>
              ₹{appointment.consultationFee}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 8 }}>
            {appointment.hasPrescription && appointment.prescriptionId && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Prescription', 'Prescription viewing will be implemented');
                }}
                style={{
                  backgroundColor: '#EFF4FF',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#0F5FDC' }}>View Prescription</Text>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity
                onPress={() => handleCancelAppointment(appointment.appointmentId, appointment.doctorName)}
                style={{
                  backgroundColor: '#FEF2F2',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>Cancel Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderLabPrescriptionCard = (prescription: any) => {
    const statusColors: Record<string, { backgroundColor: string; color: string }> = {
      UPLOADED: { backgroundColor: '#FEF3C7', color: '#92400E' },
      DIGITIZING: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
      CANCELLED: { backgroundColor: '#FEE2E2', color: '#991B1B' },
      READY: { backgroundColor: '#DCFCE7', color: '#166534' },
    };

    const statusColor = statusColors[prescription.status] || { backgroundColor: '#F3F4F6', color: '#374151' };
    const statusText = prescription.status === 'CANCELLED' ? 'Cancelled' : 'In Queue';

    return (
      <LinearGradient
        colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 2,
          borderColor: '#86ACD8',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(223, 232, 255, 0.75)',
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <BeakerIcon width={24} height={24} color="#0F5FDC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                Lab Prescription
              </Text>
              <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                {statusText}
              </Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              ...statusColor,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor.color }}>
              {prescription.status}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Patient: {prescription.patientName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Uploaded: {formatDate(prescription.uploadedAt)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPinIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Pincode: {prescription.pincode}</Text>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <Text style={{ fontSize: 13, color: '#111827', marginBottom: 8 }}>
            ID: <Text style={{ fontWeight: '500' }}>{prescription.prescriptionId}</Text>
          </Text>

          {prescription.status === 'CANCELLED' ? (
            <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#991B1B' }}>
                Cancelled on {formatDate(prescription.cancelledAt)}
                {prescription.cancellationReason && `\nReason: ${prescription.cancellationReason}`}
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#DBEAFE', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#1E40AF' }}>
                Our team is processing your prescription. You will be notified once it's ready for ordering.
              </Text>
            </View>
          )}

          {prescription.status === 'UPLOADED' && (
            <TouchableOpacity
              onPress={() => handleCancelLabPrescription(prescription)}
              style={{
                backgroundColor: '#FEF2F2',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 8,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>Cancel Prescription</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderLabOrderCard = (order: any) => {
    return (
      <LinearGradient
        colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 2,
          borderColor: '#86ACD8',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(223, 232, 255, 0.75)',
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <BeakerIcon width={24} height={24} color="#0F5FDC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                Lab Test Order
              </Text>
              <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                {order.items?.length || 0} test(s)
              </Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              backgroundColor: '#DCFCE7',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: '#166534' }}>
              Paid
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Vendor: {order.vendorName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{formatDate(order.collectionDate)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClockIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{order.collectionTime}</Text>
          </View>

          {order.items && order.items.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827', marginBottom: 4 }}>Tests:</Text>
              {order.items.slice(0, 3).map((item: any, idx: number) => (
                <Text key={idx} style={{ fontSize: 12, color: '#111827', marginLeft: 8 }}>
                  • {item.serviceName}
                </Text>
              ))}
              {order.items.length > 3 && (
                <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                  +{order.items.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#111827' }}>
              Order ID: <Text style={{ fontWeight: '500' }}>{order.orderId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0a529f' }}>
              ₹{order.finalAmount}
            </Text>
          </View>

          {/* Report Button - Show when report is generated/available */}
          {(order.reportGenerated || order.reportUrl) && (
            <TouchableOpacity
              onPress={() => handleViewLabReport(order)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <DocumentArrowDownIcon width={16} height={16} color="#FFFFFF" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>View / Download Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Status - Show when report not yet available */}
          {!order.reportGenerated && !order.reportUrl && order.status !== 'CANCELLED' && (
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#92400E' }}>
                Report will be available after sample collection
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderLabCartCard = (cart: any) => {
    const hasVendorsAssigned = cart.selectedVendorIds && cart.selectedVendorIds.length > 0;
    const displayStatus = hasVendorsAssigned ? 'Payment Pending' : cart.status;
    const statusColor = hasVendorsAssigned
      ? { backgroundColor: '#FEF3C7', color: '#92400E' }
      : cart.status === 'ACTIVE'
      ? { backgroundColor: '#DBEAFE', color: '#1E40AF' }
      : { backgroundColor: '#F3F4F6', color: '#374151' };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/member/lab-tests?cartId=${cart.cartId}` as any)}
      >
        <LinearGradient
          colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 20,
            borderWidth: 2,
            borderColor: '#86ACD8',
            marginBottom: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(223, 232, 255, 0.75)',
                  borderWidth: 1,
                  borderColor: 'rgba(164, 191, 254, 0.48)',
                }}
              >
                <BeakerIcon width={24} height={24} color="#0F5FDC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                  Lab Test Cart
                </Text>
                <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                  {cart.items?.length || 0} test(s)
                </Text>
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                ...statusColor,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor.color }}>
                {displayStatus}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={{ gap: 8, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <UserIcon width={16} height={16} color="#111827" />
              <Text style={{ fontSize: 13, color: '#111827' }}>Patient: {cart.patientName}</Text>
            </View>

            {cart.items && cart.items.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827', marginBottom: 4 }}>Tests:</Text>
                {cart.items.slice(0, 3).map((item: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 12, color: '#111827', marginLeft: 8 }}>
                    • {item.serviceName}
                  </Text>
                ))}
                {cart.items.length > 3 && (
                  <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                    +{cart.items.length - 3} more
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <View
            style={{
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#111827' }}>
                Cart ID: <Text style={{ fontWeight: '500' }}>{cart.cartId}</Text>
              </Text>
            </View>

            {hasVendorsAssigned ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#166534' }}>✓ Vendors assigned by operations team</Text>
                <TouchableOpacity
                  onPress={() => router.push(`/member/lab-tests/booking/${cart.cartId}` as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1F63B4', '#5DA4FB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Select Vendor & Book</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F5FDC' }}>
                View Details →
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderDiagnosticPrescriptionCard = (prescription: any) => {
    const statusColors: Record<string, { backgroundColor: string; color: string }> = {
      UPLOADED: { backgroundColor: '#FEF3C7', color: '#92400E' },
      DIGITIZING: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
      CANCELLED: { backgroundColor: '#FEE2E2', color: '#991B1B' },
      READY: { backgroundColor: '#DCFCE7', color: '#166534' },
    };

    const statusColor = statusColors[prescription.status] || { backgroundColor: '#F3F4F6', color: '#374151' };
    const statusText = prescription.status === 'CANCELLED' ? 'Cancelled' : 'In Queue';

    return (
      <LinearGradient
        colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 2,
          borderColor: '#86ACD8',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(223, 232, 255, 0.75)',
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <BeakerIcon width={24} height={24} color="#0F5FDC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                Diagnostic Prescription
              </Text>
              <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                {statusText}
              </Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              ...statusColor,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor.color }}>
              {prescription.status}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Patient: {prescription.patientName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Uploaded: {formatDate(prescription.uploadedAt)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPinIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Pincode: {prescription.pincode}</Text>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <Text style={{ fontSize: 13, color: '#111827', marginBottom: 8 }}>
            ID: <Text style={{ fontWeight: '500' }}>{prescription.prescriptionId}</Text>
          </Text>

          {prescription.status === 'CANCELLED' ? (
            <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#991B1B' }}>
                Cancelled on {formatDate(prescription.cancelledAt)}
                {prescription.cancellationReason && `\nReason: ${prescription.cancellationReason}`}
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#DBEAFE', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#1E40AF' }}>
                Our team is processing your prescription. You will be notified once it's ready for booking.
              </Text>
            </View>
          )}

          {prescription.status === 'UPLOADED' && (
            <TouchableOpacity
              onPress={() => handleCancelDiagnosticPrescription(prescription)}
              style={{
                backgroundColor: '#FEF2F2',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 8,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>Cancel Prescription</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderDiagnosticOrderCard = (order: any) => {
    return (
      <LinearGradient
        colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 2,
          borderColor: '#86ACD8',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(223, 232, 255, 0.75)',
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
              }}
            >
              <BeakerIcon width={24} height={24} color="#0F5FDC" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                Diagnostic Order
              </Text>
              <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                {order.items?.length || 0} service(s)
              </Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              backgroundColor: '#DCFCE7',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: '#166534' }}>
              Paid
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <UserIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>Center: {order.vendorName}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{formatDate(order.appointmentDate || order.collectionDate)}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ClockIcon width={16} height={16} color="#111827" />
            <Text style={{ fontSize: 13, color: '#111827' }}>{order.appointmentTime || order.collectionTime}</Text>
          </View>

          {order.items && order.items.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827', marginBottom: 4 }}>Services:</Text>
              {order.items.slice(0, 3).map((item: any, idx: number) => (
                <Text key={idx} style={{ fontSize: 12, color: '#111827', marginLeft: 8 }}>
                  • {item.serviceName}
                </Text>
              ))}
              {order.items.length > 3 && (
                <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                  +{order.items.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#111827' }}>
              Order ID: <Text style={{ fontWeight: '500' }}>{order.orderId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0a529f' }}>
              ₹{order.finalAmount}
            </Text>
          </View>

          {/* Report Button - Show when report is generated/available */}
          {(order.reportGenerated || order.reportUrl) && (
            <TouchableOpacity
              onPress={() => handleViewDiagnosticReport(order)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <DocumentArrowDownIcon width={16} height={16} color="#FFFFFF" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>View / Download Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Status - Show when report not yet available */}
          {!order.reportGenerated && !order.reportUrl && order.status !== 'CANCELLED' && (
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#92400E' }}>
                Report will be available after your appointment
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderDiagnosticCartCard = (cart: any) => {
    const hasVendorsAssigned = cart.selectedVendorIds && cart.selectedVendorIds.length > 0;
    const displayStatus = hasVendorsAssigned ? 'Payment Pending' : cart.status;
    const statusColor = hasVendorsAssigned
      ? { backgroundColor: '#FEF3C7', color: '#92400E' }
      : cart.status === 'ACTIVE'
      ? { backgroundColor: '#DBEAFE', color: '#1E40AF' }
      : { backgroundColor: '#F3F4F6', color: '#374151' };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/member/diagnostics?cartId=${cart.cartId}` as any)}
      >
        <LinearGradient
          colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 20,
            borderWidth: 2,
            borderColor: '#86ACD8',
            marginBottom: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(223, 232, 255, 0.75)',
                  borderWidth: 1,
                  borderColor: 'rgba(164, 191, 254, 0.48)',
                }}
              >
                <BeakerIcon width={24} height={24} color="#0F5FDC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                  Diagnostic Cart
                </Text>
                <Text style={{ fontSize: 13, color: '#111827', marginTop: 2 }}>
                  {cart.items?.length || 0} service(s)
                </Text>
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
                ...statusColor,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor.color }}>
                {displayStatus}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={{ gap: 8, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <UserIcon width={16} height={16} color="#111827" />
              <Text style={{ fontSize: 13, color: '#111827' }}>Patient: {cart.patientName}</Text>
            </View>

            {cart.items && cart.items.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827', marginBottom: 4 }}>Services:</Text>
                {cart.items.slice(0, 3).map((item: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 12, color: '#111827', marginLeft: 8 }}>
                    • {item.serviceName}
                  </Text>
                ))}
                {cart.items.length > 3 && (
                  <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                    +{cart.items.length - 3} more
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <View
            style={{
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#111827' }}>
                Cart ID: <Text style={{ fontWeight: '500' }}>{cart.cartId}</Text>
              </Text>
            </View>

            {hasVendorsAssigned ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#166534' }}>✓ Centers assigned by operations team</Text>
                <TouchableOpacity
                  onPress={() => router.push(`/member/diagnostics/booking/${cart.cartId}` as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1F63B4', '#5DA4FB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Select Center & Book</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F5FDC' }}>
                View Details →
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
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
  // MAIN UI
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  padding: 8,
                  borderRadius: 8,
                }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>My Bookings</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ===== TAB BAR (STICKY) ===== */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
          ...Platform.select({
            web: {
              position: 'sticky',
              top: Platform.OS === 'web' ? 73 : 0,
              zIndex: 9,
            },
          }),
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            maxWidth: 480,
            marginHorizontal: 'auto',
            paddingHorizontal: 16,
          }}
          style={{ width: '100%' }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? '#0F5FDC' : 'transparent',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon width={18} height={18} color={isActive ? '#0E51A2' : '#6B7280'} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: isActive ? '#0E51A2' : '#6B7280',
                      }}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* Doctors Tab */}
          {activeTab === 'doctors' && (
            <View>
              {appointments.length === 0 ? (
                renderEmptyState('doctors')
              ) : (
                <View>
                  {/* Upcoming Appointments */}
                  {upcomingAppointments.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      {upcomingAppointments.map((appointment) => (
                        <View key={appointment._id}>{renderAppointmentCard(appointment, true)}</View>
                      ))}
                    </View>
                  )}

                  {/* Past Appointments */}
                  {pastAppointments.length > 0 && (
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#6B7280',
                          marginBottom: 12,
                        }}
                      >
                        Past Appointments
                      </Text>
                      {pastAppointments.map((appointment) => (
                        <View key={appointment._id}>{renderAppointmentCard(appointment, false)}</View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Lab Tab */}
          {activeTab === 'lab' && (() => {
              // Filter out prescriptions that already have carts OR orders created
              // Both cart.prescriptionId and order.prescriptionId contain the MongoDB _id of the prescription
              const prescriptionIdsWithCarts = new Set(
                labCarts.map((cart: any) => cart.prescriptionId).filter(Boolean)
              );
              const prescriptionIdsWithOrders = new Set(
                labOrders.map((order: any) => order.prescriptionId).filter(Boolean)
              );

              const filteredPrescriptions = labPrescriptions.filter(
                (prescription: any) =>
                  !prescriptionIdsWithCarts.has(prescription._id) &&
                  !prescriptionIdsWithOrders.has(prescription._id)
              );

              return (
            <View>
              {labCarts.length === 0 && labOrders.length === 0 && filteredPrescriptions.length === 0 ? (
                renderEmptyState('lab')
              ) : (
                <View>
                  {/* Lab Prescriptions (In Queue) - only show if no cart created yet */}
                  {filteredPrescriptions.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: 12,
                        }}
                      >
                        Prescriptions In Queue
                      </Text>
                      {filteredPrescriptions.map((prescription: any) => (
                        <View key={prescription._id}>{renderLabPrescriptionCard(prescription)}</View>
                      ))}
                    </View>
                  )}

                  {/* Lab Orders (Paid) */}
                  {labOrders.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: 12,
                        }}
                      >
                        Lab Test Orders
                      </Text>
                      {labOrders.map((order) => (
                        <View key={order._id}>{renderLabOrderCard(order)}</View>
                      ))}
                    </View>
                  )}

                  {/* Lab Carts (Active) */}
                  {labCarts.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: 12,
                        }}
                      >
                        Active Carts
                      </Text>
                      {labCarts.map((cart) => (
                        <View key={cart._id}>{renderLabCartCard(cart)}</View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
              );
            })()}

          {/* Diagnostic Tab */}
          {activeTab === 'diagnostic' && (() => {
              // Filter out prescriptions that already have carts OR orders created
              const prescriptionIdsWithCarts = new Set(
                diagnosticCarts.map((cart: any) => cart.prescriptionId).filter(Boolean)
              );
              const prescriptionIdsWithOrders = new Set(
                diagnosticOrders.map((order: any) => order.prescriptionId).filter(Boolean)
              );

              const filteredPrescriptions = diagnosticPrescriptions.filter(
                (prescription: any) =>
                  !prescriptionIdsWithCarts.has(prescription._id) &&
                  !prescriptionIdsWithOrders.has(prescription._id)
              );

              return (
            <View>
              {diagnosticCarts.length === 0 && diagnosticOrders.length === 0 && filteredPrescriptions.length === 0 ? (
                renderEmptyState('diagnostic')
              ) : (
                <View>
                  {/* Diagnostic Prescriptions (In Queue) - only show if no cart created yet */}
                  {filteredPrescriptions.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: 12,
                        }}
                      >
                        Prescriptions In Queue
                      </Text>
                      {filteredPrescriptions.map((prescription: any) => (
                        <View key={prescription._id}>{renderDiagnosticPrescriptionCard(prescription)}</View>
                      ))}
                    </View>
                  )}

                  {/* Diagnostic Orders (Paid) */}
                  {diagnosticOrders.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: 12,
                        }}
                      >
                        Diagnostic Orders
                      </Text>
                      {diagnosticOrders.map((order) => (
                        <View key={order._id}>{renderDiagnosticOrderCard(order)}</View>
                      ))}
                    </View>
                  )}

                  {/* Diagnostic Carts (Active) */}
                  {diagnosticCarts.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: 12,
                        }}
                      >
                        Active Carts
                      </Text>
                      {diagnosticCarts.map((cart) => (
                        <View key={cart._id}>{renderDiagnosticCartCard(cart)}</View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
              );
            })()}

          {/* Pharmacy Tab */}
          {activeTab === 'pharmacy' && renderEmptyState('pharmacy')}

          {/* Dental Tab */}
          {activeTab === 'dental' && (
            <View>
              {dentalBookings.length === 0 ? (
                renderEmptyState('dental')
              ) : (
                <View>
                  {/* Upcoming Dental Bookings */}
                  {upcomingDentalBookings.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      {upcomingDentalBookings.map((booking) => (
                        <View key={booking._id}>{renderDentalBookingCard(booking, true)}</View>
                      ))}
                    </View>
                  )}

                  {/* Past Dental Bookings */}
                  {pastDentalBookings.length > 0 && (
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#6B7280',
                          marginBottom: 12,
                        }}
                      >
                        Past Bookings
                      </Text>
                      {pastDentalBookings.map((booking) => (
                        <View key={booking._id}>{renderDentalBookingCard(booking, false)}</View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Vision Tab */}
          {activeTab === 'vision' && (
            <View>
              {visionBookings.length === 0 ? (
                renderEmptyState('vision')
              ) : (
                <View>
                  {/* Upcoming Vision Bookings */}
                  {upcomingVisionBookings.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      {upcomingVisionBookings.map((booking) => (
                        <View key={booking._id}>{renderVisionBookingCard(booking, true)}</View>
                      ))}
                    </View>
                  )}

                  {/* Past Vision Bookings */}
                  {pastVisionBookings.length > 0 && (
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#6B7280',
                          marginBottom: 12,
                        }}
                      >
                        Past Bookings
                      </Text>
                      {pastVisionBookings.map((booking) => (
                        <View key={booking._id}>{renderVisionBookingCard(booking, false)}</View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* AHC Tab */}
          {activeTab === 'ahc' && renderEmptyState('ahc')}
        </View>
      </ScrollView>
    </View>
  );
}
