'use client'

import { useState, useEffect } from 'react'
import { getTemplates, PrescriptionTemplate, incrementTemplateUsage } from '@/lib/api/templates'
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline'

interface TemplateSelectorProps {
  onSelect: (template: PrescriptionTemplate) => void
  disabled?: boolean
}

export default function TemplateSelector({ onSelect, disabled }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await getTemplates()
      setTemplates(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (template: PrescriptionTemplate) => {
    setSelectedId(template.templateId)

    // Increment usage count
    try {
      await incrementTemplateUsage(template.templateId)
    } catch (err) {
      console.error('Failed to increment template usage:', err)
    }

    onSelect(template)
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading templates...</div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">{error}</div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No templates available. Save a prescription as a template to reuse it later.
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Load from Template (Optional)
      </label>
      <select
        value={selectedId}
        onChange={(e) => {
          const template = templates.find(t => t.templateId === e.target.value)
          if (template) {
            handleSelect(template)
          }
        }}
        className="input w-full"
        disabled={disabled}
      >
        <option value="">-- Select a template --</option>
        {templates.map((template) => (
          <option key={template.templateId} value={template.templateId}>
            {template.templateName}
            {template.usageCount > 0 && ` (used ${template.usageCount}x)`}
          </option>
        ))}
      </select>

      {/* Template Preview */}
      {selectedId && templates.find(t => t.templateId === selectedId) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {templates.find(t => t.templateId === selectedId)?.templateName}
              </p>
              {templates.find(t => t.templateId === selectedId)?.description && (
                <p className="text-xs text-blue-700 mt-1">
                  {templates.find(t => t.templateId === selectedId)?.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                <span>
                  {templates.find(t => t.templateId === selectedId)?.medicines?.length || 0} medicines
                </span>
                {templates.find(t => t.templateId === selectedId)?.labTests && templates.find(t => t.templateId === selectedId)!.labTests!.length > 0 && (
                  <span>
                    {templates.find(t => t.templateId === selectedId)?.labTests?.length} lab tests
                  </span>
                )}
                {templates.find(t => t.templateId === selectedId)?.lastUsedAt && (
                  <span className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>
                      Last used: {new Date(templates.find(t => t.templateId === selectedId)!.lastUsedAt!).toLocaleDateString()}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
