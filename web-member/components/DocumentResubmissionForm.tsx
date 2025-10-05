'use client'

import { useState } from 'react'
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface DocumentResubmissionFormProps {
  claimId: string
  claimNumber: string
  requiredDocuments?: Array<{ documentType: string; reason: string }>
  onSuccess: () => void
  onCancel: () => void
}

export default function DocumentResubmissionForm({
  claimId,
  claimNumber,
  requiredDocuments = [],
  onSuccess,
  onCancel,
}: DocumentResubmissionFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [documentTypes, setDocumentTypes] = useState<string[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [resubmissionNotes, setResubmissionNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles([...files, ...newFiles])
      setDocumentTypes([
        ...documentTypes,
        ...newFiles.map(() => requiredDocuments[0]?.documentType || 'Supporting Document'),
      ])
      setNotes([...notes, ...newFiles.map(() => '')])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setDocumentTypes(documentTypes.filter((_, i) => i !== index))
    setNotes(notes.filter((_, i) => i !== index))
  }

  const updateDocumentType = (index: number, type: string) => {
    const newTypes = [...documentTypes]
    newTypes[index] = type
    setDocumentTypes(newTypes)
  }

  const updateNote = (index: number, note: string) => {
    const newNotes = [...notes]
    newNotes[index] = note
    setNotes(newNotes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (files.length === 0) {
      setError('Please select at least one document to upload')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()

      // Add files
      files.forEach((file) => {
        formData.append('documents', file)
      })

      // Add document metadata
      const documentsMetadata = files.map((_, index) => ({
        documentType: documentTypes[index],
        notes: notes[index],
      }))

      formData.append('documents', JSON.stringify(documentsMetadata))
      formData.append('resubmissionNotes', resubmissionNotes)

      const response = await fetch(`/api/member/claims/${claimId}/resubmit-documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        setError(data.message || 'Failed to resubmit documents')
      }
    } catch (err) {
      console.error('Error resubmitting documents:', err)
      setError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const commonDocumentTypes = [
    'Medical Invoice',
    'Prescription',
    'Lab Report',
    'Discharge Summary',
    'Medical Certificate',
    'Receipt',
    'ID Proof',
    'Supporting Document',
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Resubmit Documents</h2>
            <p className="text-sm text-gray-500 mt-1">Claim: {claimNumber}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={uploading}
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Documents Resubmitted Successfully!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your claim has been moved back to the review queue. We'll notify you of any
                    updates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Required Documents Info */}
          {requiredDocuments.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">
                Required Documents:
              </h3>
              <ul className="space-y-1">
                {requiredDocuments.map((doc, index) => (
                  <li key={index} className="text-sm text-orange-700">
                    • <span className="font-medium">{doc.documentType}</span>
                    {doc.reason && <span className="text-orange-600"> - {doc.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* File Upload */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Documents <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-800 font-medium">
                    Choose files
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  or drag and drop files here
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, JPG, PNG up to 10MB each
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Selected Files ({files.length})
                </h4>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <DocumentIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        disabled={uploading}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Document Type
                        </label>
                        <select
                          value={documentTypes[index]}
                          onChange={(e) => updateDocumentType(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={uploading}
                        >
                          {commonDocumentTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={notes[index]}
                          onChange={(e) => updateNote(index, e.target.value)}
                          placeholder="e.g., Updated version"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={uploading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resubmission Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={resubmissionNotes}
                onChange={(e) => setResubmissionNotes(e.target.value)}
                placeholder="Any additional information about the resubmitted documents..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={uploading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || success || files.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5" />
                    <span>Resubmit Documents</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
