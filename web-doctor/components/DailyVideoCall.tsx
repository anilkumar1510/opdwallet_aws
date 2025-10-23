'use client'

import { useEffect, useCallback, useState } from 'react'
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
    console.log('=== [DOCTOR DailyVideoCall] Component Mounted ===')
    console.log('[DOCTOR DailyVideoCall] Props:', {
      roomUrl,
      doctorName,
      patientName,
      consultationId,
    })
    console.log('[DOCTOR DailyVideoCall] Window location:', window.location.href)
    console.log('[DOCTOR DailyVideoCall] Protocol:', window.location.protocol)
    console.log('[DOCTOR DailyVideoCall] Daily SDK version:', DailyIframe.version())
  }, [])

  // Join the room when component mounts
  useEffect(() => {
    if (!daily) {
      console.log('[DOCTOR DailyVideoCall] ⏳ Waiting for Daily instance...')
      return
    }

    console.log('[DOCTOR DailyVideoCall] 🚀 Starting join process...')
    console.log('[DOCTOR DailyVideoCall] Room URL:', roomUrl)
    console.log('[DOCTOR DailyVideoCall] Doctor Name:', doctorName)
    console.log('[DOCTOR DailyVideoCall] Daily instance state:', daily.meetingState())

    // Check camera/microphone permissions before joining
    console.log('[DOCTOR DailyVideoCall] 📹 Checking media devices...')
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        console.log('[DOCTOR DailyVideoCall] 📹 Available devices:', devices.map(d => ({
          kind: d.kind,
          label: d.label,
          deviceId: d.deviceId
        })))
        const hasCamera = devices.some(d => d.kind === 'videoinput')
        const hasMicrophone = devices.some(d => d.kind === 'audioinput')
        console.log('[DOCTOR DailyVideoCall] 📹 Has camera:', hasCamera)
        console.log('[DOCTOR DailyVideoCall] 🎤 Has microphone:', hasMicrophone)
      })
      .catch(err => {
        console.error('[DOCTOR DailyVideoCall] ❌ Error checking devices:', err)
      })

    // Set a timeout to prevent infinite loading
    const joinTimeout = setTimeout(() => {
      console.error('[DOCTOR DailyVideoCall] ❌ Join timeout after 15 seconds')
      console.error('[DOCTOR DailyVideoCall] Meeting state at timeout:', daily.meetingState())
      setError('Connection timeout. Please check your camera and microphone permissions and try again.')
      setIsLoading(false)
    }, 15000)

    console.log('[DOCTOR DailyVideoCall] 📞 Calling daily.join()...')
    const joinStartTime = Date.now()

    daily
      .join({
        url: roomUrl,
        userName: doctorName,
      })
      .then(() => {
        const joinDuration = Date.now() - joinStartTime
        clearTimeout(joinTimeout)
        console.log('[DOCTOR DailyVideoCall] ✅ Successfully joined room in', joinDuration, 'ms')
        console.log('[DOCTOR DailyVideoCall] Meeting state after join:', daily.meetingState())
        console.log('[DOCTOR DailyVideoCall] Participants:', daily.participants())
        console.log('[DOCTOR DailyVideoCall] Local participant:', daily.participants().local)
        setIsLoading(false)
      })
      .catch((error) => {
        const joinDuration = Date.now() - joinStartTime
        clearTimeout(joinTimeout)
        console.error('[DOCTOR DailyVideoCall] ❌ Failed to join room after', joinDuration, 'ms')
        console.error('[DOCTOR DailyVideoCall] Error object:', error)
        console.error('[DOCTOR DailyVideoCall] Error name:', error.name)
        console.error('[DOCTOR DailyVideoCall] Error message:', error.message)
        console.error('[DOCTOR DailyVideoCall] Error stack:', error.stack)
        console.error('[DOCTOR DailyVideoCall] Meeting state after error:', daily.meetingState())

        // Better error messages
        let errorMessage = 'Failed to join video consultation. '
        if (error.message?.includes('permission') || error.message?.includes('Permission')) {
          errorMessage += 'Please allow camera and microphone access in your browser.'
          console.error('[DOCTOR DailyVideoCall] 🔒 Permission error detected')
        } else if (error.message?.includes('devices') || error.message?.includes('Device')) {
          errorMessage += 'Camera or microphone not found. Please check your devices.'
          console.error('[DOCTOR DailyVideoCall] 📹 Device error detected')
        } else if (error.message?.includes('constraint') || error.message?.includes('Constraint')) {
          errorMessage += 'Camera/microphone configuration error. Please check your browser settings.'
          console.error('[DOCTOR DailyVideoCall] ⚙️ Constraint error detected')
        } else {
          errorMessage += error.message || 'Unknown error occurred.'
          console.error('[DOCTOR DailyVideoCall] ❓ Unknown error type')
        }

        setError(errorMessage)
        setIsLoading(false)
      })

    return () => {
      console.log('[DOCTOR DailyVideoCall] 🧹 Cleanup: Leaving room')
      clearTimeout(joinTimeout)
      if (daily) {
        daily.leave().catch(err => {
          console.error('[DOCTOR DailyVideoCall] Error during leave:', err)
        })
      }
    }
  }, [daily, roomUrl, doctorName])

  // Handle room events
  useDailyEvent(
    'joined-meeting',
    useCallback(() => {
      console.log('[DOCTOR DailyVideoCall] ✅ EVENT: joined-meeting')
      console.log('[DOCTOR DailyVideoCall] Meeting state:', daily?.meetingState())
    }, [daily])
  )

  useDailyEvent(
    'participant-joined',
    useCallback((event) => {
      console.log('[DOCTOR DailyVideoCall] 👤 EVENT: participant-joined')
      console.log('[DOCTOR DailyVideoCall] Participant info:', event?.participant)
      console.log('[DOCTOR DailyVideoCall] Total participants:', Object.keys(daily?.participants() || {}).length)
    }, [daily])
  )

  useDailyEvent(
    'participant-left',
    useCallback((event) => {
      console.log('[DOCTOR DailyVideoCall] 🚪 EVENT: participant-left')
      console.log('[DOCTOR DailyVideoCall] Participant info:', event?.participant)
      console.log('[DOCTOR DailyVideoCall] Remaining participants:', Object.keys(daily?.participants() || {}).length)
    }, [daily])
  )

  useDailyEvent(
    'left-meeting',
    useCallback(() => {
      console.log('[DOCTOR DailyVideoCall] 🚪 EVENT: left-meeting')
      console.log('[DOCTOR DailyVideoCall] Calling onEnd()')
      onEnd()
    }, [onEnd])
  )

  useDailyEvent(
    'error',
    useCallback((event) => {
      console.error('[DOCTOR DailyVideoCall] ❌ EVENT: error')
      console.error('[DOCTOR DailyVideoCall] Error event:', event)
      console.error('[DOCTOR DailyVideoCall] Error type:', event?.errorMsg)
      setError('An error occurred during the video consultation')
    }, [])
  )

  useDailyEvent(
    'camera-error',
    useCallback((event) => {
      console.error('[DOCTOR DailyVideoCall] 📹 EVENT: camera-error')
      console.error('[DOCTOR DailyVideoCall] Camera error:', event)
    }, [])
  )

  useDailyEvent(
    'loading',
    useCallback((event) => {
      console.log('[DOCTOR DailyVideoCall] ⏳ EVENT: loading', event)
    }, [])
  )

  useDailyEvent(
    'loaded',
    useCallback((event) => {
      console.log('[DOCTOR DailyVideoCall] ✅ EVENT: loaded', event)
    }, [])
  )

  useDailyEvent(
    'started-camera',
    useCallback((event) => {
      console.log('[DOCTOR DailyVideoCall] 📹 EVENT: started-camera', event)
    }, [])
  )

  useDailyEvent(
    'access-state-updated',
    useCallback((event) => {
      console.log('[DOCTOR DailyVideoCall] 🔐 EVENT: access-state-updated', event)
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

  useEffect(() => {
    console.log('[DOCTOR DailyVideoCall] 🏗️ Creating Daily call object')
    console.log('[DOCTOR DailyVideoCall] DailyIframe available:', typeof DailyIframe)

    try {
      const daily = DailyIframe.createFrame({
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '0',
        },
      })
      console.log('[DOCTOR DailyVideoCall] ✅ Daily call object created successfully')
      console.log('[DOCTOR DailyVideoCall] Call object type:', typeof daily)
      console.log('[DOCTOR DailyVideoCall] Initial meeting state:', daily.meetingState())
      setCallObject(daily)
    } catch (error) {
      console.error('[DOCTOR DailyVideoCall] ❌ Error creating Daily call object:', error)
    }

    return () => {
      console.log('[DOCTOR DailyVideoCall] 🗑️ Destroying Daily call object')
      if (callObject) {
        try {
          callObject.destroy()
          console.log('[DOCTOR DailyVideoCall] ✅ Call object destroyed')
        } catch (error) {
          console.error('[DOCTOR DailyVideoCall] ❌ Error destroying call object:', error)
        }
      }
    }
  }, [])

  if (!callObject) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <DailyProvider callObject={callObject}>
      <VideoCallContent {...props} />
    </DailyProvider>
  )
}
