import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// ============================================================================
// COLORS - Matching Home Page
// ============================================================================
const COLORS = {
  primary: '#034DA2',
  primaryLight: '#0E51A2',
  orange: '#F5821E',
  textDark: '#303030',
  textGray: '#545454',
  textLight: '#6b7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  cardBorder: '#E5E7EB',
  success: '#16a34a',
};

// ============================================================================
// SVG ICONS - Matching Home Page Style (Blue + Orange accents)
// ============================================================================

// Back Arrow Icon
function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={COLORS.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Pharmacy/Medicine Icon - Blue with orange accent
function PharmacyIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Pill bottle */}
      <Rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="2"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      <Path
        d="M5 8h14"
        stroke={COLORS.primary}
        strokeWidth={1.5}
      />
      {/* Plus symbol - orange */}
      <Path
        d="M12 11v6M9 14h6"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Check Circle Icon - Green
function CheckCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={COLORS.success}
        strokeWidth={1.5}
      />
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

// Email Icon - Blue with orange accent
function EmailIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6l-10 7L2 6"
        stroke={COLORS.orange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PharmacyPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('[Pharmacy] Pharmacy page mounted');
    return () => {
      console.log('[Pharmacy] Pharmacy page unmounted');
    };
  }, []);

  const features = useMemo(() => [
    'Medicine ordering and tracking',
    'Easy prescription upload',
    'Fast home delivery service',
    'Insurance coverage support',
  ], []);

  const handleEmailPress = useCallback(async () => {
    try {
      const url = 'mailto:support@opdwallet.com';
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        console.log('[Pharmacy] Email app opened successfully');
      } else {
        console.warn('[Pharmacy] Cannot open email app');
      }
    } catch (error) {
      console.error('[Pharmacy] Error opening email app:', error);
    }
  }, []);

  const handleBackToDashboard = useCallback(() => {
    console.log('[Pharmacy] Navigating back to dashboard');
    router.push('/member');
  }, [router]);

  const handleHeaderBack = useCallback(() => {
    console.log('[Pharmacy] Header back button pressed');
    router.push('/member');
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header with Back Button */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={handleHeaderBack}
                style={{
                  padding: 8,
                  borderRadius: 12,
                }}
                activeOpacity={0.7}
              >
                <BackArrowIcon />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                  Pharmacy Services
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Order medicines and manage prescriptions
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 20,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', gap: 20 }}>
            {/* Coming Soon Card */}
            <View
              style={{
                borderRadius: 16,
                padding: 28,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                backgroundColor: COLORS.white,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              {/* Pharmacy Icon in Circle */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: COLORS.white,
                  borderRadius: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(217, 217, 217, 0.48)',
                }}
              >
                <PharmacyIcon size={40} />
              </View>

              {/* Coming Soon Badge */}
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  borderRadius: 20,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 12,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  Coming Soon!
                </Text>
              </View>

              {/* Title */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: COLORS.primary,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                Pharmacy Services
              </Text>

              {/* Description */}
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textGray,
                  marginBottom: 24,
                  textAlign: 'center',
                  lineHeight: 22,
                  maxWidth: 320,
                }}
              >
                We're working hard to bring you convenient pharmacy services. Soon you'll be able to order medicines, manage prescriptions, and get doorstep delivery.
              </Text>

              {/* Features Box */}
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(217, 217, 217, 0.48)',
                  maxWidth: 320,
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: COLORS.primary,
                    marginBottom: 12,
                  }}
                >
                  What to expect:
                </Text>
                <View style={{ gap: 10 }}>
                  {features.map((feature, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <CheckCircleIcon size={18} />
                      <Text
                        style={{
                          fontSize: 13,
                          color: COLORS.textGray,
                          flex: 1,
                          lineHeight: 18,
                        }}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Back Button */}
              <TouchableOpacity
                onPress={handleBackToDashboard}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 14,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  Back to Dashboard
                </Text>
              </TouchableOpacity>
            </View>

            {/* Additional Info Box */}
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(217, 217, 217, 0.48)',
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <EmailIcon size={18} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                  Have Questions?
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.textGray,
                  lineHeight: 20,
                }}
              >
                Contact our support team at{' '}
                <Text
                  onPress={handleEmailPress}
                  style={{
                    fontWeight: '600',
                    color: COLORS.primary,
                    textDecorationLine: 'underline',
                  }}
                >
                  support@opdwallet.com
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
