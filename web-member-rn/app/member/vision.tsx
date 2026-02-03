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
import Svg, { Path, Circle } from 'react-native-svg';
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

function EyeIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={COLORS.primary}
        strokeWidth={1.5}
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

interface VisionService {
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

export default function VisionPage() {
  const router = useRouter();

  // State
  const [services, setServices] = useState<VisionService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Log component mount
  useEffect(() => {
    console.log('[Vision] Vision services page mounted');
    return () => {
      console.log('[Vision] Vision services page unmounted');
    };
  }, []);

  // Fetch vision services from API
  const fetchVisionServices = useCallback(async () => {
    try {
      console.log('[Vision] Loading assigned vision services');
      setLoading(true);
      setError('');

      // API endpoint: GET /member/benefits/CAT007/services
      const response = await apiClient.get<{ services: VisionService[] }>(
        '/member/benefits/CAT007/services'
      );

      console.log('[Vision] Services fetched:', response.data.services?.length || 0);
      setServices(response.data.services || []);
    } catch (err: any) {
      console.error('[Vision] Error fetching services:', err);

      // Handle specific error cases
      if (err.response?.status === 404) {
        setError('No vision services found for your policy.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view vision services.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load vision services');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchVisionServices();
  }, [fetchVisionServices]);

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
      console.log('[Vision] Booking service:', serviceCode);
      router.push(`/member/vision/clinics?serviceCode=${serviceCode}` as any);
    },
    [router]
  );

  // Handle header back button
  const handleHeaderBack = useCallback(() => {
    console.log('[Vision] Header back button pressed');
    router.push('/member');
  }, [router]);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    console.log('[Vision] Search term changed:', text);
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
                  Vision Services
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Browse and book vision care services
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
                <EyeIcon size={32} />
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
                No Vision Services Available
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textGray,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                No vision services are currently assigned to your policy. Please contact your administrator for more information.
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
                      placeholder="Search vision services..."
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
