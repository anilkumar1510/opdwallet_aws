import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth screen by default
  // The auth layout will check if user is authenticated and redirect accordingly
  return <Redirect href="/(auth)" />;
}
