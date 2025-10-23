'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { PhoneXMarkIcon } from '@heroicons/react/24/outline'
import DailyIframe from '@daily-co/daily-js'
import { DailyProvider, useDaily, useDailyEvent, useParticipantIds } from '@daily-co/daily-react'

interface DailyVideoCallProps {
  roomUrl: string
  doctorName: string
  patientName: string
  consultationId: string
  onEnd: () => void
}

function VideoCallContent({
  roomUrl,
  doctorName,
  patientName,
  consultationId,
  onEnd,
}: DailyVideoCallProps) {
  const daily = useDaily()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const participantIds = useParticipantIds()

  // Log component mount
  useEffect(() => {
    console.log('\n========================================')
    console.log('=== [DEBUG] 🎭 DOCTOR DAILYVIDEOCALL COMPONENT MOUNTED ===')
    console.log('[DEBUG] Timestamp:', new Date().toISOString())
    console.log('[DEBUG] Props:', JSON.stringify({
      roomUrl,
      doctorName,
      patientName,
      consultationId,
    }, null, 2))

    // Browser environment
    console.log('\n[DEBUG] 🌐 BROWSER ENVIRONMENT:')
    console.log('[DEBUG] - User Agent:', navigator.userAgent)
    console.log('[DEBUG] - Platform:', navigator.platform)
    console.log('[DEBUG] - Language:', navigator.language)
    console.log('[DEBUG] - Online:', navigator.onLine)
    console.log('[DEBUG] - Cookie Enabled:', navigator.cookieEnabled)

    // Network info (if available)
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      console.log('[DEBUG] - Connection Type:', conn?.effectiveType)
      console.log('[DEBUG] - Downlink:', conn?.downlink)
      console.log('[DEBUG] - RTT:', conn?.rtt)
    }

    // Location info
    console.log('\n[DEBUG] 📍 WINDOW LOCATION:')
    console.log('[DEBUG] - Full URL:', window.location.href)
    console.log('[DEBUG] - Protocol:', window.location.protocol)
    console.log('[DEBUG] - Hostname:', window.location.hostname)
    console.log('[DEBUG] - Port:', window.location.port)
    console.log('[DEBUG] - Pathname:', window.location.pathname)

    // WebSocket support
    console.log('\n[DEBUG] 🔌 WEBSOCKET SUPPORT:')
    console.log('[DEBUG] - WebSocket available:', typeof WebSocket !== 'undefined')
    if (typeof WebSocket !== 'undefined') {
      console.log('[DEBUG] - WebSocket constructor:', WebSocket.toString())
    }

    // Daily.co SDK info
    console.log('\n[DEBUG] 📦 DAILY.CO SDK:')
    console.log('[DEBUG] - Version:', DailyIframe.version())
    console.log('[DEBUG] - DailyIframe available:', typeof DailyIframe)
    console.log('[DEBUG] - DailyIframe.createFrame:', typeof DailyIframe.createFrame)

    // Room URL analysis
    console.log('\n[DEBUG] 🏠 ROOM URL ANALYSIS:')
    try {
      const url = new URL(roomUrl)
      console.log('[DEBUG] - Protocol:', url.protocol)
      console.log('[DEBUG] - Hostname:', url.hostname)
      console.log('[DEBUG] - Pathname:', url.pathname)
      console.log('[DEBUG] - Full URL:', roomUrl)
    } catch (e) {
      console.error('[DEBUG] - ERROR parsing room URL:', e)
    }

    console.log('========================================\n')
  }, [])

  // Join the room when component mounts
  useEffect(() => {
    if (!daily) {
      console.log('[DEBUG] ⏳ Waiting for Daily instance...')
      return
    }

    console.log('\n========================================')
    console.log('[DEBUG] 🚀 STARTING JOIN PROCESS')
    console.log('[DEBUG] Timestamp:', new Date().toISOString())
    console.log('[DEBUG] Room URL:', roomUrl)
    console.log('[DEBUG] Doctor Name:', doctorName)
    console.log('[DEBUG] Daily instance type:', typeof daily)
    console.log('[DEBUG] Daily instance state:', daily.meetingState())

    // Get network information from Daily
    console.log('\n[DEBUG] 📊 DAILY.CO NETWORK INFO:')
    try {
      const networkTopology = daily.getNetworkTopology()
      console.log('[DEBUG] - Network Topology:', JSON.stringify(networkTopology, null, 2))
    } catch (e) {
      console.log('[DEBUG] - Network Topology: Not available yet')
    }

    // Check camera/microphone permissions before joining
    console.log('\n[DEBUG] 📹 CHECKING MEDIA DEVICES...')
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        console.log('[DEBUG] Total devices found:', devices.length)
        console.log('[DEBUG] Device details:', JSON.stringify(devices.map(d => ({
          kind: d.kind,
          label: d.label,
          deviceId: d.deviceId,
          groupId: d.groupId
        })), null, 2))

        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        const audioDevices = devices.filter(d => d.kind === 'audioinput')

        console.log('[DEBUG] Video devices:', videoDevices.length)
        console.log('[DEBUG] Audio devices:', audioDevices.length)
        console.log('[DEBUG] Has camera:', videoDevices.length > 0)
        console.log('[DEBUG] Has microphone:', audioDevices.length > 0)

        // Check media permissions
        if (navigator.permissions) {
          navigator.permissions.query({ name: 'camera' as PermissionName }).then(result => {
            console.log('[DEBUG] Camera permission:', result.state)
          }).catch(e => console.log('[DEBUG] Camera permission check not available'))

          navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
            console.log('[DEBUG] Microphone permission:', result.state)
          }).catch(e => console.log('[DEBUG] Microphone permission check not available'))
        }
      })
      .catch(err => {
        console.error('[DEBUG] ❌ Error checking devices:')
        console.error('[DEBUG] Error type:', err.constructor.name)
        console.error('[DEBUG] Error message:', err.message)
        console.error('[DEBUG] Error stack:', err.stack)
      })

    // Set a timeout to prevent infinite loading
    const joinTimeout = setTimeout(() => {
      clearInterval(stateCheckInterval) // FIX: Stop the infinite logging

      console.error('\n========================================')
      console.error('[DEBUG] ❌ JOIN TIMEOUT AFTER 15 SECONDS')
      console.error('[DEBUG] Timestamp:', new Date().toISOString())
      console.error('[DEBUG] Meeting state:', daily.meetingState())

      try {
        const participants = daily.participants()
        console.error('[DEBUG] Participants at timeout:', JSON.stringify(participants, null, 2))
      } catch (e) {
        console.error('[DEBUG] Could not get participants:', e)
      }

      try {
        const networkStats = daily.getNetworkStats()
        console.error('[DEBUG] Network stats:', JSON.stringify(networkStats, null, 2))
      } catch (e) {
        console.error('[DEBUG] Could not get network stats:', e)
      }

      console.error('========================================\n')

      // Check if this is a cross-origin/domain configuration issue
      if (daily.meetingState() === 'joining-meeting') {
        console.error('[DEBUG] 🚨 LIKELY CAUSE: Daily.co domain not configured')
        console.error('[DEBUG] 💡 SOLUTION: Add your domain to Daily.co dashboard allowed domains')
        setError('Unable to connect to video service. Domain configuration required. Please contact support.')
      } else {
        setError('Connection timeout. Please check your camera and microphone permissions and try again.')
      }

      setIsLoading(false)
    }, 15000)

    console.log('\n[DEBUG] 📞 CALLING daily.join()...')
    console.log('[DEBUG] Join config:', JSON.stringify({
      url: roomUrl,
      userName: doctorName,
    }, null, 2))

    const joinStartTime = Date.now()
    let stateCheckInterval: NodeJS.Timeout

    // Monitor state changes during join
    stateCheckInterval = setInterval(() => {
      const elapsed = Date.now() - joinStartTime
      console.log(`[DEBUG] ⏱️ Join in progress (${elapsed}ms) - State:`, daily.meetingState())
    }, 1000)

    daily
      .join({
        url: roomUrl,
        userName: doctorName,
      })
      .then(() => {
        const joinDuration = Date.now() - joinStartTime
        clearTimeout(joinTimeout)
        clearInterval(stateCheckInterval)

        console.log('\n========================================')
        console.log('[DEBUG] ✅ SUCCESSFULLY JOINED ROOM')
        console.log('[DEBUG] Duration:', joinDuration, 'ms')
        console.log('[DEBUG] Timestamp:', new Date().toISOString())
        console.log('[DEBUG] Meeting state:', daily.meetingState())

        try {
          const participants = daily.participants()
          console.log('[DEBUG] Participants:', JSON.stringify(participants, null, 2))
          console.log('[DEBUG] Local participant:', JSON.stringify(participants.local, null, 2))
          console.log('[DEBUG] Participant count:', Object.keys(participants).length)
        } catch (e) {
          console.error('[DEBUG] Error getting participants:', e)
        }

        try {
          const networkTopology = daily.getNetworkTopology()
          console.log('[DEBUG] Network topology:', JSON.stringify(networkTopology, null, 2))
        } catch (e) {
          console.log('[DEBUG] Network topology not available:', e)
        }

        console.log('========================================\n')
        setIsLoading(false)
      })
      .catch((error) => {
        const joinDuration = Date.now() - joinStartTime
        clearTimeout(joinTimeout)
        clearInterval(stateCheckInterval)

        console.error('\n========================================')
        console.error('[DEBUG] ❌ FAILED TO JOIN ROOM')
        console.error('[DEBUG] Duration:', joinDuration, 'ms')
        console.error('[DEBUG] Timestamp:', new Date().toISOString())
        console.error('[DEBUG] Error type:', error.constructor.name)
        console.error('[DEBUG] Error name:', error.name)
        console.error('[DEBUG] Error message:', error.message)
        console.error('[DEBUG] Error code:', error.code)
        console.error('[DEBUG] Error details:', JSON.stringify(error, null, 2))
        console.error('[DEBUG] Error stack:', error.stack)
        console.error('[DEBUG] Meeting state after error:', daily.meetingState())

        try {
          const participants = daily.participants()
          console.error('[DEBUG] Participants after error:', JSON.stringify(participants, null, 2))
        } catch (e) {
          console.error('[DEBUG] Could not get participants after error:', e)
        }

        // Better error messages
        let errorMessage = 'Failed to join video consultation. '
        if (error.message?.includes('permission') || error.message?.includes('Permission')) {
          errorMessage += 'Please allow camera and microphone access in your browser.'
          console.error('[DEBUG] 🔒 PERMISSION ERROR DETECTED')
        } else if (error.message?.includes('devices') || error.message?.includes('Device')) {
          errorMessage += 'Camera or microphone not found. Please check your devices.'
          console.error('[DEBUG] 📹 DEVICE ERROR DETECTED')
        } else if (error.message?.includes('constraint') || error.message?.includes('Constraint')) {
          errorMessage += 'Camera/microphone configuration error. Please check your browser settings.'
          console.error('[DEBUG] ⚙️ CONSTRAINT ERROR DETECTED')
        } else if (error.message?.includes('network') || error.message?.includes('Network') || error.message?.includes('WebSocket')) {
          errorMessage += 'Network connection error. Please check your internet connection.'
          console.error('[DEBUG] 🌐 NETWORK ERROR DETECTED')
        } else {
          errorMessage += error.message || 'Unknown error occurred.'
          console.error('[DEBUG] ❓ UNKNOWN ERROR TYPE')
        }

        console.error('========================================\n')
        setError(errorMessage)
        setIsLoading(false)
      })

    return () => {
      console.log('\n[DEBUG] 🧹 CLEANUP: Leaving room')
      clearTimeout(joinTimeout)
      clearInterval(stateCheckInterval)
      if (daily) {
        daily.leave().catch(err => {
          console.error('[DEBUG] Error during leave:', err)
        })
      }
    }
  }, [daily, roomUrl, doctorName])

  // Handle room events - COMPREHENSIVE DEBUGGING
  useDailyEvent(
    'joined-meeting',
    useCallback(() => {
      console.log('\n========================================')
      console.log('[DEBUG] ✅ EVENT: joined-meeting')
      console.log('[DEBUG] Timestamp:', new Date().toISOString())
      console.log('[DEBUG] Meeting state:', daily?.meetingState())
      console.log('[DEBUG] Participants:', JSON.stringify(daily?.participants(), null, 2))
      console.log('========================================\n')
    }, [daily])
  )

  useDailyEvent(
    'participant-joined',
    useCallback((event) => {
      console.log('\n[DEBUG] 👤 EVENT: participant-joined')
      console.log('[DEBUG] Timestamp:', new Date().toISOString())
      console.log('[DEBUG] Participant:', JSON.stringify(event?.participant, null, 2))
      console.log('[DEBUG] Total participants:', Object.keys(daily?.participants() || {}).length)
      console.log('[DEBUG] All participants:', JSON.stringify(daily?.participants(), null, 2))
    }, [daily])
  )

  useDailyEvent(
    'participant-left',
    useCallback((event) => {
      console.log('\n[DEBUG] 🚪 EVENT: participant-left')
      console.log('[DEBUG] Timestamp:', new Date().toISOString())
      console.log('[DEBUG] Participant:', JSON.stringify(event?.participant, null, 2))
      console.log('[DEBUG] Remaining participants:', Object.keys(daily?.participants() || {}).length)
    }, [daily])
  )

  useDailyEvent(
    'left-meeting',
    useCallback(() => {
      console.log('\n[DEBUG] 🚪 EVENT: left-meeting')
      console.log('[DEBUG] Timestamp:', new Date().toISOString())
      console.log('[DEBUG] Calling onEnd()')
      onEnd()
    }, [onEnd])
  )

  useDailyEvent(
    'error',
    useCallback((event) => {
      console.error('\n========================================')
      console.error('[DEBUG] ❌ EVENT: error')
      console.error('[DEBUG] Timestamp:', new Date().toISOString())
      console.error('[DEBUG] Error event:', JSON.stringify(event, null, 2))
      console.error('[DEBUG] Error message:', event?.errorMsg)
      console.error('[DEBUG] Error details:', event?.error)
      console.error('========================================\n')
      setError('An error occurred during the video consultation')
    }, [])
  )

  useDailyEvent(
    'camera-error',
    useCallback((event) => {
      console.error('\n[DEBUG] 📹 EVENT: camera-error')
      console.error('[DEBUG] Timestamp:', new Date().toISOString())
      console.error('[DEBUG] Error:', JSON.stringify(event, null, 2))
    }, [])
  )

  useDailyEvent(
    'loading',
    useCallback((event) => {
      console.log('[DEBUG] ⏳ EVENT: loading', JSON.stringify(event, null, 2))
    }, [])
  )

  useDailyEvent(
    'loaded',
    useCallback((event) => {
      console.log('[DEBUG] ✅ EVENT: loaded', JSON.stringify(event, null, 2))
    }, [])
  )

  useDailyEvent(
    'started-camera',
    useCallback((event) => {
      console.log('[DEBUG] 📹 EVENT: started-camera', JSON.stringify(event, null, 2))
    }, [])
  )

  useDailyEvent(
    'access-state-updated',
    useCallback((event) => {
      console.log('[DEBUG] 🔐 EVENT: access-state-updated', JSON.stringify(event, null, 2))
    }, [])
  )

  // Additional important events for debugging
  useDailyEvent(
    'network-quality-change',
    useCallback((event) => {
      console.log('[DEBUG] 📶 EVENT: network-quality-change', JSON.stringify(event, null, 2))
    }, [])
  )

  useDailyEvent(
    'network-connection',
    useCallback((event) => {
      console.log('[DEBUG] 🌐 EVENT: network-connection', JSON.stringify(event, null, 2))
    }, [])
  )

  useDailyEvent(
    'track-started',
    useCallback((event) => {
      console.log('[DEBUG] 🎬 EVENT: track-started', JSON.stringify(event, null, 2))
    }, [])
  )

  useDailyEvent(
    'track-stopped',
    useCallback((event) => {
      console.log('[DEBUG] ⏹️ EVENT: track-stopped', JSON.stringify(event, null, 2))
    }, [])
  )

  const handleEndCall = useCallback(() => {
    console.log('[DOCTOR DailyVideoCall] Ending call')
    if (daily) {
      daily.leave()
    }
    onEnd()
  }, [daily, onEnd])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="card max-w-md w-full bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Failed to Start Video Consultation
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button onClick={onEnd} className="btn-secondary">
            Back to Appointment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Connecting to video consultation...</p>
          </div>
        </div>
      )}

      {participantIds.length === 1 && !isLoading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-20">
          Waiting for patient to join...
        </div>
      )}

      {/* End Call Button */}
      <button
        onClick={handleEndCall}
        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg z-20 transition-colors"
        title="End Consultation"
      >
        <PhoneXMarkIcon className="h-6 w-6" />
      </button>
    </div>
  )
}

