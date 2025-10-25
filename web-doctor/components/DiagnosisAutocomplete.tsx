'use client'

import { useState, useEffect, useRef } from 'react'
import { searchDiagnoses, Diagnosis } from '@/lib/api/digital-prescriptions'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface DiagnosisAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function DiagnosisAutocomplete({
  value,
  onChange,
  placeholder = 'Search diagnosis...',
  disabled = false,
}: DiagnosisAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setQuery(value)
  }, [value])

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
    onChange(inputValue)

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.trim().length < 2) {
      setDiagnoses([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await searchDiagnoses(inputValue, 20)
        setDiagnoses(results)
        setShowDropdown(results.length > 0)
      } catch (error) {
        console.error('Diagnosis search failed:', error)
        setDiagnoses([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (diagnosis: Diagnosis) => {
    // Format: "Diagnosis Name (ICD Code)"
    const displayName = diagnosis.icdCode
      ? `${diagnosis.diagnosisName} (${diagnosis.icdCode})`
      : diagnosis.diagnosisName

    setQuery(displayName)
    onChange(displayName)
    setShowDropdown(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (diagnoses.length > 0) setShowDropdown(true)
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
      {showDropdown && diagnoses.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {diagnoses.map((diagnosis) => (
            <button
              key={diagnosis._id}
              type="button"
              onClick={() => handleSelect(diagnosis)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">
                {diagnosis.diagnosisName}
                {diagnosis.icdCode && (
                  <span className="text-gray-600 font-normal text-sm ml-2">
                    ({diagnosis.icdCode})
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {diagnosis.category && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{diagnosis.category}</span>}
                {diagnosis.description && <span className="ml-2">{diagnosis.description.slice(0, 60)}...</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && !loading && query.trim().length >= 2 && diagnoses.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No diagnoses found. You can still enter a custom diagnosis.
          </p>
        </div>
      )}
    </div>
  )
}
