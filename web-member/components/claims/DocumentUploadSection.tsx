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
        {/* Prescription Upload Section */}
        <div className="rounded-2xl p-6 lg:p-8 border-2 shadow-md" style={{
          background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
          borderColor: '#F7DCAF'
        }}>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <DocumentTextIcon className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: '#0F5FDC' }} />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold" style={{ color: '#0E51A2' }}>Prescription Documents</h3>
              <p className="text-sm lg:text-base text-gray-700">Upload doctor's prescription <span className="text-red-500">*</span></p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="text-center py-6">
            <div
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
                border: '1px solid #A4BFFE7A',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <CloudArrowUpIcon className="h-8 w-8 lg:h-10 lg:w-10" style={{ color: '#0F5FDC' }} />
            </div>
            <p className="text-sm lg:text-base text-gray-700 font-medium mb-6">
              Drag & drop or click to upload prescription
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => triggerFileInput('image/*,application/pdf', true, onPrescriptionUpload)}
                className="px-6 py-3 lg:px-8 lg:py-4 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
              >
                <DocumentPlusIcon className="h-5 w-5" />
                Choose Files
              </button>

              <button
                onClick={() => triggerFileInput('image/*', false, onPrescriptionUpload, true)}
                className="px-6 py-3 lg:px-8 lg:py-4 border-2 text-gray-700 rounded-xl hover:bg-white/50 transition-all font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                style={{ borderColor: '#86ACD8' }}
              >
                <CameraIcon className="h-5 w-5" />
                Camera
              </button>
            </div>

            <p className="text-xs lg:text-sm text-gray-600 mt-4 font-medium">PDF, JPG, PNG up to 5MB each</p>
          </div>

          {/* Prescription Previews */}
          {prescriptionFiles.length > 0 && (
            <div className="mt-5 lg:mt-6 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-gray-900">{prescriptionFiles.length} file(s) uploaded</p>
              </div>
              {prescriptionFiles.map((doc) => (
                <div key={doc.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 relative">
                      {doc.type === 'image' && doc.preview ? (
                        <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img src={doc.preview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 lg:w-16 lg:h-16 bg-red-100 rounded-lg flex items-center justify-center border border-red-200">
                          <DocumentTextIcon className="h-7 w-7 text-red-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm lg:text-base font-semibold text-gray-900 truncate">{doc.file.name}</p>
                      <p className="text-xs lg:text-sm text-gray-500">{(doc.file.size / 1024).toFixed(1)} KB</p>
                    </div>

                    <button
                      onClick={() => onRemovePrescription(doc.id)}
                      className="flex-shrink-0 p-2 lg:p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <XMarkIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bills Upload Section */}
        <div className="rounded-2xl p-6 lg:p-8 border-2 shadow-md" style={{
          background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
          borderColor: '#F7DCAF'
        }}>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full"
              style={{
                background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
                border: '1px solid rgba(95, 161, 113, 0.3)',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <DocumentTextIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold" style={{ color: '#0E51A2' }}>Bill Documents</h3>
              <p className="text-sm lg:text-base text-gray-700">Upload consultation bills <span className="text-red-500">*</span></p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="text-center py-6">
            <div
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)',
                border: '1px solid rgba(95, 161, 113, 0.3)',
                boxShadow: '-2px 11px 46.1px 0px #0000000D'
              }}
            >
              <CloudArrowUpIcon className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
            </div>
            <p className="text-sm lg:text-base text-gray-700 font-medium mb-6">
              Drag & drop or click to upload bills
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => triggerFileInput('image/*,application/pdf', true, onBillUpload)}
                className="px-6 py-3 lg:px-8 lg:py-4 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(163.02deg, #90EAA9 -37.71%, #5FA171 117.48%)' }}
              >
                <DocumentPlusIcon className="h-5 w-5" />
                Choose Files
              </button>

              <button
                onClick={() => triggerFileInput('image/*', false, onBillUpload, true)}
                className="px-6 py-3 lg:px-8 lg:py-4 border-2 text-gray-700 rounded-xl hover:bg-white/50 transition-all font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                style={{ borderColor: '#86ACD8' }}
              >
                <CameraIcon className="h-5 w-5" />
                Camera
              </button>
            </div>

            <p className="text-xs lg:text-sm text-gray-600 mt-4 font-medium">PDF, JPG, PNG up to 5MB each</p>
          </div>

          {/* Bill Previews */}
          {billFiles.length > 0 && (
            <div className="mt-5 lg:mt-6 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-gray-900">{billFiles.length} file(s) uploaded</p>
              </div>
              {billFiles.map((doc) => (
                <div key={doc.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 relative">
                      {doc.type === 'image' && doc.preview ? (
                        <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img src={doc.preview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 lg:w-16 lg:h-16 bg-red-100 rounded-lg flex items-center justify-center border border-red-200">
                          <DocumentTextIcon className="h-7 w-7 text-red-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm lg:text-base font-semibold text-gray-900 truncate">{doc.file.name}</p>
                      <p className="text-xs lg:text-sm text-gray-500">{(doc.file.size / 1024).toFixed(1)} KB</p>
                    </div>

                    <button
                      onClick={() => onRemoveBill(doc.id)}
                      className="flex-shrink-0 p-2 lg:p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
    )
  }

  // Generic Upload Area for Lab/Pharmacy
  return (
    <div className="space-y-5 lg:space-y-6 animate-fadeIn">
      <div className="rounded-2xl p-6 lg:p-8 border-2 shadow-md" style={{
        background: 'linear-gradient(169.98deg, #EFF4FF 19.71%, #FEF3E9 66.63%, #FEF3E9 108.92%)',
        borderColor: '#F7DCAF'
      }}>
        {/* Upload Area */}
        <div className="text-center">
          <div
            className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(261.92deg, rgba(223, 232, 255, 0.75) 4.4%, rgba(189, 209, 255, 0.75) 91.97%)',
              border: '1px solid #A4BFFE7A',
              boxShadow: '-2px 11px 46.1px 0px #0000000D'
            }}
          >
            <PhotoIcon className="h-10 w-10 lg:h-12 lg:w-12" style={{ color: '#0F5FDC' }} />
          </div>
          <h3 className="text-xl lg:text-2xl font-bold mb-3" style={{ color: '#0E51A2' }}>Upload Documents</h3>
          <p className="text-sm lg:text-base text-gray-700 mb-8 max-w-md mx-auto">
            Drag and drop your bills and reports here, or tap to browse
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => triggerFileInput('image/*,application/pdf', true, onFileUpload)}
              className="px-8 py-4 lg:px-10 lg:py-5 text-white rounded-xl transition-all font-semibold text-base lg:text-lg shadow-md hover:shadow-lg flex items-center justify-center gap-3"
              style={{ background: 'linear-gradient(90deg, #1F63B4 0%, #5DA4FB 100%)' }}
            >
              <DocumentPlusIcon className="h-6 w-6" />
              Choose Files
            </button>

            <button
              onClick={onCameraCapture || (() => triggerFileInput('image/*', false, onFileUpload, true))}
              className="px-8 py-4 lg:px-10 lg:py-5 border-2 text-gray-700 rounded-xl hover:bg-white/50 transition-all font-semibold text-base lg:text-lg shadow-sm hover:shadow-md flex items-center justify-center gap-3"
              style={{ borderColor: '#86ACD8' }}
            >
              <CameraIcon className="h-6 w-6" />
              Take Photo
            </button>
          </div>

          <p className="text-xs lg:text-sm text-gray-600 mt-6 font-medium">
            Supports PDF, JPG, PNG • Maximum 5MB per file
          </p>
        </div>
      </div>

      {/* Document Previews */}
      {documentPreviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents ({documentPreviews.length})</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {documentPreviews.map((doc) => (
              <div key={doc.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:bg-gray-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 relative">
                    {doc.type === 'image' && doc.preview ? (
                      <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={doc.preview}
                          alt="Document preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-red-100 rounded-lg flex items-center justify-center border border-red-200">
                        <DocumentTextIcon className="h-8 w-8 lg:h-10 lg:w-10 text-red-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base lg:text-lg font-semibold text-gray-900 truncate mb-1">
                      {doc.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(doc.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.type === 'image' && (
                      <button
                        onClick={() => {
                          const modal = document.createElement('div')
                          modal.className = 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4'
                          modal.innerHTML = `
                            <div class="relative max-w-5xl max-h-full">
                              <img src="${doc.preview}" class="max-w-full max-h-full rounded-lg shadow-xl" />
                              <button class="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg text-3xl font-bold transition-all">×</button>
                            </div>
                          `
                          modal.onclick = () => document.body.removeChild(modal)
                          document.body.appendChild(modal)
                        }}
                        className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
