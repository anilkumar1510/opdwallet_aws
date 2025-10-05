'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function UploadPrescriptionPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        // Pre-fill patient name with user's name
        setPatientName(userData.name?.fullName || '')
        console.log('[UPLOAD] User data loaded:', userData)
      }
    } catch (error) {
      console.error('[UPLOAD] Error fetching user:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      alert('Please upload an image or PDF file')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    console.log('[UPLOAD] Starting upload process...')

    if (!file) {
      console.error('[UPLOAD] No file selected')
      alert('Please select a file')
      return
    }

    if (!patientName.trim()) {
      console.error('[UPLOAD] Patient name is empty')
      alert('Please enter patient name')
      return
    }

    if (!user?.userId) {
      console.error('[UPLOAD] User ID not available:', user)
      alert('User session error. Please refresh and try again.')
      return
    }

    setUploading(true)

    try {
      console.log('[UPLOAD] Preparing FormData...')
      const formData = new FormData()

      // Required fields as per backend DTO
      formData.append('file', file)
      formData.append('patientId', user.userId)
      formData.append('patientName', patientName.trim())
      if (notes.trim()) formData.append('notes', notes.trim())

      console.log('[UPLOAD] FormData prepared:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        patientId: user.userId,
        patientName: patientName.trim(),
        notes: notes.trim() || '(none)',
      })

      console.log('[UPLOAD] Sending request to /api/member/lab/prescriptions/upload...')
      const response = await fetch('/api/member/lab/prescriptions/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      console.log('[UPLOAD] Response status:', response.status, response.statusText)

      const responseText = await response.text()
      console.log('[UPLOAD] Response body (raw):', responseText)

      let data
      try {
        data = JSON.parse(responseText)
        console.log('[UPLOAD] Response data (parsed):', data)
      } catch (e) {
        console.error('[UPLOAD] Failed to parse response as JSON:', e)
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 200)}`)
      }

      if (!response.ok) {
        console.error('[UPLOAD] Upload failed. Status:', response.status)
        console.error('[UPLOAD] Error response:', data)
        throw new Error(data.message || data.error || 'Failed to upload prescription')
      }

      console.log('[UPLOAD] Upload successful!')
      alert(data.message || 'Prescription uploaded successfully!')
      router.push('/member/lab-tests')
    } catch (error: any) {
      console.error('[UPLOAD] Error during upload:', error)
      console.error('[UPLOAD] Error stack:', error.stack)
      alert(`Failed to upload prescription: ${error.message}`)
    } finally {
      setUploading(false)
      console.log('[UPLOAD] Upload process completed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Upload Prescription</h1>
            <p className="text-sm text-gray-600">Upload your lab test prescription</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Select Prescription File</h3>

          {!file ? (
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-colors cursor-pointer">
                <div className="text-center">
                  <CloudArrowUpIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-700 font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG, PDF (Max 10MB)
                  </p>
                </div>
              </div>
              <input
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="border border-gray-200 rounded-xl p-4">
                {preview ? (
                  <img
                    src={preview}
                    alt="Prescription preview"
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Patient Information */}
        {file && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        )}

        {/* Notes */}
        {file && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific instructions or information..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Your prescription will be reviewed by our team</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>We'll create a cart with all the tests from your prescription</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>You'll be notified once your cart is ready for review</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Select a lab partner and book your slot</span>
            </li>
          </ul>
        </div>

        {/* Upload Button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                Uploading...
              </span>
            ) : (
              'Upload Prescription'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
