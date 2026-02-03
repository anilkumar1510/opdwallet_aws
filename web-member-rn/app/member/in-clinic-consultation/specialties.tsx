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
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// COLORS
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
  iconBg: 'rgba(3, 77, 162, 0.1)',
};

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
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ============================================================================
  // MAIN UI
  // ============================================================================

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* ===== HEADER (STICKY) ===== */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
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
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>
                  Select Specialty
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
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
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                paddingHorizontal: 12,
              }}
            >
              <MagnifyingGlassIcon width={20} height={20} color={COLORS.primary} />
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
                  color: COLORS.textDark,
                }}
              />
            </View>
          </View>

          {/* ===== SPECIALTIES LIST OR EMPTY STATE ===== */}
          {filteredSpecialties.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: COLORS.iconBg,
                  marginBottom: 16,
                }}
              >
                <MagnifyingGlassIcon width={32} height={32} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight, marginBottom: 8 }}>
                {searchQuery.trim() === '' ? 'No Specialties Available' : 'No specialties found'}
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center', paddingHorizontal: 24 }}>
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
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: COLORS.cardBorder,
                    backgroundColor: COLORS.white,
                    shadowColor: '#000',
                    shadowOffset: { width: -2, height: 11 },
                    shadowOpacity: 0.08,
                    shadowRadius: 23,
                    elevation: 3,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      {/* Specialty Initial Circle */}
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: COLORS.iconBg,
                        }}
                      >
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                          {specialty.name.charAt(0)}
                        </Text>
                      </View>

                      {/* Specialty Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primaryLight }} numberOfLines={1}>
                          {specialty.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }} numberOfLines={1}>
                          {specialty.description}
                        </Text>
                      </View>
                    </View>

                    {/* Chevron */}
                    <ChevronRightIcon width={20} height={20} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
