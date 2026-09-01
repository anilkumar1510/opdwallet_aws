'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PhoneXMarkIcon } from '@heroicons/react/24/outline'
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'

export interface AgoraCallFields {
  appId: string
  channel: string
  /** Signed with the App Certificate, server-side. Without it, joining is refused. */
  token: string
  uid?: number | string
}

interface AgoraVideoCallProps {
  agora: AgoraCallFields
  doctorName: string
  patientName: string
  consultationId: string
  onEnd: () => void
}

/**
 * A fresh token for a call already running.
 *
 * Agora tokens expire — an hour by default — and a consultation that outlives
 * one is disconnected mid-sentence. The SDK warns ~30s ahead; this answers it.
 * Same endpoint the member portal renews from, under this app's basePath.
 */
async function fetchFreshToken(consultationId: string): Promise<string | null> {
  try {
    const res = await fetch(`/doctor/api/video-consultations/${consultationId}/token`, {
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.token === 'string' && data.token.trim() ? data.token : null
  } catch {
    return null
  }
}

/**
 * The doctor's side of an Agora consultation.
 *
 * This is the counterpart to the member portal's `AgoraClient`
 * (`web-angular/projects/member/src/app/core/video/agora.client.ts`) and follows
 * it deliberately: same SDK, same lifecycle, same ordering. **Both ends must
 * agree or nobody connects**, so the two are written to be read side by side
 * rather than each in its own house style.
 *
 * It does NOT replace `DailyVideoCall`. The API still provisions Daily rooms,
 * and every consultation in flight today is a Daily room. The consultation page
 * chooses: Agora when the join payload carries `agora` fields, Daily otherwise.
 * Swapping outright would have broken every call that currently works.
 *
 * The SDK is loaded with a dynamic import so it stays out of the initial bundle
 * — one screen in this app needs it.
 */
export default function AgoraVideoCall({
  agora,
  doctorName,
  patientName,
  consultationId,
  onEnd,
}: AgoraVideoCallProps) {
  const localRef = useRef<HTMLDivElement>(null)
  const remoteRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const micRef = useRef<IMicrophoneAudioTrack | null>(null)
  const camRef = useRef<ICameraVideoTrack | null>(null)

  const [joined, setJoined] = useState(false)
  const [remoteCount, setRemoteCount] = useState(0)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [error, setError] = useState('')

  /**
   * Release the devices. Called on unmount and on End — a missed `close()`
   * leaves the doctor's camera light on after the consultation has ended, which
   * in a clinical setting is worse than a bug.
   */
  const leave = useCallback(async () => {
    micRef.current?.stop()
    micRef.current?.close()
    camRef.current?.stop()
    camRef.current?.close()
    micRef.current = null
    camRef.current = null
    try {
      await clientRef.current?.leave()
    } catch {
      // Already gone; the devices above are what matter.
    }
    clientRef.current = null
    setJoined(false)
    setRemoteCount(0)
  }, [])

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      if (!agora.appId || !agora.channel || !agora.token) {
        setError('This consultation has no Agora credentials.')
        return
      }
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        if (cancelled) return

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType) => {
          await client.subscribe(user, mediaType)
          if (mediaType === 'audio') user.audioTrack?.play()
          if (mediaType === 'video' && remoteRef.current) user.videoTrack?.play(remoteRef.current)
          setRemoteCount(client.remoteUsers.length)
        })
        client.on('token-privilege-will-expire', async () => {
          const fresh = await fetchFreshToken(consultationId)
          if (fresh) await client.renewToken(fresh)
        })
        client.on('token-privilege-did-expire', async () => {
          const fresh = await fetchFreshToken(consultationId)
          if (fresh) {
            await client.renewToken(fresh)
            return
          }
          setError('The call timed out. Rejoin to continue.')
          await leave()
        })

        client.on('user-unpublished', () => setRemoteCount(client.remoteUsers.length))
        client.on('user-left', () => setRemoteCount(client.remoteUsers.length))

        await client.join(agora.appId, agora.channel, agora.token, agora.uid ?? null)
        if (cancelled) {
          await client.leave()
          return
        }

        // After joining, so a failed join never turns the camera on.
        const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks()
        micRef.current = mic
        camRef.current = cam
        if (localRef.current) cam.play(localRef.current)
        await client.publish([mic, cam])
        setJoined(true)
      } catch (err: unknown) {
        await leave()
        setError(err instanceof Error ? err.message : 'The call could not be connected.')
      }
    }

    void start()
    return () => {
      cancelled = true
      void leave()
    }
  }, [agora.appId, agora.channel, agora.token, agora.uid, consultationId, leave])

  const toggleMic = () => {
    const track = micRef.current
    if (!track) return
    const next = !micOn
    void track.setEnabled(next)
    setMicOn(next)
  }

  const toggleCam = () => {
    const track = camRef.current
    if (!track) return
    const next = !camOn
    void track.setEnabled(next)
    setCamOn(next)
  }

  const end = async () => {
    await leave()
    onEnd()
  }

  return (
    <div className="relative h-full w-full bg-gray-900">
      <div ref={remoteRef} className="h-full w-full" />

      {!joined && !error && (
        <p className="absolute inset-0 flex items-center justify-center text-white/80">
          Connecting to {patientName}&hellip;
        </p>
      )}
      {joined && remoteCount === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-white/70">
          Waiting for {patientName} to join&hellip;
        </p>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p className="max-w-md rounded-lg bg-red-900/80 px-4 py-3 text-center text-sm text-white">
            {error}
          </p>
        </div>
      )}

      <div
        ref={localRef}
        className="absolute bottom-24 right-4 h-32 w-44 overflow-hidden rounded-xl border-2 border-white/20 bg-black"
        aria-label={`${doctorName} preview`}
      />

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
        <button
          type="button"
          onClick={toggleMic}
          className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25"
        >
          {micOn ? 'Mute' : 'Unmute'}
        </button>
        <button
          type="button"
          onClick={toggleCam}
          className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25"
        >
          {camOn ? 'Camera off' : 'Camera on'}
        </button>
        <button
          type="button"
          onClick={end}
          className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <PhoneXMarkIcon className="h-5 w-5" />
          End consultation
        </button>
      </div>

      <span className="sr-only">Consultation {consultationId}</span>
    </div>
  )
}
