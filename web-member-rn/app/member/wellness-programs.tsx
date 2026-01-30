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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeftIcon,
  SparklesIcon,
  BeakerIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '../../src/components/icons/InlineSVGs';
import apiClient from '../../src/lib/api/client';

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
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'blue' | 'green' | 'white';
}

const IconCircle: React.FC<IconCircleProps> = ({ icon: Icon, size = 'md', variant = 'blue' }) => {
  const sizeMap = {
    sm: { container: 40, icon: 20 },
    md: { container: 48, icon: 24 },
    lg: { container: 64, icon: 32 },
  };

  const dimensions = sizeMap[size];

  if (variant === 'green') {
    return (
      <LinearGradient
        colors={['#90EAA9', '#5FA171']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(95, 161, 113, 0.3)',
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.05,
          shadowRadius: 46.1,
          elevation: 4,
        }}
      >
        <Icon width={dimensions.icon} height={dimensions.icon} color="#FFFFFF" />
      </LinearGradient>
    );
  }

  if (variant === 'white') {
    return (
      <View
        style={{
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <Icon width={dimensions.icon} height={dimensions.icon} color="#FFFFFF" />
      </View>
    );
  }

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
    <LinearGradient
      colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#86ACD8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Green Header */}
      <LinearGradient
        colors={['#90EAA9', '#5FA171']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          padding: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <IconCircle icon={SparklesIcon} size="lg" variant="white" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
              {ahcPackage.name}
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' }}>
              Annual Health Check Package
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={{ padding: 24, gap: 20 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Total Tests Card */}
          <LinearGradient
            colors={['rgba(144, 234, 169, 0.15)', 'rgba(95, 161, 113, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: 12,
              padding: 16,
              borderWidth: 2,
              borderColor: 'rgba(95, 161, 113, 0.3)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <BeakerIcon width={24} height={24} color="#5FA171" />
              <View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#0E51A2' }}>
                  {ahcPackage.totalTests}
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Total Tests</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Validity Card */}
          <LinearGradient
            colors={['rgba(14, 81, 162, 0.1)', 'rgba(14, 81, 162, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: 12,
              padding: 16,
              borderWidth: 2,
              borderColor: 'rgba(14, 81, 162, 0.2)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <CalendarIcon width={24} height={24} color="#0E51A2" />
              <View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280' }}>Valid Until</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0E51A2' }}>
                  {formatDate(ahcPackage.effectiveTo)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Test Categories */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Lab Tests */}
          {ahcPackage.totalLabTests > 0 && (
            <View
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 16,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
                Lab Tests ({ahcPackage.totalLabTests})
              </Text>
              <View style={{ gap: 6, maxHeight: 128 }}>
                {ahcPackage.labServices.slice(0, 5).map((service) => (
                  <View key={service._id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ marginTop: 2 }}>
                      <CheckCircleIcon width={14} height={14} color="#5FA171" />
                    </View>
                    <Text style={{ fontSize: 11, color: '#374151', flex: 1 }} numberOfLines={1}>
                      {service.name}
                    </Text>
                  </View>
                ))}
                {ahcPackage.labServices.length > 5 && (
                  <Text style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
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
                padding: 16,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0E51A2', marginBottom: 8 }}>
                Diagnostic Tests ({ahcPackage.totalDiagnosticTests})
              </Text>
              <View style={{ gap: 6, maxHeight: 128 }}>
                {ahcPackage.diagnosticServices.slice(0, 5).map((service) => (
                  <View key={service._id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <View style={{ marginTop: 2 }}>
                      <CheckCircleIcon width={14} height={14} color="#5FA171" />
                    </View>
                    <Text style={{ fontSize: 11, color: '#374151', flex: 1 }} numberOfLines={1}>
                      {service.name}
                    </Text>
                  </View>
                ))}
                {ahcPackage.diagnosticServices.length > 5 && (
                  <Text style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                    +{ahcPackage.diagnosticServices.length - 5} more tests
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Warning if already booked */}
        {!canBook && lastBooking && (
          <LinearGradient
            colors={['rgba(255, 193, 7, 0.1)', 'rgba(255, 152, 0, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              padding: 16,
              borderWidth: 2,
              borderColor: 'rgba(255, 193, 7, 0.3)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#EAB308',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>!</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 4 }}>
                  Already Booked This Year
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                  You have already booked your annual health check for this policy year.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/member/bookings?tab=ahc' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#0E51A2' }}>
                    View Your Booking →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Book Button */}
        <TouchableOpacity
          onPress={onBookClick}
          disabled={!canBook}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canBook ? ['#90EAA9', '#5FA171'] : ['#9CA3AF', '#9CA3AF']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: 'center',
              opacity: canBook ? 1 : 0.7,
              shadowColor: canBook ? '#000' : 'transparent',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: canBook ? 0.05 : 0,
              shadowRadius: 46.1,
              elevation: canBook ? 4 : 0,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
              {canBook ? 'Book Your Annual Health Check Today' : 'Cannot Book - Already Booked This Year'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Note */}
        <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 }}>
          This package can be booked <Text style={{ fontWeight: '600' }}>once per policy year</Text>.
          {canBook && ' Book now to avail your wellness benefit!'}
        </Text>
      </View>
    </LinearGradient>
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
      <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
        {/* Header */}
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
                  onPress={() => router.back()}
                  style={{ padding: 8, borderRadius: 8 }}
                  activeOpacity={0.7}
                >
                  <ArrowLeftIcon width={20} height={20} color="#374151" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                    Wellness Services
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    Access wellness and preventive care services
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Loading Spinner */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <ActivityIndicator size="large" color="#5FA171" />
        </View>
      </View>
    );
  }

  // ============================================================================
  // ERROR / NO PACKAGE STATE
  // ============================================================================

  if (error || !ahcPackage) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
        {/* Header */}
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
                  onPress={() => router.back()}
                  style={{ padding: 8, borderRadius: 8 }}
                  activeOpacity={0.7}
                >
                  <ArrowLeftIcon width={20} height={20} color="#374151" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                    Wellness Services
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
            <LinearGradient
              colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 32,
                borderWidth: 2,
                borderColor: '#86ACD8',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* Icon */}
              <IconCircle icon={SparklesIcon} size="lg" variant="green" />

              {/* Message */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: '#0E51A2',
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
                  color: '#374151',
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
              <TouchableOpacity onPress={fetchAhcData} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#90EAA9', '#5FA171']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: -2, height: 11 },
                    shadowOpacity: 0.05,
                    shadowRadius: 46.1,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Retry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ============================================================================
  // MAIN UI
  // ============================================================================

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
      {/* Header */}
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
                onPress={() => router.back()}
                style={{ padding: 8, borderRadius: 8 }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={20} height={20} color="#374151" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2' }}>
                  Wellness Services
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
          paddingVertical: 32,
          paddingBottom: 100,
        }}
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
