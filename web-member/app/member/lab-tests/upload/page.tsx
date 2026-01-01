'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import AddAddressModal from '@/components/AddAddressModal'
import PageHeader from '@/components/ui/PageHeader'
import DetailCard from '@/components/ui/DetailCard'
import CTAButton from '@/components/ui/CTAButton'

interface FamilyMember {
  userId: string
  name: string
  relationship: string
}

interface Address {
  _id: string
  addressId: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export default function UploadPrescriptionPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientRelationship, setPatientRelationship] = useState('SELF')
  const [prescriptionDate, setPrescriptionDate] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [user, setUser] = useState<any>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchAddresses()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)

        // Pre-fill with user's own info
        setPatientName(userData.name?.fullName || '')
        setPatientId(userData.userId)
        setPatientRelationship('SELF')

        // Extract family members from user profile
        const members: FamilyMember[] = [
          {
            userId: userData.userId,
            name: userData.name?.fullName || 'Self',
            relationship: 'SELF'
          }
        ]

        // Add family members if they exist
        if (userData.profile?.familyMembers && Array.isArray(userData.profile.familyMembers)) {
          userData.profile.familyMembers.forEach((member: any) => {
            members.push({
              userId: member.userId || userData.userId,
              name: member.name || 'Unknown',
              relationship: member.relationship || 'OTHER'
            })
          })
        }

        setFamilyMembers(members)
        console.log('[UPLOAD] User data loaded:', userData)
        console.log('[UPLOAD] Family members:', members)
      }
    } catch (error) {
      console.error('[UPLOAD] Error fetching user:', error)
    }
  }

  const fetchAddresses = useCallback(async () => {
    console.log('[ADDRESS-UPLOAD] ========== FETCHING ADDRESSES START ==========')
    try {
      const apiUrl = '/api/member/addresses'
      console.log('[ADDRESS-UPLOAD] API URL:', apiUrl)
      console.log('[ADDRESS-UPLOAD] Request credentials: include')

      console.log('[ADDRESS-UPLOAD] Initiating fetch request...')
      const response = await fetch(apiUrl, {
        credentials: 'include',
      })

      console.log('[ADDRESS-UPLOAD] Response received!')
      console.log('[ADDRESS-UPLOAD] Response status:', response.status)
      console.log('[ADDRESS-UPLOAD] Response statusText:', response.statusText)
      console.log('[ADDRESS-UPLOAD] Response ok:', response.ok)
      console.log('[ADDRESS-UPLOAD] Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        console.log('[ADDRESS-UPLOAD] Response OK, parsing JSON...')
        const data = await response.json()
        console.log('[ADDRESS-UPLOAD] Parsed response data:', JSON.stringify(data, null, 2))

        console.log('[ADDRESS-UPLOAD] Checking data structure...')
        console.log('[ADDRESS-UPLOAD] data.success:', data.success)
        console.log('[ADDRESS-UPLOAD] Array.isArray(data.data):', Array.isArray(data.data))

        if (data.success && Array.isArray(data.data)) {
          console.log('[ADDRESS-UPLOAD] ✅ Data structure is valid')
          console.log('[ADDRESS-UPLOAD] Number of addresses:', data.data.length)
          console.log('[ADDRESS-UPLOAD] Addresses array:', data.data)

          console.log('[ADDRESS-UPLOAD] Setting addresses state...')
          setAddresses(data.data)

          // Auto-select default address
          console.log('[ADDRESS-UPLOAD] Looking for default address...')
          const defaultAddress = data.data.find((addr: Address) => addr.isDefault)
          console.log('[ADDRESS-UPLOAD] Default address found:', defaultAddress)

          if (defaultAddress) {
            console.log('[ADDRESS-UPLOAD] Setting default address ID:', defaultAddress._id)
            setSelectedAddressId(defaultAddress._id)
          } else {
            console.log('[ADDRESS-UPLOAD] No default address found')
          }

          console.log('[ADDRESS-UPLOAD] ✅ Addresses loaded successfully:', data.data.length, 'addresses')
        } else {
          console.warn('[ADDRESS-UPLOAD] ⚠️ Unexpected data structure:', {
            success: data.success,
            isArray: Array.isArray(data.data),
            dataType: typeof data.data,
            data: data
          })
        }
      } else {
        console.error('[ADDRESS-UPLOAD] ❌ Response not OK')
        const responseText = await response.text()
        console.error('[ADDRESS-UPLOAD] Error response body:', responseText)
      }

      console.log('[ADDRESS-UPLOAD] ========== FETCHING ADDRESSES COMPLETE ==========')
    } catch (error) {
      console.error('[ADDRESS-UPLOAD] ❌ EXCEPTION caught while fetching addresses!')
      console.error('[ADDRESS-UPLOAD] Error type:', error?.constructor?.name)
      console.error('[ADDRESS-UPLOAD] Error message:', error instanceof Error ? error.message : String(error))
      console.error('[ADDRESS-UPLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('[ADDRESS-UPLOAD] Full error object:', error)
      console.log('[ADDRESS-UPLOAD] ========== FETCHING ADDRESSES COMPLETE (EXCEPTION) ==========')
    }
  }, [])

  const handleCloseAddressModal = useCallback(() => {
    setIsAddressModalOpen(false)
  }, [])

  const handleFamilyMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMember = familyMembers.find(m => m.userId === e.target.value)
    if (selectedMember) {
      setPatientId(selectedMember.userId)
      setPatientName(selectedMember.name)
      setPatientRelationship(selectedMember.relationship)
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

    if (!prescriptionDate) {
      console.error('[UPLOAD] Prescription date not selected')
      alert('Please select prescription date')
      return
    }

    if (!selectedAddressId) {
      console.error('[UPLOAD] Address not selected')
      alert('Please select an address')
      return
    }

    if (!user?.userId) {
      console.error('[UPLOAD] User ID not available:', user)
      alert('User session error. Please refresh and try again.')
      return
    }

    // Get selected address to extract pincode
    const selectedAddress = addresses.find(addr => addr._id === selectedAddressId)
    if (!selectedAddress) {
      alert('Selected address not found')
      return
    }

    setUploading(true)

    try {
      console.log('[UPLOAD] Preparing FormData...')
      const formData = new FormData()

      // Required fields as per backend DTO
      formData.append('file', file)
      formData.append('patientId', patientId)
      formData.append('patientName', patientName.trim())
      formData.append('patientRelationship', patientRelationship)
      formData.append('prescriptionDate', prescriptionDate)
      formData.append('addressId', selectedAddressId)
      formData.append('pincode', selectedAddress.pincode)
      if (notes.trim()) formData.append('notes', notes.trim())

      console.log('[UPLOAD] FormData prepared:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        patientId,
        patientName: patientName.trim(),
        patientRelationship,
        prescriptionDate,
        addressId: selectedAddressId,
        pincode: selectedAddress.pincode,
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
    <div className="min-h-screen" style={{ background: '#f7f7fc' }}>
      <PageHeader
        title="Upload Prescription"
        subtitle="Upload your lab test prescription"
        onBack={() => router.back()}
      />

      <div className="max-w-[480px] mx-auto lg:max-w-2xl px-4 lg:px-6 py-6 lg:py-8 space-y-4 lg:space-y-5">
        {/* Upload Area */}
        <DetailCard variant="primary">
          <h3 className="text-base lg:text-lg font-semibold mb-4" style={{ color: '#0E51A2' }}>Select Prescription File</h3>

          {!file ? (
            <label className="block">
              <div className="border-2 border-dashed rounded-xl p-6 lg:p-8 transition-all cursor-pointer"
                style={{ borderColor: '#86ACD8' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
              >
                <div className="text-center">
                  <CloudArrowUpIcon className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-3 lg:mb-4" style={{ color: '#0F5FDC' }} />
                  <p className="text-sm lg:text-base font-medium mb-2" style={{ color: '#0E51A2' }}>
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs lg:text-sm text-gray-500">
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
            <div className="space-y-3 lg:space-y-4">
              {/* Preview */}
              <div className="border-2 rounded-xl p-4" style={{ borderColor: '#86ACD8' }}>
                {preview ? (
                  <img
                    src={preview}
                    alt="Prescription preview"
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <DocumentTextIcon className="h-12 w-12 lg:h-16 lg:w-16" style={{ color: '#0F5FDC' }} />
                  </div>
                )}
              </div>

              {/* File Info */}
              <DetailCard variant="secondary">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm lg:text-base font-medium" style={{ color: '#0E51A2' }}>{file.name}</p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                    }}
                    className="text-xs lg:text-sm font-medium hover:opacity-80"
                    style={{ color: '#E53535' }}
                  >
                    Remove
                  </button>
                </div>
              </DetailCard>
            </div>
          )}
        </DetailCard>

        {/* Patient Information */}
        {file && (
          <DetailCard variant="primary">
            <h3 className="text-base lg:text-lg font-semibold mb-4" style={{ color: '#0E51A2' }}>Patient Information</h3>
            <div className="space-y-4">
              {/* Family Member Selection */}
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                  Select Patient <span style={{ color: '#E53535' }}>*</span>
                </label>
                <select
                  value={patientId}
                  onChange={handleFamilyMemberChange}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 rounded-xl focus:outline-none transition-all bg-white text-sm lg:text-base"
                  style={{ borderColor: '#86ACD8' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
                  required
                >
                  {familyMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name} {member.relationship !== 'SELF' && `(${member.relationship})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prescription Date */}
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                  Prescription Date <span style={{ color: '#E53535' }}>*</span>
                </label>
                <input
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 rounded-xl focus:outline-none transition-all text-sm lg:text-base"
                  style={{ borderColor: '#86ACD8' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
                  required
                />
              </div>

              {/* Address Selection */}
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                  Select Address <span style={{ color: '#E53535' }}>*</span>
                </label>
                {addresses.length === 0 ? (
                  <DetailCard variant="secondary">
                    <p className="text-xs lg:text-sm text-gray-600 mb-3">
                      No addresses found. Please add an address first.
                    </p>
                    <CTAButton
                      onClick={() => {
                        console.log('[ADDRESS-UPLOAD] "Add New Address" button clicked')
                        console.log('[ADDRESS-UPLOAD] Opening address modal...')
                        setIsAddressModalOpen(true)
                        console.log('[ADDRESS-UPLOAD] Modal state set to open')
                      }}
                      variant="primary"
                      fullWidth
                    >
                      Add New Address
                    </CTAButton>
                  </DetailCard>
                ) : (
                  <select
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 rounded-xl focus:outline-none transition-all bg-white text-sm lg:text-base"
                    style={{ borderColor: '#86ACD8' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
                    required
                  >
                    <option value="">Select an address</option>
                    {addresses.map((address) => (
                      <option key={address._id} value={address._id}>
                        {address.addressLine1}, {address.city} - {address.pincode}
                        {address.isDefault && ' (Default)'}
                      </option>
                    ))}
                  </select>
                )}
                {selectedAddressId && addresses.find(addr => addr._id === selectedAddressId) && (
                  <div className="mt-2 p-2 lg:p-3 rounded-lg text-xs lg:text-sm" style={{ background: '#EFF4FF', color: '#0F5FDC' }}>
                    <strong>Pincode:</strong> {addresses.find(addr => addr._id === selectedAddressId)?.pincode}
                  </div>
                )}
              </div>
            </div>
          </DetailCard>
        )}

        {/* Notes */}
        {file && (
          <DetailCard variant="primary">
            <h3 className="text-base lg:text-lg font-semibold mb-4" style={{ color: '#0E51A2' }}>Additional Notes (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific instructions or information..."
              rows={4}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border-2 rounded-xl focus:outline-none transition-all text-sm lg:text-base"
              style={{ borderColor: '#86ACD8' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#0F5FDC'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#86ACD8'}
            />
          </DetailCard>
        )}

        {/* Info Card */}
        <DetailCard variant="secondary">
          <h4 className="text-sm lg:text-base font-semibold mb-3" style={{ color: '#0E51A2' }}>What happens next?</h4>
          <ul className="space-y-2 text-xs lg:text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2 font-medium" style={{ color: '#0F5FDC' }}>1.</span>
              <span>Your prescription will be reviewed by our team</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-medium" style={{ color: '#0F5FDC' }}>2.</span>
              <span>We&apos;ll create a cart with all the tests from your prescription</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-medium" style={{ color: '#0F5FDC' }}>3.</span>
              <span>You&apos;ll be notified once your cart is ready for review</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-medium" style={{ color: '#0F5FDC' }}>4.</span>
              <span>Select a lab partner and book your slot</span>
            </li>
          </ul>
        </DetailCard>

        {/* Upload Button */}
        {file && (
          <CTAButton
            onClick={handleUpload}
            disabled={uploading}
            variant="primary"
            fullWidth
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                Uploading...
              </span>
            ) : (
              'Upload Prescription'
            )}
          </CTAButton>
        )}
      </div>

      {/* Add Address Modal */}
      <AddAddressModal
        isOpen={isAddressModalOpen}
        onClose={handleCloseAddressModal}
        onAddressAdded={fetchAddresses}
        userId={user?.userId || ''}
      />
    </div>
  )
}
