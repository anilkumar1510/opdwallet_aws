import { MedicineItem, LabTestItem } from './digital-prescriptions'

export interface PrescriptionTemplate {
  _id: string
  templateId: string
  doctorId: string
  templateName: string
  description?: string
  diagnosis?: string
  medicines: MedicineItem[]
  labTests: LabTestItem[]
  generalInstructions?: string
  dietaryAdvice?: string
  precautions?: string
  isActive: boolean
  usageCount: number
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateDto {
  templateName: string
  description?: string
  diagnosis?: string
  medicines?: MedicineItem[]
  labTests?: LabTestItem[]
  generalInstructions?: string
  dietaryAdvice?: string
  precautions?: string
}

export interface UpdateTemplateDto {
  templateName?: string
  description?: string
  diagnosis?: string
  medicines?: MedicineItem[]
  labTests?: LabTestItem[]
  generalInstructions?: string
  dietaryAdvice?: string
  precautions?: string
}

export async function createTemplate(data: CreateTemplateDto): Promise<PrescriptionTemplate> {
  const response = await fetch('/doctor/api/doctor/prescription-templates', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create template')
  }

  const result = await response.json()
  return result.data
}

export async function getTemplates(): Promise<PrescriptionTemplate[]> {
  const response = await fetch('/doctor/api/doctor/prescription-templates', {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch templates')
  }

  const result = await response.json()
  return result.data
}

export async function getTemplate(templateId: string): Promise<PrescriptionTemplate> {
  const response = await fetch(`/doctor/api/doctor/prescription-templates/${templateId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch template')
  }

  const result = await response.json()
  return result.data
}

export async function updateTemplate(
  templateId: string,
  data: UpdateTemplateDto
): Promise<PrescriptionTemplate> {
  const response = await fetch(`/doctor/api/doctor/prescription-templates/${templateId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update template')
  }

  const result = await response.json()
  return result.data
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(`/doctor/api/doctor/prescription-templates/${templateId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete template')
  }
}

export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const response = await fetch(`/doctor/api/doctor/prescription-templates/${templateId}/use`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to increment template usage')
  }
}
