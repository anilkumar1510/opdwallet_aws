// Video Consultation API helpers

interface VideoConsultationResponse {
  consultationId: string
  roomName: string
  roomUrl: string
  jitsiDomain: string
  doctorName: string
  patientName: string
  status: string
}

interface ConsultationStatusResponse {
  consultationId: string
  status: string
  doctorJoined: boolean
  patientJoined: boolean
  startedAt: string
  duration: number
  roomUrl: string
}

export async function joinVideoConsultation(appointmentId: string): Promise<VideoConsultationResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch('/api/video-consultations/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appointmentId }),
      credentials: 'include',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to join consultation')
    }

    return response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection')
    }
    throw error
  }
}

export async function getConsultationStatus(consultationId: string): Promise<ConsultationStatusResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`/api/video-consultations/${consultationId}/status`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get consultation status')
    }

    return response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection')
    }
    throw error
  }
}
