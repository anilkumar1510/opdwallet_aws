'use client'

import { useState, useEffect } from 'react'
import {
  ConsultationNote,
  CreateConsultationNoteDto,
  UpdateConsultationNoteDto,
  ClinicalFindings,
  createConsultationNote,
  updateConsultationNote,
  getConsultationNoteByAppointment,
} from '@/lib/api/consultation-notes'
import { DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface ConsultationNoteEditorProps {
  appointmentId: string
  patientId: string
  clinicId: string
  consultationDate: Date
  onNoteSaved?: (note: ConsultationNote) => void
}

export default function ConsultationNoteEditor({
  appointmentId,
  patientId,
  clinicId,
  consultationDate,
  onNoteSaved,
}: ConsultationNoteEditorProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingNote, setExistingNote] = useState<ConsultationNote | null>(null)

  // Form fields
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('')
  const [clinicalFindings, setClinicalFindings] = useState<ClinicalFindings>({})
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('')
  const [investigationsOrdered, setInvestigationsOrdered] = useState<string[]>([])
  const [investigationInput, setInvestigationInput] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [followUpInstructions, setFollowUpInstructions] = useState('')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')

  useEffect(() => {
    loadExistingNote()
  }, [appointmentId])

  const loadExistingNote = async () => {
    try {
      setLoading(true)
      const note = await getConsultationNoteByAppointment(appointmentId)
      if (note) {
        setExistingNote(note)
        populateForm(note)
      }
    } catch (err: any) {
      console.error('Error loading note:', err)
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (note: ConsultationNote) => {
    setChiefComplaint(note.chiefComplaint || '')
    setHistoryOfPresentIllness(note.historyOfPresentIllness || '')
    setClinicalFindings(note.clinicalFindings || {})
    setProvisionalDiagnosis(note.provisionalDiagnosis || '')
    setInvestigationsOrdered(note.investigationsOrdered || [])
    setTreatmentPlan(note.treatmentPlan || '')
    setFollowUpInstructions(note.followUpInstructions || '')
    setNextFollowUpDate(note.nextFollowUpDate ? note.nextFollowUpDate.split('T')[0] : '')
    setAdditionalNotes(note.additionalNotes || '')
    setPrivateNotes(note.privateNotes || '')
  }

  const addInvestigation = () => {
    if (investigationInput.trim()) {
      setInvestigationsOrdered([...investigationsOrdered, investigationInput.trim()])
      setInvestigationInput('')
    }
  }

  const removeInvestigation = (index: number) => {
    setInvestigationsOrdered(investigationsOrdered.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const noteData = {
        chiefComplaint: chiefComplaint.trim() || undefined,
        historyOfPresentIllness: historyOfPresentIllness.trim() || undefined,
        clinicalFindings: Object.keys(clinicalFindings).length > 0 ? clinicalFindings : undefined,
        provisionalDiagnosis: provisionalDiagnosis.trim() || undefined,
        investigationsOrdered: investigationsOrdered.length > 0 ? investigationsOrdered : undefined,
        treatmentPlan: treatmentPlan.trim() || undefined,
        followUpInstructions: followUpInstructions.trim() || undefined,
        nextFollowUpDate: nextFollowUpDate || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        privateNotes: privateNotes.trim() || undefined,
      }

      let savedNote: ConsultationNote

      if (existingNote) {
        // Update existing note
        savedNote = await updateConsultationNote(existingNote.noteId, noteData as UpdateConsultationNoteDto)
        setSuccess('Consultation note updated successfully')
      } else {
        // Create new note
        const createData: CreateConsultationNoteDto = {
          appointmentId,
          patientId,
          clinicId,
          consultationDate: consultationDate.toISOString(),
          ...noteData,
        }
        savedNote = await createConsultationNote(createData)
        setExistingNote(savedNote)
        setSuccess('Consultation note created successfully')
      }

      if (onNoteSaved) {
        onNoteSaved(savedNote)
      }

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('❌ [ConsultationNoteEditor] Save failed:', err)
      console.error('❌ [ConsultationNoteEditor] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        fullError: err,
      })
      setError(err.message || 'Failed to save consultation note')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="text-sm text-gray-500">Loading consultation note...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <DocumentTextIcon className="h-6 w-6 text-[#2B4D8C]" />
        <h3 className="text-lg font-semibold text-gray-900">Consultation Notes</h3>
        {existingNote && (
          <span className="text-xs text-green-600 flex items-center space-x-1">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Chief Complaint */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chief Complaint
          </label>
          <textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            className="input w-full"
            rows={2}
            placeholder="Main reason for visit..."
          />
        </div>

        {/* History of Present Illness */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            History of Present Illness
          </label>
          <textarea
            value={historyOfPresentIllness}
            onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
            className="input w-full"
            rows={3}
            placeholder="Detailed history of current illness..."
          />
        </div>

        {/* Clinical Findings */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Clinical Findings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                General Examination
              </label>
              <textarea
                value={clinicalFindings.generalExamination || ''}
                onChange={(e) => setClinicalFindings({ ...clinicalFindings, generalExamination: e.target.value })}
                className="input w-full text-sm"
                rows={2}
                placeholder="General physical examination findings..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Systemic Examination
              </label>
              <textarea
                value={clinicalFindings.systemicExamination || ''}
                onChange={(e) => setClinicalFindings({ ...clinicalFindings, systemicExamination: e.target.value })}
                className="input w-full text-sm"
                rows={2}
                placeholder="System-specific examination findings..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Local Examination
              </label>
              <textarea
                value={clinicalFindings.localExamination || ''}
                onChange={(e) => setClinicalFindings({ ...clinicalFindings, localExamination: e.target.value })}
                className="input w-full text-sm"
                rows={2}
                placeholder="Local examination findings..."
              />
            </div>
          </div>
        </div>

        {/* Provisional Diagnosis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provisional Diagnosis
          </label>
          <textarea
            value={provisionalDiagnosis}
            onChange={(e) => setProvisionalDiagnosis(e.target.value)}
            className="input w-full"
            rows={2}
            placeholder="Working diagnosis..."
          />
        </div>

        {/* Investigations Ordered */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Investigations Ordered
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={investigationInput}
              onChange={(e) => setInvestigationInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInvestigation())}
              className="input flex-1"
              placeholder="Type investigation and press Enter..."
            />
            <button
              type="button"
              onClick={addInvestigation}
              className="btn btn-secondary"
            >
              Add
            </button>
          </div>
          {investigationsOrdered.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {investigationsOrdered.map((inv, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{inv}</span>
                  <button
                    type="button"
                    onClick={() => removeInvestigation(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Treatment Plan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Treatment Plan
          </label>
          <textarea
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
            className="input w-full"
            rows={3}
            placeholder="Proposed treatment plan..."
          />
        </div>

        {/* Follow-up Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Instructions
          </label>
          <textarea
            value={followUpInstructions}
            onChange={(e) => setFollowUpInstructions(e.target.value)}
            className="input w-full"
            rows={2}
            placeholder="Instructions for follow-up..."
          />
        </div>

        {/* Next Follow-up Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Next Follow-up Date
          </label>
          <input
            type="date"
            value={nextFollowUpDate}
            onChange={(e) => setNextFollowUpDate(e.target.value)}
            className="input w-full"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Shared with Patient)
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="input w-full"
            rows={2}
            placeholder="Additional notes for patient..."
          />
        </div>

        {/* Private Notes */}
        <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
          <label className="block text-sm font-medium text-orange-800 mb-1">
            Private Notes (Doctor Only - Not Shared)
          </label>
          <textarea
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            className="input w-full"
            rows={2}
            placeholder="Private notes for your reference only..."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : existingNote ? 'Update Note' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}
