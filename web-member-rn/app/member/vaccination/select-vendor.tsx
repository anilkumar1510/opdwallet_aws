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
import { apiClient } from '../../../src/lib/api/client';

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

interface Vendor {
  _id: string;
  vendorId: string;
  name: string;
  code: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  centerVisit: boolean;
  actualPrice: number;
  discountedPrice: number;
  activeSchedulesCount: number;
}

export default function SelectVendorPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceId = params.serviceId as string;
  const serviceName = params.serviceName as string;
  const serviceCode = params.serviceCode as string;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pincode, setPincode] = useState('');
  const [searchedPincode, setSearchedPincode] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    console.log('[SelectVendor] Page mounted with params:', { serviceId, serviceName, serviceCode });
    return () => {
      console.log('[SelectVendor] Page unmounted');
    };
  }, [serviceId, serviceName, serviceCode]);

  useEffect(() => {
    if (!serviceId) {
      console.warn('[SelectVendor] No serviceId provided, redirecting');
      router.push('/member/vaccination');
      return;
    }
  }, [serviceId, router]);

  const searchVendors = useCallback(
    async (searchPincode: string) => {
      if (!serviceId) {
        setError('Service ID is required');
        return;
      }

      if (!searchPincode) {
        setError('Please enter a pincode to search for vaccination centers');
        return;
      }

      console.log('[SelectVendor] Searching vendors:', { pincode: searchPincode, serviceId });

      setLoading(true);
      setError('');
      setSearchedPincode(searchPincode);
      setHasSearched(true);

      try {
        const response = await apiClient.get<{ vendors: Vendor[] }>(
          `/member/vaccination/vendors`,
          {
            params: {
              serviceId,
              pincode: searchPincode,
            },
          }
        );

        console.log('[SelectVendor] Vendors found:', response.data.vendors?.length || 0);
        setVendors(response.data.vendors || []);

        if (response.data.vendors.length === 0) {
          setError(`No vaccination centers found for this vaccine in pincode ${searchPincode}`);
        }
      } catch (err: any) {
        console.error('[SelectVendor] Error fetching vendors:', err);

        if (err.response?.status === 404) {
          setError(`No vaccination centers found in pincode ${searchPincode}`);
        } else if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (!err.response) {
          setError('Network error. Please check your connection.');
        } else {
          setError(err.response?.data?.message || 'Failed to load vendors. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [serviceId]
  );

  const detectLocation = useCallback(async () => {
    console.log('[SelectVendor] Detecting location');
    setDetectingLocation(true);
    setError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Location access denied. Please enter pincode manually.');
        setDetectingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      const { latitude, longitude } = location.coords;
      let detectedPincode: string | null = null;

      try {
        const geocodeUrl = `/location/reverse-geocode?lat=${latitude}&lng=${longitude}`;
        const geocodeResponse = await apiClient.get<{ pincode: string }>(geocodeUrl);

        if (geocodeResponse.data.pincode) {
          detectedPincode = geocodeResponse.data.pincode;
        }
      } catch {
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          const nominatimResponse = await fetch(nominatimUrl, {
            headers: { 'User-Agent': 'OPDWallet-MemberApp/1.0' }
          });

          if (nominatimResponse.ok) {
            const nominatimData = await nominatimResponse.json();
            if (nominatimData.address?.postcode) {
              detectedPincode = nominatimData.address.postcode;
            }
          }
        } catch (nominatimError: any) {
          console.error('[SelectVendor] Nominatim geocode failed:', nominatimError);
        }
      }

      if (detectedPincode) {
        setPincode(detectedPincode);
        searchVendors(detectedPincode);
      } else {
        setError('Could not detect pincode from your location. Please enter manually.');
      }
    } catch (err: any) {
      console.error('[SelectVendor] Location detection error:', err);
      setError('Failed to detect location. Please enter pincode manually.');
    } finally {
      setDetectingLocation(false);
    }
  }, [searchVendors]);

  const handleSearch = useCallback(() => {
    if (pincode.trim()) {
      searchVendors(pincode.trim());
    }
  }, [pincode, searchVendors]);

  const handleSelectVendor = useCallback(
    (vendor: Vendor) => {
      console.log('[SelectVendor] Selected vendor:', vendor.vendorId);
      router.push(
        `/member/vaccination/select-patient?vendorId=${vendor.vendorId}&vendorName=${encodeURIComponent(vendor.name)}&serviceId=${serviceId}&serviceName=${encodeURIComponent(serviceName)}&serviceCode=${serviceCode}&price=${vendor.discountedPrice}&pincode=${searchedPincode}` as any
      );
    },
    [router, serviceId, serviceName, serviceCode, searchedPincode]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          ...Platform.select({
            web: { position: 'sticky', top: 0, zIndex: 10 },
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
              <TouchableOpacity onPress={handleBack} style={{ padding: 8, borderRadius: 12 }} activeOpacity={0.7}>
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  Find Vaccination Center
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  {serviceName || 'Select a center near you'}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
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
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 12 }}>
              Enter Location
            </Text>

            <View style={{ gap: 12 }}>
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
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Search</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              </View>

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

          {loading && (
            <View style={{ paddingVertical: 64, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}

          {!loading && vendors.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
                  Centers in {searchedPincode} ({vendors.length})
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {vendors.map((vendor) => (
                  <View
                    key={vendor.vendorId}
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
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 10 }}>
                      {vendor.name}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <MapPinIcon size={16} color={COLORS.textGray} />
                      <Text style={{ flex: 1, fontSize: 13, color: COLORS.textGray, lineHeight: 18 }}>
                        {vendor.contactInfo.address}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <PhoneIcon size={14} />
                      <Text style={{ fontSize: 13, color: COLORS.textGray }}>{vendor.contactInfo.phone}</Text>
                    </View>

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary }}>
                            ₹{vendor.discountedPrice}
                          </Text>
                          {vendor.actualPrice > vendor.discountedPrice && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: COLORS.textGray,
                                textDecorationLine: 'line-through',
                              }}
                            >
                              ₹{vendor.actualPrice}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: COLORS.textGray }}>Schedules</Text>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.success }}>
                          {vendor.activeSchedulesCount} available
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleSelectVendor(vendor)}
                      disabled={vendor.activeSchedulesCount === 0}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: vendor.activeSchedulesCount > 0 ? COLORS.primary : '#9CA3AF',
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                        {vendor.activeSchedulesCount > 0 ? 'Select Center' : 'No Schedules'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!loading && vendors.length === 0 && !error && !hasSearched && (
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
                style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}
              >
                Find Vaccination Centers
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20 }}>
                Enter your pincode or use your current location to find vaccination centers near you.
              </Text>
            </View>
          )}

          {!loading && vendors.length === 0 && !error && hasSearched && (
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
                style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textAlign: 'center' }}
              >
                No Centers Found
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20 }}>
                No vaccination centers found in {searchedPincode}. Try a different pincode.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
