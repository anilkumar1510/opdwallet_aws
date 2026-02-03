import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  PlusIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
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

interface Appointment {
  _id: string;
  appointmentId: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  appointmentDate: string;
  timeSlot: string;
  clinicName: string;
  clinicAddress?: string;
  consultationFee: number;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  hasPrescription?: boolean;
  prescriptionId?: string;
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

export default function InClinicConsultationPage() {
  const router = useRouter();
  const { viewingUserId } = useFamily();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userId, setUserId] = useState('');
  const [visibleCount, setVisibleCount] = useState(2); // Show 2 appointments initially

  const APPOINTMENTS_PER_PAGE = 2;

  // ============================================================================
  // FETCH USER DATA & APPOINTMENTS
  // ============================================================================

  const fetchAppointments = useCallback(async (targetUserId: string) => {
    try {
      console.log('[InClinicConsultation] Fetching IN_CLINIC appointments for user:', targetUserId);
      const response = await apiClient.get<Appointment[]>(
        `/appointments/user/${targetUserId}?type=IN_CLINIC`
      );
      console.log('[InClinicConsultation] Appointments received:', response.data?.length || 0);
      setAppointments(response.data || []);
    } catch (error) {
      console.error('[InClinicConsultation] Error fetching appointments:', error);
      setAppointments([]);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      console.log('[InClinicConsultation] Fetching user data');
      const response = await apiClient.get<{ _id: string }>('/auth/me');
      const currentUserId = response.data._id;
      setUserId(currentUserId);
      console.log('[InClinicConsultation] User ID:', currentUserId);

      // Use viewingUserId to fetch appointments for the active profile
      const targetUserId = viewingUserId || currentUserId;
      console.log('[InClinicConsultation] Fetching appointments for profile:', targetUserId);
      await fetchAppointments(targetUserId);
    } catch (error) {
      console.error('[InClinicConsultation] Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [viewingUserId, fetchAppointments]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, viewingUserId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setVisibleCount(APPOINTMENTS_PER_PAGE); // Reset to show only first 2 after refresh
    const targetUserId = viewingUserId || userId;
    await fetchAppointments(targetUserId);
    setRefreshing(false);
  }, [viewingUserId, userId, fetchAppointments]);

  const handleBookAppointment = useCallback(() => {
    console.log('[InClinicConsultation] Book new appointment clicked', { viewingUserId });
    const url = viewingUserId
      ? `/member/in-clinic-consultation/specialties?defaultPatient=${viewingUserId}`
      : '/member/in-clinic-consultation/specialties';
    router.push(url as any);
  }, [router, viewingUserId]);

  const handleCancelAppointment = useCallback(async (appointmentId: string) => {
    console.log('[InClinicConsultation] handleCancelAppointment called:', appointmentId);

    if (!appointmentId) {
      console.error('[InClinicConsultation] No appointmentId provided!');
      Alert.alert('Error', 'Invalid appointment ID');
      return;
    }

    // For web, use window.confirm as Alert may not work properly
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to cancel this appointment? Your wallet will be refunded.');
      if (!confirmed) return;

      try {
        console.log('[InClinicConsultation] Cancelling appointment (web):', appointmentId);
        await apiClient.patch(`/appointments/${appointmentId}/user-cancel`);
        window.alert('Appointment cancelled successfully. Your wallet has been refunded.');

        // Refresh appointments
        const targetUserId = viewingUserId || userId;
        await fetchAppointments(targetUserId);
      } catch (error: any) {
        console.error('[InClinicConsultation] Error cancelling appointment:', error);
        console.error('[InClinicConsultation] Error response:', error.response?.data);
        window.alert('Failed to cancel appointment: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      }
      return;
    }

    // For native platforms, use Alert
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? Your wallet will be refunded.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[InClinicConsultation] Cancelling appointment:', appointmentId);
              await apiClient.patch(`/appointments/${appointmentId}/user-cancel`);
              console.log('[InClinicConsultation] Appointment cancelled successfully');
              Alert.alert('Success', 'Appointment cancelled successfully. Your wallet has been refunded.');

              // Refresh appointments
              const targetUserId = viewingUserId || userId;
              await fetchAppointments(targetUserId);
            } catch (error: any) {
              console.error('[InClinicConsultation] Error cancelling appointment:', error);
              console.error('[InClinicConsultation] Error response:', error.response?.data);
              Alert.alert('Error', 'Failed to cancel appointment: ' + (error.response?.data?.message || error.message || 'Unknown error'));
            }
          },
        },
      ]
    );
  }, [viewingUserId, userId, fetchAppointments]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + APPOINTMENTS_PER_PAGE);
  }, []);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return 'Confirming';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#25A425';
      case 'COMPLETED':
        return '#6b7280';
      case 'CANCELLED':
        return '#E53535';
      default:
        return '#F59E0B';
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    // Parse appointment date and time
    const [year, month, day] = appointment.appointmentDate.split('-').map(Number);
    const appointmentDateObj = new Date(year, month - 1, day);

    // Parse time slot
    const timeParts = appointment.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const period = timeParts[3].toUpperCase();

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      appointmentDateObj.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const isFuture = appointmentDateObj > now;
    return (appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED') && isFuture;
  };

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

  // ============================================================================
  // MAIN UI
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
              <TouchableOpacity
                onPress={handleBack}
                style={{ padding: 8, borderRadius: 8 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>
                  In-Clinic Appointments
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  View and manage your appointments
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* ===== BOOK NEW APPOINTMENT CTA ===== */}
          <TouchableOpacity
            onPress={handleBookAppointment}
            activeOpacity={0.8}
            style={{
              marginBottom: 24,
              backgroundColor: COLORS.primary,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <PlusIcon width={20} height={20} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>
              Book New Appointment
            </Text>
          </TouchableOpacity>

          {/* ===== APPOINTMENTS LIST OR EMPTY STATE ===== */}
          {appointments.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <IconCircle icon={CalendarIcon} size="lg" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginTop: 16, marginBottom: 8 }}>
                No appointments yet
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
                Book your first appointment to get started
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primaryLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Your Appointments ({appointments.length})
              </Text>

              {appointments.slice(0, visibleCount).map((appointment) => (
                <View
                  key={appointment._id}
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
                  {/* Doctor Info and Status */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <IconCircle icon={UserIcon} size="md" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primaryLight }} numberOfLines={1}>
                          {appointment.doctorName}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                          {appointment.specialty}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: getStatusColor(appointment.status),
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.white }}>
                        {getStatusText(appointment.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Appointment Details */}
                  <View
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.background,
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <UserIcon width={16} height={16} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, color: COLORS.textGray }}>Patient:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primaryLight, flex: 1 }} numberOfLines={1}>
                          {appointment.patientName}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CalendarIcon width={16} height={16} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, color: COLORS.textGray }}>Date:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primaryLight }}>
                          {formatDate(appointment.appointmentDate)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ClockIcon width={16} height={16} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, color: COLORS.textGray }}>Time:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primaryLight }}>
                          {appointment.timeSlot}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <View style={{ marginTop: 2 }}>
                          <MapPinIcon width={16} height={16} color={COLORS.primary} />
                        </View>
                        <Text style={{ fontSize: 13, color: COLORS.textGray }}>Clinic:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primaryLight, flex: 1 }} numberOfLines={2}>
                          {appointment.clinicName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Appointment ID and Fee */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                      ID: <Text style={{ fontWeight: '600', color: COLORS.primaryLight }}>{appointment.appointmentId}</Text>
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.success }}>
                      ₹{appointment.consultationFee}
                    </Text>
                  </View>

                  {/* Cancel Button */}
                  {canCancelAppointment(appointment) && (
                    <TouchableOpacity
                      onPress={() => handleCancelAppointment(appointment.appointmentId)}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: COLORS.error,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                        Cancel Appointment
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Load More Button */}
              {visibleCount < appointments.length && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.white,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>
                    Load More ({appointments.length - visibleCount} remaining)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
