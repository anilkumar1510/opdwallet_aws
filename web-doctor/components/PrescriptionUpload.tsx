'use client'

import { useState, FormEvent, memo } from 'react'
import { uploadPrescription } from '@/lib/api/prescriptions'
import { MAX_FILE_SIZE_BYTES, ALLOWED_PRESCRIPTION_TYPES } from '@/lib/utils/constants'
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface PrescriptionUploadProps {
  appointmentId: string
  onSuccess?: () => void
}

function PrescriptionUpload({ appointmentId, onSuccess }: PrescriptionUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) return

    // Validate file type
    if (!ALLOWED_PRESCRIPTION_TYPES.includes(selectedFile.type)) {
      setError('Only PDF files are allowed')
      setFile(null)
      return
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError('File size must be less than 10MB')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a PDF file')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await uploadPrescription({
        appointmentId,
        file,
        diagnosis: diagnosis.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      setSuccess(true)
      setFile(null)
      setDiagnosis('')
      setNotes('')

      // Reset form
      const fileInput = document.getElementById('prescription-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload prescription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">
              Prescription uploaded successfully!
            </h3>
            <p className="text-sm text-green-700">
              The patient can now view this prescription in their health records.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Prescription
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label htmlFor="prescription-file" className="block text-sm font-medium text-gray-700 mb-2">
            Prescription PDF <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-brand-400 transition-colors">
            <div className="space-y-1 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="prescription-file"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="prescription-file"
                    name="prescription-file"
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF up to 10MB
              </p>
              {file && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  ✓ {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis (Optional)
          </label>
          <input
            type="text"
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="input-field"
            placeholder="e.g., Viral Fever, Common Cold"
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Additional notes for the patient..."
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full btn-primary py-3"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            'Upload Prescription'
          )}
        </button>
      </form>
    </div>
  )
}

export default memo(PrescriptionUpload)
