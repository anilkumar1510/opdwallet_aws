'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

interface TPANote {
  type: string
  message: string
  timestamp?: string
  documents?: Array<{ documentType: string; reason: string }>
}

interface TPANotesPanelProps {
  claimId: string
}

export default function TPANotesPanel({ claimId }: TPANotesPanelProps) {
  const [notes, setNotes] = useState<TPANote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTPANotes()
  }, [claimId])

  const fetchTPANotes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/member/claims/${claimId}/tpa-notes`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching TPA notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      case 'rejection':
        return <XCircleIcon className="h-6 w-6 text-red-600" />
      case 'documents_required':
        return <DocumentTextIcon className="h-6 w-6 text-orange-600" />
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />
    }
  }

  const getNoteColor = (type: string) => {
    switch (type) {
      case 'approval':
        return 'border-green-200 bg-green-50'
      case 'rejection':
        return 'border-red-200 bg-red-50'
      case 'documents_required':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getNoteTitle = (type: string) => {
    switch (type) {
      case 'approval':
        return 'Claim Approved'
      case 'rejection':
        return 'Claim Rejected'
      case 'documents_required':
        return 'Additional Documents Required'
      default:
        return 'Note from TPA'
    }
  }

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notes from TPA</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          No notes from TPA yet
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notes from TPA</h3>
        <p className="text-sm text-gray-500 mt-1">
          Important information from your claim reviewer
        </p>
      </div>

      <div className="p-6 space-y-4">
        {notes.map((note, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${getNoteColor(note.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">{getNoteIcon(note.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {getNoteTitle(note.type)}
                  </h4>
                  {note.timestamp && (
                    <span className="text-xs text-gray-500">
                      {formatDateTime(note.timestamp)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-2">{note.message}</p>

                {note.documents && note.documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 uppercase">
                      Required Documents:
                    </p>
                    {note.documents.map((doc, docIndex) => (
                      <div
                        key={docIndex}
                        className="bg-white rounded p-2 border border-orange-200"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {doc.documentType}
                        </p>
                        {doc.reason && (
                          <p className="text-xs text-gray-600 mt-1">{doc.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
