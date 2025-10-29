'use client'

import { useState, useEffect, useRef } from 'react'
import { searchSymptoms, Symptom } from '@/lib/api/digital-prescriptions'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SymptomsAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function SymptomsAutocomplete({
  value,
  onChange,
  placeholder = 'Search and add symptoms...',
  disabled = false,
}: SymptomsAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const justSelectedRef = useRef(false)

  // Initialize selectedSymptoms from value
  useEffect(() => {
    if (value && value.trim()) {
      const symptomsArray = value.split(',').map(s => s.trim()).filter(s => s)
      setSelectedSymptoms(symptomsArray)
    } else {
      setSelectedSymptoms([])
    }
  }, [])

  // Update parent when selected symptoms change
  useEffect(() => {
    onChange(selectedSymptoms.join(', '))
  }, [selectedSymptoms])

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (inputValue: string) => {
    setQuery(inputValue)

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.trim().length < 2) {
      setSymptoms([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await searchSymptoms(inputValue, 20)
        setSymptoms(results)
        setShowDropdown(results.length > 0)
      } catch (error) {
        console.error('Symptom search failed:', error)
        setSymptoms([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (symptom: Symptom) => {
    // Mark that we just selected from dropdown
    justSelectedRef.current = true

    // Add symptom if not already selected
    if (!selectedSymptoms.includes(symptom.symptomName)) {
      setSelectedSymptoms([...selectedSymptoms, symptom.symptomName])
    }
    setQuery('')
    setShowDropdown(false)
    setSymptoms([])

    // Reset flag after a short delay
    setTimeout(() => {
      justSelectedRef.current = false
    }, 100)
  }

  const removeSymptom = (symptomToRemove: string) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomToRemove))
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected symptoms tags */}
      {selectedSymptoms.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSymptoms.map((symptom, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {symptom}
              <button
                type="button"
                onClick={() => removeSymptom(symptom)}
                disabled={disabled}
                className="hover:text-blue-900"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (symptoms.length > 0) setShowDropdown(true)
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="input-field pl-10 pr-4"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && symptoms.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {symptoms.map((symptom) => (
            <button
              key={symptom._id}
              type="button"
              onClick={() => handleSelect(symptom)}
              disabled={selectedSymptoms.includes(symptom.symptomName)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-gray-900">
                {symptom.symptomName}
                {selectedSymptoms.includes(symptom.symptomName) && (
                  <span className="text-green-600 text-sm ml-2">✓ Added</span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {symptom.category && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{symptom.category}</span>}
                {symptom.severityLevels && symptom.severityLevels.length > 0 && (
                  <span className="ml-2 text-xs">• {symptom.severityLevels.join(', ')}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && !loading && query.trim().length >= 2 && symptoms.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No symptoms found in database.
          </p>
        </div>
      )}
    </div>
  )
}
