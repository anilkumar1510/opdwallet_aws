import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

// Ignore specific warnings and errors that appear on native but don't affect functionality
LogBox.ignoreLogs([
  'Unexpected text node',
  'A text node cannot be a child of a <View>',
  'Text strings must be rendered within a <Text> component',
  'AxiosError',
  'Request failed with status code',
  'Error fetching',
  'Network Error',
  'timeout',
  '[OnlineConsultation]',
  '[InClinicConsultation]',
  '[Specialties]',
  '[Wallet]',
  '[Profile]',
  '[Auth]',
  '[API]',
]);

// Also ignore all LogBox errors in production-like experience
if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="member" />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
