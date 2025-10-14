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
            displayName: patientName,
          },
          configOverwrite: {
            startWithAudioMuted: true,
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

        apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, options)

        // Listen for conference events
        apiRef.current.addEventListener('videoConferenceJoined', () => {
          console.log('[VideoConsultation] Patient joined the conference')
          setIsLoading(false)
        })

        apiRef.current.addEventListener('participantJoined', (participant: any) => {
          console.log('[VideoConsultation] Participant joined:', participant)
          setWaitingForDoctor(false)
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
