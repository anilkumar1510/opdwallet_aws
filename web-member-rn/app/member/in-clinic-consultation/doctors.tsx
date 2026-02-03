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
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  UserIcon,
  StarIcon,
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
  cardBorder: 'rgba(217, 217, 217, 0.48)',
  success: '#16a34a',
  error: '#DC2626',
  selectedBorder: '#86ACD8',
  iconBg: 'rgba(3, 77, 162, 0.1)',
};

// ============================================================================
// TYPES
// ============================================================================

interface ClinicLocation {
  clinicId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  consultationFee: number;
  distance?: number;
  distanceText?: string;
}

interface Doctor {
  _id: string;
  doctorId: string;
  name: string;
  profilePhoto: string;
  specialtyId: string;
  specialty: string;
  qualifications: string;
  experience: number;
  rating: number;
  reviewCount: number;
  clinics: ClinicLocation[];
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

export default function DoctorsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const specialtyId = params.specialtyId as string;
  const specialtyName = params.specialtyName as string;
  const defaultPatient = params.defaultPatient as string | undefined;

  // State
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pincode, setPincode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // API base URL for images
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

  // ============================================================================
  // LOAD SAVED LOCATION
  // ============================================================================

  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const savedPincode = await AsyncStorage.getItem('userPincode');
        const savedLocation = await AsyncStorage.getItem('userLocation');
        if (savedPincode) setPincode(savedPincode);
        if (savedLocation) setLocationName(savedLocation);
      } catch (error) {
        console.warn('[Doctors] Could not load saved location:', error);
      }
    };
    loadSavedLocation();
  }, []);

  // ============================================================================
  // FETCH DOCTORS
  // ============================================================================

  const fetchDoctors = useCallback(async () => {
    try {
      console.log('[Doctors] Fetching doctors for specialty:', specialtyId);

      let queryString = `specialtyId=${specialtyId}`;
      if (pincode && pincode.length === 6) {
        queryString += `&pincode=${pincode}`;
        console.log('[Doctors] Adding pincode filter:', pincode);
      }

      const response = await apiClient.get<{ data?: Doctor[] } | Doctor[]>(`/doctors?${queryString}`);

      // Handle both pagination wrapper and flat array responses
      const data = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
      console.log('[Doctors] Doctors received:', data.length);

      // Validate and ensure each doctor has clinics array
      const validatedData = data.map((doctor: Doctor) => ({
        ...doctor,
        clinics: doctor.clinics || [],
      }));

      setDoctors(validatedData);

      // Extract unique cities
      const uniqueCities = Array.from(
        new Set(
          validatedData.flatMap((doctor: Doctor) =>
            doctor.clinics?.map((clinic) => clinic.city) || []
          ).filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b)));

      setCities(uniqueCities as string[]);
      console.log('[Doctors] Available cities:', uniqueCities);
    } catch (error) {
      console.error('[Doctors] Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [specialtyId, pincode]);

  useEffect(() => {
    if (specialtyId) {
      fetchDoctors();
    }
  }, [specialtyId, fetchDoctors]);

  // ============================================================================
  // FILTERED DOCTORS
  // ============================================================================

  const filteredDoctors = useMemo(() => {
    console.log('[Doctors] Filtering doctors:', { searchQuery, selectedCity });
    let filtered = doctors;

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.qualifications.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCity !== '') {
      filtered = filtered.filter(
        (doctor) => doctor.clinics?.some((clinic) => clinic.city === selectedCity) || false
      );
    }

    console.log('[Doctors] Filtered results:', filtered.length);
    return filtered;
  }, [searchQuery, selectedCity, doctors]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBookAppointment = useCallback(
    (doctor: Doctor, clinic: ClinicLocation) => {
      console.log('[Doctors] Book appointment clicked:', {
        doctorId: doctor.doctorId,
        doctorName: doctor.name,
        clinicId: clinic.clinicId,
        clinicName: clinic.name,
      });

      const queryParams = new URLSearchParams({
        doctorId: doctor.doctorId,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        clinicId: clinic.clinicId,
        clinicName: clinic.name,
        clinicAddress: clinic.address,
        consultationFee: clinic.consultationFee.toString(),
      });

      if (defaultPatient) {
        queryParams.append('defaultPatient', defaultPatient);
      }

      router.push(`/member/in-clinic-consultation/select-patient?${queryParams.toString()}` as any);
    },
    [router, defaultPatient]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePincodeChange = useCallback(async (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);

    if (cleaned.length === 6) {
      try {
        await AsyncStorage.setItem('userPincode', cleaned);
        console.log('[Doctors] Pincode saved:', cleaned);
      } catch (error) {
        console.warn('[Doctors] Could not save pincode:', error);
      }
    }
  }, []);

  const handleClearPincode = useCallback(async () => {
    setPincode('');
    setLocationName('');
    setLocationError('');
    try {
      await AsyncStorage.removeItem('userPincode');
      await AsyncStorage.removeItem('userLocation');
      console.log('[Doctors] Location cleared');
    } catch (error) {
      console.warn('[Doctors] Could not clear location:', error);
    }
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setLocationError('');
    setFetchingLocation(true);
    console.log('[Doctors] Requesting current location...');

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location access denied. Please enable location permissions.');
        setFetchingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      console.log('[Doctors] Location obtained:', { latitude, longitude });

      // Reverse geocode to get pincode
      const response = await apiClient.get<{ pincode: string; city: string; state: string }>(
        `/location/reverse-geocode?lat=${latitude}&lng=${longitude}`
      );

      if (response.data.pincode) {
        setPincode(response.data.pincode);
        const locationText = [response.data.city, response.data.state].filter(Boolean).join(', ');
        setLocationName(locationText);

        // Save to storage
        await AsyncStorage.setItem('userPincode', response.data.pincode);
        await AsyncStorage.setItem('userLocation', locationText);

        console.log('[Doctors] Location set:', { pincode: response.data.pincode, location: locationText });
      } else {
        setLocationError('Could not determine pincode for your location');
      }
    } catch (error: any) {
      console.error('[Doctors] Location error:', error);
      setLocationError('Failed to get location. Please enter pincode manually.');
    } finally {
      setFetchingLocation(false);
    }
  }, []);

  const handleCityClick = useCallback((city: string) => {
    setSelectedCity((prev) => (city === prev ? '' : city));
    console.log('[Doctors] City filter changed:', city);
  }, []);

  const handleClearCity = useCallback(() => {
    setSelectedCity('');
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
                  Select Doctor
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  {specialtyName || 'Choose your doctor'}
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
          {/* ===== LOCATION FILTER CARD ===== */}
          <View
            style={{
              borderRadius: 16,
              padding: 12,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>
                Filter by Location
              </Text>
              {pincode && (
                <TouchableOpacity
                  onPress={handleClearPincode}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: COLORS.iconBg,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.primary }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={pincode}
                onChangeText={handlePincodeChange}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="#9CA3AF"
                maxLength={6}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  backgroundColor: COLORS.background,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: COLORS.textDark,
                }}
              />
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={fetchingLocation}
                activeOpacity={0.8}
                style={{
                  backgroundColor: fetchingLocation ? '#9ca3af' : COLORS.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <MapPinIcon width={16} height={16} color={COLORS.white} />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.white }}>
                      Use Current
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {locationName && (
              <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.success, marginTop: 8 }}>
                {locationName}
              </Text>
            )}

            {locationError && (
              <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 8 }}>
                {locationError}
              </Text>
            )}

            {pincode.length > 0 && pincode.length < 6 && !locationError && (
              <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 8 }}>
                {6 - pincode.length} more digit(s) required
              </Text>
            )}
          </View>

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

            {selectedCity && (
              <TouchableOpacity
                onPress={handleClearCity}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: COLORS.iconBg,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>
                  {selectedCity} ×
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ===== CITY FILTERS ===== */}
          {showFilters && cities.length > 0 && (
            <View
              style={{
                borderRadius: 16,
                padding: 12,
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
              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight, marginBottom: 12 }}>
                Filter by City
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    onPress={() => handleCityClick(city)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: city === selectedCity ? COLORS.primary : COLORS.border,
                      backgroundColor: city === selectedCity ? COLORS.primary : COLORS.white,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: city === selectedCity ? COLORS.white : COLORS.primaryLight,
                      }}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

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
                          borderWidth: 2,
                          borderColor: COLORS.border,
                        }}
                      />
                    ) : (
                      <IconCircle icon={UserIcon} size="lg" />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight }}>
                        {doctor.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                        {doctor.qualifications}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                        {doctor.experience} years experience
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
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

                  {/* Clinic Locations */}
                  {doctor.clinics && doctor.clinics.length > 0 ? (
                    <View style={{ gap: 12 }}>
                      {doctor.clinics.map((clinic, index) => (
                        <View
                          key={index}
                          style={{
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            backgroundColor: COLORS.background,
                          }}
                        >
                          <View style={{ marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primaryLight }}>
                                {clinic.name}
                              </Text>
                              {clinic.distanceText && (
                                <View
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 12,
                                    backgroundColor: COLORS.success,
                                  }}
                                >
                                  <Text style={{ fontSize: 10, color: COLORS.white }}>
                                    {clinic.distanceText}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
                              <View style={{ marginTop: 2 }}>
                                <MapPinIcon width={14} height={14} color={COLORS.primary} />
                              </View>
                              <Text style={{ fontSize: 12, color: COLORS.textGray, flex: 1 }} numberOfLines={2}>
                                {clinic.address}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: 8,
                              borderTopWidth: 1,
                              borderTopColor: COLORS.border,
                            }}
                          >
                            <View>
                              <Text style={{ fontSize: 12, color: COLORS.textGray }}>Consultation:</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                                ₹{clinic.consultationFee}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleBookAppointment(doctor, clinic)}
                              activeOpacity={0.8}
                              style={{
                                backgroundColor: COLORS.primary,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 8,
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.white }}>
                                Book Appointment
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View
                      style={{
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.background,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, color: COLORS.textGray }}>
                        No clinic locations available
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
