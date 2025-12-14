'use client'

import { DocumentPreview } from '@/lib/utils/claimValidation'
import {
  DocumentPlusIcon,
  CameraIcon,
  DocumentTextIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface DocumentUploadSectionProps {
  isConsultation: boolean
  prescriptionFiles: DocumentPreview[]
  billFiles: DocumentPreview[]
  documentPreviews: DocumentPreview[]
  onPrescriptionUpload: (files: FileList | null) => void
  onBillUpload: (files: FileList | null) => void
  onFileUpload: (files: FileList | null) => void
  onRemovePrescription: (id: string) => void
  onRemoveBill: (id: string) => void
  onRemoveDocument: (id: string) => void
  onCameraCapture?: () => void
}

export function DocumentUploadSection({
  isConsultation,
  prescriptionFiles,
  billFiles,
  documentPreviews,
  onPrescriptionUpload,
  onBillUpload,
  onFileUpload,
  onRemovePrescription,
  onRemoveBill,
  onRemoveDocument,
  onCameraCapture
}: DocumentUploadSectionProps) {
  const triggerFileInput = (
    accept: string,
    multiple: boolean,
    onUpload: (files: FileList | null) => void,
    capture?: boolean
  ) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    input.accept = accept
    if (capture) {
      input.capture = 'environment'
    }
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      onUpload(target.files)
    }
    input.click()
  }

  if (isConsultation) {
    return (
      <>
        {/* Prescription Upload Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Prescription Documents *</h3>
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center bg-white">
            <DocumentPlusIcon className="h-10 w-10 text-blue-400 mx-auto mb-3" />
            <p className="text-xs text-ink-600 mb-3">Upload prescription from doctor</p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => triggerFileInput('image/*,application/pdf', true, onPrescriptionUpload)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Choose Files
              </button>

              <button
                onClick={() => triggerFileInput('image/*', false, onPrescriptionUpload, true)}
                className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center text-sm"
              >
                <CameraIcon className="h-4 w-4 mr-1" />
                Camera
              </button>
            </div>

            <p className="text-xs text-ink-400 mt-2">PDF, JPG, PNG up to 5MB</p>
          </div>

          {/* Prescription Previews */}
          {prescriptionFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {prescriptionFiles.map((doc) => (
                <div key={doc.id} className="flex items-center p-2 bg-white rounded-lg border border-blue-200">
                  <div className="flex-shrink-0 mr-2">
                    {doc.type === 'image' && doc.preview ? (
                      <img src={doc.preview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-900 truncate">{doc.file.name}</p>
                    <p className="text-xs text-ink-500">{(doc.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => onRemovePrescription(doc.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bills Upload Section */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Bill Documents *</h3>
          <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center bg-white">
            <DocumentPlusIcon className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-xs text-ink-600 mb-3">Upload consultation bills</p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => triggerFileInput('image/*,application/pdf', true, onBillUpload)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Choose Files
              </button>

              <button
                onClick={() => triggerFileInput('image/*', false, onBillUpload, true)}
                className="px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center text-sm"
              >
                <CameraIcon className="h-4 w-4 mr-1" />
                Camera
              </button>
            </div>

            <p className="text-xs text-ink-400 mt-2">PDF, JPG, PNG up to 5MB</p>
          </div>

          {/* Bill Previews */}
          {billFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {billFiles.map((doc) => (
                <div key={doc.id} className="flex items-center p-2 bg-white rounded-lg border border-green-200">
                  <div className="flex-shrink-0 mr-2">
                    {doc.type === 'image' && doc.preview ? (
                      <img src={doc.preview} alt="Preview" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-900 truncate">{doc.file.name}</p>
                    <p className="text-xs text-ink-500">{(doc.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={() => onRemoveBill(doc.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )
  }

  // Generic Upload Area for Lab/Pharmacy
  return (
    <>
      <div className="border-2 border-dashed border-surface-border rounded-2xl p-8 text-center">
        <DocumentPlusIcon className="h-12 w-12 text-ink-300 mx-auto mb-4" />
        <p className="text-sm text-ink-600 mb-4">
          Drag and drop files here or tap to browse
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => triggerFileInput('image/*,application/pdf', true, onFileUpload)}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
          >
            Choose Files
          </button>

          <button
            onClick={onCameraCapture || (() => triggerFileInput('image/*', false, onFileUpload, true))}
            className="px-4 py-2 border border-brand-600 text-brand-600 rounded-xl hover:bg-brand-50 transition-colors flex items-center justify-center"
          >
            <CameraIcon className="h-4 w-4 mr-2" />
            Camera
          </button>
        </div>

        <p className="text-xs text-ink-400 mt-3">
          Supports PDF, JPG, PNG up to 5MB each
        </p>
      </div>

      {/* Document Previews */}
      {documentPreviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-ink-900">Uploaded Documents</h3>
          <div className="grid grid-cols-1 gap-3">
            {documentPreviews.map((doc) => (
              <div key={doc.id} className="flex items-center p-3 bg-surface-alt rounded-xl border border-surface-border">
                <div className="flex-shrink-0 mr-3">
                  {doc.type === 'image' && doc.preview ? (
                    <img
                      src={doc.preview}
                      alt="Document preview"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="h-6 w-6 text-red-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {doc.file.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {(doc.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-2">
                  {doc.type === 'image' && (
                    <button
                      onClick={() => {
                        const modal = document.createElement('div')
                        modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4'
                        modal.innerHTML = `
                          <div class="relative max-w-full max-h-full">
                            <img src="${doc.preview}" class="max-w-full max-h-full rounded-lg" />
                            <button class="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full">×</button>
                          </div>
                        `
                        modal.onclick = () => document.body.removeChild(modal)
                        document.body.appendChild(modal)
                      }}
                      className="p-2 text-ink-400 hover:text-brand-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="p-2 text-ink-400 hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
