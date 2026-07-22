import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
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
import { apiClient } from '../../../src/lib/api/client';

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
  slotId: string;
}

interface DaySlot {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

interface UpcomingSlotsResponse {
  days: DaySlot[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SelectSlotPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract all query params
  const vendorId = params.vendorId as string;
  const vendorName = params.vendorName as string;
  const serviceId = params.serviceId as string;
  const serviceName = params.serviceName as string;
  const serviceCode = params.serviceCode as string;
  const price = params.price as string;
  const pincode = params.pincode as string;
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;

  // State
  const [loading, setLoading] = useState(true);
  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState(0);
  const [error, setError] = useState('');

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  };

  // ============================================================================
  // FETCH SLOTS
  // ============================================================================

  const fetchSlots = useCallback(async () => {
    try {
      console.log('[SelectSlot] Fetching upcoming slots for vendor:', { vendorId, pincode: pincode || 'ALL' });
      setError('');

      const url = pincode
        ? `/member/vaccination/vendors/${vendorId}/slots?pincode=${pincode}`
        : `/member/vaccination/vendors/${vendorId}/slots`;

      const response = await apiClient.get<UpcomingSlotsResponse>(url);

      console.log('[SelectSlot] Slots received:', response.data?.days?.length || 0, 'days');

      const days = response.data?.days || [];
      setDaySlots(days);

      // Auto-select first available date
      if (days.length > 0) {
        setSelectedDate(days[0].date);
      }
    } catch (err: any) {
      console.error('[SelectSlot] Error fetching slots:', err);

      if (err.response?.status === 404) {
        setError('No slots available for this vendor');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to load slots. Please try again.');
      }
      setDaySlots([]);
    } finally {
      setLoading(false);
    }
  }, [vendorId, pincode]);

  useEffect(() => {
    if (!vendorId || !serviceId || !patientId) {
      console.error('[SelectSlot] Missing required params, redirecting');
      router.replace('/member/vaccination');
      return;
    }

    console.log('[SelectSlot] Query params:', { vendorId, serviceId, patientId, pincode: pincode || 'ALL' });
    fetchSlots();
  }, [vendorId, serviceId, patientId, pincode, router, fetchSlots]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDateSelect = useCallback((dateStr: string) => {
    console.log('[SelectSlot] Date selected:', dateStr);
    setSelectedDate(dateStr);
    setSelectedSlot('');
    setSelectedSlotId('');
  }, []);

  const handleSlotSelect = useCallback((time: string, slotId: string) => {
    console.log('[SelectSlot] Time slot selected:', time, 'SlotId:', slotId);
    setSelectedSlot(time);
    setSelectedSlotId(slotId);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedDate || !selectedSlot || !selectedSlotId) return;

    console.log('[SelectSlot] Continuing to confirmation', {
      selectedDate,
      selectedSlot,
      selectedSlotId,
      pincode: pincode || 'NOT_PROVIDED',
    });

    // Build query params, only including pincode if it's valid
    const params: Record<string, string> = {
      vendorId,
      vendorName,
      serviceId,
      serviceName,
      serviceCode,
      price,
      patientId,
      patientName,
      slotId: selectedSlotId,
      appointmentDate: selectedDate,
      appointmentTime: selectedSlot,
    };

    // Only add pincode if it's a valid value (not undefined, null, or empty)
    if (pincode && pincode !== 'undefined' && pincode !== 'null' && pincode.trim().length > 0) {
      params.pincode = pincode;
    }

    const queryParams = new URLSearchParams(params);

    router.push(`/member/vaccination/confirm?${queryParams.toString()}` as any);
  }, [
    selectedDate,
    selectedSlot,
    selectedSlotId,
    vendorId,
    vendorName,
    serviceId,
    serviceName,
    serviceCode,
    price,
    pincode,
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

  const selectedDaySlots = daySlots.find((day) => day.date === selectedDate);

  // Filter out lapsed time slots for today
  const getFilteredSlots = useCallback((slots: TimeSlot[], dateStr: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // If not today, return all slots
    if (dateStr !== todayStr) {
      return slots;
    }

    // For today, filter out past time slots
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    return slots.filter((slot) => {
      // Parse time slot (e.g., "10:00", "14:30")
      const [hourStr, minuteStr] = slot.time.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      // Compare with current time
      if (hour > currentHour) return true;
      if (hour === currentHour && minute > currentMinute) return true;
      return false;
    });
  }, []);

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
                  {vendorName || 'Choose your vaccination slot'}
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
          {/* ===== ERROR STATE ===== */}
          {error ? (
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
          ) : daySlots.length === 0 ? (
            /* ===== NO SLOTS AVAILABLE ===== */
            <View
              style={{
                borderRadius: 16,
                padding: 32,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                backgroundColor: COLORS.white,
                alignItems: 'center',
              }}
            >
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 8 }}>
                No Slots Available
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20 }}>
                There are no available vaccination slots at this center for the next 30 days.
                Please try another vaccination center.
              </Text>
            </View>
          ) : (
            <>
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
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <Pressable
                      onPress={() => {
                        console.log('[SelectSlot] Prev week clicked, currentWeekStart:', currentWeekStart);
                        if (currentWeekStart > 0) {
                          setCurrentWeekStart(Math.max(0, currentWeekStart - 5));
                        }
                      }}
                      disabled={currentWeekStart === 0}
                      style={({ pressed }) => ({
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: pressed ? COLORS.border : (currentWeekStart === 0 ? COLORS.border : COLORS.background),
                        opacity: currentWeekStart === 0 ? 0.4 : 1,
                        cursor: Platform.OS === 'web' ? (currentWeekStart === 0 ? 'not-allowed' : 'pointer') : undefined,
                      })}
                    >
                      <View pointerEvents="none">
                        <ChevronLeftIcon width={20} height={20} color={currentWeekStart === 0 ? COLORS.textGray : COLORS.primaryLight} />
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        console.log('[SelectSlot] Next week clicked, currentWeekStart:', currentWeekStart, 'daySlots.length:', daySlots.length);
                        if (currentWeekStart + 5 < daySlots.length) {
                          setCurrentWeekStart(currentWeekStart + 5);
                        }
                      }}
                      disabled={currentWeekStart + 5 >= daySlots.length}
                      style={({ pressed }) => ({
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: pressed ? COLORS.border : (currentWeekStart + 5 >= daySlots.length ? COLORS.border : COLORS.background),
                        opacity: currentWeekStart + 5 >= daySlots.length ? 0.4 : 1,
                        cursor: Platform.OS === 'web' ? (currentWeekStart + 5 >= daySlots.length ? 'not-allowed' : 'pointer') : undefined,
                      })}
                    >
                      <View pointerEvents="none">
                        <ChevronRightIcon width={20} height={20} color={currentWeekStart + 5 >= daySlots.length ? COLORS.textGray : COLORS.primaryLight} />
                      </View>
                    </Pressable>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {getVisibleDays().map((day) => {
                      const isSelected = selectedDate === day.date;

                      return (
                        <TouchableOpacity
                          key={day.date}
                          onPress={() => handleDateSelect(day.date)}
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

                  {getFilteredSlots(selectedDaySlots.slots, selectedDaySlots.date).filter((s) => s.available).length === 0 ? (
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
                      {getFilteredSlots(selectedDaySlots.slots, selectedDaySlots.date).map((slot) => {
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
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
