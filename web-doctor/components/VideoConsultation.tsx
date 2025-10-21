'use client'

import { useEffect, useRef, useState } from 'react'
import { XMarkIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline'

interface VideoConsultationProps {
  roomName: string
  jitsiDomain: string
  doctorName: string
  patientName: string
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
  doctorName,
  patientName,
  consultationId,
  onEnd,
}: VideoConsultationProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Log component mount
  useEffect(() => {
    console.log('=== [DOCTOR VideoConsultation] Component Mounted ===')
    console.log('[DOCTOR VideoConsultation] Props:', {
      roomName,
      jitsiDomain,
      doctorName,
      patientName,
      consultationId,
    })
  }, [])

  useEffect(() => {
    console.log('[DOCTOR VideoConsultation] Starting initialization...')

    // Check browser permissions first
    const checkPermissions = async () => {
      console.log('[DOCTOR VideoConsultation] Checking browser permissions...')
      try {
        const permissions = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ])
        console.log('[DOCTOR VideoConsultation] Camera permission:', permissions[0].state)
        console.log('[DOCTOR VideoConsultation] Microphone permission:', permissions[1].state)
      } catch (err) {
        console.log('[DOCTOR VideoConsultation] Permission API not available:', err)
      }
    }
    checkPermissions()

    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      console.log('[DOCTOR VideoConsultation] Loading Jitsi script from:', `https://${jitsiDomain}/external_api.js`)
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          console.log('[DOCTOR VideoConsultation] Jitsi API already loaded')
          resolve(window.JitsiMeetExternalAPI)
          return
        }

        const script = document.createElement('script')
        script.src = `https://${jitsiDomain}/external_api.js`
        script.async = true
        script.onload = () => {
          console.log('[DOCTOR VideoConsultation] ✅ Jitsi script loaded successfully')
          resolve(window.JitsiMeetExternalAPI)
        }
        script.onerror = (err) => {
          console.error('[DOCTOR VideoConsultation] ❌ Failed to load Jitsi script:', err)
          reject(new Error('Failed to load Jitsi Meet API'))
        }
        document.body.appendChild(script)
      })
    }

    const initializeJitsi = async () => {
      try {
        console.log('[DOCTOR VideoConsultation] Step 1: Loading Jitsi script...')
        await loadJitsiScript()

        console.log('[DOCTOR VideoConsultation] Step 2: Checking container ref...')
        if (!jitsiContainerRef.current) {
          throw new Error('Jitsi container not found')
        }
        console.log('[DOCTOR VideoConsultation] ✅ Container ref exists')

        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: doctorName,
          },
          configOverwrite: {
            startWithAudioMuted: false,
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
              'recording',
              'livestreaming',
              'etherpad',
              'sharedvideo',
              'settings',
              'raisehand',
              'videoquality',
              'filmstrip',
              'feedback',
              'stats',
              'shortcuts',
              'tileview',
              'download',
              'help',
              'mute-everyone',
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: patientName,
          },
        }

        console.log('[DOCTOR VideoConsultation] Step 3: Creating Jitsi instance with config:', JSON.stringify(options, null, 2))
        apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, options)
        console.log('[DOCTOR VideoConsultation] ✅ Jitsi instance created')

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
            console.log(`[DOCTOR VideoConsultation] 🎯 Event: ${eventName}`, data || '')
          })
        })

        // Specific handlers
        apiRef.current.addEventListener('videoConferenceJoined', (data: any) => {
          console.log('[DOCTOR VideoConsultation] ✅✅✅ DOCTOR JOINED CONFERENCE ✅✅✅', data)
          setIsLoading(false)
        })

        apiRef.current.addEventListener('participantJoined', (participant: any) => {
          console.log('[DOCTOR VideoConsultation] 👤 Participant joined:', participant)
        })

        apiRef.current.addEventListener('videoConferenceLeft', (data: any) => {
          console.log('[DOCTOR VideoConsultation] 🚪 Conference left', data)
          onEnd()
        })

        apiRef.current.addEventListener('readyToClose', () => {
          console.log('[DOCTOR VideoConsultation] 🚪 Ready to close')
          onEnd()
        })

        apiRef.current.addEventListener('errorOccurred', (error: any) => {
          console.error('[DOCTOR VideoConsultation] ❌ ERROR OCCURRED:', error)
        })

        console.log('[DOCTOR VideoConsultation] ✅ All event listeners attached')
      } catch (err: any) {
        console.error('[DOCTOR VideoConsultation] ❌❌❌ INITIALIZATION FAILED ❌❌❌')
        console.error('[DOCTOR VideoConsultation] Error:', err)
        console.error('[DOCTOR VideoConsultation] Error message:', err.message)
        console.error('[DOCTOR VideoConsultation] Error stack:', err.stack)
        setError(err.message || 'Failed to initialize video consultation')
        setIsLoading(false)
      }
    }

    console.log('[DOCTOR VideoConsultation] Starting Jitsi initialization...')
    initializeJitsi()

    // Cleanup
    return () => {
      console.log('[DOCTOR VideoConsultation] 🧹 Cleanup: Disposing Jitsi instance')
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [roomName, jitsiDomain, doctorName, patientName, onEnd])

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
