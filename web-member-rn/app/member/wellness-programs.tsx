import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
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
  selectedBorder: '#86ACD8',
  warning: '#EAB308',
};

// ============================================================================
// ICONS
// ============================================================================

function SparklesIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L14.5 8.5L20 9.5L16 14L17 20L12 17L7 20L8 14L4 9.5L9.5 8.5L12 3Z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BeakerIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3H15M9 3V7.4C9 7.96 8.74 8.49 8.28 8.84L4.29 11.84C3.68 12.3 3.27 12.97 3.27 13.7V17.5C3.27 19.43 4.84 21 6.77 21H17.23C19.16 21 20.73 19.43 20.73 17.5V13.7C20.73 12.97 20.32 12.3 19.71 11.84L15.72 8.84C15.26 8.49 15 7.96 15 7.4V3M9 3H15"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// TYPES
// ============================================================================

interface AHCPackage {
  _id: string;
  packageId: string;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  labServices: Array<{
    _id: string;
    name: string;
    code: string;
    category?: string;
  }>;
  diagnosticServices: Array<{
    _id: string;
    name: string;
    code: string;
    category?: string;
  }>;
  totalLabTests: number;
  totalDiagnosticTests: number;
  totalTests: number;
}

interface Eligibility {
  isEligible: boolean;
  reason?: string;
  existingOrderId?: string;
}

// ============================================================================
// ICON CIRCLE COMPONENT
// ============================================================================

interface IconCircleProps {
  icon: React.ComponentType<{ size?: number }>;
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
    <View
      style={{
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(3, 77, 162, 0.1)',
      }}
    >
      <Icon size={dimensions.icon} />
    </View>
  );
};

// ============================================================================
// AHC PACKAGE CARD COMPONENT
// ============================================================================

interface AHCPackageCardProps {
  ahcPackage: AHCPackage;
  canBook: boolean;
  lastBooking?: {
    orderId: string;
    bookedAt: string;
  };
  onBookClick: () => void;
}

