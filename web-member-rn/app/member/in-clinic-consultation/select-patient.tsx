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
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeftIcon,
  UserIcon,
  CheckCircleIcon,
} from '../../../src/components/icons/InlineSVGs';
import { useFamily } from '../../../src/contexts/FamilyContext';

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
// ICON CIRCLE COMPONENT
// ============================================================================

interface IconCircleProps {
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  size?: 'sm' | 'md' | 'lg';
}

const IconCircle: React.FC<IconCircleProps> = ({ icon: Icon, size = 'md' }) => {
  const sizeMap = {
    sm: { container: 40, icon: 20 },
    md: { container: 48, icon: 24 },
    lg: { container: 64, icon: 32 },
  };

  const dimensions = sizeMap[size];

  return (
    <LinearGradient
      colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
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
      <Icon width={dimensions.icon} height={dimensions.icon} color="#0F5FDC" />
    </LinearGradient>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SelectPatientPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract all query params
  const doctorId = params.doctorId as string;
  const doctorName = params.doctorName as string;
  const specialty = params.specialty as string;
  const clinicId = params.clinicId as string;
  const clinicName = params.clinicName as string;
  const clinicAddress = params.clinicAddress as string;
  const consultationFee = params.consultationFee as string;
  const defaultPatient = params.defaultPatient as string | undefined;

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
    console.log('[SelectPatient] Component mounted');

    if (!doctorId || !clinicId) {
      console.error('[SelectPatient] Missing required params, redirecting');
      router.replace('/member/in-clinic-consultation');
      return;
    }

    console.log('[SelectPatient] Query params:', { doctorId, doctorName, clinicId, consultationFee });
  }, [doctorId, clinicId, router, doctorName, consultationFee]);

  // ============================================================================
  // LOAD PATIENTS FROM FAMILY CONTEXT
  // ============================================================================

  useEffect(() => {
    if (familyLoading) {
      console.log('[SelectPatient] Waiting for family data to load...');
      return;
    }

    console.log('[SelectPatient] Building patient list from family members');
    console.log('[SelectPatient] Family members count:', familyMembers.length);

    const patientsList: Patient[] = familyMembers.map((member) => ({
      id: member._id,
      name: `${member.name.firstName} ${member.name.lastName}`,
      relationship: member.isPrimary ? 'Self' : member.relationship || 'Family Member',
      age: calculateAge(member.dateOfBirth),
      gender: member.gender || 'Not specified',
    }));

    console.log('[SelectPatient] Patients list created:', patientsList.length);
    setPatients(patientsList);

    // Auto-select patient based on defaultPatient or viewingUserId
    const targetPatientId = defaultPatient || viewingUserId;
    if (targetPatientId) {
      const matchedPatient = patientsList.find((p) => p.id === targetPatientId);
      if (matchedPatient) {
        console.log('[SelectPatient] Auto-selected patient:', matchedPatient.name);
        setSelectedPatient(matchedPatient);
      }
    } else if (patientsList.length > 0) {
      // Default to first patient (self)
      console.log('[SelectPatient] Auto-selected self as default');
      setSelectedPatient(patientsList[0]);
    }

    setLoading(false);
  }, [familyMembers, familyLoading, viewingUserId, defaultPatient, calculateAge]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContinue = useCallback(() => {
    if (!selectedPatient) {
      console.warn('[SelectPatient] Continue clicked but no patient selected');
      return;
    }

    console.log('[SelectPatient] Selected patient:', selectedPatient.id, selectedPatient.name);

    const queryParams = new URLSearchParams({
      doctorId,
      doctorName,
      specialty,
      clinicId,
      clinicName,
      clinicAddress,
      consultationFee,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
    });

    router.push(`/member/in-clinic-consultation/select-slot?${queryParams.toString()}` as any);
  }, [selectedPatient, router, doctorId, doctorName, specialty, clinicId, clinicName, clinicAddress, consultationFee]);

  const handlePatientSelect = useCallback((patient: Patient) => {
    console.log('[SelectPatient] Patient selected:', patient.name);
    setSelectedPatient(patient);
  }, []);

  const handleBack = useCallback(() => {
    console.log('[SelectPatient] Back button pressed');
    router.back();
  }, [router]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading || familyLoading) {
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
                  Select Patient
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
          paddingVertical: 24,
          paddingBottom: 96,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          {/* ===== PATIENTS GRID OR EMPTY STATE ===== */}
          {patients.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
                No Patients Available
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                Please contact support if you believe this is an error.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16, marginBottom: 24 }}>
              {patients.map((patient) => {
                const isSelected = selectedPatient?.id === patient.id;

                return (
                  <TouchableOpacity
                    key={patient.id}
                    onPress={() => handlePatientSelect(patient)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? ['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']
                          : ['#EFF4FF', '#FEF3E9', '#FEF3E9']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 2,
                        borderColor: isSelected ? '#86ACD8' : '#F7DCAF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected ? 0.15 : 0.05,
                        shadowRadius: isSelected ? 8 : 4,
                        elevation: isSelected ? 4 : 2,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                        }}
                      >
                        {/* Left Side - Patient Info */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: 12,
                            flex: 1,
                          }}
                        >
                          <IconCircle icon={UserIcon} size="md" />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#0E51A2',
                              }}
                              numberOfLines={1}
                            >
                              {patient.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: '#6B7280',
                                marginTop: 2,
                              }}
                            >
                              {patient.relationship}
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                gap: 12,
                                marginTop: 8,
                              }}
                            >
                              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                {patient.age} years
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                {patient.gender}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Right Side - Checkmark if Selected */}
                        {isSelected && (
                          <CheckCircleIcon width={24} height={24} color="#25A425" />
                        )}
                      </View>
                    </LinearGradient>
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
          >
            <LinearGradient
              colors={
                selectedPatient
                  ? ['#1F63B4', '#5DA4FB']
                  : ['#9ca3af', '#9ca3af']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selectedPatient ? 0.2 : 0,
                shadowRadius: 8,
                elevation: selectedPatient ? 4 : 0,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
