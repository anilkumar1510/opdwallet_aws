'use client'

import { useEffect, useRef } from 'react'
import DailyIframe from '@daily-co/daily-js'

interface DailyVideoCallProps {
  roomUrl: string
  doctorName: string
  patientName: string
  consultationId: string
  onEnd: () => void
}

export default function DailyVideoCall({
  roomUrl,
  patientName,
  onEnd,
}: DailyVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dailyRef = useRef<DailyIframe | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Create Daily iframe with automatic join
    const daily = DailyIframe.createFrame(containerRef.current, {
      url: roomUrl,
      userName: patientName,
      showLeaveButton: true,
      showFullscreenButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
      },
    })

    dailyRef.current = daily

    // Handle left-meeting event
    daily.on('left-meeting', () => {
      onEnd()
    })

    return () => {
      daily.destroy()
    }
  }, [roomUrl, patientName, onEnd])

  return (
    <div className="relative w-full h-full bg-gray-900">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
