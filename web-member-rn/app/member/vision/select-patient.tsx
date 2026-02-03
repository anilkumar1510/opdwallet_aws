import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ArrowLeftIcon,
} from '../../../src/components/icons/InlineSVGs';
import { useFamily } from '../../../src/contexts/FamilyContext';

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
// ICONS - Matching Home Page Style
// ============================================================================

function UserIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={COLORS.primary} strokeWidth={1.5} />
      <Path
        d="M20 21a8 8 0 10-16 0"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={COLORS.success} strokeWidth={1.5} />
      <Path
        d="M9 12l2 2 4-4"
        stroke={COLORS.success}
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

interface Patient {
  id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VisionSelectPatientPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const clinicId = params.clinicId as string;
  const serviceCode = params.serviceCode as string;

  // Family context
  const { familyMembers, viewingUserId, isLoading: familyLoading } = useFamily();

  // State
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // ============================================================================
  // HELPER: Calculate Age
  // ============================================================================

  const calculateAge = useCallback((dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }, []);

  // ============================================================================
  // VALIDATION: Redirect if missing params
  // ============================================================================

  useEffect(() => {
    console.log('[VisionSelectPatient] Component mounted');

    if (!clinicId || !serviceCode) {
      console.error('[VisionSelectPatient] Missing clinicId or serviceCode, redirecting to vision page');
      router.replace('/member/vision');
      return;
    }

    console.log('[VisionSelectPatient] Query params:', { clinicId, serviceCode });
  }, [clinicId, serviceCode, router]);

  // ============================================================================
  // LOAD PATIENTS FROM FAMILY CONTEXT
  // ============================================================================

  useEffect(() => {
    if (familyLoading) {
      console.log('[VisionSelectPatient] Waiting for family data to load...');
      return;
    }

    console.log('[VisionSelectPatient] Building patient list from family members');
    console.log('[VisionSelectPatient] Family members count:', familyMembers.length);

    const patientsList: Patient[] = familyMembers.map((member) => ({
      id: member._id,
      name: `${member.name.firstName} ${member.name.lastName}`,
      relationship: member.isPrimary ? 'Self' : (member.relationship || 'Family Member'),
      age: calculateAge(member.dateOfBirth),
      gender: member.gender || 'Not specified',
    }));

    console.log('[VisionSelectPatient] Patients list created:', patientsList.length);
    setPatients(patientsList);

    // Auto-select patient based on viewingUserId
    if (viewingUserId) {
      const matchedPatient = patientsList.find((p) => p.id === viewingUserId);
      if (matchedPatient) {
        console.log('[VisionSelectPatient] Auto-selected patient from viewing context:', matchedPatient.name);
        setSelectedPatient(matchedPatient);
      }
    } else if (patientsList.length > 0) {
      // Default to first patient (self)
      console.log('[VisionSelectPatient] Auto-selected self as default');
      setSelectedPatient(patientsList[0]);
    }

    setLoading(false);
  }, [familyMembers, familyLoading, viewingUserId, calculateAge]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContinue = useCallback(() => {
    if (!selectedPatient) {
      console.warn('[VisionSelectPatient] Continue clicked but no patient selected');
      return;
    }

    console.log('[VisionSelectPatient] Selected patient:', selectedPatient.id, selectedPatient.name);
    router.push(
      `/member/vision/select-slot?clinicId=${clinicId}&serviceCode=${serviceCode}&patientId=${selectedPatient.id}` as any
    );
  }, [selectedPatient, router, clinicId, serviceCode]);

  const handlePatientSelect = useCallback((patient: Patient) => {
    console.log('[VisionSelectPatient] Patient selected:', patient.name);
    setSelectedPatient(patient);
  }, []);

  const handleBack = useCallback(() => {
    console.log('[VisionSelectPatient] Back button pressed');
    router.back();
  }, [router]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading || familyLoading) {
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
                  Select Patient
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Who is this appointment for?
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
          {/* ===== PATIENTS LIST OR EMPTY STATE ===== */}
          {patients.length === 0 ? (
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
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 8 }}>
                No Patients Available
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
                Please contact support if you believe this is an error.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12, marginBottom: 24 }}>
              {patients.map((patient) => {
                const isSelected = selectedPatient?.id === patient.id;

                return (
                  <TouchableOpacity
                    key={patient.id}
                    onPress={() => handlePatientSelect(patient)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? COLORS.selectedBorder : COLORS.cardBorder,
                      shadowColor: '#000',
                      shadowOffset: { width: -2, height: 11 },
                      shadowOpacity: 0.08,
                      shadowRadius: 23,
                      elevation: 3,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Left Side - Patient Info */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(3, 77, 162, 0.1)',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <UserIcon size={22} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: '600',
                              color: COLORS.primary,
                            }}
                            numberOfLines={1}
                          >
                            {patient.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: COLORS.textGray,
                              marginTop: 2,
                            }}
                          >
                            {patient.relationship} • {patient.age} yrs • {patient.gender}
                          </Text>
                        </View>
                      </View>

                      {/* Right Side - Checkmark if Selected */}
                      {isSelected && <CheckCircleIcon size={24} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ===== CONTINUE BUTTON ===== */}
          <TouchableOpacity
            disabled={!selectedPatient}
            onPress={handleContinue}
            activeOpacity={0.8}
            style={{
              backgroundColor: selectedPatient ? COLORS.primary : '#9CA3AF',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
