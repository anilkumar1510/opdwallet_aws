'use client'

import { useState } from 'react'
import { Modal, ModalFooter } from './ui/Modal'

interface AddAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onAddressAdded: () => void
  userId: string
}

export default function AddAddressModal({
  isOpen,
  onClose,
  onAddressAdded,
  userId
}: AddAddressModalProps) {
  const [addressType, setAddressType] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [landmark, setLandmark] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[ADDRESS-MODAL] ========== FORM SUBMISSION START ==========')
    e.preventDefault()
    setError('')

    // Log all form field values
    console.log('[ADDRESS-MODAL] Form field values:', {
      userId,
      addressType,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      isDefault
    })

    // Validate pincode
    console.log('[ADDRESS-MODAL] Validating pincode:', pincode)
    const pincodeRegex = /^[0-9]{6}$/
    const isPincodeValid = pincodeRegex.test(pincode)
    console.log('[ADDRESS-MODAL] Pincode validation result:', isPincodeValid)

    if (!isPincodeValid) {
      console.error('[ADDRESS-MODAL] Pincode validation FAILED')
      setError('Pincode must be exactly 6 digits')
      return
    }
    console.log('[ADDRESS-MODAL] Pincode validation PASSED')

    setSubmitting(true)
    console.log('[ADDRESS-MODAL] Submitting state set to true')

    try {
      // Prepare request payload
      const requestPayload = {
        addressType,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state,
        pincode,
        landmark: landmark || undefined,
        isDefault,
      }
      console.log('[ADDRESS-MODAL] Request payload prepared:', JSON.stringify(requestPayload, null, 2))

      const apiUrl = `/api/member/addresses`
      console.log('[ADDRESS-MODAL] API URL:', apiUrl)
      console.log('[ADDRESS-MODAL] Note: Using member endpoint (userId from JWT token)')
      console.log('[ADDRESS-MODAL] Request method: POST')
      console.log('[ADDRESS-MODAL] Request headers:', {
        'Content-Type': 'application/json',
        credentials: 'include'
      })

      console.log('[ADDRESS-MODAL] Initiating fetch request...')
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestPayload),
      })

      console.log('[ADDRESS-MODAL] Response received!')
      console.log('[ADDRESS-MODAL] Response status:', response.status)
      console.log('[ADDRESS-MODAL] Response statusText:', response.statusText)
      console.log('[ADDRESS-MODAL] Response ok:', response.ok)
      console.log('[ADDRESS-MODAL] Response headers:', Object.fromEntries(response.headers.entries()))

      // Clone response to read it twice (once for logging, once for processing)
      const responseClone = response.clone()
      const responseText = await responseClone.text()
      console.log('[ADDRESS-MODAL] Raw response body:', responseText)

      if (response.ok) {
        console.log('[ADDRESS-MODAL] ✅ SUCCESS - Address created successfully!')

        let parsedData
        try {
          parsedData = JSON.parse(responseText)
          console.log('[ADDRESS-MODAL] Parsed response data:', parsedData)
        } catch (parseError) {
          console.warn('[ADDRESS-MODAL] Could not parse response as JSON:', parseError)
        }

        // Reset form
        console.log('[ADDRESS-MODAL] Resetting form fields...')
        setAddressLine1('')
        setAddressLine2('')
        setCity('')
        setState('')
        setPincode('')
        setLandmark('')
        setIsDefault(false)
        setAddressType('HOME')
        console.log('[ADDRESS-MODAL] Form reset complete')

        console.log('[ADDRESS-MODAL] Calling onAddressAdded callback...')
        onAddressAdded()
        console.log('[ADDRESS-MODAL] Calling onClose callback...')
        onClose()
        console.log('[ADDRESS-MODAL] ========== FORM SUBMISSION COMPLETE (SUCCESS) ==========')
      } else {
        console.error('[ADDRESS-MODAL] ❌ ERROR - Request failed with status:', response.status)

        let data
        try {
          data = JSON.parse(responseText)
          console.error('[ADDRESS-MODAL] Error response data:', data)
        } catch (parseError) {
          console.error('[ADDRESS-MODAL] Could not parse error response as JSON:', parseError)
          data = { message: responseText || 'Failed to add address' }
        }

        const errorMessage = data.message || 'Failed to add address'
        console.error('[ADDRESS-MODAL] Setting error message:', errorMessage)
        setError(errorMessage)
        console.log('[ADDRESS-MODAL] ========== FORM SUBMISSION COMPLETE (FAILED) ==========')
      }
    } catch (error) {
      console.error('[ADDRESS-MODAL] ❌ EXCEPTION caught during address creation!')
      console.error('[ADDRESS-MODAL] Error type:', error?.constructor?.name)
      console.error('[ADDRESS-MODAL] Error message:', error instanceof Error ? error.message : String(error))
      console.error('[ADDRESS-MODAL] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('[ADDRESS-MODAL] Full error object:', error)

      setError('Failed to add address. Please try again.')
      console.log('[ADDRESS-MODAL] ========== FORM SUBMISSION COMPLETE (EXCEPTION) ==========')
    } finally {
      setSubmitting(false)
      console.log('[ADDRESS-MODAL] Submitting state set to false')
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setError('')
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Address"
      description="Enter the address details below"
      size="lg"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Address Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Type <span className="text-red-500">*</span>
            </label>
            <select
              value={addressType}
              onChange={(e) => setAddressType(e.target.value as 'HOME' | 'WORK' | 'OTHER')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            >
              <option value="HOME">Home</option>
              <option value="WORK">Work</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="House/Flat no., Building name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Street, Area"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Pincode and Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setPincode(value)
                }}
                placeholder="6-digit pincode"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby landmark"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Set as Default */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={submitting}
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Set as default address
            </label>
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Address'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
