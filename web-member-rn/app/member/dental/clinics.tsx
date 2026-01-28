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
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  ArrowLeftIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

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
        // API endpoint: GET /dental-bookings/clinics?serviceCode={code}&pincode={pincode}
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
    console.log('[DentalClinics] Detecting location');
    setDetectingLocation(true);
    setError('');

    try {
      // Request location permissions
      console.log('[DentalClinics] Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[DentalClinics] Permission status:', status);

      if (status !== 'granted') {
        setError('Location access denied. Please enter pincode manually.');
        console.warn('[DentalClinics] Location permission denied, status:', status);
        setDetectingLocation(false);
        return;
      }

      // Get current position
      console.log('[DentalClinics] Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      const { latitude, longitude } = location.coords;
      console.log('[DentalClinics] Location detected:', { latitude, longitude });

      // Try backend reverse geocode first
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

        // Fallback to Nominatim (OpenStreetMap)
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

            // Extract pincode from address
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
      console.error('[DentalClinics] Error details:', {
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
                onPress={handleBack}
                style={{
                  padding: 8,
                  borderRadius: 8,
                }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  Find Dental Clinics
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
          paddingVertical: 24,
          paddingBottom: 96,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* ===== LOCATION SEARCH CARD ===== */}
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              padding: 16,
              borderWidth: 2,
              borderColor: '#F7DCAF',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#0E51A2',
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
                    color: '#374151',
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
                      borderColor: '#86ACD8',
                      borderRadius: 12,
                      fontSize: 14,
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                    }}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={handleSearch}
                    disabled={loading || !pincode}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#1F63B4', '#5DA4FB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        opacity: loading || !pincode ? 0.5 : 1,
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
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* OR Divider */}
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>OR</Text>
              </View>

              {/* Auto-detect Location */}
              <View>
                <TouchableOpacity
                  onPress={detectLocation}
                  disabled={detectingLocation || loading}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      backgroundColor: '#25A425',
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: detectingLocation || loading ? 0.5 : 1,
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
                  </View>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#6B7280',
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  Automatically detect your location
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ===== ERROR BANNER ===== */}
          {error && (
            <View
              style={{
                backgroundColor: '#FEF1E7',
                borderWidth: 1,
                borderColor: '#F9B376',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: '#E53535' }}>{error}</Text>
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
              <ActivityIndicator size="large" color="#0F5FDC" />
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
                    color: '#0E51A2',
                  }}
                >
                  Clinics in {searchedPincode} ({clinics.length})
                </Text>
              </View>

              {/* Clinics Grid */}
              <View style={{ gap: 16 }}>
                {clinics.map((clinic) => (
                  <LinearGradient
                    key={clinic.clinicId}
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
                    {/* Clinic Name */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#0E51A2',
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
                      <MapPinIcon width={20} height={20} color="#0F5FDC" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                          {clinic.address.street || clinic.address.line1}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                          {clinic.address.city}, {clinic.address.state} - {clinic.address.pincode}
                        </Text>
                      </View>
                    </View>

                    {/* Contact */}
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
                      <Text style={{ fontWeight: '500' }}>Contact:</Text> {clinic.contactNumber}
                    </Text>

                    {/* Price and Availability */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderTopWidth: 1,
                        borderTopColor: '#E5E7EB',
                        paddingTop: 16,
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Price</Text>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#0E51A2',
                          }}
                        >
                          ₹{clinic.servicePrice}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Available Slots</Text>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#25A425',
                          }}
                        >
                          {clinic.availableSlots}
                        </Text>
                      </View>
                    </View>

                    {/* Select Button */}
                    <TouchableOpacity
                      onPress={() => handleSelectClinic(clinic.clinicId)}
                      disabled={clinic.availableSlots === 0}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          clinic.availableSlots > 0
                            ? ['#1F63B4', '#5DA4FB']
                            : ['#9ca3af', '#9ca3af']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
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
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                ))}
              </View>
            </View>
          )}

          {/* ===== EMPTY STATE ===== */}
          {!loading && !searchedPincode && (
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
              {/* Icon Circle */}
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
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(164, 191, 254, 0.48)',
                  shadowColor: '#000',
                  shadowOffset: { width: -2, height: 11 },
                  shadowOpacity: 0.05,
                  shadowRadius: 46.1,
                  elevation: 4,
                }}
              >
                <MapPinIcon width={32} height={32} color="#0F5FDC" />
              </LinearGradient>

              {/* Title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#0E51A2',
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
                  color: '#6B7280',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Enter your pincode or use auto-detect to find dental clinics near you
              </Text>
            </LinearGradient>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
