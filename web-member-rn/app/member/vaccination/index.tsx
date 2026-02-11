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
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

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

function VaccineIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9V15M9 12H15"
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

interface VaccinationService {
  _id: string;
  serviceId: string;
  code: string;
  name: string;
  description: string;
  vaccineType?: string;
  manufacturer?: string;
  dosesRequired?: number;
  ageGroup?: string;
  coveragePercentage: number;
  copayAmount: number;
}

export default function VaccinationPage() {
  const router = useRouter();
  const [services, setServices] = useState<VaccinationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('[Vaccination] Vaccination services page mounted');
    return () => {
      console.log('[Vaccination] Vaccination services page unmounted');
    };
  }, []);

  const fetchVaccinationServices = useCallback(async () => {
    try {
      console.log('[Vaccination] Loading assigned vaccination services');
      setLoading(true);
      setError('');

      const response = await apiClient.get<{ services: VaccinationService[] }>(
        '/member/vaccination/services'
      );

      console.log('[Vaccination] Services fetched:', response.data.services?.length || 0);
      setServices(response.data.services || []);
    } catch (err: any) {
      console.error('[Vaccination] Error fetching services:', err);

      if (err.response?.status === 404) {
        setError('No vaccination services found for your policy.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view vaccination services.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (!err.response) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load vaccination services');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaccinationServices();
  }, [fetchVaccinationServices]);

  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) {
      return services;
    }

    const searchLower = searchTerm.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchLower) ||
        service.code.toLowerCase().includes(searchLower) ||
        (service.manufacturer && service.manufacturer.toLowerCase().includes(searchLower)) ||
        (service.vaccineType && service.vaccineType.toLowerCase().includes(searchLower))
    );
  }, [services, searchTerm]);

  const handleSelectVaccine = useCallback(
    (service: VaccinationService) => {
      console.log('[Vaccination] Selected vaccine:', service.code);
      router.push(
        `/member/vaccination/select-vendor?serviceId=${service._id}&serviceName=${encodeURIComponent(service.name)}&serviceCode=${service.code}` as any
      );
    },
    [router]
  );

  const handleHeaderBack = useCallback(() => {
    console.log('[Vaccination] Header back button pressed');
    router.push('/member');
  }, [router]);

  const handleSearchChange = useCallback((text: string) => {
    console.log('[Vaccination] Search term changed:', text);
    setSearchTerm(text);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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
                  Vaccination Services
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Book your vaccination appointment
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

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
                <VaccineIcon size={32} />
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
                No Vaccines Available
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textGray,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                No vaccination services are currently assigned to your policy. Please contact your administrator.
              </Text>
            </View>
          ) : (
            <>
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
                      placeholder="Search vaccines..."
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

              <View style={{ gap: 12 }}>
                {filteredServices.map((service) => (
                  <TouchableOpacity
                    key={service._id}
                    onPress={() => handleSelectVaccine(service)}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <View
                            style={{
                              backgroundColor: 'rgba(3, 77, 162, 0.1)',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '600', color: COLORS.primary }}>
                              {service.code}
                            </Text>
                          </View>
                        </View>
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
                        {service.vaccineType && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: COLORS.textGray,
                              marginBottom: 2,
                            }}
                          >
                            Type: {service.vaccineType}
                          </Text>
                        )}
                        {service.manufacturer && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: COLORS.textGray,
                              marginBottom: 2,
                            }}
                          >
                            Manufacturer: {service.manufacturer}
                          </Text>
                        )}
                        {service.dosesRequired && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: COLORS.textGray,
                            }}
                          >
                            Doses: {service.dosesRequired}
                          </Text>
                        )}
                      </View>
                      <ChevronRightIcon size={20} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredServices.length === 0 && searchTerm && (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
                    No vaccines match your search "{searchTerm}"
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
