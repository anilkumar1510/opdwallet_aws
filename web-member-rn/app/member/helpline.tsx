import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

// ============================================================================
// COLORS - Matching Home Page
// ============================================================================
const COLORS = {
  primary: '#034DA2',
  orange: '#F5821E',
  textDark: '#303030',
  textGray: '#545454',
  textLight: '#6b7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
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

// Phone Icon - Blue with orange accent
function PhoneIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
        stroke={COLORS.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="18" cy="6" r="3" fill={COLORS.orange} />
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

export default function HelplinePage() {
  const router = useRouter();

  useEffect(() => {
    console.log('[Helpline] Helpline page mounted');
    return () => {
      console.log('[Helpline] Helpline page unmounted');
    };
  }, []);

  const handleEmailPress = useCallback(async () => {
    try {
      const url = 'mailto:support@opdwallet.com';
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        console.log('[Helpline] Email app opened successfully');
      } else {
        console.warn('[Helpline] Cannot open email app');
      }
    } catch (error) {
      console.error('[Helpline] Error opening email app:', error);
    }
  }, []);

  const handleBackToDashboard = useCallback(() => {
    console.log('[Helpline] Navigating back to dashboard');
    router.push('/member');
  }, [router]);

  const handleHeaderBack = useCallback(() => {
    console.log('[Helpline] Header back button pressed');
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
                  24/7 Helpline
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                  Get support anytime you need
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
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
            {/* Coming Soon Card */}
            <LinearGradient
              colors={['rgba(224, 233, 255, 0.48)', 'rgba(200, 216, 255, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 28,
                borderWidth: 2,
                borderColor: '#86ACD8',
                alignItems: 'center',
              }}
            >
              {/* Phone Icon in Circle */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: COLORS.white,
                  borderRadius: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(217, 217, 217, 0.48)',
                }}
              >
                <PhoneIcon size={40} />
              </View>

              {/* Coming Soon Message */}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: COLORS.primary,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                Coming Soon
              </Text>
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
                We're working on bringing you 24/7 helpline support. This feature will be available soon!
              </Text>

              {/* Info Box */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <EmailIcon size={18} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                    Contact Us
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.textGray,
                    lineHeight: 20,
                  }}
                >
                  In the meantime, you can reach out to us through your corporate HR or email us at{' '}
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
                  Go Back to Dashboard
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
