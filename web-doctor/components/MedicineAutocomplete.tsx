'use client'

import { useState, useEffect, useRef } from 'react'
import { searchMedicines, Medicine } from '@/lib/api/digital-prescriptions'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface MedicineAutocompleteProps {
  value: string
  onChange: (value: string, genericName?: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function MedicineAutocomplete({
  value,
  onChange,
  placeholder = 'Search medicine...',
  disabled = false,
}: MedicineAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const justSelectedRef = useRef(false)
  const initializedRef = useRef(false)

  // Only sync with parent value on mount or when externally cleared
  useEffect(() => {
    console.log('🔵 [MedicineAutocomplete] useEffect triggered', {
      initialized: initializedRef.current,
      parentValue: value,
      localQuery: query,
    });

    if (!initializedRef.current) {
      // First mount - initialize from parent
      console.log('🔵 [MedicineAutocomplete] First mount - initializing from parent value');
      initializedRef.current = true
      setQuery(value)
    } else if (value === '' && query !== '') {
      // Parent cleared the value - sync local state
      console.log('🔵 [MedicineAutocomplete] Parent cleared value - syncing local state');
      setQuery('')
    } else {
      console.log('🔵 [MedicineAutocomplete] No sync needed - maintaining local state');
    }
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
    console.log('🔵 [MedicineAutocomplete] handleInputChange called:', {
      inputValue,
      previousQuery: query,
    });
    setQuery(inputValue)
    // Don't call onChange during typing - only when an item is selected from dropdown
    // This prevents search text (e.g., "para") from being saved instead of selected medicine name (e.g., "PARACETAMOL (Crocin) - Tablet 500mg")
    // onChange(inputValue) // <-- REMOVED

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.trim().length < 2) {
      console.log('🔵 [MedicineAutocomplete] Query too short, clearing results');
      setMedicines([])
      setShowDropdown(false)
      return
    }

    console.log('🔵 [MedicineAutocomplete] Scheduling search with 300ms debounce');
    debounceRef.current = setTimeout(async () => {
      console.log('🔵 [MedicineAutocomplete] Executing debounced search for:', inputValue);
      setLoading(true)
      try {
        const results = await searchMedicines(inputValue, 20)
        console.log('✅ [MedicineAutocomplete] Search results received:', results.length);
        setMedicines(results)
        setShowDropdown(results.length > 0)
      } catch (error) {
        console.error('❌ [MedicineAutocomplete] Medicine search failed:', error)
        setMedicines([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (medicine: Medicine) => {
    // Mark that we just selected from dropdown to prevent handleBlur from overwriting
    justSelectedRef.current = true

    // Format: "GENERIC NAME (Brand Name) - Form Strength"
    const displayName = medicine.brandNames && medicine.brandNames.length > 0
      ? `${medicine.genericName.toUpperCase()} (${medicine.brandNames[0]})${medicine.form ? ` - ${medicine.form}` : ''}${medicine.strength ? ` ${medicine.strength}` : ''}`
      : `${medicine.genericName.toUpperCase()}${medicine.form ? ` - ${medicine.form}` : ''}${medicine.strength ? ` ${medicine.strength}` : ''}`

    console.log('🔵 [MedicineAutocomplete] handleSelect called:', {
      displayName,
      genericName: medicine.genericName,
      query: query,
    })

    setQuery(displayName)
    onChange(displayName, medicine.genericName)
    setShowDropdown(false)
  }

  const handleBlur = () => {
    console.log('🔵 [MedicineAutocomplete] handleBlur called:', {
      query,
      parentValue: value,
      justSelected: justSelectedRef.current,
    });

    // If user typed custom medicine name (not from dropdown), save it when field loses focus
    setTimeout(() => {
      console.log('🔵 [MedicineAutocomplete] handleBlur timeout executing:', {
        query,
        parentValue: value,
        justSelected: justSelectedRef.current,
      });

      // If user just selected from dropdown, don't override the selection
      if (justSelectedRef.current) {
        console.log('✅ [MedicineAutocomplete] Item was just selected, skipping blur handler');
        justSelectedRef.current = false
        setShowDropdown(false)
        return
      }

      // Delay to allow click on dropdown to register first
      if (query.trim() && query !== value) {
        console.log('🔵 [MedicineAutocomplete] Saving custom medicine name from blur:', query.trim());
        onChange(query.trim())
      } else {
        console.log('🔵 [MedicineAutocomplete] No custom value to save');
      }
      setShowDropdown(false)
    }, 200)
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
            if (medicines.length > 0) setShowDropdown(true)
          }}
          onBlur={handleBlur}
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
      {showDropdown && medicines.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {medicines.map((medicine) => (
            <button
              key={medicine._id}
              type="button"
              onClick={() => handleSelect(medicine)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">
                {medicine.genericName.toUpperCase()}
                {medicine.brandNames && medicine.brandNames.length > 0 && (
                  <span className="text-gray-600 font-normal">
                    {' '}({medicine.brandNames.slice(0, 2).join(', ')})
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {medicine.form && <span>{medicine.form}</span>}
                {medicine.strength && <span> • {medicine.strength}</span>}
                {medicine.manufacturer && <span> • {medicine.manufacturer}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && !loading && query.trim().length >= 2 && medicines.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No medicines found. You can still enter a custom medicine name.
          </p>
        </div>
      )}
    </div>
  )
}
