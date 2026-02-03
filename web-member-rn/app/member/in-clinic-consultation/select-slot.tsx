import React, { useState, useEffect, useCallback } from 'react';
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
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../../src/components/icons/InlineSVGs';
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
  cardBorder: 'rgba(217, 217, 217, 0.48)',
  success: '#16a34a',
  error: '#DC2626',
  selectedBorder: '#86ACD8',
  iconBg: 'rgba(3, 77, 162, 0.1)',
};

// ============================================================================
// TYPES
// ============================================================================

interface TimeSlot {
  time: string;
  available: boolean;
  slotId?: string;
}

interface DaySlot {
  date: Date;
  dateStr: string;
  dayName: string;
  slots: TimeSlot[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SelectSlotPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract all query params
  const doctorId = params.doctorId as string;
  const doctorName = params.doctorName as string;
  const specialty = params.specialty as string;
  const clinicId = params.clinicId as string;
  const clinicName = params.clinicName as string;
  const clinicAddress = params.clinicAddress as string;
  const consultationFee = params.consultationFee as string;
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;

  // State
  const [loading, setLoading] = useState(true);
  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState(0);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  };

  const getDayName = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) return 'Today';

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleString('default', { weekday: 'short' });
  };

  // ============================================================================
  // FETCH SLOTS
  // ============================================================================

  const fetchSlots = useCallback(async () => {
    try {
      console.log('[SelectSlot] Fetching slots for doctor:', { doctorId, clinicId });
      const response = await apiClient.get<any[]>(`/doctors/${doctorId}/slots?clinicId=${clinicId}`);

      console.log('[SelectSlot] Slots received:', response.data?.length || 0, 'days');

      // Get today's date string in YYYY-MM-DD format for comparison
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const processedSlots: DaySlot[] = (response.data || [])
        .filter((day: any) => {
          // Compare date strings to avoid timezone issues
          const slotDateStr = day.date.split('T')[0]; // Handle both "2026-02-02" and "2026-02-02T00:00:00" formats
          return slotDateStr >= todayStr; // Only include today and future dates
        })
        .map((day: any) => ({
          date: new Date(day.date),
          dateStr: day.date,
          dayName: getDayName(new Date(day.date)),
          slots: day.slots,
        }));

      setDaySlots(processedSlots);

      if (processedSlots.length > 0) {
        setSelectedDate(processedSlots[0].dateStr);
      }
    } catch (error) {
      console.error('[SelectSlot] Error fetching slots:', error);
      setDaySlots([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, clinicId]);

  useEffect(() => {
    if (doctorId && clinicId) {
      fetchSlots();
    }
  }, [doctorId, clinicId, fetchSlots]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDateSelect = useCallback((dateStr: string) => {
    console.log('[SelectSlot] Date selected:', dateStr);
    setSelectedDate(dateStr);
    setSelectedSlot('');
    setSelectedSlotId('');
  }, []);

  const handleSlotSelect = useCallback(
    (time: string, slotId?: string) => {
      console.log('[SelectSlot] Time slot selected:', time, 'SlotId:', slotId);
      setSelectedSlot(time);
      const generatedSlotId = slotId || `${doctorId}_${clinicId}_${selectedDate}_${time}`;
      setSelectedSlotId(generatedSlotId);
    },
    [doctorId, clinicId, selectedDate]
  );

  const handleContinue = useCallback(() => {
    if (!selectedDate || !selectedSlot) return;

    console.log('[SelectSlot] Continuing to confirmation', {
      selectedDate,
      selectedSlot,
      selectedSlotId,
      doctorId,
      patientId,
    });

    const queryParams = new URLSearchParams({
      doctorId,
      doctorName,
      specialty,
      clinicId,
      clinicName,
      clinicAddress,
      consultationFee,
      patientId,
      patientName,
      appointmentDate: selectedDate,
      timeSlot: selectedSlot,
      slotId: selectedSlotId || `${doctorId}_${clinicId}_${selectedDate}_${selectedSlot}`,
    });

    router.push(`/member/in-clinic-consultation/confirm?${queryParams.toString()}` as any);
  }, [
    selectedDate,
    selectedSlot,
    selectedSlotId,
    doctorId,
    doctorName,
    specialty,
    clinicId,
    clinicName,
    clinicAddress,
    consultationFee,
    patientId,
    patientName,
    router,
  ]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const getVisibleDays = () => {
    return daySlots.slice(currentWeekStart, currentWeekStart + 5);
  };

  const handlePrevWeek = useCallback(() => {
    if (currentWeekStart > 0) {
      setCurrentWeekStart(Math.max(0, currentWeekStart - 5));
    }
  }, [currentWeekStart]);

  const handleNextWeek = useCallback(() => {
    if (currentWeekStart + 5 < daySlots.length) {
      setCurrentWeekStart(currentWeekStart + 5);
    }
  }, [currentWeekStart, daySlots.length]);

  const selectedDaySlots = daySlots.find((day) => day.dateStr === selectedDate);

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
                  Select Date & Time
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  {doctorName || 'Choose your appointment slot'}
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
          {/* ===== DATE PICKER CARD ===== */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CalendarIcon width={20} height={20} color={COLORS.primary} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>Select Date</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handlePrevWeek}
                  disabled={currentWeekStart === 0}
                  style={{
                    padding: 4,
                    borderRadius: 6,
                    opacity: currentWeekStart === 0 ? 0.3 : 1,
                  }}
                >
                  <ChevronLeftIcon width={20} height={20} color={COLORS.primaryLight} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNextWeek}
                  disabled={currentWeekStart + 5 >= daySlots.length}
                  style={{
                    padding: 4,
                    borderRadius: 6,
                    opacity: currentWeekStart + 5 >= daySlots.length ? 0.3 : 1,
                  }}
                >
                  <ChevronRightIcon width={20} height={20} color={COLORS.primaryLight} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {getVisibleDays().map((day) => {
                  const isSelected = selectedDate === day.dateStr;

                  return (
                    <TouchableOpacity
                      key={day.dateStr}
                      onPress={() => handleDateSelect(day.dateStr)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                        minWidth: 72,
                        backgroundColor: isSelected ? COLORS.primary : COLORS.background,
                        borderWidth: 1,
                        borderColor: isSelected ? COLORS.primary : COLORS.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: isSelected ? 4 : 0 },
                        shadowOpacity: isSelected ? 0.2 : 0,
                        shadowRadius: isSelected ? 8 : 0,
                        elevation: isSelected ? 4 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: isSelected ? COLORS.white : COLORS.primaryLight,
                          marginBottom: 4,
                        }}
                      >
                        {day.dayName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: isSelected ? COLORS.white : COLORS.primaryLight,
                        }}
                      >
                        {formatDate(day.date)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* ===== TIME SLOTS CARD ===== */}
          {selectedDaySlots && (
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
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight, marginBottom: 16 }}>
                Available Time Slots
              </Text>

              {selectedDaySlots.slots.filter((s) => s.available).length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: COLORS.iconBg,
                      marginBottom: 16,
                    }}
                  >
                    <CalendarIcon width={32} height={32} color={COLORS.primary} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight, marginBottom: 4 }}>
                    No slots available
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>Please select a different date</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {selectedDaySlots.slots.map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    const isAvailable = slot.available;

                    return (
                      <TouchableOpacity
                        key={slot.time}
                        onPress={() => isAvailable && handleSlotSelect(slot.time, slot.slotId)}
                        disabled={!isAvailable}
                        activeOpacity={0.7}
                        style={{
                          width: '31%',
                          paddingVertical: 10,
                          paddingHorizontal: 8,
                          borderRadius: 12,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: isSelected ? COLORS.primary : isAvailable ? COLORS.border : '#e5e7eb',
                          backgroundColor: isSelected ? COLORS.primary : isAvailable ? COLORS.background : '#f3f4f6',
                          opacity: isAvailable ? 1 : 0.5,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: isSelected ? 4 : 0 },
                          shadowOpacity: isSelected ? 0.2 : 0,
                          shadowRadius: isSelected ? 8 : 0,
                          elevation: isSelected ? 4 : 0,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: isSelected ? COLORS.white : isAvailable ? COLORS.primaryLight : '#9ca3af',
                          }}
                        >
                          {slot.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ===== CONTINUE BUTTON ===== */}
          <TouchableOpacity
            disabled={!selectedDate || !selectedSlot}
            onPress={handleContinue}
            activeOpacity={0.8}
            style={{
              backgroundColor: selectedDate && selectedSlot ? COLORS.primary : '#9ca3af',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: selectedDate && selectedSlot ? 4 : 0 },
              shadowOpacity: selectedDate && selectedSlot ? 0.2 : 0,
              shadowRadius: 8,
              elevation: selectedDate && selectedSlot ? 4 : 0,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
