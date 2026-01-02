export interface Unavailability {
  _id: string
  unavailabilityId: string
  doctorId: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  type: string
  reason?: string
  isAllDay: boolean
  recurrence: string
  recurrenceEndDate?: string
  affectedClinicIds: string[]
  isActive: boolean
  notifyPatients: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUnavailabilityDto {
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  type: string
  reason?: string
  isAllDay?: boolean
  recurrence?: string
  recurrenceEndDate?: string
  affectedClinicIds?: string[]
  notifyPatients?: boolean
}

export interface UpdateUnavailabilityDto {
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  type?: string
  reason?: string
  isAllDay?: boolean
  recurrence?: string
  recurrenceEndDate?: string
  affectedClinicIds?: string[]
  notifyPatients?: boolean
}

export async function createUnavailability(data: CreateUnavailabilityDto): Promise<Unavailability> {
  const response = await fetch('/doctor/api/doctor/calendar/unavailability', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create unavailability')
  }

  const result = await response.json()
  return result.data
}

export async function getUnavailabilities(includeInactive = false): Promise<Unavailability[]> {
  const url = `/doctor/api/doctor/calendar/unavailability?includeInactive=${includeInactive}`
  const response = await fetch(url, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch unavailabilities')
  }

  const result = await response.json()
  return result.data
}

export async function getUpcomingUnavailabilities(): Promise<Unavailability[]> {
  const response = await fetch('/doctor/api/doctor/calendar/unavailability/upcoming', {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch upcoming unavailabilities')
  }

  const result = await response.json()
  return result.data
}

export async function updateUnavailability(
  unavailabilityId: string,
  data: UpdateUnavailabilityDto
): Promise<Unavailability> {
  const response = await fetch(`/doctor/api/doctor/calendar/unavailability/${unavailabilityId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update unavailability')
  }

  const result = await response.json()
  return result.data
}

export async function deleteUnavailability(unavailabilityId: string): Promise<void> {
  const response = await fetch(`/doctor/api/doctor/calendar/unavailability/${unavailabilityId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete unavailability')
  }
}

export async function getUnavailableDates(
  startDate: string,
  endDate: string,
  clinicId?: string
): Promise<string[]> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  })

  if (clinicId) {
    params.append('clinicId', clinicId)
  }

  const response = await fetch(`/doctor/api/doctor/calendar/unavailable-dates?${params}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch unavailable dates')
  }

  const result = await response.json()
  return result.data
}
