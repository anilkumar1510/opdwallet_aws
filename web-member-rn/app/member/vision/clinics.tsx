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
import Svg, { Path, Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import {
  ArrowLeftIcon,
  MapPinIcon,
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
  selectedBorder: '#86ACD8',
};

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

export default function VisionClinicsPage() {
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
    console.log('[VisionClinics] Page mounted with serviceCode:', serviceCode);
    return () => {
      console.log('[VisionClinics] Page unmounted');
    };
  }, [serviceCode]);

  // Redirect if no service code
  useEffect(() => {
    if (!serviceCode) {
      console.warn('[VisionClinics] No serviceCode provided, redirecting to vision services');
      router.push('/member/vision');
    }
  }, [serviceCode, router]);

  // Search clinics by pincode
  const searchClinics = useCallback(
    async (searchPincode: string) => {
      if (!searchPincode || !serviceCode) {
        setError('Please enter a pincode');
        return;
      }

      console.log('[VisionClinics] Searching clinics:', {
        pincode: searchPincode,
        serviceCode,
      });

      setLoading(true);
      setError('');
      setSearchedPincode(searchPincode);

      try {
        // API endpoint: GET /vision-bookings/clinics?serviceCode={code}&pincode={pincode}
        const response = await apiClient.get<{ clinics: Clinic[] }>(
          `/vision-bookings/clinics`,
          {
            params: {
              serviceCode,
              pincode: searchPincode,
            },
          }
        );

        console.log('[VisionClinics] Clinics found:', response.data.clinics?.length || 0);
        setClinics(response.data.clinics || []);

        if (response.data.clinics.length === 0) {
          setError(`No clinics found offering this service in pincode ${searchPincode}`);
        }
      } catch (err: any) {
        console.error('[VisionClinics] Error fetching clinics:', err);

        // Handle specific error cases
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
    console.log('[VisionClinics] Detecting location');
    setDetectingLocation(true);
    setError('');

    try {
      // Request location permissions
      console.log('[VisionClinics] Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[VisionClinics] Permission status:', status);

      if (status !== 'granted') {
        setError('Location access denied. Please enter pincode manually.');
        console.warn('[VisionClinics] Location permission denied, status:', status);
        setDetectingLocation(false);
        return;
      }

      // Get current position
      console.log('[VisionClinics] Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      const { latitude, longitude } = location.coords;
      console.log('[VisionClinics] Location detected:', { latitude, longitude });

      // Try backend reverse geocode first
      let detectedPincode: string | null = null;

      try {
        const geocodeUrl = `/location/reverse-geocode?lat=${latitude}&lng=${longitude}`;
        console.log('[VisionClinics] Trying backend reverse geocode API:', geocodeUrl);

        const geocodeResponse = await apiClient.get<{ pincode: string }>(geocodeUrl);
        console.log('[VisionClinics] Backend reverse geocode response:', geocodeResponse.data);

        if (geocodeResponse.data.pincode) {
          detectedPincode = geocodeResponse.data.pincode;
          console.log('[VisionClinics] Pincode from backend:', detectedPincode);
        }
      } catch (backendError: any) {
        console.warn('[VisionClinics] Backend geocode failed, trying Nominatim:', backendError.message);

        // Fallback to Nominatim (OpenStreetMap)
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          console.log('[VisionClinics] Trying Nominatim geocode:', nominatimUrl);

          const nominatimResponse = await fetch(nominatimUrl, {
            headers: {
              'User-Agent': 'OPDWallet-MemberApp/1.0'
            }
          });

          if (nominatimResponse.ok) {
            const nominatimData = await nominatimResponse.json();
            console.log('[VisionClinics] Nominatim response:', nominatimData);

            // Extract pincode from address
            const pincodeValue = nominatimData.address?.postcode;
            if (pincodeValue) {
              detectedPincode = pincodeValue;
              console.log('[VisionClinics] Pincode from Nominatim:', detectedPincode);
            }
          }
        } catch (nominatimError: any) {
          console.error('[VisionClinics] Nominatim geocode also failed:', nominatimError);
        }
      }

      if (detectedPincode) {
        setPincode(detectedPincode);
        searchClinics(detectedPincode);
      } else {
        setError('Could not detect pincode from your location. Please enter manually.');
      }
    } catch (err: any) {
      console.error('[VisionClinics] Location detection error:', err);
      console.error('[VisionClinics] Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });

      // Handle specific error types
      if (err.response?.status === 404) {
        setError('Location service not available. Please enter pincode manually.');
      } else if (err.response?.status === 500) {
        setError('Location service error. Please enter pincode manually.');
      } else if (err.message?.includes('permission')) {
        setError('Location access denied. Please enter pincode manually.');
      } else if (err.message?.includes('timeout')) {
        setError('Location detection timeout. Please enter pincode manually.');
      } else if (err.message?.includes('unavailable')) {
        setError('Location unavailable. Please enter pincode manually.');
      } else {
        const errorMsg = err.message || 'Unknown error';
        setError(`Failed to detect location: ${errorMsg} Please enter pincode manually`);
      }
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
      console.log('[VisionClinics] Selected clinic:', clinicId);
      router.push(
        `/member/vision/select-patient?clinicId=${clinicId}&serviceCode=${serviceCode}` as any
      );
    },
    [router, serviceCode]
  );

  // Handle back button
  const handleBack = useCallback(() => {
    console.log('[VisionClinics] Back button pressed');
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
                  Find Vision Clinics
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
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.primary,
                marginBottom: 16,
              }}
            >
              Enter Location
            </Text>

            <View style={{ gap: 16 }}>
              {/* Manual Pincode Entry */}
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: COLORS.textDark,
                    marginBottom: 8,
                  }}
                >
                  Enter Pincode
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    placeholder="e.g., 110001"
                    value={pincode}
                    onChangeText={setPincode}
                    onSubmitEditing={handleSearch}
                    keyboardType="numeric"
                    maxLength={6}
                    returnKeyType="search"
                    style={{
                      flex: 1,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: COLORS.cardBorder,
                      borderRadius: 12,
                      fontSize: 14,
                      color: COLORS.textDark,
                      backgroundColor: COLORS.white,
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
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <MagnifyingGlassIcon width={20} height={20} color="#FFFFFF" />
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      Search
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* OR Divider */}
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textGray }}>OR</Text>
              </View>

              {/* Auto-detect Location */}
              <View>
                <TouchableOpacity
                  onPress={detectLocation}
                  disabled={detectingLocation || loading}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: detectingLocation || loading ? '#9CA3AF' : COLORS.success,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <MapPinIcon width={20} height={20} color="#FFFFFF" />
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {detectingLocation ? 'Detecting...' : 'Use My Location'}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textGray,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  Automatically detect your location
                </Text>
              </View>
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
            <View
              style={{
                paddingVertical: 64,
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}

          {/* ===== CLINICS LIST ===== */}
          {!loading && searchedPincode && clinics.length > 0 && (
            <View>
              {/* Results Header */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: COLORS.primary,
                  }}
                >
                  Clinics in {searchedPincode} ({clinics.length})
                </Text>
              </View>

              {/* Clinics Grid */}
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
                        marginBottom: 12,
                      }}
                    >
                      {clinic.clinicName}
                    </Text>

                    {/* Address */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <MapPinIcon width={20} height={20} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, color: COLORS.textGray, lineHeight: 20 }}>
                          {clinic.address.street || clinic.address.line1}
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.textGray, lineHeight: 20 }}>
                          {clinic.address.city}, {clinic.address.state} - {clinic.address.pincode}
                        </Text>
                      </View>
                    </View>

                    {/* Contact */}
                    <Text style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 16 }}>
                      <Text style={{ fontWeight: '500' }}>Contact:</Text> {clinic.contactNumber}
                    </Text>

                    {/* Billing Info and Availability */}
                    <View
                      style={{
                        backgroundColor: 'rgba(3, 77, 162, 0.05)',
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: COLORS.selectedBorder,
                        marginBottom: 16,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: COLORS.textGray }}>Billing</Text>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textDark }}>
                            Billing will be done post service availment
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 12, color: COLORS.textGray }}>Available Slots</Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: '700',
                              color: COLORS.success,
                            }}
                          >
                            {clinic.availableSlots}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Select Button */}
                    <TouchableOpacity
                      onPress={() => handleSelectClinic(clinic.clinicId)}
                      disabled={clinic.availableSlots === 0}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: clinic.availableSlots > 0 ? COLORS.primary : '#9CA3AF',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 14,
                          fontWeight: '600',
                        }}
                      >
                        {clinic.availableSlots > 0 ? 'Select Clinic' : 'No Slots Available'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ===== EMPTY STATE ===== */}
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
              {/* Icon Circle */}
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
                <MapPinIcon width={32} height={32} color={COLORS.primary} />
              </View>

              {/* Title */}
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

              {/* Message */}
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textGray,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Enter your pincode or use auto-detect to find vision clinics near you
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
