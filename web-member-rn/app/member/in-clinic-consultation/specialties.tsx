import React, { useState, useEffect, useCallback } from 'react';
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
  icon: string;
  isActive: boolean;
  displayOrder: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SpecialtiesPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const defaultPatient = params.defaultPatient as string | undefined;

  // State
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // FETCH SPECIALTIES
  // ============================================================================

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        console.log('[Specialties] Fetching policy-filtered specialties from API');
        const response = await apiClient.get<{ services: Specialty[] }>('/member/benefits/CAT001/specialties');

        const data = response.data.services || [];
        console.log('[Specialties] Policy-filtered specialties received:', data.length);
        setSpecialties(data);
        setFilteredSpecialties(data);
      } catch (error) {
        console.error('[Specialties] Error fetching specialties:', error);
        setSpecialties([]);
        setFilteredSpecialties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  // ============================================================================
  // SEARCH FILTER
  // ============================================================================

  useEffect(() => {
    console.log('[Specialties] Search query changed:', searchQuery);
    if (searchQuery.trim() === '') {
      setFilteredSpecialties(specialties);
    } else {
      const filtered = specialties.filter(
        (specialty) =>
          specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          specialty.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('[Specialties] Filtered results:', filtered.length);
      setFilteredSpecialties(filtered);
    }
  }, [searchQuery, specialties]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSpecialtyClick = useCallback(
    (specialty: Specialty) => {
      console.log('[Specialties] Specialty selected:', {
        specialtyId: specialty.specialtyId,
        name: specialty.name,
      });

      let url = `/member/in-clinic-consultation/doctors?specialtyId=${specialty.specialtyId}&specialtyName=${encodeURIComponent(specialty.name)}`;
      if (defaultPatient) {
        url += `&defaultPatient=${defaultPatient}`;
      }
      router.push(url as any);
    },
    [router, defaultPatient]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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
                  Choose your medical specialty
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
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#86ACD8',
                borderRadius: 12,
                paddingHorizontal: 12,
              }}
            >
              <MagnifyingGlassIcon width={20} height={20} color="#0F5FDC" />
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
                  marginBottom: 16,
                }}
              >
                <MagnifyingGlassIcon width={32} height={32} color="#0F5FDC" />
              </LinearGradient>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
                {searchQuery.trim() === '' ? 'No Specialties Available' : 'No specialties found'}
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24 }}>
                {searchQuery.trim() === ''
                  ? 'In-clinic consultation is not configured in your policy. Please contact your HR administrator.'
                  : 'Try a different search term'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredSpecialties.map((specialty) => (
                <TouchableOpacity
                  key={specialty._id}
                  onPress={() => handleSpecialtyClick(specialty)}
                  activeOpacity={0.7}
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
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        {/* Specialty Initial Circle */}
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
                          }}
                        >
                          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F5FDC' }}>
                            {specialty.name.charAt(0)}
                          </Text>
                        </LinearGradient>

                        {/* Specialty Info */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2' }} numberOfLines={1}>
                            {specialty.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
                            {specialty.description}
                          </Text>
                        </View>
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
