import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  VideoCameraIcon,
} from '../../src/components/icons/InlineSVGs';
import apiClient, { tokenManager } from '../../src/lib/api/client';
import { useFamily } from '../../src/contexts/FamilyContext';
import { fetchWalletBalance, WalletCategory } from '../../src/lib/api/wallet';

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

  // AHC (Annual Health Check) Orders
  const [ahcOrders, setAhcOrders] = useState<any[]>([]);

  // Covered benefits (from wallet categories)
  const [coveredBenefits, setCoveredBenefits] = useState<Set<string>>(new Set());

  // AHC eligibility (checked separately via eligibility endpoint)
  const [ahcCovered, setAhcCovered] = useState<boolean>(false);

  // Load More state - show only 2 cards initially per section
  const CARDS_PER_PAGE = 2;
  const [showAllUpcomingDental, setShowAllUpcomingDental] = useState(false);
  const [showAllPastDental, setShowAllPastDental] = useState(false);
  const [showAllUpcomingVision, setShowAllUpcomingVision] = useState(false);
  const [showAllPastVision, setShowAllPastVision] = useState(false);
  const [showAllUpcomingAppointments, setShowAllUpcomingAppointments] = useState(false);
  const [showAllPastAppointments, setShowAllPastAppointments] = useState(false);
  const [showAllLabPrescriptions, setShowAllLabPrescriptions] = useState(false);
  const [showAllLabOrders, setShowAllLabOrders] = useState(false);
  const [showAllLabCarts, setShowAllLabCarts] = useState(false);
  const [showAllDiagnosticPrescriptions, setShowAllDiagnosticPrescriptions] = useState(false);
  const [showAllDiagnosticOrders, setShowAllDiagnosticOrders] = useState(false);
  const [showAllDiagnosticCarts, setShowAllDiagnosticCarts] = useState(false);
  const [showAllAhcOrders, setShowAllAhcOrders] = useState(false);

  // Expandable CTA sections for all tabs
  const [expandedDoctorSection, setExpandedDoctorSection] = useState<string | null>(null);
  const [expandedDentalSection, setExpandedDentalSection] = useState<string | null>(null);
  const [expandedVisionSection, setExpandedVisionSection] = useState<string | null>(null);
  const [expandedLabSection, setExpandedLabSection] = useState<string | null>(null);
  const [expandedDiagnosticSection, setExpandedDiagnosticSection] = useState<string | null>(null);

  // Map tab names to category codes
  const tabToCategoryCode: Record<string, string> = {
    doctors: 'CAT001',      // Doctor Consult / In-Clinic Appointments
    dental: 'CAT006',       // Dental Services
    vision: 'CAT007',       // Vision Care
    lab: 'CAT004',          // Lab Tests
    diagnostic: 'CAT003',   // Diagnostic Services
    pharmacy: 'CAT002',     // Pharmacy
    // Note: AHC is checked separately via ahcCovered state
  };

  // ============================================================================
  // FETCH DATA ON MOUNT AND WHEN viewingUserId CHANGES
  // ============================================================================

  useEffect(() => {
    console.log('[Bookings] Component mounted or viewingUserId changed:', viewingUserId);
    fetchCoveredBenefits();
    fetchAppointments();
    fetchDentalBookings();
    fetchVisionBookings();
    fetchLabCarts();
    fetchLabOrders();
    fetchLabPrescriptions();
    fetchDiagnosticCarts();
    fetchDiagnosticOrders();
    fetchDiagnosticPrescriptions();
    fetchAhcOrders();
  }, [viewingUserId]);

  // Fetch covered benefits from wallet categories
  const fetchCoveredBenefits = async () => {
    try {
      if (!viewingUserId) return;

      console.log('[Bookings] Fetching covered benefits for:', viewingUserId);
      const walletData = await fetchWalletBalance(viewingUserId);

      if (walletData?.categories) {
        // A benefit is covered if it exists in categories and has total > 0
        const covered = new Set<string>();
        walletData.categories.forEach((cat: WalletCategory) => {
          if (cat.total > 0) {
            covered.add(cat.categoryCode);
          }
        });
        console.log('[Bookings] Covered benefits:', Array.from(covered));
        setCoveredBenefits(covered);
      }

      // Check AHC eligibility separately (it's not in wallet categories)
      try {
        const ahcResponse = await apiClient.get('/member/ahc/package');
        // If we get a package, AHC is covered
        const hasAhcPackage = ahcResponse.data?.data?.packageId || ahcResponse.data?.data?.id;
        console.log('[Bookings] AHC package available:', !!hasAhcPackage);
        setAhcCovered(!!hasAhcPackage);
      } catch (ahcError: any) {
        // If 404 or error, AHC is not covered
        console.log('[Bookings] AHC not covered or error:', ahcError?.response?.status);
        setAhcCovered(false);
      }
    } catch (error) {
      console.error('[Bookings] Error fetching covered benefits:', error);
      // On error, allow all benefits (fail-open)
      setCoveredBenefits(new Set(['CAT001', 'CAT002', 'CAT003', 'CAT004', 'CAT006', 'CAT007']));
      setAhcCovered(false);
    }
  };

  // Check if a benefit type is covered
  const isBenefitCovered = (tabType: string): boolean => {
    // AHC is checked separately
    if (tabType === 'ahc') {
      return ahcCovered;
    }

    const categoryCode = tabToCategoryCode[tabType];
    if (!categoryCode) return true; // Unknown tabs are allowed
    return coveredBenefits.has(categoryCode);
  };

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

        // COMPLETED and CANCELLED appointments always go to past, regardless of date
        if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
          past.push(appointment);
        } else if (appointmentDate >= today) {
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

  const fetchAhcOrders = async () => {
    try {
      console.log('[AhcOrders] Fetching AHC orders for profile:', viewingUserId);

      if (!viewingUserId) {
        console.log('[AhcOrders] No viewingUserId, skipping AHC orders fetch');
        return;
      }

      // Try fetching from /member/ahc/orders first
      let ordersData: any[] = [];

      try {
        const response = await apiClient.get(`/member/ahc/orders?userId=${viewingUserId}`);
        const data = response.data;
        console.log('[AhcOrders] Orders API response:', data);

        if (data?.data && Array.isArray(data.data)) {
          ordersData = data.data;
        } else if (Array.isArray(data)) {
          ordersData = data;
        }
      } catch (ordersError: any) {
        console.log('[AhcOrders] /member/ahc/orders failed, trying /member/ahc/bookings...');

        // Try alternative endpoint
        try {
          const altResponse = await apiClient.get(`/member/ahc/bookings?userId=${viewingUserId}`);
          const altData = altResponse.data;
          console.log('[AhcOrders] Bookings API response:', altData);

          if (altData?.data && Array.isArray(altData.data)) {
            ordersData = altData.data;
          } else if (Array.isArray(altData)) {
            ordersData = altData;
          }
        } catch (bookingsError) {
          console.log('[AhcOrders] Both endpoints failed');
        }
      }

      // Also check for pending booking in AsyncStorage (recently created)
      try {
        const pendingBooking = await AsyncStorage.getItem('ahc_completed_booking');
        if (pendingBooking) {
          const completedBooking = JSON.parse(pendingBooking);
          console.log('[AhcOrders] Found completed booking in AsyncStorage:', completedBooking);

          // Check if this booking is already in the orders list
          const alreadyExists = ordersData.some(
            (order) => order._id === completedBooking._id || order.orderId === completedBooking.orderId
          );

          if (!alreadyExists && completedBooking.packageName) {
            ordersData.unshift(completedBooking);
          }
        }
      } catch (storageError) {
        console.log('[AhcOrders] Error reading AsyncStorage:', storageError);
      }

      console.log('[AhcOrders] Final AHC orders:', ordersData.length);
      setAhcOrders(ordersData);
    } catch (error: any) {
      console.error('[AhcOrders] Error fetching AHC orders:', error);
      setAhcOrders([]);
    }
  };

  // Re-fetch AHC orders when page gains focus (important for returning from payment)
  useFocusEffect(
    useCallback(() => {
      console.log('[Bookings] Page focused, checking for AHC updates...');
      // Only re-fetch if on AHC tab or navigating to AHC tab
      if (activeTab === 'ahc' || params.tab === 'ahc') {
        fetchAhcOrders();
      }
    }, [viewingUserId, activeTab, params.tab])
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCancelDentalBooking = async (bookingId: string, serviceName: string) => {
    // For web, use window.confirm as Alert may not work properly
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to cancel ${serviceName}? Your wallet will be refunded.`);
      if (!confirmed) return;

      try {
        console.log('[Bookings] Cancelling dental booking (web):', bookingId);
        await apiClient.put(`/dental-bookings/${bookingId}/cancel`);
        window.alert('Booking cancelled successfully. Your wallet has been refunded.');
        fetchDentalBookings(); // Refresh bookings
      } catch (error: any) {
        console.error('[Bookings] Error cancelling booking:', error);
        // Extract error message - handle nested message structures
        let errorMessage = 'Failed to cancel booking';
        if (error.response?.data) {
          const data = error.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (data.message && typeof data.message === 'object' && typeof data.message.message === 'string') {
            errorMessage = data.message.message;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
        }
        window.alert(errorMessage);
      }
      return;
    }

    // For native platforms, use Alert
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
              await apiClient.put(`/dental-bookings/${bookingId}/cancel`);
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
    // For web, use window.confirm as Alert may not work properly
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to cancel ${serviceName}? Your wallet will be refunded.`);
      if (!confirmed) return;

      try {
        console.log('[Bookings] Cancelling vision booking (web):', bookingId);
        await apiClient.put(`/vision-bookings/${bookingId}/cancel`);
        window.alert('Booking cancelled successfully. Your wallet has been refunded.');
        fetchVisionBookings(); // Refresh bookings
      } catch (error: any) {
        console.error('[Bookings] Error cancelling booking:', error);
        // Extract error message - handle nested message structures
        let errorMessage = 'Failed to cancel booking';
        if (error.response?.data) {
          const data = error.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (data.message && typeof data.message === 'object' && typeof data.message.message === 'string') {
            errorMessage = data.message.message;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
        }
        window.alert(errorMessage);
      }
      return;
    }

    // For native platforms, use Alert
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
              await apiClient.put(`/vision-bookings/${bookingId}/cancel`);
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
        let errorMessage = 'Failed to download invoice';
        try {
          const errorData = await response.json();
          console.error('[Bookings] Invoice download failed:', errorData);
          if (errorData?.message) {
            errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (jsonError) {
          console.error('[Bookings] Could not parse error response as JSON');
          // Try to get text response
          try {
            const textError = await response.text();
            if (textError) errorMessage = textError;
          } catch (textErr) {
            // Use status text as fallback
            errorMessage = response.statusText || `HTTP ${response.status}`;
          }
        }
        throw new Error(errorMessage);
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

  // Unified status for dental/vision bookings - single status that considers both booking and payment status
  const getUnifiedBookingStatus = (bookingStatus: string, paymentStatus?: string) => {
    // Priority order: Cancelled > Completed > Payment issues > Confirmed > Pending
    if (bookingStatus === 'CANCELLED') {
      return { text: 'Cancelled', backgroundColor: '#FEE2E2', color: '#991B1B' };
    }
    if (bookingStatus === 'COMPLETED') {
      return { text: 'Completed', backgroundColor: '#DCFCE7', color: '#166534' };
    }
    if (paymentStatus === 'FAILED') {
      return { text: 'Payment Failed', backgroundColor: '#FEE2E2', color: '#991B1B' };
    }
    if (bookingStatus === 'CONFIRMED') {
      if (paymentStatus === 'PENDING') {
        return { text: 'Payment Pending', backgroundColor: '#FEF3C7', color: '#92400E' };
      }
      return { text: 'Confirmed', backgroundColor: '#DCFCE7', color: '#166534' };
    }
    if (bookingStatus === 'PENDING_CONFIRMATION') {
      if (paymentStatus === 'COMPLETED') {
        return { text: 'Awaiting Confirmation', backgroundColor: '#DBEAFE', color: '#1E40AF' };
      }
      if (paymentStatus === 'PENDING') {
        return { text: 'Payment Pending', backgroundColor: '#FEF3C7', color: '#92400E' };
      }
      return { text: 'Pending', backgroundColor: '#FEF3C7', color: '#92400E' };
    }
    // Default fallback
    return { text: bookingStatus, backgroundColor: '#F3F4F6', color: '#374151' };
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
        notCoveredDescription: 'Doctor consultations are not covered under your policy',
        buttonText: 'Book Appointment',
        route: '/member/appointments',
      },
      dental: {
        title: 'No dental bookings yet',
        description: 'Book your first dental service to get started',
        notCoveredDescription: 'Dental services are not covered under your policy',
        buttonText: 'Browse Dental Services',
        route: '/member/dental',
      },
      vision: {
        title: 'No vision bookings yet',
        description: 'Book your first vision service to get started',
        notCoveredDescription: 'Vision care is not covered under your policy',
        buttonText: 'Browse Vision Services',
        route: '/member/vision',
      },
      lab: {
        title: 'No lab tests yet',
        description: 'Upload a prescription to get started',
        notCoveredDescription: 'Lab tests are not covered under your policy',
        buttonText: 'Go to Lab Tests',
        route: '/member/lab-tests',
      },
      diagnostic: {
        title: 'No diagnostic tests yet',
        description: 'Upload a prescription to book diagnostic services',
        notCoveredDescription: 'Diagnostic services are not covered under your policy',
        buttonText: 'Go to Diagnostics',
        route: '/member/diagnostics',
      },
      pharmacy: {
        title: 'No pharmacy orders yet',
        description: 'Place your first order to get started',
        notCoveredDescription: 'Pharmacy benefits are not covered under your policy',
        buttonText: 'Browse Medicines',
        route: '/member/pharmacy',
      },
      ahc: {
        title: 'No health checkups yet',
        description: 'Book your annual health checkup',
        notCoveredDescription: 'Annual health check is not covered under your policy',
        buttonText: 'Book Annual Health Check',
        route: '/member/wellness-programs',
      },
    };

    const config = emptyConfig[type as keyof typeof emptyConfig] || emptyConfig.doctors;
    const isCovered = isBenefitCovered(type);

    return (
      <View
        style={{
          borderRadius: 16,
          padding: 48,
          alignItems: 'center',
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
        <IconCircle icon={SparklesIcon} size="lg" />
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: isCovered ? COLORS.primaryLight : COLORS.textGray,
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
            color: COLORS.textGray,
            marginBottom: isCovered ? 24 : 0,
            textAlign: 'center',
          }}
        >
          {isCovered ? config.description : config.notCoveredDescription}
        </Text>
        {isCovered && (
          <TouchableOpacity
            onPress={() => router.push(config.route as any)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: COLORS.primary,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
              {config.buttonText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Handle downloading AHC reports
  const handleDownloadReport = async (report: any, type: 'lab' | 'diagnostic', orderId: string) => {
    try {
      console.log(`[Bookings] Downloading ${type} report for order ${orderId}:`, report);

      // Get the file URL from the report
      const fileUrl = report.filePath || report.url;

      if (!fileUrl) {
        Alert.alert('Error', 'Report file not available');
        return;
      }

      // Construct the full URL
      // apiClient.defaults.baseURL is like "http://localhost:3001/api"
      // Static files are served at /api/uploads (per ServeStaticModule config)
      // filePath in DB is like "uploads/ahc-reports/lab/filename.pdf"
      let fullUrl = fileUrl;
      if (!fileUrl.startsWith('http')) {
        const baseUrl = apiClient.defaults.baseURL || '';
        // Ensure fileUrl starts with / for proper concatenation
        const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        fullUrl = `${baseUrl}${normalizedPath}`;
      }

      console.log(`[Bookings] Download URL: ${fullUrl}`);

      // For web, open in new tab
      if (Platform.OS === 'web') {
        // Try to get the file with auth token
        try {
          const token = await tokenManager.getToken();
          const response = await fetch(fullUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = report.originalName || report.fileName || `${type}_report_${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } else {
            // Fallback: open URL directly
            window.open(fullUrl, '_blank');
          }
        } catch (fetchError) {
          // Fallback: open URL directly
          window.open(fullUrl, '_blank');
        }
      } else {
        // For native, use Linking
        await Linking.openURL(fullUrl);
      }
    } catch (error) {
      console.error('[Bookings] Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report. Please try again.');
    }
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
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              {booking.serviceName}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              {booking.clinicName}
            </Text>
          </View>
          {/* Unified Status Badge */}
          {(() => {
            const unifiedStatus = getUnifiedBookingStatus(booking.status, booking.paymentStatus);
            return (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: unifiedStatus.backgroundColor,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '500', color: unifiedStatus.color }}>
                  {unifiedStatus.text}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Details */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Patient: </Text>{booking.patientName}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Date: </Text>{formatDate(booking.appointmentDate)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Time: </Text>{booking.appointmentTime}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }} numberOfLines={1}>
            <Text style={{ color: COLORS.textGray }}>Location: </Text>{booking.clinicAddress.city}, {booking.clinicAddress.state}
          </Text>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: COLORS.textGray }}>
              ID: <Text style={{ fontWeight: '500' }}>{booking.bookingId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
              ₹{booking.servicePrice}
            </Text>
          </View>

          {/* Payment Info */}
          {booking.walletDebitAmount > 0 && (
            <View style={{ marginBottom: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>Wallet Deduction:</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textDark }}>
                  ₹{booking.walletDebitAmount}
                </Text>
              </View>
              {booking.copayAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Co-pay:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textDark }}>
                    ₹{booking.copayAmount}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {canCancel && (
              <TouchableOpacity
                onPress={() => handleCancelDentalBooking(booking.bookingId, booking.serviceName)}
                style={{
                  flex: 1,
                  backgroundColor: '#FEF2F2',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.error }}>Cancel</Text>
              </TouchableOpacity>
            )}

            {/* Invoice Button - Only show when booking is completed and invoice is generated */}
            {booking.status === 'COMPLETED' && booking.invoiceGenerated && (
              <TouchableOpacity
                onPress={() => handleViewInvoice(booking)}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.primary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>View Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              {booking.serviceName}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              {booking.clinicName}
            </Text>
          </View>
          {/* Unified Status Badge */}
          {(() => {
            const unifiedStatus = getUnifiedBookingStatus(booking.status, booking.paymentStatus);
            return (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: unifiedStatus.backgroundColor,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '500', color: unifiedStatus.color }}>
                  {unifiedStatus.text}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Details */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Patient: </Text>{booking.patientName}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Date: </Text>{formatDate(booking.appointmentDate)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Time: </Text>{booking.appointmentTime}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }} numberOfLines={1}>
            <Text style={{ color: COLORS.textGray }}>Location: </Text>{booking.clinicAddress.city}, {booking.clinicAddress.state}
          </Text>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: COLORS.textGray }}>
              ID: <Text style={{ fontWeight: '500', color: COLORS.textDark }}>{booking.bookingId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
              ₹{booking.servicePrice}
            </Text>
          </View>

          {/* Payment Info */}
          {booking.walletDebitAmount > 0 && (
            <View style={{ marginBottom: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>Wallet Deduction:</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textDark }}>
                  ₹{booking.walletDebitAmount}
                </Text>
              </View>
              {booking.copayAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Co-pay:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textDark }}>
                    ₹{booking.copayAmount}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* View and Pay Bill - Show when bill generated but payment pending */}
            {booking.billGenerated && booking.paymentStatus === 'PENDING' && (
              <TouchableOpacity
                onPress={() => router.push(`/member/vision/payment/${booking.bookingId}` as any)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: COLORS.primary,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>
                  View & Pay Bill
                </Text>
              </TouchableOpacity>
            )}

            {/* Invoice Button - Show when payment completed and invoice generated */}
            {booking.paymentStatus === 'COMPLETED' && booking.invoiceGenerated && (
              <TouchableOpacity
                onPress={() => handleViewInvoice(booking)}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.primary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>View Invoice</Text>
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
                <CheckCircleIcon width={16} height={16} color={COLORS.success} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>Payment Complete</Text>
              </View>
            )}

            {/* Cancel Button - Show when pending or confirmed but no bill yet */}
            {canCancel && (
              <TouchableOpacity
                onPress={() => handleCancelVisionBooking(booking.bookingId, booking.serviceName)}
                style={{
                  flex: 1,
                  backgroundColor: '#FEF2F2',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.error }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              Dr. {appointment.doctorName}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              {appointment.specialty} {appointment.appointmentType === 'ONLINE' && <Text style={{ color: COLORS.success, fontWeight: '500' }}>(Online)</Text>}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: getStatusColor(appointment.status).backgroundColor,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: getStatusColor(appointment.status).color }}>
                {getStatusText(appointment.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Patient: </Text>{appointment.patientName}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Date: </Text>{formatDate(appointment.appointmentDate)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Time: </Text>{appointment.timeSlot}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }} numberOfLines={1}>
            <Text style={{ color: COLORS.textGray }}>Location: </Text>
            {appointment.appointmentType === 'ONLINE' ? 'Online Consultation' : appointment.clinicName}
          </Text>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: COLORS.textGray }}>
              ID: <Text style={{ fontWeight: '500', color: COLORS.textDark }}>{appointment.appointmentNumber}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
              ₹{appointment.consultationFee}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {appointment.hasPrescription && appointment.prescriptionId && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Prescription', 'Prescription viewing will be implemented');
                }}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.primary,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>View Prescription</Text>
              </TouchableOpacity>
            )}

            {/* Join Call Button - Only for confirmed online appointments without prescription */}
            {appointment.appointmentType === 'ONLINE' && appointment.status === 'CONFIRMED' && !appointment.hasPrescription && (
              <TouchableOpacity
                onPress={() => {
                  console.log('[Bookings] Join Call clicked:', appointment._id);
                  router.push(`/member/consultations/${appointment._id}` as any);
                }}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.success,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>Join Call</Text>
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity
                onPress={() => handleCancelAppointment(appointment.appointmentId, appointment.doctorName)}
                style={{
                  flex: 1,
                  backgroundColor: '#FEF2F2',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.error }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              Lab Prescription
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              {statusText}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: statusColor.backgroundColor,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor.color }}>
              {prescription.status}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Patient: </Text>{prescription.patientName}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Uploaded: </Text>{formatDate(prescription.uploadedAt)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Pincode: </Text>{prescription.pincode}
          </Text>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <Text style={{ fontSize: 13, color: COLORS.textGray, marginBottom: 8 }}>
            ID: <Text style={{ fontWeight: '500', color: COLORS.textDark }}>{prescription.prescriptionId}</Text>
          </Text>

          {prescription.status === 'CANCELLED' ? (
            <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: COLORS.error }}>
                Cancelled on {formatDate(prescription.cancelledAt)}
                {prescription.cancellationReason && `\nReason: ${prescription.cancellationReason}`}
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: COLORS.iconBg, padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: COLORS.primary }}>
                Our team is processing your prescription. You will be notified once it's ready for ordering.
              </Text>
            </View>
          )}

          {prescription.status === 'UPLOADED' && (
            <TouchableOpacity
              onPress={() => handleCancelLabPrescription(prescription)}
              style={{
                backgroundColor: '#FEF2F2',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 8,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.error }}>Cancel Prescription</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderLabOrderCard = (order: any) => {
    return (
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              Lab Test Order
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              {order.items?.length || 0} test(s)
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: '#DCFCE7',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.success }}>
              Paid
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Vendor: </Text>{order.vendorName}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Collection Date: </Text>{formatDate(order.collectionDate)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Time: </Text>{order.collectionTime}
          </Text>

          {order.items && order.items.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 4 }}>Tests:</Text>
              {order.items.slice(0, 3).map((item: any, idx: number) => (
                <Text key={idx} style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
                  • {item.serviceName}
                </Text>
              ))}
              {order.items.length > 3 && (
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
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
            borderTopColor: COLORS.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: COLORS.textGray }}>
              Order ID: <Text style={{ fontWeight: '500', color: COLORS.textDark }}>{order.orderId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
              ₹{order.finalAmount}
            </Text>
          </View>

          {/* Report Button - Show when report is generated/available */}
          {(order.reportGenerated || order.reportUrl) && (
            <TouchableOpacity
              onPress={() => handleViewLabReport(order)}
              activeOpacity={0.8}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: COLORS.primary,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>View Report</Text>
            </TouchableOpacity>
          )}

          {/* Status - Show when report not yet available */}
          {!order.reportGenerated && !order.reportUrl && order.status !== 'CANCELLED' && (
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: COLORS.iconBg,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: COLORS.primary }}>
                Report will be available after sample collection
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderLabCartCard = (cart: any) => {
    const hasVendorsAssigned = cart.selectedVendorIds && cart.selectedVendorIds.length > 0;
    const displayStatus = hasVendorsAssigned ? 'Payment Pending' : cart.status;
    const statusColor = hasVendorsAssigned
      ? { backgroundColor: '#FEF3C7', color: '#92400E' }
      : cart.status === 'ACTIVE'
      ? { backgroundColor: COLORS.iconBg, color: COLORS.primary }
      : { backgroundColor: '#F3F4F6', color: COLORS.textGray };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/member/lab-tests?cartId=${cart.cartId}` as any)}
      >
        <View
          style={{
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
            backgroundColor: COLORS.white,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
                Lab Test Cart
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                {cart.items?.length || 0} test(s)
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: statusColor.backgroundColor,
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
              <UserIcon width={16} height={16} color={COLORS.primary} />
              <Text style={{ fontSize: 13, color: COLORS.textDark }}>Patient: {cart.patientName}</Text>
            </View>

            {cart.items && cart.items.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 4 }}>Tests:</Text>
                {cart.items.slice(0, 3).map((item: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 12, color: COLORS.textDark, marginLeft: 8 }}>
                    • {item.serviceName}
                  </Text>
                ))}
                {cart.items.length > 3 && (
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
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
              borderTopColor: COLORS.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>
                Cart ID: <Text style={{ fontWeight: '500' }}>{cart.cartId}</Text>
              </Text>
            </View>

            {hasVendorsAssigned ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: COLORS.success }}>✓ Vendors assigned by operations team</Text>
                <TouchableOpacity
                  onPress={() => router.push(`/member/lab-tests/booking/${cart.cartId}` as any)}
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: COLORS.primary,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Select Vendor & Book</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                View Details →
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDiagnosticPrescriptionCard = (prescription: any) => {
    const statusColors: Record<string, { backgroundColor: string; color: string }> = {
      UPLOADED: { backgroundColor: '#FEF3C7', color: '#92400E' },
      DIGITIZING: { backgroundColor: COLORS.iconBg, color: COLORS.primary },
      CANCELLED: { backgroundColor: '#FEE2E2', color: COLORS.error },
      READY: { backgroundColor: '#DCFCE7', color: COLORS.success },
    };

    const statusColor = statusColors[prescription.status] || { backgroundColor: '#F3F4F6', color: COLORS.textGray };
    const statusText = prescription.status === 'CANCELLED' ? 'Cancelled' : 'In Queue';

    return (
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              Diagnostic Prescription
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              {statusText}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: statusColor.backgroundColor,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor.color }}>
              {prescription.status}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Patient: </Text>{prescription.patientName}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Uploaded: </Text>{formatDate(prescription.uploadedAt)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Pincode: </Text>{prescription.pincode}
          </Text>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <Text style={{ fontSize: 13, color: COLORS.textGray, marginBottom: 8 }}>
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
      </View>
    );
  };

  const renderDiagnosticOrderCard = (order: any) => {
    return (
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              Diagnostic Order
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              {order.items?.length || 0} service(s)
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: '#DCFCE7',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.success }}>
              Paid
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Center: </Text>{order.vendorName}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Date: </Text>{formatDate(order.appointmentDate || order.collectionDate)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textDark }}>
            <Text style={{ color: COLORS.textGray }}>Time: </Text>{order.appointmentTime || order.collectionTime}
          </Text>

          {order.items && order.items.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 4 }}>Services:</Text>
              {order.items.slice(0, 3).map((item: any, idx: number) => (
                <Text key={idx} style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
                  • {item.serviceName}
                </Text>
              ))}
              {order.items.length > 3 && (
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
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
            borderTopColor: COLORS.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: COLORS.textGray }}>
              Order ID: <Text style={{ fontWeight: '500', color: COLORS.textDark }}>{order.orderId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
              ₹{order.finalAmount}
            </Text>
          </View>

          {/* Report Button - Show when report is generated/available */}
          {(order.reportGenerated || order.reportUrl) && (
            <TouchableOpacity
              onPress={() => handleViewDiagnosticReport(order)}
              activeOpacity={0.8}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: COLORS.primary,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>View Report</Text>
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
      </View>
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
        <View
          style={{
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
            backgroundColor: COLORS.white,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
                Diagnostic Cart
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                {cart.items?.length || 0} service(s)
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
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
              <UserIcon width={16} height={16} color={COLORS.primary} />
              <Text style={{ fontSize: 13, color: COLORS.textDark }}>Patient: {cart.patientName}</Text>
            </View>

            {cart.items && cart.items.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark, marginBottom: 4 }}>Services:</Text>
                {cart.items.slice(0, 3).map((item: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 12, color: COLORS.textDark, marginLeft: 8 }}>
                    • {item.serviceName}
                  </Text>
                ))}
                {cart.items.length > 3 && (
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginLeft: 8 }}>
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
              borderTopColor: COLORS.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>
                Cart ID: <Text style={{ fontWeight: '500' }}>{cart.cartId}</Text>
              </Text>
            </View>

            {hasVendorsAssigned ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: COLORS.success }}>✓ Centers assigned by operations team</Text>
                <TouchableOpacity
                  onPress={() => router.push(`/member/diagnostics/booking/${cart.cartId}` as any)}
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: COLORS.primary,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Select Center & Book</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                View Details →
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAhcOrderCard = (order: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'PLACED':
          return { backgroundColor: '#FEF3C7', color: '#92400E' };
        case 'CONFIRMED':
          return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
        case 'LAB_COMPLETED':
        case 'DIAGNOSTIC_COMPLETED':
          return { backgroundColor: '#D1FAE5', color: '#065F46' };
        case 'COMPLETED':
          return { backgroundColor: '#DCFCE7', color: '#166534' };
        case 'CANCELLED':
          return { backgroundColor: '#FEE2E2', color: '#991B1B' };
        default:
          return { backgroundColor: '#F3F4F6', color: '#374151' };
      }
    };

    const statusColor = getStatusColor(order.status);

    // Handle both API format (labOrder/diagnosticOrder) and AsyncStorage format (labPortion/diagnosticPortion)
    const labData = order.labOrder || order.labPortion;
    const diagnosticData = order.diagnosticOrder || order.diagnosticPortion;

    const hasLabPortion = labData && (labData.items?.length > 0 || labData.vendorId || labData.vendorName);
    const hasDiagnosticPortion = diagnosticData && (diagnosticData.items?.length > 0 || diagnosticData.vendorId || diagnosticData.vendorName);

    // Check for reports
    const labReports = labData?.reports || [];
    const diagnosticReports = diagnosticData?.reports || [];

    return (
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          backgroundColor: COLORS.white,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primaryLight }}>
              {order.packageName || 'Annual Health Check'}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
              {hasLabPortion && hasDiagnosticPortion
                ? 'Lab + Diagnostic Tests'
                : hasLabPortion
                ? 'Lab Tests'
                : 'Diagnostic Tests'}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: statusColor.backgroundColor,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '500', color: statusColor.color }}>
              {order.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Lab Portion */}
        {hasLabPortion && (
          <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
              Lab Tests {labData.items?.length ? `(${labData.items.length})` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CalendarIcon width={14} height={14} color="#6B7280" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {labData.collectionDate ? formatDate(labData.collectionDate) : 'Not scheduled'}
              </Text>
            </View>
            {labData.vendorName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <BuildingStorefrontIcon width={14} height={14} color="#6B7280" />
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{labData.vendorName}</Text>
              </View>
            )}
            {/* Lab Reports */}
            {labReports.length > 0 && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669', marginBottom: 6 }}>
                  Reports Available ({labReports.length})
                </Text>
                {labReports.map((report: any, index: number) => (
                  <TouchableOpacity
                    key={report._id || index}
                    onPress={() => handleDownloadReport(report, 'lab', order.orderId)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      backgroundColor: '#ECFDF5',
                      borderRadius: 6,
                      marginBottom: 4,
                    }}
                  >
                    <DocumentArrowDownIcon width={16} height={16} color="#059669" />
                    <Text style={{ fontSize: 12, color: '#059669', flex: 1 }} numberOfLines={1}>
                      {report.originalName || report.fileName || `Lab Report ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Diagnostic Portion */}
        {hasDiagnosticPortion && (
          <View style={{ marginBottom: 12, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
              Diagnostic Tests {diagnosticData.items?.length ? `(${diagnosticData.items.length})` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CalendarIcon width={14} height={14} color="#6B7280" />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {diagnosticData.appointmentDate || diagnosticData.collectionDate ? formatDate(diagnosticData.appointmentDate || diagnosticData.collectionDate) : 'Not scheduled'}
              </Text>
            </View>
            {diagnosticData.vendorName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <BuildingStorefrontIcon width={14} height={14} color="#6B7280" />
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{diagnosticData.vendorName}</Text>
              </View>
            )}
            {/* Diagnostic Reports */}
            {diagnosticReports.length > 0 && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669', marginBottom: 6 }}>
                  Reports Available ({diagnosticReports.length})
                </Text>
                {diagnosticReports.map((report: any, index: number) => (
                  <TouchableOpacity
                    key={report._id || index}
                    onPress={() => handleDownloadReport(report, 'diagnostic', order.orderId)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      backgroundColor: '#ECFDF5',
                      borderRadius: 6,
                      marginBottom: 4,
                    }}
                  >
                    <DocumentArrowDownIcon width={16} height={16} color="#059669" />
                    <Text style={{ fontSize: 12, color: '#059669', flex: 1 }} numberOfLines={1}>
                      {report.originalName || report.fileName || `Diagnostic Report ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(95, 161, 113, 0.2)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#111827' }}>
              Order ID: <Text style={{ fontWeight: '500' }}>{order.orderId}</Text>
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#5FA171' }}>
              ₹{order.finalAmount || 0}
            </Text>
          </View>

          {/* Payment Status */}
          {order.paymentStatus && (
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: order.paymentStatus === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: order.paymentStatus === 'COMPLETED' ? '#166534' : '#92400E',
                }}
              >
                Payment {order.paymentStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
              </Text>
            </View>
          )}
        </View>
      </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/member')}
                style={{
                  padding: 8,
                  borderRadius: 8,
                }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>
                  My Bookings
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  View and manage your bookings
                </Text>
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
            paddingHorizontal: 16,
            flexGrow: 1,
          }}
          style={{ width: '100%' }}
          nestedScrollEnabled={true}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? COLORS.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: isActive ? COLORS.primaryLight : COLORS.textGray,
                    }}
                  >
                    {tab.label}
                  </Text>
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
                <View style={{ gap: 12 }}>
                  {/* CTA: Upcoming Appointments */}
                  {upcomingAppointments.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedDoctorSection(expandedDoctorSection === 'upcoming' ? null : 'upcoming')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Upcoming Appointments
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {upcomingAppointments.length} appointment{upcomingAppointments.length !== 1 ? 's' : ''} scheduled
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedDoctorSection === 'upcoming' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Upcoming Appointments */}
                  {expandedDoctorSection === 'upcoming' && upcomingAppointments.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllUpcomingAppointments ? upcomingAppointments : upcomingAppointments.slice(0, CARDS_PER_PAGE)).map((appointment) => (
                        <View key={appointment._id}>{renderAppointmentCard(appointment, true)}</View>
                      ))}
                      {upcomingAppointments.length > CARDS_PER_PAGE && !showAllUpcomingAppointments && (
                        <TouchableOpacity
                          onPress={() => setShowAllUpcomingAppointments(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({upcomingAppointments.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CTA: Past Appointments */}
                  {pastAppointments.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedDoctorSection(expandedDoctorSection === 'past' ? null : 'past')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Past Appointments
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {pastAppointments.length} appointment{pastAppointments.length !== 1 ? 's' : ''} completed
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedDoctorSection === 'past' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Past Appointments */}
                  {expandedDoctorSection === 'past' && pastAppointments.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllPastAppointments ? pastAppointments : pastAppointments.slice(0, CARDS_PER_PAGE)).map((appointment) => (
                        <View key={appointment._id}>{renderAppointmentCard(appointment, false)}</View>
                      ))}
                      {pastAppointments.length > CARDS_PER_PAGE && !showAllPastAppointments && (
                        <TouchableOpacity
                          onPress={() => setShowAllPastAppointments(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({pastAppointments.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Lab Tab */}
          {activeTab === 'lab' && (() => {
              // Filter out prescriptions that already have carts OR orders created
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

              const hasAnyLabData = labCarts.length > 0 || labOrders.length > 0 || filteredPrescriptions.length > 0;

              return (
            <View>
              {!hasAnyLabData ? (
                renderEmptyState('lab')
              ) : (
                <View style={{ gap: 12 }}>
                  {/* CTA: Prescriptions In Queue */}
                  {filteredPrescriptions.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedLabSection(expandedLabSection === 'prescriptions' ? null : 'prescriptions')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Prescriptions In Queue
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {filteredPrescriptions.length} prescription{filteredPrescriptions.length !== 1 ? 's' : ''} awaiting action
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedLabSection === 'prescriptions' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Prescriptions */}
                  {expandedLabSection === 'prescriptions' && filteredPrescriptions.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllLabPrescriptions ? filteredPrescriptions : filteredPrescriptions.slice(0, CARDS_PER_PAGE)).map((prescription: any) => (
                        <View key={prescription._id}>{renderLabPrescriptionCard(prescription)}</View>
                      ))}
                      {filteredPrescriptions.length > CARDS_PER_PAGE && !showAllLabPrescriptions && (
                        <TouchableOpacity
                          onPress={() => setShowAllLabPrescriptions(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({filteredPrescriptions.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CTA: Lab Test Orders */}
                  {labOrders.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedLabSection(expandedLabSection === 'orders' ? null : 'orders')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Lab Test Orders
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {labOrders.length} order{labOrders.length !== 1 ? 's' : ''} placed
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedLabSection === 'orders' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Orders */}
                  {expandedLabSection === 'orders' && labOrders.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllLabOrders ? labOrders : labOrders.slice(0, CARDS_PER_PAGE)).map((order) => (
                        <View key={order._id}>{renderLabOrderCard(order)}</View>
                      ))}
                      {labOrders.length > CARDS_PER_PAGE && !showAllLabOrders && (
                        <TouchableOpacity
                          onPress={() => setShowAllLabOrders(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({labOrders.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CTA: Active Carts */}
                  {labCarts.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedLabSection(expandedLabSection === 'carts' ? null : 'carts')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Active Carts
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {labCarts.length} cart{labCarts.length !== 1 ? 's' : ''} pending checkout
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedLabSection === 'carts' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Carts */}
                  {expandedLabSection === 'carts' && labCarts.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllLabCarts ? labCarts : labCarts.slice(0, CARDS_PER_PAGE)).map((cart) => (
                        <View key={cart._id}>{renderLabCartCard(cart)}</View>
                      ))}
                      {labCarts.length > CARDS_PER_PAGE && !showAllLabCarts && (
                        <TouchableOpacity
                          onPress={() => setShowAllLabCarts(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({labCarts.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
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

              const hasAnyDiagnosticData = diagnosticCarts.length > 0 || diagnosticOrders.length > 0 || filteredPrescriptions.length > 0;

              return (
            <View>
              {!hasAnyDiagnosticData ? (
                renderEmptyState('diagnostic')
              ) : (
                <View style={{ gap: 12 }}>
                  {/* CTA: Prescriptions In Queue */}
                  {filteredPrescriptions.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedDiagnosticSection(expandedDiagnosticSection === 'prescriptions' ? null : 'prescriptions')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Prescriptions In Queue
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {filteredPrescriptions.length} prescription{filteredPrescriptions.length !== 1 ? 's' : ''} awaiting action
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedDiagnosticSection === 'prescriptions' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Prescriptions */}
                  {expandedDiagnosticSection === 'prescriptions' && filteredPrescriptions.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllDiagnosticPrescriptions ? filteredPrescriptions : filteredPrescriptions.slice(0, CARDS_PER_PAGE)).map((prescription: any) => (
                        <View key={prescription._id}>{renderDiagnosticPrescriptionCard(prescription)}</View>
                      ))}
                      {filteredPrescriptions.length > CARDS_PER_PAGE && !showAllDiagnosticPrescriptions && (
                        <TouchableOpacity
                          onPress={() => setShowAllDiagnosticPrescriptions(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({filteredPrescriptions.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CTA: Diagnostic Orders */}
                  {diagnosticOrders.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedDiagnosticSection(expandedDiagnosticSection === 'orders' ? null : 'orders')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Diagnostic Orders
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {diagnosticOrders.length} order{diagnosticOrders.length !== 1 ? 's' : ''} placed
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedDiagnosticSection === 'orders' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Orders */}
                  {expandedDiagnosticSection === 'orders' && diagnosticOrders.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllDiagnosticOrders ? diagnosticOrders : diagnosticOrders.slice(0, CARDS_PER_PAGE)).map((order) => (
                        <View key={order._id}>{renderDiagnosticOrderCard(order)}</View>
                      ))}
                      {diagnosticOrders.length > CARDS_PER_PAGE && !showAllDiagnosticOrders && (
                        <TouchableOpacity
                          onPress={() => setShowAllDiagnosticOrders(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({diagnosticOrders.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CTA: Active Carts */}
                  {diagnosticCarts.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedDiagnosticSection(expandedDiagnosticSection === 'carts' ? null : 'carts')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Active Carts
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {diagnosticCarts.length} cart{diagnosticCarts.length !== 1 ? 's' : ''} pending checkout
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedDiagnosticSection === 'carts' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Carts */}
                  {expandedDiagnosticSection === 'carts' && diagnosticCarts.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllDiagnosticCarts ? diagnosticCarts : diagnosticCarts.slice(0, CARDS_PER_PAGE)).map((cart) => (
                        <View key={cart._id}>{renderDiagnosticCartCard(cart)}</View>
                      ))}
                      {diagnosticCarts.length > CARDS_PER_PAGE && !showAllDiagnosticCarts && (
                        <TouchableOpacity
                          onPress={() => setShowAllDiagnosticCarts(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({diagnosticCarts.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
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
                <View style={{ gap: 12 }}>
                  {/* CTA: Upcoming Bookings */}
                  {upcomingDentalBookings.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedDentalSection(expandedDentalSection === 'upcoming' ? null : 'upcoming')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Upcoming Bookings
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {upcomingDentalBookings.length} booking{upcomingDentalBookings.length !== 1 ? 's' : ''} scheduled
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedDentalSection === 'upcoming' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Upcoming Bookings */}
                  {expandedDentalSection === 'upcoming' && upcomingDentalBookings.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllUpcomingDental ? upcomingDentalBookings : upcomingDentalBookings.slice(0, CARDS_PER_PAGE)).map((booking) => (
                        <View key={booking._id}>{renderDentalBookingCard(booking, true)}</View>
                      ))}
                      {upcomingDentalBookings.length > CARDS_PER_PAGE && !showAllUpcomingDental && (
                        <TouchableOpacity
                          onPress={() => setShowAllUpcomingDental(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({upcomingDentalBookings.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CTA: Past Bookings */}
                  {pastDentalBookings.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedDentalSection(expandedDentalSection === 'past' ? null : 'past')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Past Bookings
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {pastDentalBookings.length} booking{pastDentalBookings.length !== 1 ? 's' : ''} completed
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedDentalSection === 'past' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Past Bookings */}
                  {expandedDentalSection === 'past' && pastDentalBookings.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllPastDental ? pastDentalBookings : pastDentalBookings.slice(0, CARDS_PER_PAGE)).map((booking) => (
                        <View key={booking._id}>{renderDentalBookingCard(booking, false)}</View>
                      ))}
                      {pastDentalBookings.length > CARDS_PER_PAGE && !showAllPastDental && (
                        <TouchableOpacity
                          onPress={() => setShowAllPastDental(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({pastDentalBookings.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
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
                <View style={{ gap: 12 }}>
                  {/* CTA: Upcoming Bookings */}
                  {upcomingVisionBookings.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedVisionSection(expandedVisionSection === 'upcoming' ? null : 'upcoming')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Upcoming Bookings
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {upcomingVisionBookings.length} booking{upcomingVisionBookings.length !== 1 ? 's' : ''} scheduled
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedVisionSection === 'upcoming' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Upcoming Bookings */}
                  {expandedVisionSection === 'upcoming' && upcomingVisionBookings.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllUpcomingVision ? upcomingVisionBookings : upcomingVisionBookings.slice(0, CARDS_PER_PAGE)).map((booking) => (
                        <View key={booking._id}>{renderVisionBookingCard(booking, true)}</View>
                      ))}
                      {upcomingVisionBookings.length > CARDS_PER_PAGE && !showAllUpcomingVision && (
                        <TouchableOpacity
                          onPress={() => setShowAllUpcomingVision(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({upcomingVisionBookings.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CTA: Past Bookings */}
                  {pastVisionBookings.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setExpandedVisionSection(expandedVisionSection === 'past' ? null : 'past')}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 217, 217, 0.48)',
                        shadowColor: '#000',
                        shadowOffset: { width: -2, height: 11 },
                        shadowOpacity: 0.08,
                        shadowRadius: 23,
                        elevation: 3,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                            Past Bookings
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
                            {pastVisionBookings.length} booking{pastVisionBookings.length !== 1 ? 's' : ''} completed
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: expandedVisionSection === 'past' ? '270deg' : '180deg' }] }}>
                          <ArrowLeftIcon width={16} height={16} color={COLORS.textGray} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Expanded Past Bookings */}
                  {expandedVisionSection === 'past' && pastVisionBookings.length > 0 && (
                    <View style={{ gap: 8, paddingLeft: 8 }}>
                      {(showAllPastVision ? pastVisionBookings : pastVisionBookings.slice(0, CARDS_PER_PAGE)).map((booking) => (
                        <View key={booking._id}>{renderVisionBookingCard(booking, false)}</View>
                      ))}
                      {pastVisionBookings.length > CARDS_PER_PAGE && !showAllPastVision && (
                        <TouchableOpacity
                          onPress={() => setShowAllPastVision(true)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                            Load More ({pastVisionBookings.length - CARDS_PER_PAGE} more)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* AHC Tab */}
          {activeTab === 'ahc' && (
            <View>
              {!isBenefitCovered('ahc') ? (
                /* AHC not covered under policy */
                <View
                  style={{
                    borderRadius: 16,
                    padding: 48,
                    alignItems: 'center',
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
                  <IconCircle icon={SparklesIcon} size="lg" />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: COLORS.textGray,
                      marginTop: 24,
                      marginBottom: 8,
                      textAlign: 'center',
                    }}
                  >
                    Annual Health Check
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: COLORS.textGray,
                      textAlign: 'center',
                    }}
                  >
                    Annual Health Check is not covered under your policy
                  </Text>
                </View>
              ) : ahcOrders.length === 0 ? (
                renderEmptyState('ahc')
              ) : (
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: COLORS.primaryLight,
                      marginBottom: 12,
                    }}
                  >
                    Your Health Check Orders
                  </Text>
                  {(showAllAhcOrders ? ahcOrders : ahcOrders.slice(0, CARDS_PER_PAGE)).map((order) => (
                    <View key={order._id}>{renderAhcOrderCard(order)}</View>
                  ))}
                  {ahcOrders.length > CARDS_PER_PAGE && !showAllAhcOrders && (
                    <TouchableOpacity
                      onPress={() => setShowAllAhcOrders(true)}
                      style={{ paddingVertical: 12, alignItems: 'center' }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                        Load More ({ahcOrders.length - CARDS_PER_PAGE} more)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Book Another CTA */}
                  <TouchableOpacity
                    onPress={() => router.push('/member/wellness-programs' as any)}
                    activeOpacity={0.8}
                    style={{
                      marginTop: 8,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: COLORS.success,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                      View Wellness Packages
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
