'use client'

import { useState } from 'react'
import { XMarkIcon, DocumentTextIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { apiFetch } from '@/lib/api'

interface RequestDocumentsModalProps {
  claimId: string
  onClose: () => void
  onSuccess: () => void
}

const COMMON_DOCUMENTS = [
  'Original medical bills',
  'Prescription from doctor',
  'Diagnostic test reports',
  'Discharge summary',
  'Doctor consultation notes',
  'Pharmacy bills',
  'Payment receipts',
  'Medical certificate',
  'Policy document copy',
  'ID proof',
  'Previous claim history',
  'Pre-authorization letter',
]

interface DocumentRequest {
  documentType: string
  reason: string
}

export default function RequestDocumentsModal({
  claimId,
  onClose,
  onSuccess,
}: RequestDocumentsModalProps) {
  const [documents, setDocuments] = useState<DocumentRequest[]>([
    { documentType: '', reason: '' },
  ])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addDocument = () => {
    setDocuments([...documents, { documentType: '', reason: '' }])
  }

  const removeDocument = (index: number) => {
    if (documents.length > 1) {
      setDocuments(documents.filter((_, i) => i !== index))
    }
  }

  const updateDocument = (index: number, field: keyof DocumentRequest, value: string) => {
    const updated = [...documents]
    updated[index][field] = value
    setDocuments(updated)
  }

  const handleSubmit = async () => {
    // Validation
    const validDocuments = documents.filter(
      (doc) => doc.documentType.trim() && doc.reason.trim()
    )

    if (validDocuments.length === 0) {
      setError('Please add at least one document request with document type and reason')
      return
    }

    // Check if all filled documents have both fields
    const hasIncompleteDoc = documents.some(
      (doc) =>
        (doc.documentType.trim() && !doc.reason.trim()) ||
        (!doc.documentType.trim() && doc.reason.trim())
    )

    if (hasIncompleteDoc) {
      setError('Please fill both document type and reason for all document requests')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const response = await apiFetch(`/api/tpa/claims/${claimId}/request-documents`, {
        method: 'POST',
        body: JSON.stringify({
          documents: validDocuments,
          notes,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to request documents')
      }
    } catch (err) {
      setError('Failed to request documents. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Request Documents</h3>
              <p className="text-sm text-gray-500">{claimId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            Request additional documents from the member to process this claim. The member will be
            notified and can upload the requested documents through their portal.
          </p>
        </div>

        <div className="space-y-4">
          {/* Document Requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Document Requests *
              </label>
              <button
                onClick={addDocument}
                className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Document</span>
              </button>
            </div>

            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Document {index + 1}
                    </p>
                    {documents.length > 1 && (
                      <button
                        onClick={() => removeDocument(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Document Type *
                      </label>
                      <input
                        type="text"
                        value={doc.documentType}
                        onChange={(e) => updateDocument(index, 'documentType', e.target.value)}
                        placeholder="Enter document type or select from suggestions"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        list={`document-suggestions-${index}`}
                      />
                      <datalist id={`document-suggestions-${index}`}>
                        {COMMON_DOCUMENTS.map((docType) => (
                          <option key={docType} value={docType} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Reason for Request *
                      </label>
                      <textarea
                        value={doc.reason}
                        onChange={(e) => updateDocument(index, 'reason', e.target.value)}
                        placeholder="Explain why this document is needed..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Documents Suggestions */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              Common document types:
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_DOCUMENTS.slice(0, 6).map((docType) => (
                <button
                  key={docType}
                  onClick={() => {
                    const emptyIndex = documents.findIndex((d) => !d.documentType.trim())
                    if (emptyIndex !== -1) {
                      updateDocument(emptyIndex, 'documentType', docType)
                    } else {
                      setDocuments([...documents, { documentType: docType, reason: '' }])
                    }
                  }}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-purple-50 hover:border-purple-300 transition-colors"
                >
                  {docType}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional instructions or context for the member..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes will be visible to the member along with the document requests
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm font-medium text-purple-900">Request Summary</p>
          <div className="mt-2">
            <p className="text-sm text-purple-700">
              {documents.filter((d) => d.documentType.trim() && d.reason.trim()).length} document(s) will be requested
            </p>
            <div className="mt-2 space-y-1">
              {documents
                .filter((d) => d.documentType.trim() && d.reason.trim())
                .map((doc, index) => (
                  <div key={index} className="text-xs text-purple-700">
                    • {doc.documentType}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || documents.filter((d) => d.documentType.trim() && d.reason.trim()).length === 0}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Requesting...
              </>
            ) : (
              <>
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Request Documents
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
