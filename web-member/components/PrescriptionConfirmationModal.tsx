'use client'

import { Modal } from './ui/Modal'
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface PrescriptionConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  serviceType: 'lab' | 'diagnostic'
  loading?: boolean
}

export default function PrescriptionConfirmationModal({
  isOpen,
  onClose,
  serviceType,
  loading = false
}: PrescriptionConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="text-center py-6">
        {loading ? (
          <>
            <div className="flex justify-center mb-4">
              <div
                className="h-16 w-16 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: '#0a529f', borderTopColor: 'transparent' }}
              />
            </div>
            <p className="text-gray-700">Submitting your prescription...</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#e8f2fc' }}
              >
                <CheckCircleIcon className="h-10 w-10" style={{ color: '#0a529f' }} />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Prescription Submitted Successfully!
            </h3>

            <p className="text-gray-600 mb-6">
              Your prescription has been submitted for digitization. Our operations team will review it and create a cart with available {serviceType === 'lab' ? 'lab vendors' : 'diagnostic centers'} for you to choose from.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    What happens next?
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Our team will digitize your prescription</li>
                    <li>• We&apos;ll find the best {serviceType === 'lab' ? 'labs' : 'diagnostic centers'} for you</li>
                    <li>• You&apos;ll receive a notification when ready</li>
                    <li>• Review vendors and book your slot</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: '#0a529f' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084080'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0a529f'}
            >
              Got it, thanks!
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
