import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

// Icons
function HomeIcon({ color = '#034da2' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </Svg>
  );
}

function ClaimsIcon({ color = '#034da2' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </Svg>
  );
}

function BookingsIcon({ color = '#034da2' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </Svg>
  );
}

function WalletNavIcon({ color = '#034da2' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </Svg>
  );
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ color?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Claims', href: '/member/claims', icon: ClaimsIcon },
  { name: 'Bookings', href: '/member/bookings', icon: BookingsIcon },
  { name: 'Wallet', href: '/member/wallet', icon: WalletNavIcon },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/index';
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    router.push(href as any);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 10) + 10 },
      ]}
      pointerEvents="box-none"
    >
      {/* Gradient fade effect */}
      <LinearGradient
        colors={['transparent', 'rgba(184, 196, 208, 0.6)']}
        style={styles.gradientFade}
        pointerEvents="none"
      />

      {/* Frosted glass pill container */}
      <View style={styles.pillWrapper}>
        <BlurView intensity={80} tint="light" style={styles.pillBlur}>
          <View style={styles.pillContent}>
            {/* Home Button - Always in blue gradient circle */}
            <TouchableOpacity
              onPress={() => handleNavigation('/')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1a6fd4', '#034da2']}
                style={styles.homeButton}
              >
                <HomeIcon color="#FFFFFF" />
                <Text style={styles.homeButtonText}>Home</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Other nav items container */}
            <View style={styles.otherItemsContainer}>
              {navItems.filter((item) => item.name !== 'Home').map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => handleNavigation(item.href)}
                    style={[
                      styles.navItem,
                      active && styles.navItemActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Icon color={active ? '#0a3f93' : '#034da2'} />
                    <Text
                      style={[
                        styles.navItemText,
                        active && styles.navItemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  gradientFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pillWrapper: {
    borderRadius: 49,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pillBlur: {
    borderRadius: 49,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    height: 63,
    gap: 4,
  },
  homeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 55,
    borderRadius: 46,
    gap: 3,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(3, 77, 162, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  otherItemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 26.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 3,
  },
  navItemActive: {
    backgroundColor: 'rgba(3, 77, 162, 0.15)',
  },
  navItemText: {
    color: '#034da2',
    fontSize: 12,
    fontWeight: '600',
  },
  navItemTextActive: {
    color: '#0a3f93',
    fontWeight: '700',
  },
});
