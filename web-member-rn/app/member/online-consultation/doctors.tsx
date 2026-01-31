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
import { LinearGradient } from 'expo-linear-gradient';
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
        `/doctors?specialtyId=${specialtyId}&type=ONLINE`
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
                  Select Doctor
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#86ACD8',
              borderRadius: 12,
              paddingHorizontal: 12,
            }}
          >
            <MagnifyingGlassIcon width={20} height={20} color="#0F5FDC" />
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
                color: '#111827',
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
                borderWidth: 2,
                borderColor: '#86ACD8',
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
              }}
            >
              <FunnelIcon width={16} height={16} color="#0E51A2" />
              <Text style={{ fontSize: 14, color: '#0E51A2' }}>Filters</Text>
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
                  borderWidth: 2,
                  borderColor: showAvailableNow ? '#25A425' : '#86ACD8',
                  backgroundColor: showAvailableNow ? '#25A425' : '#FFFFFF',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: showAvailableNow ? '#FFFFFF' : '#0E51A2',
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
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginTop: 16, marginBottom: 8 }}>
                No doctors found
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                Try adjusting your filters or search term
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {filteredDoctors.map((doctor) => (
                <LinearGradient
                  key={doctor._id}
                  colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 2,
                    borderColor: '#F7DCAF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
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
                          borderWidth: 2,
                          borderColor: 'rgba(164, 191, 254, 0.48)',
                        }}
                      />
                    ) : (
                      <IconCircle icon={UserIcon} size="lg" />
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', flex: 1 }} numberOfLines={1}>
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
                          <ClockIcon width={12} height={12} color={isAvailableSoon(doctor.availableInMinutes) ? '#25A425' : '#6B7280'} />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '500',
                              color: isAvailableSoon(doctor.availableInMinutes) ? '#25A425' : '#6B7280',
                            }}
                          >
                            {formatAvailability(doctor.availableInMinutes)}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
                        {doctor.qualifications}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                        {doctor.experienceYears || doctor.experience} years experience
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <StarIcon width={16} height={16} color="#F59E0B" />
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }}>
                          {doctor.rating}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>
                          ({doctor.reviewCount} reviews)
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Consultation Fee and Select Button */}
                  <LinearGradient
                    colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 8,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#86ACD8',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Consultation:</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#25A425' }}>
                          ₹{doctor.consultationFee}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleSelectDoctor(doctor)} activeOpacity={0.8}>
                        <LinearGradient
                          colors={['#1F63B4', '#5DA4FB']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            paddingHorizontal: 24,
                            paddingVertical: 10,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                            Select
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </LinearGradient>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
