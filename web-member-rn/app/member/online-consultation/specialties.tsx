import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface Specialty {
  _id: string;
  specialtyId: string;
  code: string;
  name: string;
  description: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnlineSpecialtiesPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const defaultPatient = params.defaultPatient as string | undefined;

  // State
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // FETCH SPECIALTIES
  // ============================================================================

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        console.log('[OnlineSpecialties] Fetching policy-filtered specialties from API');
        // CAT005 is the category code for Online Consultation
        const response = await apiClient.get<{ services?: Specialty[] }>('/member/benefits/CAT005/specialties');

        const data = response.data?.services || [];
        console.log('[OnlineSpecialties] Policy-filtered specialties received:', data.length);
        setSpecialties(data);
      } catch (error) {
        console.error('[OnlineSpecialties] Error fetching specialties:', error);
        setSpecialties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  // ============================================================================
  // FILTERED SPECIALTIES
  // ============================================================================

  const filteredSpecialties = useMemo(() => {
    if (searchQuery.trim() === '') {
      return specialties;
    }
    return specialties.filter(
      (specialty) =>
        specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specialty.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, specialties]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSpecialtyClick = (specialty: Specialty) => {
    console.log('[OnlineSpecialties] Specialty selected:', specialty.specialtyId, specialty.name);

    const queryParams = new URLSearchParams({
      specialtyId: specialty.specialtyId,
      specialtyName: specialty.name,
    });

    if (defaultPatient) {
      queryParams.append('defaultPatient', defaultPatient);
    }

    router.push(`/member/online-consultation/doctors?${queryParams.toString()}` as any);
  };

  const handleBack = () => {
    router.back();
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
                  Select Specialty
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Choose medical specialty
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
              marginBottom: 24,
            }}
          >
            <MagnifyingGlassIcon width={20} height={20} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search specialties..."
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

          {/* ===== SPECIALTIES LIST OR EMPTY STATE ===== */}
          {filteredSpecialties.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
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
                  borderWidth: 1,
                  borderColor: 'rgba(164, 191, 254, 0.48)',
                }}
              >
                <MagnifyingGlassIcon width={32} height={32} color="#0F5FDC" />
              </LinearGradient>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginTop: 16, marginBottom: 8 }}>
                {searchQuery.trim() === '' ? 'No Specialties Available' : 'No specialties found'}
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24 }}>
                {searchQuery.trim() === ''
                  ? 'Online consultation is not configured in your policy. Please contact your HR administrator.'
                  : 'Try adjusting your search term'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredSpecialties.map((specialty) => (
                <TouchableOpacity
                  key={specialty._id}
                  onPress={() => handleSpecialtyClick(specialty)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {/* Icon Circle with first letter */}
                      <LinearGradient
                        colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
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
                        <Text style={{ fontSize: 20, fontWeight: '600', color: '#0F5FDC' }}>
                          {specialty.name.charAt(0)}
                        </Text>
                      </LinearGradient>

                      {/* Specialty Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 4 }}>
                          {specialty.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={2}>
                          {specialty.description}
                        </Text>
                      </View>

                      {/* Chevron */}
                      <ChevronRightIcon width={20} height={20} color="#0F5FDC" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
