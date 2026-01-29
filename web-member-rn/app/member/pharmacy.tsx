import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeftIcon, BeakerIcon, CheckCircleIcon } from '../../src/components/icons/InlineSVGs';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PharmacyPage() {
  const router = useRouter();

  // Log component mount
  useEffect(() => {
    console.log('[Pharmacy] Pharmacy page mounted');
    return () => {
      console.log('[Pharmacy] Pharmacy page unmounted');
    };
  }, []);

  // Memoize feature list to prevent unnecessary re-renders
  const features = useMemo(() => [
    'Medicine ordering and tracking',
    'Easy prescription upload',
    'Fast home delivery service',
    'Insurance coverage support',
  ], []);

  // Handle email link press
  const handleEmailPress = useCallback(async () => {
    try {
      const url = 'mailto:support@opdwallet.com';
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        console.log('[Pharmacy] Email app opened successfully');
      } else {
        console.warn('[Pharmacy] Cannot open email app');
        // Fallback: Could show alert to user, but for now just log
      }
    } catch (error) {
      console.error('[Pharmacy] Error opening email app:', error);
    }
  }, []);

  // Handle back to dashboard navigation
  const handleBackToDashboard = useCallback(() => {
    console.log('[Pharmacy] Navigating back to dashboard');
    router.back();
  }, [router]);

  // Handle header back button
  const handleHeaderBack = useCallback(() => {
    console.log('[Pharmacy] Header back button pressed');
    router.push('/member');
  }, [router]);

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
              paddingVertical: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                onPress={handleHeaderBack}
                style={{
                  padding: 8,
                  borderRadius: 12,
                }}
                activeOpacity={0.7}
              >
                <ArrowLeftIcon width={24} height={24} color="#0E51A2" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0E51A2', marginBottom: 2 }}>
                  Pharmacy Services
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>
                  Order medicines and manage prescriptions
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
          paddingVertical: 32,
          paddingBottom: 96,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 24 }}>
          {/* ===== COMING SOON CARD ===== */}
          <LinearGradient
            colors={['#EFF4FF', '#FEF3E9', '#FEF3E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 32,
              borderWidth: 2,
              borderColor: '#F7DCAF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              alignItems: 'center',
            }}
          >
            {/* Beaker Icon in Gradient Circle */}
            <LinearGradient
              colors={['rgba(223, 232, 255, 0.75)', 'rgba(189, 209, 255, 0.75)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                borderWidth: 1,
                borderColor: 'rgba(164, 191, 254, 0.48)',
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.05,
                shadowRadius: 46.1,
                elevation: 4,
              }}
            >
              <BeakerIcon width={40} height={40} color="#0F5FDC" />
            </LinearGradient>

            {/* Coming Soon Badge */}
            <LinearGradient
              colors={['#1F63B4', '#5DA4FB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 9999,
                marginBottom: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                Coming Soon!
              </Text>
            </LinearGradient>

            {/* Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#0E51A2',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Pharmacy Services
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 16,
                color: '#374151',
                marginBottom: 32,
                textAlign: 'center',
                lineHeight: 26,
                maxWidth: 384,
              }}
            >
              We're working hard to bring you convenient pharmacy services. Soon you'll be able to order medicines, manage prescriptions, and get doorstep delivery.
            </Text>

            {/* Features Box */}
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 12,
                padding: 24,
                marginBottom: 32,
                borderWidth: 2,
                borderColor: '#86ACD8',
                maxWidth: 384,
                width: '100%',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#0E51A2',
                  marginBottom: 16,
                }}
              >
                What to expect:
              </Text>
              <View style={{ gap: 12 }}>
                {features.map((feature, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <CheckCircleIcon width={20} height={20} color="#5FA171" />
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#111827',
                        flex: 1,
                        lineHeight: 20,
                      }}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Back Button */}
            <TouchableOpacity
              onPress={handleBackToDashboard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1F63B4', '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  Back to Dashboard
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          {/* ===== ADDITIONAL INFO BOX ===== */}
          <LinearGradient
            colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              padding: 20,
              borderWidth: 2,
              borderColor: '#86ACD8',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: '#374151',
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Have questions? Contact our support team at{' '}
              <Text
                onPress={handleEmailPress}
                style={{
                  fontWeight: '600',
                  color: '#0F5FDC',
                  textDecorationLine: 'underline',
                }}
              >
                support@opdwallet.com
              </Text>
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}
