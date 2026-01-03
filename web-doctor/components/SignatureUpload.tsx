'use client'

import { useState, useEffect } from 'react'
import { uploadSignature, getSignatureStatus, deleteSignature, SignatureStatus } from '@/lib/api/auth'
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export default function SignatureUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null)
  const [fetchingStatus, setFetchingStatus] = useState(true)

  useEffect(() => {
    loadSignatureStatus()
  }, [])

  const loadSignatureStatus = async () => {
    try {
      setFetchingStatus(true)
      const status = await getSignatureStatus()
      setSignatureStatus(status)
    } catch (err) {
      console.error('Error fetching signature status:', err)
    } finally {
      setFetchingStatus(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PNG and JPG/JPEG images are allowed')
      setFile(null)
      return
    }

    // Validate file size (500KB max)
    const maxSizeBytes = 500 * 1024
    if (selectedFile.size > maxSizeBytes) {
      setError('File size must be less than 500KB')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await uploadSignature(file)
      setSuccess(true)
      setFile(null)

      // Reset file input
      const fileInput = document.getElementById('signature-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Reload signature status
      await loadSignatureStatus()

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload signature')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your signature? This will prevent you from generating prescriptions until you upload a new one.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await deleteSignature()
      await loadSignatureStatus()
    } catch (err: any) {
      setError(err.message || 'Failed to delete signature')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingStatus) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Doctor Signature
      </h3>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Required for Prescriptions:</strong> A valid signature is mandatory for generating prescriptions per MCI guidelines.
        </p>
      </div>

      {/* Current Signature Status */}
      {signatureStatus?.hasSignature && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Signature Uploaded</p>
                <p className="text-sm text-green-700">
                  {signatureStatus.uploadedAt && (
                    <>Uploaded on {new Date(signatureStatus.uploadedAt).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete signature"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          {signatureStatus.previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="bg-white p-4 rounded border border-gray-200 inline-block">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${signatureStatus.previewUrl}`}
                  alt="Signature preview"
                  className="h-20 object-contain"
                  onError={(e) => {
                    console.error('Failed to load signature preview');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload New Signature */}
      <div>
        <label
          htmlFor="signature-file"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {signatureStatus?.hasSignature ? 'Upload New Signature' : 'Upload Signature'}
        </label>

        <div className="flex items-center space-x-4">
          <label
            htmlFor="signature-file"
            className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2B4D8C] hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {file ? file.name : 'Click to select signature image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG or JPG, max 500KB
              </p>
            </div>
            <input
              id="signature-file"
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>

          {file && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-3 bg-[#2B4D8C] text-white rounded-lg hover:bg-[#1E3A6B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">Success!</p>
            <p className="text-sm text-green-700">
              Your signature has been uploaded successfully. You can now generate prescriptions.
            </p>
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Signature Guidelines:</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Use a clear, high-resolution image of your signature</li>
          <li>Ensure the signature is on a white or transparent background</li>
          <li>File size should not exceed 500KB</li>
          <li>Only PNG or JPG/JPEG formats are accepted</li>
          <li>Your signature will appear on all generated prescriptions</li>
        </ul>
      </div>
    </div>
  )
}
