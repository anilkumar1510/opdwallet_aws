'use client'

import { useState, FormEvent, useEffect } from 'react'
import { createDigitalPrescription, generatePrescriptionPDF, MedicineItem, LabTestItem } from '@/lib/api/digital-prescriptions'
import MedicineAutocomplete from './MedicineAutocomplete'
import DiagnosisAutocomplete from './DiagnosisAutocomplete'
import SymptomsAutocomplete from './SymptomsAutocomplete'
import VitalsInput, { Vitals } from './VitalsInput'
import AllergiesInput, { Allergies } from './AllergiesInput'
import TemplateSelector from './TemplateSelector'
import { createTemplate, PrescriptionTemplate } from '@/lib/api/templates'
import {
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookmarkIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'

interface DigitalPrescriptionWriterProps {
  appointmentId: string
  onSuccess?: () => void
}

const FREQUENCY_OPTIONS = ['OD (Once Daily)', 'BD (Twice Daily)', 'TDS (Thrice Daily)', 'QID (Four Times Daily)', 'SOS (If Needed)', 'STAT (Immediately)']
const ROUTE_OPTIONS = ['Oral', 'IV (Intravenous)', 'IM (Intramuscular)', 'SC (Subcutaneous)', 'Topical', 'Nasal', 'Inhalation', 'Rectal']
const INSTRUCTION_OPTIONS = ['Before Food', 'After Food', 'With Food', 'On Empty Stomach', 'At Bedtime', 'As Directed']

export default function DigitalPrescriptionWriter({
  appointmentId,
  onSuccess,
}: DigitalPrescriptionWriterProps) {
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null)
  const [signatureStatus, setSignatureStatus] = useState<{ hasSignature: boolean; signatureUrl?: string } | null>(null)

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [clinicalFindings, setClinicalFindings] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [generalInstructions, setGeneralInstructions] = useState('')
  const [dietaryAdvice, setDietaryAdvice] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpInstructions, setFollowUpInstructions] = useState('')

  const [vitals, setVitals] = useState<Vitals>({})
  const [allergies, setAllergies] = useState<Allergies>({
    hasKnownAllergies: false,
    drugAllergies: [],
    foodAllergies: [],
    otherAllergies: [],
  })

  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      medicineName: '',
      genericName: '',
      dosage: '',
      frequency: 'BD (Twice Daily)',
      duration: '5 days',
      route: 'Oral',
      instructions: 'After Food',
    },
  ])

  const [labTests, setLabTests] = useState<LabTestItem[]>([])

  // Fetch doctor's signature status on component mount
  useEffect(() => {
    const fetchSignatureStatus = async () => {
      try {
        const response = await fetch('/doctor/api/auth/doctor/profile/signature/status', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setSignatureStatus({
            hasSignature: data.hasSignature,
            signatureUrl: data.hasSignature ? `/doctor/api/auth/doctor/profile/signature?t=${Date.now()}` : undefined
          })
        }
      } catch (err) {
        console.error('Failed to fetch signature status:', err)
      }
    }
    fetchSignatureStatus()
  }, [])

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: '',
        genericName: '',
        dosage: '',
        frequency: 'BD (Twice Daily)',
        duration: '5 days',
        route: 'Oral',
        instructions: 'After Food',
      },
    ])
  }

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const updateMedicine = (index: number, field: keyof MedicineItem, value: string) => {
    console.log('🔵 [DigitalPrescriptionWriter] updateMedicine called:', {
      index,
      field,
      value,
      currentValue: medicines[index]?.[field],
    })
    const updated = [...medicines]
    updated[index] = { ...updated[index], [field]: value }
    setMedicines(updated)
    console.log('✅ [DigitalPrescriptionWriter] Medicine updated:', updated[index])
  }

  const addLabTest = () => {
    setLabTests([...labTests, { testName: '', instructions: '' }])
  }

  const removeLabTest = (index: number) => {
    setLabTests(labTests.filter((_, i) => i !== index))
  }

  const updateLabTest = (index: number, field: keyof LabTestItem, value: string) => {
    const updated = [...labTests]
    updated[index] = { ...updated[index], [field]: value }
    setLabTests(updated)
  }

  const loadTemplate = (template: PrescriptionTemplate) => {
    // Load template data into form
    setDiagnosis(template.diagnosis || '')
    setMedicines(template.medicines && template.medicines.length > 0 ? template.medicines : [{
      medicineName: '',
      genericName: '',
      dosage: '',
      frequency: 'BD (Twice Daily)',
      duration: '5 days',
      route: 'Oral',
      instructions: 'After Food',
    }])
    setLabTests(template.labTests || [])
    setGeneralInstructions(template.generalInstructions || '')
    setDietaryAdvice(template.dietaryAdvice || '')
  }

  const saveAsTemplate = async () => {
    const templateName = prompt('Enter a name for this template:')
    if (!templateName) return

    const description = prompt('Enter a description (optional):')

    const validMedicines = medicines.filter(m => m.medicineName.trim() && m.dosage.trim())

    try {
      await createTemplate({
        templateName,
        description: description || undefined,
        diagnosis: diagnosis.trim() || undefined,
        medicines: validMedicines.length > 0 ? validMedicines : undefined,
        labTests: labTests.filter(t => t.testName.trim()).length > 0
          ? labTests.filter(t => t.testName.trim())
          : undefined,
        generalInstructions: generalInstructions.trim() || undefined,
        dietaryAdvice: dietaryAdvice.trim() || undefined,
      })

      alert('Template saved successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to save template')
    }
  }

  const handleSubmit = async (e: FormEvent, withPDF = false) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validate
    const validMedicines = medicines.filter(m => m.medicineName.trim() && m.dosage.trim())

    console.log('🔵 [DigitalPrescriptionWriter] Form submission:', {
      allMedicines: medicines,
      validMedicines,
      diagnosis: diagnosis.trim(),
    })

    if (!diagnosis.trim() && validMedicines.length === 0) {
      setError('Please provide at least a diagnosis or add medicines')
      setLoading(false)
      return
    }

    try {
      // Check if vitals has any values
      const hasVitals = Object.values(vitals).some(v => v !== undefined && v !== '')

      const prescriptionData = {
        appointmentId,
        chiefComplaint: chiefComplaint.trim() || undefined,
        clinicalFindings: clinicalFindings.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        medicines: validMedicines.length > 0 ? validMedicines : undefined,
        labTests: labTests.filter(t => t.testName.trim()).length > 0
          ? labTests.filter(t => t.testName.trim())
          : undefined,
        followUpDate: followUpDate || undefined,
        followUpInstructions: followUpInstructions.trim() || undefined,
        generalInstructions: generalInstructions.trim() || undefined,
        dietaryAdvice: dietaryAdvice.trim() || undefined,
        // Note: vitals and allergies are displayed but not sent to API
        // They're for doctor's reference only during consultation
      }

      console.log('🔵 [DigitalPrescriptionWriter] Sending prescription to API:', prescriptionData)

      const response = await createDigitalPrescription(prescriptionData)

      console.log('✅ [DigitalPrescriptionWriter] Prescription created successfully:', response.prescription.prescriptionId)

      setPrescriptionId(response.prescription.prescriptionId)
      setSuccess(true)

      // Generate PDF if requested
      if (withPDF) {
        setGeneratingPDF(true)
        try {
          await generatePrescriptionPDF(response.prescription.prescriptionId)
        } catch (pdfError: any) {
          console.error('PDF generation failed:', pdfError)
          setError('Prescription saved but PDF generation failed. You can generate it later.')
        } finally {
          setGeneratingPDF(false)
        }
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">
              Digital prescription created successfully!
            </h3>
            <p className="text-sm text-green-700">
              The patient can now view this prescription in their health records.
            </p>
            {generatingPDF && (
              <p className="text-xs text-green-600 mt-1">Generating PDF...</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Write Digital Prescription
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Template Selector */}
        <div className="pb-4 border-b border-gray-200">
          <TemplateSelector onSelect={loadTemplate} disabled={loading} />
        </div>

        {/* Clinical Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Clinical Information</h4>
            <button
              type="button"
              onClick={saveAsTemplate}
              className="text-sm text-[#2B4D8C] hover:text-[#1E3A6B] flex items-center gap-1"
              disabled={loading}
            >
              <BookmarkIcon className="h-4 w-4" />
              Save as Template
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaint / Symptoms
            </label>
            <SymptomsAutocomplete
              value={chiefComplaint}
              onChange={(value) => setChiefComplaint(value)}
              placeholder="Search and add symptoms (e.g., Fever, Cough)..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Search from database or type custom symptoms separated by commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Findings (Optional)
            </label>
            <textarea
              value={clinicalFindings}
              onChange={(e) => setClinicalFindings(e.target.value)}
              rows={2}
              className="input-field"
              placeholder="e.g., Temp: 100°F, Throat congestion noted, BP: 120/80"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis
            </label>
            <DiagnosisAutocomplete
              value={diagnosis}
              onChange={(value) => setDiagnosis(value)}
              placeholder="Search diagnosis (e.g., Upper Respiratory Tract Infection)..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Search from database with ICD-10 codes or type custom diagnosis
            </p>
          </div>
        </div>

        {/* Vitals */}
        <VitalsInput vitals={vitals} onChange={setVitals} />

        {/* Allergies */}
        <AllergiesInput allergies={allergies} onChange={setAllergies} />

        {/* Medicines */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Medicines (Rx)</h4>
            <button
              type="button"
              onClick={addMedicine}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
              disabled={loading}
            >
              <PlusIcon className="h-4 w-4" />
              Add Medicine
            </button>
          </div>

          {medicines.map((medicine, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Medicine {index + 1}</span>
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    className="text-red-600 hover:text-red-700"
                    disabled={loading}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <MedicineAutocomplete
                    value={medicine.medicineName}
                    onChange={(value, genericName) => {
                      console.log('🔵 [DigitalPrescriptionWriter] MedicineAutocomplete onChange:', {
                        index,
                        medicineName: value,
                        genericName,
                      });
                      // Update both fields in a single state update to avoid race condition
                      const updated = [...medicines]
                      updated[index] = {
                        ...updated[index],
                        medicineName: value,
                        ...(genericName && { genericName })
                      }
                      setMedicines(updated)
                      console.log('✅ [DigitalPrescriptionWriter] Medicine updated in single operation:', updated[index]);
                    }}
                    placeholder="Search medicine by generic or brand name..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dosage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={medicine.dosage}
                    onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    className="input-field text-sm"
                    placeholder="e.g., 500mg, 10ml"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Frequency
                  </label>
                  <select
                    value={medicine.frequency}
                    onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    className="input-field text-sm"
                    disabled={loading}
                  >
                    {FREQUENCY_OPTIONS.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={medicine.duration}
                    onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                    className="input-field text-sm"
                    placeholder="e.g., 5 days, 2 weeks"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Route
                  </label>
                  <select
                    value={medicine.route}
                    onChange={(e) => updateMedicine(index, 'route', e.target.value)}
                    className="input-field text-sm"
                    disabled={loading}
                  >
                    {ROUTE_OPTIONS.map(route => (
                      <option key={route} value={route}>{route}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Instructions
                  </label>
                  <select
                    value={medicine.instructions}
                    onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                    className="input-field text-sm"
                    disabled={loading}
                  >
                    {INSTRUCTION_OPTIONS.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lab Tests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Lab Tests / Investigations</h4>
            <button
              type="button"
              onClick={addLabTest}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
              disabled={loading}
            >
              <PlusIcon className="h-4 w-4" />
              Add Lab Test
            </button>
          </div>

          {labTests.length === 0 && (
            <p className="text-sm text-gray-500 italic">No lab tests added</p>
          )}

          {labTests.map((test, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Test {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeLabTest(index)}
                  className="text-red-600 hover:text-red-700"
                  disabled={loading}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Test Name
                  </label>
                  <input
                    type="text"
                    value={test.testName}
                    onChange={(e) => updateLabTest(index, 'testName', e.target.value)}
                    className="input-field text-sm"
                    placeholder="e.g., Complete Blood Count (CBC)"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={test.instructions || ''}
                    onChange={(e) => updateLabTest(index, 'instructions', e.target.value)}
                    className="input-field text-sm"
                    placeholder="e.g., Fasting required"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions & Follow-up */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Instructions & Follow-up</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Instructions
            </label>
            <textarea
              value={generalInstructions}
              onChange={(e) => setGeneralInstructions(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="e.g., Take adequate rest, drink plenty of fluids..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Advice (Optional)
            </label>
            <textarea
              value={dietaryAdvice}
              onChange={(e) => setDietaryAdvice(e.target.value)}
              rows={2}
              className="input-field"
              placeholder="e.g., Avoid spicy food, increase protein intake..."
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Date (Optional)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Instructions (Optional)
              </label>
              <input
                type="text"
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                className="input-field"
                placeholder="e.g., If symptoms persist"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Doctor Signature Preview */}
        {signatureStatus?.hasSignature && signatureStatus.signatureUrl && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Doctor Signature (will appear on prescription)</label>
            </div>
            <div className="bg-white p-3 rounded border border-gray-300 inline-block">
              <img
                src={signatureStatus.signatureUrl}
                alt="Doctor Signature"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}

        {!signatureStatus?.hasSignature && signatureStatus !== null && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start gap-3">
            <PencilSquareIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Signature Required</p>
              <p className="text-xs text-yellow-700 mt-1">
                Please upload your signature in{' '}
                <a href="/doctor/doctorview/profile" className="underline font-medium">Profile Settings</a>
                {' '}before creating prescriptions.
              </p>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading || generatingPDF}
            className="flex-1 btn-primary py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Digital Prescription'
            )}
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || generatingPDF}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPDF ? 'Generating PDF...' : 'Save & Generate PDF'}
          </button>
        </div>
      </form>
    </div>
  )
}
