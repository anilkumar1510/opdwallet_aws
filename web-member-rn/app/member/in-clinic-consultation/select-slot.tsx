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
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

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

      const processedSlots: DaySlot[] = (response.data || []).map((day: any) => ({
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
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  Select Date & Time
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CalendarIcon width={20} height={20} color="#0F5FDC" />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>Select Date</Text>
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
                  <ChevronLeftIcon width={20} height={20} color="#0E51A2" />
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
                  <ChevronRightIcon width={20} height={20} color="#0E51A2" />
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
                    >
                      <LinearGradient
                        colors={isSelected ? ['#1F63B4', '#5DA4FB'] : ['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: 'center',
                          minWidth: 72,
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
                            color: isSelected ? '#FFFFFF' : '#0E51A2',
                            marginBottom: 4,
                          }}
                        >
                          {day.dayName}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: isSelected ? '#FFFFFF' : '#0E51A2',
                          }}
                        >
                          {formatDate(day.date)}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </LinearGradient>

          {/* ===== TIME SLOTS CARD ===== */}
          {selectedDaySlots && (
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
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2', marginBottom: 16 }}>
                Available Time Slots
              </Text>

              {selectedDaySlots.slots.filter((s) => s.available).length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <LinearGradient
                    colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(164, 191, 254, 0.48)',
                      marginBottom: 16,
                    }}
                  >
                    <CalendarIcon width={32} height={32} color="#0F5FDC" />
                  </LinearGradient>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2', marginBottom: 4 }}>
                    No slots available
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Please select a different date</Text>
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
                        style={{ width: '31%' }}
                      >
                        <LinearGradient
                          colors={
                            isSelected
                              ? ['#1F63B4', '#5DA4FB']
                              : isAvailable
                              ? ['#EFF4FF', '#FEF3E9']
                              : ['#f3f4f6', '#f3f4f6']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            alignItems: 'center',
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: isAvailable ? '#F7DCAF' : '#e5e7eb',
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
                              color: isSelected ? '#FFFFFF' : isAvailable ? '#0E51A2' : '#9ca3af',
                            }}
                          >
                            {slot.time}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </LinearGradient>
          )}

          {/* ===== CONTINUE BUTTON ===== */}
          <TouchableOpacity
            disabled={!selectedDate || !selectedSlot}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedDate && selectedSlot ? ['#1F63B4', '#5DA4FB'] : ['#9ca3af', '#9ca3af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
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
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
