import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { FamilyProvider } from '../../src/contexts/FamilyContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomTabBar from '../../src/components/navigation/BottomTabBar';

export default function MemberRoutesLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Only show bottom nav on the main member page (dashboard)
  const showBottomNav = pathname === '/member' || pathname === '/member/index';

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1E3A8C" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <FamilyProvider>
      <View style={{ flex: 1, paddingBottom: Platform.OS !== 'web' && !showBottomNav ? insets.bottom : 0 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="policy-details/[policyId]" />
          <Stack.Screen name="helpline" />
          <Stack.Screen name="pharmacy" />
          <Stack.Screen name="bookings" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="transactions" />
          <Stack.Screen name="claims" />
          <Stack.Screen name="claims/[id]" />
          <Stack.Screen name="claims/new" />
          <Stack.Screen name="dental" />
          <Stack.Screen name="dental/clinics" />
          <Stack.Screen name="dental/select-patient" />
          <Stack.Screen name="dental/select-slot" />
          <Stack.Screen name="dental/confirm" />
          <Stack.Screen name="payments/[paymentId]" />
        </Stack>
        {showBottomNav && <BottomTabBar />}
      </View>
    </FamilyProvider>
  );
}
