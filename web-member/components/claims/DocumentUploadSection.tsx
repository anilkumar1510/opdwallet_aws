'use client'

import { DocumentPreview } from '@/lib/utils/claimValidation'
import {
  DocumentPlusIcon,
  CameraIcon,
  DocumentTextIcon,
  XMarkIcon,
  EyeIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CheckCircleIcon
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
      <div className="space-y-5 lg:space-y-6 animate-fadeIn">
        {/* Prescription Upload Section - Beautiful Blue Gradient */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl border-2 border-blue-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transform hover:rotate-12 transition-transform">
                <DocumentTextIcon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg lg:text-xl font-black text-gray-900">Prescription Documents</h3>
                <p className="text-sm lg:text-base text-gray-600">Upload doctor's prescription <span className="text-red-500">*</span></p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="relative overflow-hidden border-3 border-dashed border-blue-300 rounded-2xl p-8 lg:p-10 bg-white/80 backdrop-blur-sm group-hover:bg-white transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 rounded-full -ml-12 -mb-12"></div>

              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
                  <CloudArrowUpIcon className="h-8 w-8 lg:h-10 lg:w-10 text-blue-600" />
                </div>
                <p className="text-sm lg:text-base text-gray-700 font-medium mb-6">
                  Drag & drop or click to upload prescription
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => triggerFileInput('image/*,application/pdf', true, onPrescriptionUpload)}
                    className="px-6 py-3 lg:px-8 lg:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl lg:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <DocumentPlusIcon className="h-5 w-5" />
                    Choose Files
                  </button>

                  <button
                    onClick={() => triggerFileInput('image/*', false, onPrescriptionUpload, true)}
                    className="px-6 py-3 lg:px-8 lg:py-4 border-2 border-blue-600 text-blue-600 rounded-xl lg:rounded-2xl hover:bg-blue-50 transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <CameraIcon className="h-5 w-5" />
                    Camera
                  </button>
                </div>

                <p className="text-xs lg:text-sm text-gray-500 mt-4 font-medium">PDF, JPG, PNG up to 5MB each</p>
              </div>
            </div>

            {/* Prescription Previews */}
            {prescriptionFiles.length > 0 && (
              <div className="mt-5 lg:mt-6 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-bold text-gray-900">{prescriptionFiles.length} file(s) uploaded</p>
                </div>
                {prescriptionFiles.map((doc) => (
                  <div key={doc.id} className="group/item relative overflow-hidden bg-white rounded-xl lg:rounded-2xl p-4 border-2 border-blue-100 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 relative">
                        {doc.type === 'image' && doc.preview ? (
                          <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden border-2 border-blue-200">
                            <img src={doc.preview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center border-2 border-red-200">
                            <DocumentTextIcon className="h-7 w-7 text-red-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm lg:text-base font-bold text-gray-900 truncate">{doc.file.name}</p>
                        <p className="text-xs lg:text-sm text-gray-500 font-medium">{(doc.file.size / 1024).toFixed(1)} KB</p>
                      </div>

                      <button
                        onClick={() => onRemovePrescription(doc.id)}
                        className="flex-shrink-0 p-2 lg:p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <XMarkIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bills Upload Section - Beautiful Green Gradient */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl border-2 border-green-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg transform hover:rotate-12 transition-transform">
                <DocumentTextIcon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg lg:text-xl font-black text-gray-900">Bill Documents</h3>
                <p className="text-sm lg:text-base text-gray-600">Upload consultation bills <span className="text-red-500">*</span></p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="relative overflow-hidden border-3 border-dashed border-green-300 rounded-2xl p-8 lg:p-10 bg-white/80 backdrop-blur-sm group-hover:bg-white transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/20 rounded-full -ml-12 -mb-12"></div>

              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4">
                  <CloudArrowUpIcon className="h-8 w-8 lg:h-10 lg:w-10 text-green-600" />
                </div>
                <p className="text-sm lg:text-base text-gray-700 font-medium mb-6">
                  Drag & drop or click to upload bills
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => triggerFileInput('image/*,application/pdf', true, onBillUpload)}
                    className="px-6 py-3 lg:px-8 lg:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl lg:rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <DocumentPlusIcon className="h-5 w-5" />
                    Choose Files
                  </button>

                  <button
                    onClick={() => triggerFileInput('image/*', false, onBillUpload, true)}
                    className="px-6 py-3 lg:px-8 lg:py-4 border-2 border-green-600 text-green-600 rounded-xl lg:rounded-2xl hover:bg-green-50 transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <CameraIcon className="h-5 w-5" />
                    Camera
                  </button>
                </div>

                <p className="text-xs lg:text-sm text-gray-500 mt-4 font-medium">PDF, JPG, PNG up to 5MB each</p>
              </div>
            </div>

            {/* Bill Previews */}
            {billFiles.length > 0 && (
              <div className="mt-5 lg:mt-6 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-bold text-gray-900">{billFiles.length} file(s) uploaded</p>
                </div>
                {billFiles.map((doc) => (
                  <div key={doc.id} className="group/item relative overflow-hidden bg-white rounded-xl lg:rounded-2xl p-4 border-2 border-green-100 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 relative">
                        {doc.type === 'image' && doc.preview ? (
                          <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-xl overflow-hidden border-2 border-green-200">
                            <img src={doc.preview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center border-2 border-red-200">
                            <DocumentTextIcon className="h-7 w-7 text-red-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm lg:text-base font-bold text-gray-900 truncate">{doc.file.name}</p>
                        <p className="text-xs lg:text-sm text-gray-500 font-medium">{(doc.file.size / 1024).toFixed(1)} KB</p>
                      </div>

                      <button
                        onClick={() => onRemoveBill(doc.id)}
                        className="flex-shrink-0 p-2 lg:p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <XMarkIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Generic Upload Area for Lab/Pharmacy - Stunning Purple Gradient
  return (
    <div className="space-y-5 lg:space-y-6 animate-fadeIn">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl lg:rounded-3xl p-8 lg:p-10 shadow-xl border-2 border-purple-100">

          {/* Upload Area */}
          <div className="relative overflow-hidden border-3 border-dashed border-purple-300 rounded-2xl p-10 lg:p-12 bg-white/80 backdrop-blur-sm group-hover:bg-white transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/20 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-200/20 rounded-full -ml-16 -mb-16"></div>

            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-6 shadow-lg">
                <PhotoIcon className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-gray-900 mb-3">Upload Documents</h3>
              <p className="text-sm lg:text-base text-gray-600 font-medium mb-8 max-w-md mx-auto">
                Drag and drop your bills and reports here, or tap to browse
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => triggerFileInput('image/*,application/pdf', true, onFileUpload)}
                  className="px-8 py-4 lg:px-10 lg:py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl lg:rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <DocumentPlusIcon className="h-6 w-6" />
                  Choose Files
                </button>

                <button
                  onClick={onCameraCapture || (() => triggerFileInput('image/*', false, onFileUpload, true))}
                  className="px-8 py-4 lg:px-10 lg:py-5 border-2 border-purple-600 text-purple-600 rounded-xl lg:rounded-2xl hover:bg-purple-50 transition-all font-bold text-base lg:text-lg shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <CameraIcon className="h-6 w-6" />
                  Take Photo
                </button>
              </div>

              <p className="text-xs lg:text-sm text-gray-500 mt-6 font-medium">
                Supports PDF, JPG, PNG • Maximum 5MB per file
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Previews */}
      {documentPreviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-black text-gray-900">Uploaded Documents ({documentPreviews.length})</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {documentPreviews.map((doc) => (
              <div key={doc.id} className="relative group/item overflow-hidden bg-white rounded-2xl p-5 border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 relative">
                    {doc.type === 'image' && doc.preview ? (
                      <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden border-2 border-purple-200 shadow-md">
                        <img
                          src={doc.preview}
                          alt="Document preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center border-2 border-red-200 shadow-md">
                        <DocumentTextIcon className="h-8 w-8 lg:h-10 lg:w-10 text-red-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base lg:text-lg font-bold text-gray-900 truncate mb-1">
                      {doc.file.name}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {(doc.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.type === 'image' && (
                      <button
                        onClick={() => {
                          const modal = document.createElement('div')
                          modal.className = 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm'
                          modal.innerHTML = `
                            <div class="relative max-w-5xl max-h-full">
                              <img src="${doc.preview}" class="max-w-full max-h-full rounded-2xl shadow-2xl" />
                              <button class="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-3xl font-bold transition-all">×</button>
                            </div>
                          `
                          modal.onclick = () => document.body.removeChild(modal)
                          document.body.appendChild(modal)
                        }}
                        className="p-3 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <XMarkIcon className="h-5 w-5 lg:h-6 lg:h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
