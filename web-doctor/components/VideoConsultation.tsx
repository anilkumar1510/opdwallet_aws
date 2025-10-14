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

  useEffect(() => {
    // Load Jitsi Meet External API script
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI)
          return
        }

        const script = document.createElement('script')
        script.src = `https://${jitsiDomain}/external_api.js`
        script.async = true
        script.onload = () => resolve(window.JitsiMeetExternalAPI)
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'))
        document.body.appendChild(script)
      })
    }

    const initializeJitsi = async () => {
      try {
        await loadJitsiScript()

        if (!jitsiContainerRef.current) {
          throw new Error('Jitsi container not found')
        }

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
            prejoinPageEnabled: false,
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

        apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, options)

        // Listen for conference events
        apiRef.current.addEventListener('videoConferenceJoined', () => {
          console.log('[VideoConsultation] Doctor joined the conference')
          setIsLoading(false)
        })

        apiRef.current.addEventListener('videoConferenceLeft', () => {
          console.log('[VideoConsultation] Conference ended')
          onEnd()
        })

        apiRef.current.addEventListener('readyToClose', () => {
          console.log('[VideoConsultation] Ready to close')
          onEnd()
        })
      } catch (err: any) {
        console.error('[VideoConsultation] Failed to initialize Jitsi:', err)
        setError(err.message || 'Failed to initialize video consultation')
        setIsLoading(false)
      }
    }

    initializeJitsi()

    // Cleanup
    return () => {
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
