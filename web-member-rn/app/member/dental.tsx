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
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '../../src/components/icons/InlineSVGs';
import apiClient from '../../src/lib/api/client';

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

function ToothIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C9.5 2 7.5 3.5 7 5.5C6.5 7.5 5 8 4 9C3 10 3 11.5 3.5 13C4 14.5 4.5 16 5 18C5.5 20 6.5 22 8 22C9.5 22 10 20.5 10 19C10 17.5 10.5 16 12 16C13.5 16 14 17.5 14 19C14 20.5 14.5 22 16 22C17.5 22 18.5 20 19 18C19.5 16 20 14.5 20.5 13C21 11.5 21 10 20 9C19 8 17.5 7.5 17 5.5C16.5 3.5 14.5 2 12 2Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={COLORS.textGray}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
    router.push('/member');
  }, [router]);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    console.log('[Dental] Search term changed:', text);
    setSearchTerm(text);
  }, []);

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
                onPress={handleHeaderBack}
                style={{ padding: 8, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  Dental Services
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Browse and book dental care services
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
          {loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 64,
              }}
            >
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : services.length === 0 ? (
            /* ===== EMPTY STATE ===== */
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
                <ToothIcon size={32} />
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
                No Dental Services Available
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textGray,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                No dental services are currently assigned to your policy. Please contact your administrator for more information.
              </Text>
            </View>
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
                      <MagnifyingGlassIcon width={20} height={20} color="#9CA3AF" />
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
                        borderColor: COLORS.cardBorder,
                        borderRadius: 12,
                        fontSize: 14,
                        color: COLORS.textDark,
                        backgroundColor: COLORS.white,
                      }}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              )}

              {/* ===== SERVICES LIST ===== */}
              <View style={{ gap: 12 }}>
                {filteredServices.map((service) => (
                  <TouchableOpacity
                    key={service.code}
                    onPress={() => handleBookService(service.code)}
                    activeOpacity={0.7}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: COLORS.primary,
                            marginBottom: 4,
                          }}
                        >
                          {service.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: COLORS.textGray,
                            lineHeight: 18,
                          }}
                          numberOfLines={2}
                        >
                          {service.description}
                        </Text>
                      </View>
                      <ChevronRightIcon size={20} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ===== NO SEARCH RESULTS ===== */}
              {filteredServices.length === 0 && searchTerm && (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
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
