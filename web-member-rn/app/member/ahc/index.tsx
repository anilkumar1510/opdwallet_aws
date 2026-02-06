import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * AHC (Annual Health Checkup) Index Page
 * Redirects to health-packages where AHC packages are displayed
 */
export default function AHCIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to health packages which contains AHC packages
    router.replace('/member/health-packages');
  }, []);

  return null;
}
