import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserIcon,
  StarIcon,
  ClockIcon,
  FunnelIcon,
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
  cardBorder: '#E5E7EB',
  success: '#16a34a',
  error: '#DC2626',
  selectedBorder: '#86ACD8',
  iconBg: 'rgba(3, 77, 162, 0.1)',
};

// ============================================================================
// TYPES
// ============================================================================

interface Doctor {
  _id: string;
  doctorId: string;
  name: string;
  profilePhoto: string;
  specialtyId: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  experience?: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  availableInMinutes: number | null | undefined;
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

export default function OnlineDoctorsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const specialtyId = params.specialtyId as string;
  const specialtyName = params.specialtyName as string;
  const defaultPatient = params.defaultPatient as string | undefined;

  // State
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableNow, setShowAvailableNow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // API base URL for images
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

  // ============================================================================
  // FETCH DOCTORS
  // ============================================================================

  const fetchDoctors = useCallback(async () => {
    try {
      console.log('[OnlineDoctors] Fetching online doctors for specialty:', specialtyId);
      const response = await apiClient.get<{ data?: Doctor[] } | Doctor[]>(
        `/doctors?specialtyId=${specialtyId}&type=ONLINE&isActive=true`
      );

      // Handle both pagination wrapper and flat array responses
      const data = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
      console.log('[OnlineDoctors] Doctors received:', data.length);
      setDoctors(data);
    } catch (error) {
      console.error('[OnlineDoctors] Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [specialtyId]);

  useEffect(() => {
    if (specialtyId) {
      fetchDoctors();
    }
  }, [specialtyId, fetchDoctors]);

  // ============================================================================
  // FILTERED DOCTORS
  // ============================================================================

  const filteredDoctors = useMemo(() => {
    console.log('[OnlineDoctors] Filtering doctors:', { searchQuery, showAvailableNow });
    let filtered = doctors;

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.qualifications.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showAvailableNow) {
      filtered = filtered.filter(
        (doctor) => doctor.availableInMinutes !== null && doctor.availableInMinutes !== undefined && doctor.availableInMinutes <= 5
      );
    }

    console.log('[OnlineDoctors] Filtered results:', filtered.length);
    return filtered;
  }, [searchQuery, showAvailableNow, doctors]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectDoctor = (doctor: Doctor) => {
    console.log('[OnlineDoctors] Doctor selected:', {
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      availableInMinutes: doctor.availableInMinutes,
    });

    const queryParams = new URLSearchParams({
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      consultationFee: doctor.consultationFee.toString(),
      availableInMinutes: (doctor.availableInMinutes || 0).toString(),
    });

    if (defaultPatient) {
      queryParams.append('defaultPatient', defaultPatient);
    }

    router.push(`/member/online-consultation/confirm?${queryParams.toString()}` as any);
  };

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatAvailability = (minutes: number | null | undefined) => {
    if (minutes === null || minutes === undefined) return 'Availability on request';
    if (minutes === 0) return 'Available now';
    if (minutes <= 5) return `Available in ${minutes} min`;
    return `Available in ${minutes} mins`;
  };

  const isAvailableSoon = (minutes: number | null | undefined) => {
    return minutes !== null && minutes !== undefined && minutes <= 5;
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
                  Select Doctor
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  {specialtyName || 'Online Consultation'}
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
          {/* ===== SEARCH BAR ===== */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              paddingHorizontal: 12,
            }}
          >
            <MagnifyingGlassIcon width={20} height={20} color={COLORS.primary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search doctors..."
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                paddingHorizontal: 12,
                paddingVertical: 14,
                fontSize: 14,
                color: COLORS.textDark,
              }}
            />
          </View>

          {/* ===== FILTER BUTTONS ===== */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                backgroundColor: COLORS.white,
              }}
            >
              <FunnelIcon width={16} height={16} color={COLORS.primaryLight} />
              <Text style={{ fontSize: 14, color: COLORS.primaryLight }}>Filters</Text>
            </TouchableOpacity>

            {/* Available Now Filter */}
            <TouchableOpacity
              onPress={() => setShowAvailableNow(!showAvailableNow)}
              activeOpacity={0.8}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: showAvailableNow ? COLORS.success : COLORS.border,
                  backgroundColor: showAvailableNow ? COLORS.success : COLORS.white,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: showAvailableNow ? COLORS.white : COLORS.primaryLight,
                  }}
                >
                  Available Now (5 mins)
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ===== DOCTORS LIST OR EMPTY STATE ===== */}
          {filteredDoctors.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <IconCircle icon={UserIcon} size="lg" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginTop: 16, marginBottom: 8 }}>
                No doctors found
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
                Try adjusting your filters or search term
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {filteredDoctors.map((doctor) => (
                <View
                  key={doctor._id}
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
                  {/* Doctor Info */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    {doctor.profilePhoto ? (
                      <Image
                        source={{ uri: `${API_BASE_URL}${doctor.profilePhoto}` }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                        }}
                      />
                    ) : (
                      <IconCircle icon={UserIcon} size="lg" />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, flex: 1 }} numberOfLines={1}>
                          {doctor.name}
                        </Text>
                        {/* Availability Badge */}
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: isAvailableSoon(doctor.availableInMinutes) ? '#E8F5E9' : '#F3F4F6',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            marginLeft: 8,
                          }}
                        >
                          <ClockIcon width={12} height={12} color={isAvailableSoon(doctor.availableInMinutes) ? COLORS.success : COLORS.textGray} />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '500',
                              color: isAvailableSoon(doctor.availableInMinutes) ? COLORS.success : COLORS.textGray,
                            }}
                          >
                            {formatAvailability(doctor.availableInMinutes)}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>
                        {doctor.qualifications}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 4 }}>
                        {doctor.experienceYears || doctor.experience} years experience
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <StarIcon width={16} height={16} color="#F59E0B" />
                        <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>
                          {doctor.rating}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                          ({doctor.reviewCount} reviews)
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Consultation Fee and Select Button */}
                  <View
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      backgroundColor: COLORS.iconBg,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ fontSize: 12, color: COLORS.textGray }}>Consultation:</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.success }}>
                          ₹{doctor.consultationFee}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleSelectDoctor(doctor)}
                        activeOpacity={0.8}
                        style={{
                          paddingHorizontal: 24,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: COLORS.primary,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>
                          Select
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
