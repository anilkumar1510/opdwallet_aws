import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * AHC (Annual Health Checkup) Index Page
 * Redirects to wellness-programs where AHC packages are displayed
 */
export default function AHCIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to wellness programs which contains AHC packages
    router.replace('/member/wellness-programs');
  }, []);

  return null;
}
