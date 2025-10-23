'use client'

import { useEffect, useCallback, useState } from 'react'
import { PhoneXMarkIcon } from '@heroicons/react/24/outline'
import DailyIframe from '@daily-co/daily-js'
import { DailyProvider, useDaily, useDailyEvent, useParticipantIds } from '@daily-co/daily-react'

interface DailyVideoCallProps {
  roomUrl: string
  patientName: string
  doctorName: string
  consultationId: string
  onEnd: () => void
}

function VideoCallContent({
  roomUrl,
  patientName,
  doctorName,
  consultationId,
  onEnd,
}: DailyVideoCallProps) {
  const daily = useDaily()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [waitingForDoctor, setWaitingForDoctor] = useState(true)
  const participantIds = useParticipantIds()

  // Log component mount
  useEffect(() => {
    console.log('=== [MEMBER DailyVideoCall] Component Mounted ===')
    console.log('[MEMBER DailyVideoCall] Props:', {
      roomUrl,
      patientName,
      doctorName,
      consultationId,
    })
    console.log('[MEMBER DailyVideoCall] Window location:', window.location.href)
    console.log('[MEMBER DailyVideoCall] Protocol:', window.location.protocol)
    console.log('[MEMBER DailyVideoCall] Daily SDK version:', DailyIframe.version())
  }, [])

  // Join the room when component mounts
  useEffect(() => {
    if (!daily) {
      console.log('[MEMBER DailyVideoCall] ⏳ Waiting for Daily instance...')
      return
    }

    console.log('[MEMBER DailyVideoCall] 🚀 Starting join process...')
    console.log('[MEMBER DailyVideoCall] Room URL:', roomUrl)
    console.log('[MEMBER DailyVideoCall] Patient Name:', patientName)
    console.log('[MEMBER DailyVideoCall] Daily instance state:', daily.meetingState())

    // Check camera/microphone permissions before joining
    console.log('[MEMBER DailyVideoCall] 📹 Checking media devices...')
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        console.log('[MEMBER DailyVideoCall] 📹 Available devices:', devices.map(d => ({
          kind: d.kind,
          label: d.label,
          deviceId: d.deviceId
        })))
        const hasCamera = devices.some(d => d.kind === 'videoinput')
        const hasMicrophone = devices.some(d => d.kind === 'audioinput')
        console.log('[MEMBER DailyVideoCall] 📹 Has camera:', hasCamera)
        console.log('[MEMBER DailyVideoCall] 🎤 Has microphone:', hasMicrophone)
      })
      .catch(err => {
        console.error('[MEMBER DailyVideoCall] ❌ Error checking devices:', err)
      })

    // Set a timeout to prevent infinite loading
    const joinTimeout = setTimeout(() => {
      console.error('[MEMBER DailyVideoCall] ❌ Join timeout after 15 seconds')
      console.error('[MEMBER DailyVideoCall] Meeting state at timeout:', daily.meetingState())
      setError('Connection timeout. Please check your camera and microphone permissions and try again.')
      setIsLoading(false)
    }, 15000)

    console.log('[MEMBER DailyVideoCall] 📞 Calling daily.join()...')
    const joinStartTime = Date.now()

    daily
      .join({
        url: roomUrl,
        userName: patientName,
      })
      .then(() => {
        const joinDuration = Date.now() - joinStartTime
        clearTimeout(joinTimeout)
        console.log('[MEMBER DailyVideoCall] ✅ Successfully joined room in', joinDuration, 'ms')
        console.log('[MEMBER DailyVideoCall] Meeting state after join:', daily.meetingState())
        console.log('[MEMBER DailyVideoCall] Participants:', daily.participants())
        console.log('[MEMBER DailyVideoCall] Local participant:', daily.participants().local)
        setIsLoading(false)
      })
      .catch((error) => {
        const joinDuration = Date.now() - joinStartTime
        clearTimeout(joinTimeout)
        console.error('[MEMBER DailyVideoCall] ❌ Failed to join room after', joinDuration, 'ms')
        console.error('[MEMBER DailyVideoCall] Error object:', error)
        console.error('[MEMBER DailyVideoCall] Error name:', error.name)
        console.error('[MEMBER DailyVideoCall] Error message:', error.message)
        console.error('[MEMBER DailyVideoCall] Error stack:', error.stack)
        console.error('[MEMBER DailyVideoCall] Meeting state after error:', daily.meetingState())

        // Better error messages
        let errorMessage = 'Failed to join video consultation. '
        if (error.message?.includes('permission') || error.message?.includes('Permission')) {
          errorMessage += 'Please allow camera and microphone access in your browser.'
          console.error('[MEMBER DailyVideoCall] 🔒 Permission error detected')
        } else if (error.message?.includes('devices') || error.message?.includes('Device')) {
          errorMessage += 'Camera or microphone not found. Please check your devices.'
          console.error('[MEMBER DailyVideoCall] 📹 Device error detected')
        } else if (error.message?.includes('constraint') || error.message?.includes('Constraint')) {
          errorMessage += 'Camera/microphone configuration error. Please check your browser settings.'
          console.error('[MEMBER DailyVideoCall] ⚙️ Constraint error detected')
        } else {
          errorMessage += error.message || 'Unknown error occurred.'
          console.error('[MEMBER DailyVideoCall] ❓ Unknown error type')
        }

        setError(errorMessage)
        setIsLoading(false)
      })

    return () => {
      console.log('[MEMBER DailyVideoCall] 🧹 Cleanup: Leaving room')
      clearTimeout(joinTimeout)
      if (daily) {
        daily.leave().catch(err => {
          console.error('[MEMBER DailyVideoCall] Error during leave:', err)
        })
      }
    }
  }, [daily, roomUrl, patientName])

  // Handle room events
  useDailyEvent(
    'joined-meeting',
    useCallback(() => {
      console.log('[MEMBER DailyVideoCall] ✅ EVENT: joined-meeting')
      console.log('[MEMBER DailyVideoCall] Meeting state:', daily?.meetingState())
    }, [daily])
  )

  useDailyEvent(
    'participant-joined',
    useCallback((event) => {
      console.log('[MEMBER DailyVideoCall] 👤 EVENT: participant-joined')
      console.log('[MEMBER DailyVideoCall] Participant info:', event?.participant)
      console.log('[MEMBER DailyVideoCall] Total participants:', Object.keys(daily?.participants() || {}).length)
      setWaitingForDoctor(false)
    }, [daily])
  )

  useDailyEvent(
    'participant-left',
    useCallback((event) => {
      console.log('[MEMBER DailyVideoCall] 🚪 EVENT: participant-left')
      console.log('[MEMBER DailyVideoCall] Participant info:', event?.participant)
      console.log('[MEMBER DailyVideoCall] Remaining participants:', Object.keys(daily?.participants() || {}).length)
    }, [daily])
  )

  useDailyEvent(
    'left-meeting',
    useCallback(() => {
      console.log('[MEMBER DailyVideoCall] 🚪 EVENT: left-meeting')
      console.log('[MEMBER DailyVideoCall] Calling onEnd()')
      onEnd()
    }, [onEnd])
  )

  useDailyEvent(
    'error',
    useCallback((event) => {
      console.error('[MEMBER DailyVideoCall] ❌ EVENT: error')
      console.error('[MEMBER DailyVideoCall] Error event:', event)
      console.error('[MEMBER DailyVideoCall] Error type:', event?.errorMsg)
      setError('An error occurred during the video consultation')
    }, [])
  )

  useDailyEvent(
    'camera-error',
    useCallback((event) => {
      console.error('[MEMBER DailyVideoCall] 📹 EVENT: camera-error')
      console.error('[MEMBER DailyVideoCall] Camera error:', event)
    }, [])
  )

  useDailyEvent(
    'loading',
    useCallback((event) => {
      console.log('[MEMBER DailyVideoCall] ⏳ EVENT: loading', event)
    }, [])
  )

  useDailyEvent(
    'loaded',
    useCallback((event) => {
      console.log('[MEMBER DailyVideoCall] ✅ EVENT: loaded', event)
    }, [])
  )

  useDailyEvent(
    'started-camera',
    useCallback((event) => {
      console.log('[MEMBER DailyVideoCall] 📹 EVENT: started-camera', event)
    }, [])
  )

  useDailyEvent(
    'access-state-updated',
    useCallback((event) => {
      console.log('[MEMBER DailyVideoCall] 🔐 EVENT: access-state-updated', event)
    }, [])
  )

  const handleEndCall = useCallback(() => {
    console.log('[MEMBER DailyVideoCall] Ending call')
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
            Failed to Join Video Consultation
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button onClick={onEnd} className="btn-secondary">
            Back to Appointments
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

      {waitingForDoctor && !isLoading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-20">
          Waiting for doctor to join...
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
    console.log('[MEMBER DailyVideoCall] 🏗️ Creating Daily call object')
    console.log('[MEMBER DailyVideoCall] DailyIframe available:', typeof DailyIframe)

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
      console.log('[MEMBER DailyVideoCall] ✅ Daily call object created successfully')
      console.log('[MEMBER DailyVideoCall] Call object type:', typeof daily)
      console.log('[MEMBER DailyVideoCall] Initial meeting state:', daily.meetingState())
      setCallObject(daily)
    } catch (error) {
      console.error('[MEMBER DailyVideoCall] ❌ Error creating Daily call object:', error)
    }

    return () => {
      console.log('[MEMBER DailyVideoCall] 🗑️ Destroying Daily call object')
      if (callObject) {
        try {
          callObject.destroy()
          console.log('[MEMBER DailyVideoCall] ✅ Call object destroyed')
        } catch (error) {
          console.error('[MEMBER DailyVideoCall] ❌ Error destroying call object:', error)
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
