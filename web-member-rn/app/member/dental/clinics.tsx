import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
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
};

// ============================================================================
// ICONS - Matching Home Page Style
// ============================================================================

function MapPinIcon({ size = 20, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke={COLORS.textGray}
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

interface Clinic {
  clinicId: string;
  clinicName: string;
  address: {
    street?: string;
    line1?: string;
    city: string;
    state: string;
    pincode: string;
  };
  contactNumber: string;
  servicePrice: number;
  availableSlots: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DentalClinicsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceCode = params.serviceCode as string;

  // State
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pincode, setPincode] = useState('');
  const [searchedPincode, setSearchedPincode] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Log component mount
  useEffect(() => {
    console.log('[DentalClinics] Page mounted with serviceCode:', serviceCode);
    return () => {
      console.log('[DentalClinics] Page unmounted');
    };
  }, [serviceCode]);

  // Redirect if no service code
  useEffect(() => {
    if (!serviceCode) {
      console.warn('[DentalClinics] No serviceCode provided, redirecting to dental services');
      router.push('/member/dental');
    }
  }, [serviceCode, router]);

  // Search clinics by pincode
  const searchClinics = useCallback(
    async (searchPincode: string) => {
      if (!searchPincode || !serviceCode) {
        setError('Please enter a pincode');
        return;
      }

      console.log('[DentalClinics] Searching clinics:', {
        pincode: searchPincode,
        serviceCode,
      });

      setLoading(true);
      setError('');
      setSearchedPincode(searchPincode);

      try {
        const response = await apiClient.get<{ clinics: Clinic[] }>(
          `/dental-bookings/clinics`,
          {
            params: {
              serviceCode,
              pincode: searchPincode,
            },
          }
        );

        console.log('[DentalClinics] Clinics found:', response.data.clinics?.length || 0);
        setClinics(response.data.clinics || []);

        if (response.data.clinics.length === 0) {
          setError(`No clinics found offering this service in pincode ${searchPincode}`);
        }
      } catch (err: any) {
        console.error('[DentalClinics] Error fetching clinics:', err);

        if (err.response?.status === 404) {
          setError(`No clinics found in pincode ${searchPincode}`);
        } else if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view clinics.');
        } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          setError('Request timed out. Please try again.');
        } else if (!err.response) {
          setError('Network error. Please check your connection.');
        } else {
          setError(err.response?.data?.message || 'Failed to load clinics. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [serviceCode]
  );

  // Detect location and search
  const detectLocation = useCallback(async () => {
    console.log('[DentalClinics] Detecting location');
    setDetectingLocation(true);
    setError('');

    try {
      console.log('[DentalClinics] Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[DentalClinics] Permission status:', status);

      if (status !== 'granted') {
        setError('Location access denied. Please enter pincode manually.');
        console.warn('[DentalClinics] Location permission denied, status:', status);
        setDetectingLocation(false);
        return;
      }

      console.log('[DentalClinics] Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      const { latitude, longitude } = location.coords;
      console.log('[DentalClinics] Location detected:', { latitude, longitude });

      let detectedPincode: string | null = null;

      try {
        const geocodeUrl = `/location/reverse-geocode?lat=${latitude}&lng=${longitude}`;
        console.log('[DentalClinics] Trying backend reverse geocode API:', geocodeUrl);

        const geocodeResponse = await apiClient.get<{ pincode: string }>(geocodeUrl);
        console.log('[DentalClinics] Backend reverse geocode response:', geocodeResponse.data);

        if (geocodeResponse.data.pincode) {
          detectedPincode = geocodeResponse.data.pincode;
          console.log('[DentalClinics] Pincode from backend:', detectedPincode);
        }
      } catch (backendError: any) {
        console.warn('[DentalClinics] Backend geocode failed, trying Nominatim:', backendError.message);

        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          console.log('[DentalClinics] Trying Nominatim geocode:', nominatimUrl);

          const nominatimResponse = await fetch(nominatimUrl, {
            headers: {
              'User-Agent': 'OPDWallet-MemberApp/1.0'
            }
          });

          if (nominatimResponse.ok) {
            const nominatimData = await nominatimResponse.json();
            console.log('[DentalClinics] Nominatim response:', nominatimData);

            const pincode = nominatimData.address?.postcode;
            if (pincode) {
              detectedPincode = pincode;
              console.log('[DentalClinics] Pincode from Nominatim:', detectedPincode);
            }
          }
        } catch (nominatimError: any) {
          console.error('[DentalClinics] Nominatim geocode also failed:', nominatimError);
        }
      }

      if (detectedPincode) {
        setPincode(detectedPincode);
        searchClinics(detectedPincode);
      } else {
        setError('Could not detect pincode from your location. Please enter manually.');
      }
    } catch (err: any) {
      console.error('[DentalClinics] Location detection error:', err);
      const errorMsg = err.message || 'Unknown error';
      setError(`Failed to detect location. Please enter pincode manually.`);
    } finally {
      setDetectingLocation(false);
    }
  }, [searchClinics]);

  // Handle search button press
  const handleSearch = useCallback(() => {
    if (pincode.trim()) {
      searchClinics(pincode.trim());
    }
  }, [pincode, searchClinics]);

  // Handle select clinic
  const handleSelectClinic = useCallback(
    (clinicId: string) => {
      console.log('[DentalClinics] Selected clinic:', clinicId);
      router.push(
        `/member/dental/select-patient?clinicId=${clinicId}&serviceCode=${serviceCode}` as any
      );
    },
    [router, serviceCode]
  );

  // Handle back button
  const handleBack = useCallback(() => {
    console.log('[DentalClinics] Back button pressed');
    router.back();
  }, [router]);

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
                onPress={handleBack}
                style={{ padding: 8, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  Find Dental Clinics
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Search for clinics near you
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
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* ===== LOCATION SEARCH CARD ===== */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.08,
              shadowRadius: 23,
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: COLORS.primary,
                marginBottom: 12,
              }}
            >
              Enter Location
            </Text>

            <View style={{ gap: 12 }}>
              {/* Manual Pincode Entry */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  placeholder="Enter pincode (e.g., 110001)"
                  value={pincode}
                  onChangeText={setPincode}
                  onSubmitEditing={handleSearch}
                  keyboardType="numeric"
                  maxLength={6}
                  returnKeyType="search"
                  style={{
                    flex: 1,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: COLORS.cardBorder,
                    borderRadius: 10,
                    fontSize: 14,
                    color: COLORS.textDark,
                    backgroundColor: COLORS.background,
                  }}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={loading || !pincode}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: loading || !pincode ? '#9CA3AF' : COLORS.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MagnifyingGlassIcon width={18} height={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                    Search
                  </Text>
                </TouchableOpacity>
              </View>

              {/* OR Divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              </View>

              {/* Auto-detect Location */}
              <TouchableOpacity
                onPress={detectLocation}
                disabled={detectingLocation || loading}
                activeOpacity={0.8}
                style={{
                  backgroundColor: detectingLocation || loading ? '#9CA3AF' : COLORS.success,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <MapPinIcon size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                  {detectingLocation ? 'Detecting...' : 'Use My Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== ERROR BANNER ===== */}
          {error && (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: COLORS.error }}>{error}</Text>
            </View>
          )}

          {/* ===== LOADING STATE ===== */}
          {loading && (
            <View style={{ paddingVertical: 64, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}

          {/* ===== CLINICS LIST ===== */}
          {!loading && searchedPincode && clinics.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.primary,
                  marginBottom: 12,
                }}
              >
                Clinics in {searchedPincode} ({clinics.length})
              </Text>

              <View style={{ gap: 12 }}>
                {clinics.map((clinic) => (
                  <View
                    key={clinic.clinicId}
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
                    {/* Clinic Name */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: COLORS.primary,
                        marginBottom: 10,
                      }}
                    >
                      {clinic.clinicName}
                    </Text>

                    {/* Address */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <MapPinIcon size={16} color={COLORS.textGray} />
                      <Text style={{ flex: 1, fontSize: 13, color: COLORS.textGray, lineHeight: 18 }}>
                        {clinic.address.street || clinic.address.line1}, {clinic.address.city}, {clinic.address.state} - {clinic.address.pincode}
                      </Text>
                    </View>

                    {/* Contact */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <PhoneIcon size={14} />
                      <Text style={{ fontSize: 13, color: COLORS.textGray }}>
                        {clinic.contactNumber}
                      </Text>
                    </View>

                    {/* Price and Availability Row */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: COLORS.border,
                        marginBottom: 12,
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 11, color: COLORS.textGray }}>Price</Text>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary }}>
                          ₹{clinic.servicePrice}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: COLORS.textGray }}>Slots Available</Text>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.success }}>
                          {clinic.availableSlots}
                        </Text>
                      </View>
                    </View>

                    {/* Select Button */}
                    <TouchableOpacity
                      onPress={() => handleSelectClinic(clinic.clinicId)}
                      disabled={clinic.availableSlots === 0}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: clinic.availableSlots > 0 ? COLORS.primary : '#9CA3AF',
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        {clinic.availableSlots > 0 ? 'Select Clinic' : 'No Slots Available'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ===== EMPTY STATE (Before Search) ===== */}
          {!loading && !searchedPincode && (
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
                <MapPinIcon size={32} color={COLORS.primary} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: COLORS.primary,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Search for Clinics
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textGray,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Enter your pincode or use auto-detect to find dental clinics near you
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