const AHCPackageCard: React.FC<AHCPackageCardProps> = ({
  ahcPackage,
  canBook,
  lastBooking,
  onBookClick,
}) => {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.primary,
          padding: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <SparklesIcon size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
              {ahcPackage.name}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
              Annual Health Check Package
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 20, gap: 16 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Total Tests Card */}
          <View
            style={{
              flex: 1,
              borderRadius: 12,
              padding: 14,
              backgroundColor: 'rgba(3, 77, 162, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(3, 77, 162, 0.1)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BeakerIcon size={22} />
              <View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.primary }}>
                  {ahcPackage.totalTests}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textGray }}>Total Tests</Text>
              </View>
            </View>
          </View>

          {/* Validity Card */}
          <View
            style={{
              flex: 1,
              borderRadius: 12,
              padding: 14,
              backgroundColor: 'rgba(3, 77, 162, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(3, 77, 162, 0.1)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CalendarIcon width={22} height={22} color={COLORS.primary} />
              <View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.textGray }}>Valid Until</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }}>
                  {formatDate(ahcPackage.effectiveTo)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Test Categories */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Lab Tests */}
          {ahcPackage.totalLabTests > 0 && (
            <View
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 14,
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 8 }}>
                Lab Tests ({ahcPackage.totalLabTests})
              </Text>
              <View style={{ gap: 6, maxHeight: 120 }}>
                {ahcPackage.labServices.slice(0, 5).map((service) => (
                  <View key={service._id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ marginTop: 2 }}>
                      <CheckCircleIcon width={14} height={14} color={COLORS.success} />
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.textDark, flex: 1 }} numberOfLines={1}>
                      {service.name}
                    </Text>
                  </View>
                ))}
                {ahcPackage.labServices.length > 5 && (
                  <Text style={{ fontSize: 11, color: COLORS.textGray, fontStyle: 'italic' }}>
                    +{ahcPackage.labServices.length - 5} more tests
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Diagnostic Tests */}
          {ahcPackage.totalDiagnosticTests > 0 && (
            <View
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 14,
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 8 }}>
                Diagnostic Tests ({ahcPackage.totalDiagnosticTests})
              </Text>
              <View style={{ gap: 6, maxHeight: 120 }}>
                {ahcPackage.diagnosticServices.slice(0, 5).map((service) => (
                  <View key={service._id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ marginTop: 2 }}>
                      <CheckCircleIcon width={14} height={14} color={COLORS.success} />
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.textDark, flex: 1 }} numberOfLines={1}>
                      {service.name}
                    </Text>
                  </View>
                ))}
                {ahcPackage.diagnosticServices.length > 5 && (
                  <Text style={{ fontSize: 11, color: COLORS.textGray, fontStyle: 'italic' }}>
                    +{ahcPackage.diagnosticServices.length - 5} more tests
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Warning if already booked */}
        {!canBook && lastBooking && (
          <View
            style={{
              borderRadius: 12,
              padding: 14,
              backgroundColor: '#FEF3C7',
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: COLORS.warning,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>!</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark, marginBottom: 4 }}>
                  Already Booked This Year
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 8 }}>
                  You have already booked your annual health check for this policy year.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/member/bookings?tab=ahc' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.primary }}>
                    View Your Booking →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          onPress={onBookClick}
          disabled={!canBook}
          activeOpacity={0.8}
          style={{
            backgroundColor: canBook ? COLORS.primary : '#9CA3AF',
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center',
            opacity: canBook ? 1 : 0.7,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
            {canBook ? 'Book Your Annual Health Check Today' : 'Cannot Book - Already Booked This Year'}
          </Text>
        </TouchableOpacity>

        {/* Info Note */}
        <Text style={{ fontSize: 12, color: COLORS.textGray, textAlign: 'center', lineHeight: 18 }}>
          This package can be booked <Text style={{ fontWeight: '600' }}>once per policy year</Text>.
          {canBook && ' Book now to avail your wellness benefit!'}
        </Text>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WellnessProgramsPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [ahcPackage, setAhcPackage] = useState<AHCPackage | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH DATA ON MOUNT
  // ============================================================================

  useEffect(() => {
    fetchAhcData();
  }, []);

  const fetchAhcData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch AHC package
      console.log('[Wellness] Fetching AHC package...');
      const packageResponse = await apiClient.get('/member/ahc/package');

      if (!packageResponse.data || !packageResponse.data.data) {
        setError('No AHC package assigned to your policy');
        return;
      }

      console.log('[Wellness] AHC package received:', packageResponse.data.data);
      setAhcPackage(packageResponse.data.data);

      // Fetch eligibility
      console.log('[Wellness] Fetching eligibility...');
      const eligibilityResponse = await apiClient.get('/member/ahc/eligibility');

      console.log('[Wellness] Eligibility received:', eligibilityResponse.data.data);
      setEligibility(eligibilityResponse.data.data);
    } catch (err: any) {
      console.error('[Wellness] Error fetching AHC data:', err);

      // Handle 404 - no package assigned
      if (err.response?.status === 404) {
        setError('No AHC package assigned to your policy');
        return;
      }

      // Extract error message
      let errorMessage = 'Failed to load wellness data';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (data.message && typeof data.message.message === 'string') {
          errorMessage = data.message.message;
        }
      } else if (err.message && typeof err.message === 'string') {
        errorMessage = err.message;
      }

      setError(errorMessage);

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBookClick = async () => {
    if (!ahcPackage) return;

    // Store package info in AsyncStorage for booking flow
    try {
      await AsyncStorage.setItem('ahc_package', JSON.stringify(ahcPackage));
    } catch (e) {
      console.warn('[Wellness] Failed to store package in AsyncStorage:', e);
    }

    // Determine navigation based on package contents
    console.log('[Wellness] AHC Package data:', JSON.stringify(ahcPackage, null, 2));
    console.log('[Wellness] totalLabTests:', ahcPackage.totalLabTests);
    console.log('[Wellness] totalDiagnosticTests:', ahcPackage.totalDiagnosticTests);

    const hasLabTests = ahcPackage.totalLabTests > 0;
    const hasDiagnosticTests = ahcPackage.totalDiagnosticTests > 0;

    console.log('[Wellness] hasLabTests:', hasLabTests);
    console.log('[Wellness] hasDiagnosticTests:', hasDiagnosticTests);

    if (hasLabTests) {
      // If package has lab tests, start with lab booking
      console.log('[Wellness] Navigating to lab booking page');
      router.push('/member/ahc/booking' as any);
    } else if (hasDiagnosticTests) {
      // If package has only diagnostic tests, go directly to diagnostic booking
      console.log('[Wellness] Navigating to diagnostic booking page');
      router.push('/member/ahc/booking/diagnostic' as any);
    } else {
      // Should not happen, but handle gracefully
      console.log('[Wellness] No tests found in package');
      if (Platform.OS === 'web') {
        window.alert('Package has no tests configured');
      } else {
        Alert.alert('Error', 'Package has no tests configured');
      }
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
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
                paddingVertical: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ padding: 8, borderRadius: 12 }}
                  activeOpacity={0.7}
                >
                  <ArrowLeftIcon width={20} height={20} color="#374151" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                    Wellness Services
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                    Access wellness and preventive care services
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Loading Spinner */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  // ============================================================================
  // ERROR / NO PACKAGE STATE
  // ============================================================================

  if (error || !ahcPackage) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
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
                paddingVertical: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ padding: 8, borderRadius: 12 }}
                  activeOpacity={0.7}
                >
                  <ArrowLeftIcon width={20} height={20} color="#374151" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                    Wellness Services
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                    Access wellness and preventive care services
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Error Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 32,
          }}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
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
              {/* Icon */}
              <IconCircle icon={SparklesIcon} size="lg" />

              {/* Message */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: COLORS.primary,
                  marginTop: 24,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                {error === 'No AHC package assigned to your policy'
                  ? 'No Wellness Package'
                  : 'Not Available'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textGray,
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: 24,
                }}
              >
                {error === 'No AHC package assigned to your policy'
                  ? 'Your policy does not have a wellness package assigned. Please contact your administrator for more information.'
                  : error || 'Wellness services are not available at this time. Please try again later.'}
              </Text>

              {/* Retry Button */}
              <TouchableOpacity
                onPress={fetchAhcData}
                activeOpacity={0.8}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ============================================================================
  // MAIN UI
  // ============================================================================

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
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
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8, borderRadius: 12 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  Wellness Services
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Access wellness and preventive care services
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
          <AHCPackageCard
            ahcPackage={ahcPackage}
            canBook={eligibility?.isEligible || false}
            lastBooking={
              eligibility?.existingOrderId
                ? {
                    orderId: eligibility.existingOrderId,
                    bookedAt: new Date().toISOString(),
                  }
                : undefined
            }
            onBookClick={handleBookClick}
          />
        </View>
      </ScrollView>
    </View>
  );
}
