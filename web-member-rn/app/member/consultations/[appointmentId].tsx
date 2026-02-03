import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  UserIcon,
} from '../../../src/components/icons/InlineSVGs';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
  primary: '#034DA2',
  primaryLight: '#0E51A2',
  textDark: '#1c1c1c',
  textGray: '#6B7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  cardBorder: '#E5E7EB',
  success: '#16a34a',
  error: '#DC2626',
  iconBg: 'rgba(3, 77, 162, 0.1)',
};

// ============================================================================
// TYPES
// ============================================================================

interface ConsultationData {
  consultationId: string;
  roomName: string;
  roomUrl: string;
  doctorName: string;
  patientName: string;
  status: string;
}

// ============================================================================
// DAILY VIDEO CALL COMPONENT (Web-only using iframe)
// ============================================================================

interface DailyVideoCallProps {
  roomUrl: string;
  doctorName: string;
  patientName: string;
  consultationId: string;
  onEnd: () => void;
  onParticipantCountChange?: (count: number) => void;
}

const DailyVideoCall: React.FC<DailyVideoCallProps> = ({
  roomUrl,
  doctorName,
  patientName,
  consultationId,
  onEnd,
  onParticipantCountChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dailyRef = useRef<any>(null);
  const isLoadingRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantCount, setParticipantCount] = useState(1);

  // Keep ref in sync with state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') {
      setError('Video calls are currently only supported on web');
      setIsLoading(false);
      return;
    }

    // Dynamically import Daily.co for web
    const initDaily = async () => {
      try {
        console.log('[DailyVideoCall] Initializing Daily.co...');
        console.log('[DailyVideoCall] Room URL:', roomUrl);
        console.log('[DailyVideoCall] Patient Name:', patientName);

        // Import Daily.co dynamically
        const DailyIframe = (await import('@daily-co/daily-js')).default;
        console.log('[DailyVideoCall] Daily SDK loaded, version:', DailyIframe.version());

        if (!containerRef.current) {
          console.error('[DailyVideoCall] Container ref not available');
          setError('Failed to initialize video container');
          setIsLoading(false);
          return;
        }

        // Create the Daily frame
        const daily = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
          },
        });
        dailyRef.current = daily;

        console.log('[DailyVideoCall] Daily frame created');

        // Set up event listeners
        daily.on('joined-meeting', () => {
          console.log('[DailyVideoCall] Successfully joined meeting');
          setIsLoading(false);
        });

        daily.on('participant-joined', (event: any) => {
          console.log('[DailyVideoCall] Participant joined:', event?.participant?.user_name);
          const participants = daily.participants();
          const count = Object.keys(participants).length;
          setParticipantCount(count);
          onParticipantCountChange?.(count);
        });

        daily.on('participant-left', (event: any) => {
          console.log('[DailyVideoCall] Participant left:', event?.participant?.user_name);
          const participants = daily.participants();
          const count = Object.keys(participants).length;
          setParticipantCount(count);
          onParticipantCountChange?.(count);
        });

        daily.on('left-meeting', () => {
          console.log('[DailyVideoCall] Left meeting');
          onEnd();
        });

        daily.on('error', (event: any) => {
          console.error('[DailyVideoCall] Error:', event);
          setError('An error occurred during the video consultation');
        });

        daily.on('camera-error', (event: any) => {
          console.error('[DailyVideoCall] Camera error:', event);
        });

        // Join timeout
        const joinTimeout = setTimeout(() => {
          if (isLoadingRef.current) {
            console.error('[DailyVideoCall] Join timeout');
            setError('Connection timeout. Please check your camera and microphone permissions.');
            setIsLoading(false);
          }
        }, 15000);

        // Join the room
        console.log('[DailyVideoCall] Joining room...');
        await daily.join({
          url: roomUrl,
          userName: patientName,
        });

        clearTimeout(joinTimeout);
        console.log('[DailyVideoCall] Join successful');
        setIsLoading(false);
      } catch (err: any) {
        console.error('[DailyVideoCall] Error initializing Daily:', err);

        let errorMessage = 'Failed to join video consultation. ';
        if (err.message?.includes('permission') || err.message?.includes('Permission')) {
          errorMessage += 'Please allow camera and microphone access in your browser.';
        } else if (err.message?.includes('devices') || err.message?.includes('Device')) {
          errorMessage += 'Camera or microphone not found. Please check your devices.';
        } else if (err.message?.includes('network') || err.message?.includes('Network')) {
          errorMessage += 'Network connection error. Please check your internet connection.';
        } else {
          errorMessage += err.message || 'Unknown error occurred.';
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    };

    // Small delay to ensure container is mounted
    const timeoutId = setTimeout(initDaily, 100);

    return () => {
      clearTimeout(timeoutId);
      if (dailyRef.current) {
        console.log('[DailyVideoCall] Cleaning up - leaving room');
        dailyRef.current.leave().catch((err: any) => {
          console.error('[DailyVideoCall] Error leaving room:', err);
        });
        dailyRef.current.destroy();
        dailyRef.current = null;
      }
    };
  }, [roomUrl, patientName, onEnd, onParticipantCountChange]);

  const handleEndCall = useCallback(() => {
    console.log('[DailyVideoCall] End call clicked');
    if (dailyRef.current) {
      dailyRef.current.leave();
    }
    onEnd();
  }, [onEnd]);

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Failed to Start Video Consultation</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity onPress={onEnd} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Back to Appointments</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Web-specific rendering using native DOM
  if (Platform.OS === 'web') {
    return (
      <View style={styles.videoContainer}>
        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Connecting to video consultation...</Text>
          </View>
        )}

        {/* Waiting for doctor banner */}
        {!isLoading && participantCount === 1 && (
          <View style={styles.waitingBanner}>
            <Text style={styles.waitingText}>Waiting for doctor to join...</Text>
          </View>
        )}

        {/* End Call Button */}
        <TouchableOpacity
          onPress={handleEndCall}
          style={styles.endCallButton}
          activeOpacity={0.8}
        >
          <PhoneXMarkIcon width={24} height={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Daily.co iframe container - renders via ref */}
        <div
          ref={containerRef as any}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </View>
    );
  }

  // Native fallback (not supported yet)
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>Video Calls Not Supported</Text>
        <Text style={styles.errorMessage}>
          Video consultations are currently only available on the web version.
          Please open the app in a browser to join your video consultation.
        </Text>
        <TouchableOpacity onPress={onEnd} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Back to Appointments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VideoConsultationPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const appointmentId = params.appointmentId as string;

  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waitingForDoctor, setWaitingForDoctor] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Inject CSS animations for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'video-consultation-animations';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // ============================================================================
  // JOIN CONSULTATION
  // ============================================================================

  const initializeConsultation = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      setError('');

      console.log('[VideoConsultation] Joining consultation with appointmentId:', appointmentId);

      // Call the join API
      const response = await apiClient.post('/video-consultations/join', {
        appointmentId,
      });

      const consultationData = response.data;
      console.log('[VideoConsultation] Consultation data:', consultationData);

      setWaitingForDoctor(false);
      setConsultation(consultationData);
    } catch (err: any) {
      console.error('[VideoConsultation] Error:', err);
      console.error('[VideoConsultation] Error response:', err.response?.data);

      let errorMessage = 'Failed to join consultation';

      if (err.response?.data?.message) {
        const msg = err.response.data.message;
        errorMessage = typeof msg === 'string' ? msg : (msg.message || JSON.stringify(msg));
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Check if doctor hasn't started the consultation yet
      const isWaitingError =
        errorMessage.toLowerCase().includes('no active consultation') ||
        errorMessage.toLowerCase().includes('not found') ||
        errorMessage.toLowerCase().includes('not started') ||
        err.response?.status === 404;

      if (isWaitingError) {
        console.log('[VideoConsultation] Consultation not started yet, showing waiting screen');
        setWaitingForDoctor(true);
        setError('');
      } else {
        setError(errorMessage);
        setWaitingForDoctor(false);
      }
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) {
      initializeConsultation();
    }
  }, [appointmentId, initializeConsultation]);

  // Auto-retry when waiting for doctor (every 5 seconds)
  useEffect(() => {
    if (!waitingForDoctor) return;

    const retryInterval = setInterval(() => {
      console.log('[VideoConsultation] Retrying to join consultation...');
      setRetryCount((prev) => prev + 1);
      initializeConsultation(true);
    }, 5000);

    return () => clearInterval(retryInterval);
  }, [waitingForDoctor, initializeConsultation]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEndConsultation = useCallback(() => {
    console.log('[VideoConsultation] Ending consultation, navigating back');
    router.replace('/member/online-consultation' as any);
  }, [router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingMainText}>Joining video consultation...</Text>
      </View>
    );
  }

  // ============================================================================
  // WAITING FOR DOCTOR STATE
  // ============================================================================

  if (waitingForDoctor) {
    return (
      <View style={styles.waitingContainer}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.waitingContent}>
            {/* Animated Video Icon */}
            <View style={styles.waitingIconContainer}>
              <View style={[styles.waitingIconGradient, { backgroundColor: COLORS.primary }]}>
                <VideoCameraIcon width={48} height={48} color="#FFFFFF" />
              </View>

              {/* Pulsing ring animation */}
              <View style={styles.pulseRing} />
              <View style={[styles.pulseRing, styles.pulseRing2]} />
            </View>

            {/* Text content */}
            <Text style={styles.waitingTitle}>Waiting for Doctor</Text>
            <Text style={styles.waitingSubtitle}>
              Please wait while the doctor starts the consultation.
              You'll be connected automatically.
            </Text>

            {/* Status indicator */}
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connecting...</Text>
            </View>

            {/* Doctor icon with waiting animation */}
            <View style={styles.doctorWaitingContainer}>
              <View style={styles.doctorIconWrapper}>
                <UserIcon width={24} height={24} color="#0F5FDC" />
              </View>
              <Text style={styles.doctorWaitingText}>
                Dr. will join shortly
              </Text>
            </View>

            {/* Retry info */}
            <Text style={styles.retryText}>
              Checking every 5 seconds • Attempt {retryCount + 1}
            </Text>

            {/* Cancel button */}
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.cancelButton}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel & Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !consultation) {
    return (
      <View style={styles.errorPageContainer}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.errorPageContent}>
            <View style={styles.errorPageCard}>
              <Text style={styles.errorPageTitle}>Unable to Join Consultation</Text>
              <Text style={styles.errorPageMessage}>
                {error || 'Failed to join consultation'}
              </Text>
              <TouchableOpacity
                onPress={handleGoBack}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <ArrowLeftIcon width={16} height={16} color="#374151" />
                <Text style={styles.backButtonText}>Back to Appointments</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================================
  // VIDEO CALL STATE
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Video Consultation</Text>
              <Text style={styles.headerSubtitle}>Dr. {consultation.doctorName}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.consultationIdLabel}>Consultation ID:</Text>
              <Text style={styles.consultationIdValue}>{consultation.consultationId}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Video Container */}
      <View style={styles.videoWrapper}>
        <DailyVideoCall
          roomUrl={consultation.roomUrl}
          patientName={consultation.patientName}
          doctorName={consultation.doctorName}
          consultationId={consultation.consultationId}
          onEnd={handleEndConsultation}
        />
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#111827', // gray-900
  },

  // Header
  header: {
    backgroundColor: '#1F2937', // gray-800
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    ...(Platform.OS === 'web' ? {
      position: 'sticky' as any,
      top: 0,
    } : {}),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxWidth: 1280,
    marginHorizontal: 'auto',
    width: '100%',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1D5DB', // gray-300
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  consultationIdLabel: {
    fontSize: 12,
    color: '#9CA3AF', // gray-400
  },
  consultationIdValue: {
    fontSize: 14,
    color: '#D1D5DB', // gray-300
    fontWeight: '500',
  },

  // Video wrapper
  videoWrapper: {
    flex: 1,
    backgroundColor: '#111827', // gray-900
  },

  // Video container
  videoContainer: {
    flex: 1,
    backgroundColor: '#111827',
    position: 'relative',
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMainText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },

  // Waiting banner
  waitingBanner: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: [{ translateX: -120 }],
    backgroundColor: '#FEF3C7', // yellow-100
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  waitingText: {
    color: '#92400E', // yellow-800
    fontSize: 14,
    fontWeight: '500',
  },

  // End call button
  endCallButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#DC2626', // red-600
    padding: 12,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },

  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorCard: {
    maxWidth: 400,
    width: '100%',
    backgroundColor: '#FEF2F2', // red-50
    borderWidth: 1,
    borderColor: '#FECACA', // red-200
    borderRadius: 12,
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F1D1D', // red-900
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#B91C1C', // red-700
    marginBottom: 16,
    lineHeight: 20,
  },
  errorButton: {
    backgroundColor: '#F3F4F6', // gray-100
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    textAlign: 'center',
  },

  // Error page
  errorPageContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  errorPageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorPageCard: {
    maxWidth: 400,
    width: '100%',
    backgroundColor: '#FEF2F2', // red-50
    borderWidth: 1,
    borderColor: '#FECACA', // red-200
    borderRadius: 12,
    padding: 24,
  },
  errorPageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7F1D1D', // red-900
    marginBottom: 16,
  },
  errorPageMessage: {
    fontSize: 14,
    color: '#B91C1C', // red-700
    marginBottom: 24,
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6', // gray-100
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
  },

  // Waiting for doctor state - Light theme matching app design
  waitingContainer: {
    flex: 1,
    backgroundColor: '#f7f7fc', // Light background matching app
  },
  waitingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  waitingIconContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1F63B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(31, 99, 180, 0.3)', // Blue pulse
    ...(Platform.OS === 'web' ? {
      animation: 'pulse 2s ease-out infinite',
    } : {}),
  },
  pulseRing2: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderColor: 'rgba(31, 99, 180, 0.15)',
    ...(Platform.OS === 'web' ? {
      animationDelay: '1s',
    } : {}),
  },
  waitingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E51A2', // Primary blue
    marginBottom: 12,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 16,
    color: '#6B7280', // gray-500
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 320,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // green tint
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E', // green-500
    marginRight: 8,
    ...(Platform.OS === 'web' ? {
      animation: 'blink 1.5s ease-in-out infinite',
    } : {}),
  },
  statusText: {
    fontSize: 14,
    color: '#22C55E', // green-500
    fontWeight: '500',
  },
  doctorWaitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 95, 220, 0.1)', // Light blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorWaitingText: {
    fontSize: 15,
    color: '#374151', // gray-700
    fontWeight: '500',
  },
  retryText: {
    fontSize: 12,
    color: '#9CA3AF', // gray-400
    marginBottom: 32,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6B7280', // gray-500
    fontWeight: '500',
  },
});
