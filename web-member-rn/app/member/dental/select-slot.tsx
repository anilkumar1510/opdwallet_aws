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
import Svg, { Path, Circle } from 'react-native-svg';
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
  selectedBorder: '#86ACD8',
};

// ============================================================================
// ICONS - Matching Home Page Style
// ============================================================================

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
      <Path
        d="M15.695 13.7H15.704M15.695 16.7H15.704M11.995 13.7H12.005M11.995 16.7H12.005M8.294 13.7H8.304M8.294 16.7H8.304"
        stroke={COLORS.primary}
        strokeWidth={2}
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
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isSelected
              ? COLORS.primary
              : slot.isAvailable
              ? COLORS.selectedBorder
              : COLORS.border,
            backgroundColor: isSelected
              ? COLORS.primary
              : slot.isAvailable
              ? COLORS.white
              : '#f3f4f6',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: isSelected
                ? COLORS.white
                : slot.isAvailable
                ? COLORS.primary
                : '#9ca3af',
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
      </TouchableOpacity>
    );
  };

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
                  Select Date & Time
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
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
          paddingVertical: 20,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 16 }}>
          {/* ===== CALENDAR CARD ===== */}
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
            }}
          >
            {/* Calendar Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(3, 77, 162, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CalendarIcon size={18} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                Select Date
              </Text>
            </View>

            {/* Weekday Headers */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {weekdays.map((day) => (
                <View key={day} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textGray }}>
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
                      <View
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 8,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: isSelected
                            ? COLORS.primary
                            : isToday
                            ? 'rgba(3, 77, 162, 0.1)'
                            : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected
                              ? COLORS.white
                              : isToday
                              ? COLORS.primary
                              : COLORS.textDark,
                            fontSize: 12,
                            fontWeight: '500',
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ===== TIME SLOTS OR EMPTY STATE ===== */}
          {!selectedDate ? (
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 32,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(3, 77, 162, 0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <CalendarIcon size={32} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 8 }}>
                Select a Date
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20 }}>
                Choose a date from the calendar to see available time slots
              </Text>
            </View>
          ) : loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: COLORS.error, textAlign: 'center' }}>{error}</Text>
            </View>
          ) : (
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
              }}
            >
              {/* Time Slots Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(3, 77, 162, 0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <ClockIcon size={18} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                  {formatDate(selectedDate)}
                </Text>
              </View>

              {/* Morning Slots */}
              {groupedSlots.morning.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textGray, marginBottom: 12 }}>
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
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textGray, marginBottom: 12 }}>
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
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textGray, marginBottom: 12 }}>
                    Evening
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {groupedSlots.evening.map((slot) => renderSlotButton(slot))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ===== CONTINUE BUTTON ===== */}
          <TouchableOpacity
            disabled={!selectedSlot}
            onPress={handleContinue}
            activeOpacity={0.8}
            style={{
              backgroundColor: selectedSlot ? COLORS.primary : '#9CA3AF',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
