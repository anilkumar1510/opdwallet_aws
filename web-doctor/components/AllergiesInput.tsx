'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface Allergies {
  hasKnownAllergies: boolean
  drugAllergies: string[]
  foodAllergies: string[]
  otherAllergies: string[]
}

interface AllergiesInputProps {
  allergies: Allergies
  onChange: (allergies: Allergies) => void
}

export default function AllergiesInput({ allergies, onChange }: AllergiesInputProps) {
  const [newDrugAllergy, setNewDrugAllergy] = useState('')
  const [newFoodAllergy, setNewFoodAllergy] = useState('')
  const [newOtherAllergy, setNewOtherAllergy] = useState('')

  const handleHasAllergiesChange = (value: boolean) => {
    onChange({
      ...allergies,
      hasKnownAllergies: value,
      drugAllergies: value ? allergies.drugAllergies : [],
      foodAllergies: value ? allergies.foodAllergies : [],
      otherAllergies: value ? allergies.otherAllergies : [],
    })
  }

  const addAllergy = (type: 'drug' | 'food' | 'other', value: string) => {
    if (!value.trim()) return

    const updated = { ...allergies }
    if (type === 'drug') {
      updated.drugAllergies = [...updated.drugAllergies, value.trim()]
      setNewDrugAllergy('')
    } else if (type === 'food') {
      updated.foodAllergies = [...updated.foodAllergies, value.trim()]
      setNewFoodAllergy('')
    } else {
      updated.otherAllergies = [...updated.otherAllergies, value.trim()]
      setNewOtherAllergy('')
    }
    onChange(updated)
  }

  const removeAllergy = (type: 'drug' | 'food' | 'other', index: number) => {
    const updated = { ...allergies }
    if (type === 'drug') {
      updated.drugAllergies = updated.drugAllergies.filter((_, i) => i !== index)
    } else if (type === 'food') {
      updated.foodAllergies = updated.foodAllergies.filter((_, i) => i !== index)
    } else {
      updated.otherAllergies = updated.otherAllergies.filter((_, i) => i !== index)
    }
    onChange(updated)
  }

  return (
    <div className="card border-2 border-orange-200 bg-orange-50/30">
      <div className="flex items-center space-x-2 mb-4">
        <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Allergies</h3>
        <span className="text-sm text-gray-500">(Important)</span>
      </div>

      {/* Has Known Allergies Toggle */}
      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allergies.hasKnownAllergies}
            onChange={(e) => handleHasAllergiesChange(e.target.checked)}
            className="h-4 w-4 text-[#2B4D8C] focus:ring-[#2B4D8C] border-gray-300 rounded"
          />
          <span className="font-medium text-gray-900">Patient has known allergies</span>
        </label>
      </div>

      {/* Allergy Inputs (shown only if has allergies) */}
      {allergies.hasKnownAllergies && (
        <div className="space-y-6">
          {/* Drug Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drug Allergies
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="e.g., Penicillin, Aspirin"
                value={newDrugAllergy}
                onChange={(e) => setNewDrugAllergy(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAllergy('drug', newDrugAllergy)
                  }
                }}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => addAllergy('drug', newDrugAllergy)}
                className="btn-secondary px-3"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.drugAllergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeAllergy('drug', index)}
                    className="ml-2 hover:text-red-900"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Food Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Allergies
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="e.g., Peanuts, Shellfish"
                value={newFoodAllergy}
                onChange={(e) => setNewFoodAllergy(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAllergy('food', newFoodAllergy)
                  }
                }}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => addAllergy('food', newFoodAllergy)}
                className="btn-secondary px-3"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.foodAllergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeAllergy('food', index)}
                    className="ml-2 hover:text-yellow-900"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Other Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Allergies
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="e.g., Latex, Pollen"
                value={newOtherAllergy}
                onChange={(e) => setNewOtherAllergy(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAllergy('other', newOtherAllergy)
                  }
                }}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => addAllergy('other', newOtherAllergy)}
                className="btn-secondary px-3"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.otherAllergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeAllergy('other', index)}
                    className="ml-2 hover:text-gray-900"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NKDA Message */}
      {!allergies.hasKnownAllergies && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            NKDA - No Known Drug Allergies
          </p>
        </div>
      )}
    </div>
  )
}
