import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '../../src/components/icons/InlineSVGs';
import apiClient from '../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface DentalService {
  code: string;
  name: string;
  description: string;
  priceRange: {
    min: number;
    max: number;
  };
  coveragePercentage: number;
  copayAmount: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DentalPage() {
  const router = useRouter();

  // State
  const [services, setServices] = useState<DentalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Log component mount
  useEffect(() => {
    console.log('[Dental] Dental services page mounted');
    return () => {
      console.log('[Dental] Dental services page unmounted');
    };
  }, []);

  // Fetch dental services from API
  const fetchDentalServices = useCallback(async () => {
    try {
      console.log('[Dental] Loading assigned dental services');
      setLoading(true);
      setError('');

      // API endpoint: GET /member/benefits/CAT006/services
      const response = await apiClient.get<{ services: DentalService[] }>(
        '/member/benefits/CAT006/services'
      );

      console.log('[Dental] Services fetched:', response.data.services?.length || 0);
      setServices(response.data.services || []);
    } catch (err: any) {
      console.error('[Dental] Error fetching services:', err);

      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('No dental services found for your policy.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view dental services.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load dental services');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchDentalServices();
  }, [fetchDentalServices]);

  // Filter services based on search term (memoized)
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) {
      return services;
    }

    const searchLower = searchTerm.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower)
    );
  }, [services, searchTerm]);

  // Handle book service navigation
  const handleBookService = useCallback(
    (serviceCode: string) => {
      console.log('[Dental] Booking service:', serviceCode);
      router.push(`/member/dental/clinics?serviceCode=${serviceCode}` as any);
    },
    [router]
  );

  // Handle header back button
  const handleHeaderBack = useCallback(() => {
    console.log('[Dental] Header back button pressed');
    router.push('/(member)');
  }, [router]);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    console.log('[Dental] Search term changed:', text);
    setSearchTerm(text);
  }, []);

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
                onPress={handleHeaderBack}
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
                  Dental Services
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Browse and book dental care services covered by your policy
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
          {loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 64,
              }}
            >
              <ActivityIndicator size="large" color="#0F5FDC" />
            </View>
          ) : services.length === 0 ? (
            /* ===== EMPTY STATE ===== */
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
                <SparklesIcon width={32} height={32} color="#0F5FDC" />
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
                No Dental Services Available
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
                No dental services are currently assigned to your policy. Please contact your administrator for more information.
              </Text>
            </LinearGradient>
          ) : (
            <>
              {/* ===== SEARCH BAR (Conditional - only if > 3 services) ===== */}
              {services.length > 3 && (
                <View style={{ marginBottom: 16 }}>
                  <View style={{ position: 'relative' }}>
                    <View
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: [{ translateY: -10 }],
                        zIndex: 1,
                      }}
                    >
                      <MagnifyingGlassIcon width={20} height={20} color="#0F5FDC" />
                    </View>
                    <TextInput
                      placeholder="Search dental services..."
                      value={searchTerm}
                      onChangeText={handleSearchChange}
                      style={{
                        width: '100%',
                        paddingLeft: 40,
                        paddingRight: 16,
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
                  </View>
                </View>
              )}

              {/* ===== SERVICES GRID ===== */}
              <View style={{ gap: 16 }}>
                {filteredServices.map((service) => (
                  <LinearGradient
                    key={service.code}
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
                    {/* Service Header */}
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#0E51A2',
                          marginBottom: 8,
                        }}
                      >
                        {service.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#6B7280',
                          lineHeight: 20,
                        }}
                        numberOfLines={2}
                      >
                        {service.description}
                      </Text>
                    </View>

                    {/* Book Button */}
                    <TouchableOpacity
                      onPress={() => handleBookService(service.code)}
                      activeOpacity={0.8}
                      style={{ width: '100%' }}
                    >
                      <LinearGradient
                        colors={['#1F63B4', '#5DA4FB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingHorizontal: 24,
                          paddingVertical: 12,
                          borderRadius: 12,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 4,
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
                          Book Now
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                ))}
              </View>

              {/* ===== NO SEARCH RESULTS ===== */}
              {filteredServices.length === 0 && searchTerm && (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                    No services match your search "{searchTerm}"
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
