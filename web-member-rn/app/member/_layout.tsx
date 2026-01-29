import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { FamilyProvider } from '../../src/contexts/FamilyContext';
import { View, ActivityIndicator } from 'react-native';
import BottomTabBar from '../../src/components/navigation/BottomTabBar';

export default function MemberRoutesLayout() {
  const { isAuthenticated, isLoading } = useAuth();

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
      <View style={{ flex: 1 }}>
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
        <BottomTabBar />
      </View>
    </FamilyProvider>
  );
}
