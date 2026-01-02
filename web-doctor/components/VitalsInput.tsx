'use client'

import { HeartIcon } from '@heroicons/react/24/outline'

export interface Vitals {
  bloodPressure?: string
  pulse?: number
  temperature?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
  bmi?: number
}

interface VitalsInputProps {
  vitals: Vitals
  onChange: (vitals: Vitals) => void
}

export default function VitalsInput({ vitals, onChange }: VitalsInputProps) {
  const handleChange = (field: keyof Vitals, value: string) => {
    const updatedVitals = { ...vitals }

    if (field === 'bloodPressure') {
      updatedVitals[field] = value
    } else {
      updatedVitals[field] = value ? parseFloat(value) : undefined
    }

    // Auto-calculate BMI if both height and weight are provided
    if ((field === 'height' || field === 'weight') && updatedVitals.height && updatedVitals.weight) {
      const heightInMeters = updatedVitals.height / 100
      updatedVitals.bmi = parseFloat((updatedVitals.weight / (heightInMeters * heightInMeters)).toFixed(1))
    }

    onChange(updatedVitals)
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <HeartIcon className="h-5 w-5 text-[#2B4D8C]" />
        <h3 className="text-lg font-semibold text-gray-900">Vitals</h3>
        <span className="text-sm text-gray-500">(Optional)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Blood Pressure */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blood Pressure
          </label>
          <input
            type="text"
            placeholder="120/80"
            value={vitals.bloodPressure || ''}
            onChange={(e) => handleChange('bloodPressure', e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">mmHg (e.g., 120/80)</p>
        </div>

        {/* Pulse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pulse
          </label>
          <input
            type="number"
            placeholder="72"
            value={vitals.pulse || ''}
            onChange={(e) => handleChange('pulse', e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">bpm</p>
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="98.6"
            value={vitals.temperature || ''}
            onChange={(e) => handleChange('temperature', e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">°F</p>
        </div>

        {/* Respiratory Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Respiratory Rate
          </label>
          <input
            type="number"
            placeholder="16"
            value={vitals.respiratoryRate || ''}
            onChange={(e) => handleChange('respiratoryRate', e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">breaths/min</p>
        </div>

        {/* Oxygen Saturation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SpO₂
          </label>
          <input
            type="number"
            placeholder="98"
            value={vitals.oxygenSaturation || ''}
            onChange={(e) => handleChange('oxygenSaturation', e.target.value)}
            className="input w-full"
            max="100"
          />
          <p className="text-xs text-gray-500 mt-1">%</p>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="70"
            value={vitals.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">kg</p>
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height
          </label>
          <input
            type="number"
            placeholder="170"
            value={vitals.height || ''}
            onChange={(e) => handleChange('height', e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-gray-500 mt-1">cm</p>
        </div>

        {/* BMI (Auto-calculated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            BMI
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.bmi || ''}
            className="input w-full bg-gray-50"
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
        </div>
      </div>
    </div>
  )
}
