import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface TimeSlot {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  currentBookings: number;
  maxAppointments: number;
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

export default function SelectSlotPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const clinicId = params.clinicId as string;
  const serviceCode = params.serviceCode as string;
  const patientId = params.patientId as string;

  // State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate calendar dates (next 30 days)
  const calendarDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Weekday names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Format date helper
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group slots by time of day
  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [slots]);

  // ============================================================================
  // VALIDATION: Redirect if missing required params
  // ============================================================================

  useEffect(() => {
    console.log('[SelectSlot] Component mounted');

    if (!clinicId || !serviceCode || !patientId) {
      console.error('[SelectSlot] Missing required params, redirecting to dental page');
      router.replace('/member/dental');
      return;
    }

    console.log('[SelectSlot] Query params:', { clinicId, serviceCode, patientId });
  }, [clinicId, serviceCode, patientId, router]);

  // ============================================================================
  // FETCH SLOTS: When date is selected
  // ============================================================================

  const fetchSlots = useCallback(async (date: Date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      console.log('[SelectSlot] Fetching slots for date:', dateString);

      setLoading(true);
      setError('');
      setSelectedSlot(null);

      const response = await apiClient.get<{ slots: TimeSlot[] }>(
        `/dental-bookings/slots?clinicId=${clinicId}&date=${dateString}`
      );

      console.log('[SelectSlot] Slots fetched:', response.data.slots?.length || 0);
      setSlots(response.data.slots || []);

      if (response.data.slots.length === 0) {
        setError('No slots available for this date');
      }
    } catch (err: any) {
      console.error('[SelectSlot] Error fetching slots:', err);

      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('No slots available for this date');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view slots.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load slots. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDateSelect = useCallback((date: Date) => {
    console.log('[SelectSlot] Date selected:', date.toISOString().split('T')[0]);
    setSelectedDate(date);
  }, []);

  const handleSlotSelect = useCallback((slot: TimeSlot) => {
    if (slot.isAvailable) {
      console.log('[SelectSlot] Slot selected:', slot.startTime);
      setSelectedSlot(slot);
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedSlot || !selectedDate) {
      console.warn('[SelectSlot] Continue clicked but no slot/date selected');
      return;
    }

    const appointmentDate = selectedDate.toISOString().split('T')[0];
    const appointmentTime = selectedSlot.startTime;

    console.log('[SelectSlot] Continuing to confirmation:', {
      slotId: selectedSlot.slotId,
      appointmentDate,
      appointmentTime,
    });

    router.push(
      `/member/dental/confirm?clinicId=${clinicId}&serviceCode=${serviceCode}&patientId=${patientId}&slotId=${selectedSlot.slotId}&appointmentDate=${appointmentDate}&appointmentTime=${appointmentTime}` as any
    );
  }, [selectedSlot, selectedDate, router, clinicId, serviceCode, patientId]);

  // ============================================================================
  // RENDER SLOT BUTTON
  // ============================================================================

  const renderSlotButton = (slot: TimeSlot) => {
    const isSelected = selectedSlot?.startTime === slot.startTime;

    return (
      <TouchableOpacity
        key={slot.startTime}
        onPress={() => handleSlotSelect(slot)}
        disabled={!slot.isAvailable}
        activeOpacity={0.8}
        style={{ flex: 1, minWidth: '45%' }}
      >
        {isSelected ? (
          <LinearGradient
            colors={['#1F63B4', '#5DA4FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#0F5FDC',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
              {slot.startTime}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: slot.isAvailable ? '#86ACD8' : '#e5e7eb',
              backgroundColor: slot.isAvailable ? '#FFFFFF' : '#f3f4f6',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: slot.isAvailable ? '#0E51A2' : '#9ca3af',
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {slot.startTime}
            </Text>
            {!slot.isAvailable && (
              <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Full</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
                onPress={() => router.back()}
                style={{ padding: 8, borderRadius: 8 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  Select Date & Time
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Choose a convenient slot for your appointment
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
          {/* ===== CALENDAR CARD ===== */}
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
            {/* Calendar Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CalendarIcon width={20} height={20} color="#0F5FDC" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                Select Date
              </Text>
            </View>

            {/* Weekday Headers */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {weekdays.map((day) => (
                <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280' }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Empty cells for alignment */}
              {Array.from({ length: calendarDates[0].getDay() }).map((_, i) => (
                <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
              ))}

              {/* Date buttons */}
              {calendarDates.map((date, index) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <View key={index} style={{ width: `${100 / 7}%`, padding: 2 }}>
                    <TouchableOpacity
                      onPress={() => handleDateSelect(date)}
                      activeOpacity={0.8}
                      style={{ aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={['#1F63B4', '#5DA4FB']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 8,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                            {date.getDate()}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 8,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: isToday ? '#EFF4FF' : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              color: isToday ? '#0F5FDC' : '#111827',
                              fontSize: 12,
                              fontWeight: '500',
                            }}
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </LinearGradient>

          {/* ===== TIME SLOTS OR EMPTY STATE ===== */}
          {!selectedDate ? (
            <LinearGradient
              colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 12,
                padding: 32,
                borderWidth: 2,
                borderColor: '#F7DCAF',
                alignItems: 'center',
              }}
            >
              <IconCircle icon={CalendarIcon} size="lg" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2', marginTop: 16, marginBottom: 8 }}>
                Select a Date
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
                Choose a date from the calendar to see available time slots
              </Text>
            </LinearGradient>
          ) : loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
              <ActivityIndicator size="large" color="#0F5FDC" />
            </View>
          ) : error ? (
            <View
              style={{
                backgroundColor: '#FEF1E7',
                borderWidth: 1,
                borderColor: '#F9B376',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: '#E53535', textAlign: 'center' }}>{error}</Text>
            </View>
          ) : (
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
              {/* Time Slots Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ClockIcon width={20} height={20} color="#0F5FDC" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2' }}>
                  {formatDate(selectedDate)}
                </Text>
              </View>

              {/* Morning Slots */}
              {groupedSlots.morning.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 12 }}>
                    Morning
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {groupedSlots.morning.map((slot) => renderSlotButton(slot))}
                  </View>
                </View>
              )}

              {/* Afternoon Slots */}
              {groupedSlots.afternoon.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 12 }}>
                    Afternoon
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {groupedSlots.afternoon.map((slot) => renderSlotButton(slot))}
                  </View>
                </View>
              )}

              {/* Evening Slots */}
              {groupedSlots.evening.length > 0 && (
                <View style={{ marginBottom: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 12 }}>
                    Evening
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {groupedSlots.evening.map((slot) => renderSlotButton(slot))}
                  </View>
                </View>
              )}
            </LinearGradient>
          )}

          {/* ===== CONTINUE BUTTON ===== */}
          <TouchableOpacity
            disabled={!selectedSlot}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedSlot ? ['#1F63B4', '#5DA4FB'] : ['#9ca3af', '#9ca3af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selectedSlot ? 0.2 : 0,
                shadowRadius: 8,
                elevation: selectedSlot ? 4 : 0,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
