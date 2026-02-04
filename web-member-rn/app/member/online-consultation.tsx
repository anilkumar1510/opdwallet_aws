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
  VideoCameraIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
} from '../../src/components/icons/InlineSVGs';
import { useFamily } from '../../src/contexts/FamilyContext';
import apiClient from '../../src/lib/api/client';

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
  appointmentNumber: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  appointmentType: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  consultationFee: number;
  contactNumber?: string;
  callPreference?: 'VOICE' | 'VIDEO' | 'BOTH';
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

export default function OnlineConsultationPage() {
  const router = useRouter();
  const { viewingUserId } = useFamily();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userId, setUserId] = useState('');
  const [visibleCount, setVisibleCount] = useState(1);

  // Pagination
  const APPOINTMENTS_PER_PAGE = 1;

  // ============================================================================
  // FETCH USER DATA & APPOINTMENTS
  // ============================================================================

  const fetchAppointments = useCallback(async (targetUserId: string) => {
    try {
      console.log('[OnlineConsultation] Fetching ONLINE appointments for user:', targetUserId);
      const response = await apiClient.get<Appointment[]>(
        `/appointments/user/${targetUserId}?type=ONLINE`
      );
      console.log('[OnlineConsultation] Appointments received:', response.data?.length || 0);
      setAppointments(response.data || []);
    } catch (error) {
      console.error('[OnlineConsultation] Error fetching appointments:', error);
      setAppointments([]);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      console.log('[OnlineConsultation] Fetching user data');
      const response = await apiClient.get<{ _id: string }>('/auth/me');
      const currentUserId = response.data._id;
      setUserId(currentUserId);
      console.log('[OnlineConsultation] User ID:', currentUserId);

      // Use viewingUserId to fetch appointments for the active profile
      const targetUserId = viewingUserId || currentUserId;
      console.log('[OnlineConsultation] Fetching appointments for profile:', targetUserId);
      await fetchAppointments(targetUserId);
    } catch (error) {
      console.error('[OnlineConsultation] Error fetching user data:', error);
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
    setVisibleCount(1); // Reset pagination on refresh
    const targetUserId = viewingUserId || userId;
    await fetchAppointments(targetUserId);
    setRefreshing(false);
  }, [viewingUserId, userId, fetchAppointments]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + APPOINTMENTS_PER_PAGE);
  }, []);

  const handleConsultNow = useCallback(() => {
    console.log('[OnlineConsultation] Consult Now clicked', { viewingUserId });
    const url = viewingUserId
      ? `/member/online-consultation/specialties?defaultPatient=${viewingUserId}`
      : '/member/online-consultation/specialties';
    router.push(url as any);
  }, [router, viewingUserId]);

  const handleCancelAppointment = useCallback(async (appointmentId: string) => {
    console.log('[OnlineConsultation] handleCancelAppointment called:', appointmentId);

    if (!appointmentId) {
      console.error('[OnlineConsultation] No appointmentId provided!');
      Alert.alert('Error', 'Invalid appointment ID');
      return;
    }

    // For web, use window.confirm as Alert may not work properly
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to cancel this online consultation? Your wallet will be refunded.');
      if (!confirmed) return;

      try {
        console.log('[OnlineConsultation] Cancelling appointment (web):', appointmentId);
        await apiClient.patch(`/appointments/${appointmentId}/user-cancel`);
        window.alert('Online consultation cancelled successfully. Your wallet has been refunded.');

        // Refresh appointments
        const targetUserId = viewingUserId || userId;
        await fetchAppointments(targetUserId);
      } catch (error: any) {
        console.error('[OnlineConsultation] Error cancelling appointment:', error);
        console.error('[OnlineConsultation] Error response:', error.response?.data);
        window.alert('Failed to cancel appointment: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      }
      return;
    }

    // For native platforms, use Alert
    Alert.alert(
      'Cancel Consultation',
      'Are you sure you want to cancel this online consultation? Your wallet will be refunded.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[OnlineConsultation] Cancelling appointment:', appointmentId);
              await apiClient.patch(`/appointments/${appointmentId}/user-cancel`);
              console.log('[OnlineConsultation] Appointment cancelled successfully');
              Alert.alert('Success', 'Online consultation cancelled successfully. Your wallet has been refunded.');

              // Refresh appointments
              const targetUserId = viewingUserId || userId;
              await fetchAppointments(targetUserId);
            } catch (error: any) {
              console.error('[OnlineConsultation] Error cancelling appointment:', error);
              console.error('[OnlineConsultation] Error response:', error.response?.data);
              Alert.alert('Error', 'Failed to cancel appointment: ' + (error.response?.data?.message || error.message || 'Unknown error'));
            }
          },
        },
      ]
    );
  }, [viewingUserId, userId, fetchAppointments]);

  const handleBack = useCallback(() => {
    // Navigate directly to member dashboard instead of back()
    // This avoids going back to confirm page after booking
    router.replace('/member' as any);
  }, [router]);

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

  const getCallPreferenceText = (pref?: string) => {
    switch (pref) {
      case 'VOICE':
        return 'Voice Call';
      case 'VIDEO':
        return 'Video Call';
      case 'BOTH':
        return 'Voice & Video';
      default:
        return pref || '-';
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    // Don't allow cancel if has prescription
    if (appointment.hasPrescription) return false;

    // Allow cancellation for immediate appointments
    if (appointment.timeSlot === 'Immediate') {
      return appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED';
    }

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
                  Online Consultation
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Consult with doctors on call
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
          {/* ===== CONSULT DOCTOR ON CALL CARD ===== */}
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
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <IconCircle icon={VideoCameraIcon} size="lg" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight, marginBottom: 4 }}>
                  Consult Doctor on Call
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                  Connect with top doctors instantly
                </Text>
              </View>
            </View>

            {/* Features */}
            <View style={{ gap: 10, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircleIcon width={18} height={18} color={COLORS.success} />
                <Text style={{ fontSize: 14, color: COLORS.textDark }}>Available 24/7 for immediate consultation</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircleIcon width={18} height={18} color={COLORS.success} />
                <Text style={{ fontSize: 14, color: COLORS.textDark }}>Voice or video call support</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircleIcon width={18} height={18} color={COLORS.success} />
                <Text style={{ fontSize: 14, color: COLORS.textDark }}>Get prescriptions digitally</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={handleConsultNow}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: COLORS.primary,
              }}
            >
              <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>
                Consult Now
              </Text>
            </TouchableOpacity>
          </View>

          {/* ===== APPOINTMENTS LIST OR EMPTY STATE ===== */}
          {appointments.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <IconCircle icon={VideoCameraIcon} size="lg" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginTop: 16, marginBottom: 8 }}>
                No online consultations yet
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
                Book your first online consultation to get started
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primaryLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Your Consultations ({appointments.length})
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
                      <IconCircle icon={VideoCameraIcon} size="md" />
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
                      backgroundColor: COLORS.iconBg,
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

                      {appointment.contactNumber && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <PhoneIcon width={16} height={16} color={COLORS.primary} />
                          <Text style={{ fontSize: 13, color: COLORS.textGray }}>Contact:</Text>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primaryLight }}>
                            {appointment.contactNumber}
                          </Text>
                        </View>
                      )}

                      {appointment.callPreference && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <VideoCameraIcon width={16} height={16} color={COLORS.primary} />
                          <Text style={{ fontSize: 13, color: COLORS.textGray }}>Mode:</Text>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primaryLight }}>
                            {getCallPreferenceText(appointment.callPreference)}
                          </Text>
                        </View>
                      )}
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

                  {/* Prescription Badge */}
                  {appointment.hasPrescription && (
                    <View
                      style={{
                        backgroundColor: '#E8F5E9',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircleIcon width={16} height={16} color={COLORS.success} />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.success }}>
                        Prescription Available
                      </Text>
                    </View>
                  )}

                  {/* Join Call Button - Only for confirmed appointments without prescription */}
                  {appointment.status === 'CONFIRMED' && !appointment.hasPrescription && (
                    <TouchableOpacity
                      onPress={() => {
                        console.log('[OnlineConsultation] Join Call clicked:', appointment._id);
                        router.push(`/member/consultations/${appointment._id}` as any);
                      }}
                      activeOpacity={0.8}
                      style={{
                        marginBottom: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: COLORS.success,
                      }}
                    >
                      <VideoCameraIcon width={20} height={20} color={COLORS.white} />
                      <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                        Join Call
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Cancel Button */}
                  {canCancelAppointment(appointment) && (
                    <TouchableOpacity
                      onPress={() => handleCancelAppointment(appointment.appointmentId)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={{
                          backgroundColor: COLORS.error,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                          Cancel Consultation
                        </Text>
                      </View>
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
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.white,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primaryLight }}>
                    Load More ({appointments.length - visibleCount} remaining)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ===== HOW IT WORKS ===== */}
          <View
            style={{
              marginTop: 24,
              backgroundColor: COLORS.iconBg,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primaryLight, marginBottom: 16 }}>
              How it works
            </Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>1.</Text>
                <Text style={{ fontSize: 14, color: COLORS.textDark, flex: 1 }}>Select your medical specialty</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>2.</Text>
                <Text style={{ fontSize: 14, color: COLORS.textDark, flex: 1 }}>Choose an available doctor</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>3.</Text>
                <Text style={{ fontSize: 14, color: COLORS.textDark, flex: 1 }}>Consult now or schedule for later</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>4.</Text>
                <Text style={{ fontSize: 14, color: COLORS.textDark, flex: 1 }}>Connect via voice or video call</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