export default function DailyVideoCall(props: DailyVideoCallProps) {
  const [callObject, setCallObject] = useState<DailyIframe | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('\n========================================')
    console.log('[DEBUG] 🏗️ CREATING DAILY CALL OBJECT')
    console.log('[DEBUG] Timestamp:', new Date().toISOString())
    console.log('[DEBUG] DailyIframe available:', typeof DailyIframe)
    console.log('[DEBUG] DailyIframe.createFrame available:', typeof DailyIframe.createFrame)
    console.log('[DEBUG] Container ref:', containerRef.current ? 'Available' : 'Not available')

    // Wait for container to be ready
    if (!containerRef.current) {
      console.error('[DEBUG] ❌ Container ref not available yet')
      return
    }

    try {
      const frameConfig = {
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '0',
        },
      }
      console.log('[DEBUG] Frame config:', JSON.stringify(frameConfig, null, 2))

      // FIX: Pass container element to createFrame()
      const daily = DailyIframe.createFrame(containerRef.current, frameConfig)
      console.log('[DEBUG] ✅ createFrame() called with container element')

      console.log('[DEBUG] ✅ Daily call object created successfully')
      console.log('[DEBUG] Call object type:', typeof daily)
      console.log('[DEBUG] Call object methods:', Object.keys(daily))
      console.log('[DEBUG] Initial meeting state:', daily.meetingState())

      // Log all available daily methods for debugging
      console.log('[DEBUG] Available Daily methods:', {
        join: typeof daily.join,
        leave: typeof daily.leave,
        meetingState: typeof daily.meetingState,
        participants: typeof daily.participants,
        getNetworkTopology: typeof daily.getNetworkTopology,
        getNetworkStats: typeof daily.getNetworkStats,
      })

      console.log('========================================\n')
      setCallObject(daily)
    } catch (error) {
      console.error('\n========================================')
      console.error('[DEBUG] ❌ ERROR CREATING DAILY CALL OBJECT')
      console.error('[DEBUG] Error type:', error?.constructor?.name)
      console.error('[DEBUG] Error message:', (error as Error)?.message)
      console.error('[DEBUG] Error stack:', (error as Error)?.stack)
      console.error('========================================\n')
    }

    return () => {
      console.log('\n[DEBUG] 🗑️ DESTROYING DAILY CALL OBJECT')
      if (callObject) {
        try {
          callObject.destroy()
          console.log('[DEBUG] ✅ Call object destroyed')
        } catch (error) {
          console.error('[DEBUG] ❌ Error destroying call object:', error)
        }
      }
    }
  }, [])

  return (
    <>
      {/* Container for Daily.co iframe - REQUIRED for proper postMessage communication */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {!callObject ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900" style={{ zIndex: 2 }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <DailyProvider callObject={callObject}>
            <VideoCallContent {...props} />
          </DailyProvider>
        </div>
      )}
    </>
  )
}
