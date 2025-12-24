'use client'

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: {
    fileName: string
    filePath: string
    fileType?: string
    documentType: string
  }
  userId: string
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  userId,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError('')
    }
  }, [isOpen, document])

  if (!isOpen) return null

  // Extract userId from filePath if available, otherwise use provided userId
  // filePath format: /app/uploads/claims/{userId}/{fileName} or uploads/claims/{userId}/{fileName}
  let fileUserId = userId
  if (document.filePath) {
    const pathMatch = document.filePath.match(/claims\/([^/]+)\//)
    if (pathMatch && pathMatch[1]) {
      fileUserId = pathMatch[1]
    }
  }

  // Construct the proper file URL using the extracted userId
  const fileUrl = `/api/member/claims/files/${fileUserId}/${document.fileName}`

  // Determine if it's a PDF or image
  const isPDF = document.fileName?.toLowerCase().endsWith('.pdf') ||
                document.fileType?.includes('pdf')
  const isImage = document.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                  document.fileType?.includes('image')

  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = fileUrl
    link.download = document.fileName
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <button
          type="button"
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 border-0 p-0 cursor-default"
          onClick={onClose}
          aria-label="Close modal"
        ></button>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isPDF ? (
                <DocumentTextIcon className="h-6 w-6 text-red-600" />
              ) : isImage ? (
                <PhotoIcon className="h-6 w-6 text-blue-600" />
              ) : (
                <DocumentTextIcon className="h-6 w-6 text-gray-600" />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {document.documentType}
                </h3>
                <p className="text-sm text-gray-500">{document.fileName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-4 py-6" style={{ minHeight: '500px', maxHeight: '80vh' }}>
            {error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <XMarkIcon className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 font-medium mb-2">Failed to load document</p>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Download Instead
                </button>
              </div>
            ) : isPDF ? (
              <div className="h-full flex flex-col">
                <iframe
                  src={fileUrl}
                  className="w-full flex-1 rounded-lg shadow-lg"
                  style={{ minHeight: '600px' }}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false)
                    setError('Failed to load PDF. The file may be corrupted or inaccessible.')
                  }}
                  title={document.fileName}
                />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            ) : isImage ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={fileUrl}
                  alt={document.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false)
                    setError('Failed to load image. The file may be corrupted or inaccessible.')
                  }}
                />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-2">Preview not available</p>
                <p className="text-sm text-gray-500 mb-4">
                  This file type cannot be previewed in the browser
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
