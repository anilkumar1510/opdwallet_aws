'use client'

import { useEffect, useRef, useState } from 'react'
import { XMarkIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline'

interface VideoConsultationProps {
  roomName: string
  jitsiDomain: string
  patientName: string
  doctorName: string
  consultationId: string
  onEnd: () => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export default function VideoConsultation({
  roomName,
  jitsiDomain,
  patientName,
  doctorName,
  consultationId,
  onEnd,
}: VideoConsultationProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [waitingForDoctor, setWaitingForDoctor] = useState(true)

  // Log component mount
  useEffect(() => {
    console.log('=== [MEMBER VideoConsultation] Component Mounted ===')
    console.log('[MEMBER VideoConsultation] Props:', {
      roomName,
      jitsiDomain,
      patientName,
      doctorName,
      consultationId,
    })
  }, [])

  useEffect(() => {
    console.log('[MEMBER VideoConsultation] Starting initialization...')

    // Check browser permissions first
    const checkPermissions = async () => {
      console.log('[MEMBER VideoConsultation] Checking browser permissions...')
      try {
        const permissions = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ])
        console.log('[MEMBER VideoConsultation] Camera permission:', permissions[0].state)
        console.log('[MEMBER VideoConsultation] Microphone permission:', permissions[1].state)
      } catch (err) {
        console.log('[MEMBER VideoConsultation] Permission API not available:', err)
      }
    }
    checkPermissions()

    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      console.log('[MEMBER VideoConsultation] Loading Jitsi script from:', `https://${jitsiDomain}/external_api.js`)
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          console.log('[MEMBER VideoConsultation] Jitsi API already loaded')
          resolve(window.JitsiMeetExternalAPI)
          return
        }

        const script = document.createElement('script')
        script.src = `https://${jitsiDomain}/external_api.js`
        script.async = true
        script.onload = () => {
          console.log('[MEMBER VideoConsultation] ✅ Jitsi script loaded successfully')
          resolve(window.JitsiMeetExternalAPI)
        }
        script.onerror = (err) => {
          console.error('[MEMBER VideoConsultation] ❌ Failed to load Jitsi script:', err)
          reject(new Error('Failed to load Jitsi Meet API'))
        }
        document.body.appendChild(script)
      })
    }

    const initializeJitsi = async () => {
      try {
        console.log('[MEMBER VideoConsultation] Step 1: Loading Jitsi script...')
        await loadJitsiScript()

        console.log('[MEMBER VideoConsultation] Step 2: Checking container ref...')
        if (!jitsiContainerRef.current) {
          throw new Error('Jitsi container not found')
        }
        console.log('[MEMBER VideoConsultation] ✅ Container ref exists')

        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: patientName,
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'profile',
              'chat',
              'settings',
              'raisehand',
              'videoquality',
              'filmstrip',
              'tileview',
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: doctorName,
          },
        }

        console.log('[MEMBER VideoConsultation] Step 3: Creating Jitsi instance')
        console.log('[MEMBER VideoConsultation] - roomName:', options.roomName)
        console.log('[MEMBER VideoConsultation] - jitsiDomain:', jitsiDomain)
        console.log('[MEMBER VideoConsultation] - userInfo:', options.userInfo)
        console.log('[MEMBER VideoConsultation] - configOverwrite:', options.configOverwrite)
        console.log('[MEMBER VideoConsultation] - prejoinPageEnabled:', options.configOverwrite.prejoinPageEnabled)
        console.log('[MEMBER VideoConsultation] - startWithAudioMuted:', options.configOverwrite.startWithAudioMuted)
        console.log('[MEMBER VideoConsultation] - startWithVideoMuted:', options.configOverwrite.startWithVideoMuted)
        apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, options)
        console.log('[MEMBER VideoConsultation] ✅ Jitsi instance created')

        // Hide loading spinner immediately so prejoin page is visible
        console.log('[MEMBER VideoConsultation] 🎬 Hiding loading spinner to show prejoin page')
        setIsLoading(false)

        // Listen for ALL possible events for debugging
        const events = [
          'videoConferenceJoined',
          'videoConferenceLeft',
          'participantJoined',
          'participantLeft',
          'readyToClose',
          'audioMuteStatusChanged',
          'videoMuteStatusChanged',
          'deviceListChanged',
          'errorOccurred',
          'cameraError',
          'micError',
          'screenSharingStatusChanged',
        ]

        events.forEach(eventName => {
          apiRef.current.addEventListener(eventName, (data: any) => {
            console.log(`[MEMBER VideoConsultation] 🎯 Event: ${eventName}`, data || '')
          })
        })

        // Specific handlers
        apiRef.current.addEventListener('videoConferenceJoined', (data: any) => {
          console.log('[MEMBER VideoConsultation] ✅✅✅ PATIENT JOINED CONFERENCE ✅✅✅', data)
        })

        apiRef.current.addEventListener('participantJoined', (participant: any) => {
          console.log('[MEMBER VideoConsultation] 👤 Participant joined:', participant)
          setWaitingForDoctor(false)
        })

        apiRef.current.addEventListener('videoConferenceLeft', (data: any) => {
          console.log('[MEMBER VideoConsultation] 🚪 Conference left', data)
          onEnd()
        })

        apiRef.current.addEventListener('readyToClose', () => {
          console.log('[MEMBER VideoConsultation] 🚪 Ready to close')
          onEnd()
        })

        apiRef.current.addEventListener('errorOccurred', (error: any) => {
          console.error('[MEMBER VideoConsultation] ❌ ERROR OCCURRED:', error)
        })

        console.log('[MEMBER VideoConsultation] ✅ All event listeners attached')
      } catch (err: any) {
        console.error('[MEMBER VideoConsultation] ❌❌❌ INITIALIZATION FAILED ❌❌❌')
        console.error('[MEMBER VideoConsultation] Error:', err)
        console.error('[MEMBER VideoConsultation] Error message:', err.message)
        console.error('[MEMBER VideoConsultation] Error stack:', err.stack)
        setError(err.message || 'Failed to initialize video consultation')
        setIsLoading(false)
      }
    }

    console.log('[MEMBER VideoConsultation] Starting Jitsi initialization...')
    initializeJitsi()

    // Cleanup
    return () => {
      console.log('[MEMBER VideoConsultation] 🧹 Cleanup: Disposing Jitsi instance')
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [roomName, jitsiDomain, patientName, doctorName, onEnd])

  const handleEndCall = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup')
    }
    onEnd()
  }

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

      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="w-full h-full" />

      {/* End Call Button (Alternative) */}
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
