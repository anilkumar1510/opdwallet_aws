import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Switch } from '@/components/ui/switch'

interface BenefitsTabProps {
  policyId: string
  planVersion: number
  isEditable: boolean
}

interface BenefitComponent {
  enabled: boolean
  annualAmountLimit?: number
  visitsLimit?: number
  rxRequired?: boolean
}

interface BenefitComponents {
  consultation?: BenefitComponent
  pharmacy?: BenefitComponent
  diagnostics?: BenefitComponent
  ahc?: BenefitComponent
  vaccination?: BenefitComponent
  dental?: BenefitComponent
  vision?: BenefitComponent
  wellness?: BenefitComponent
}

const BENEFIT_LABELS = {
  consultation: 'Consultation',
  pharmacy: 'Pharmacy',
  diagnostics: 'Lab & Diagnostics',
  ahc: 'Annual Health Checkup',
  vaccination: 'Vaccination',
  dental: 'Dental',
  vision: 'Vision',
  wellness: 'Wellness',
}

export default function BenefitsTab({ policyId, planVersion, isEditable }: BenefitsTabProps) {
  const [components, setComponents] = useState<BenefitComponents>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBenefitComponents()
  }, [policyId, planVersion])

  const fetchBenefitComponents = async () => {
    try {
      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/benefit-components`
      )
      if (!response.ok) throw new Error('Failed to fetch benefit components')
      const data = await response.json()
      setComponents(data.components || {})
    } catch (error) {
      console.error('Error fetching benefit components:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateComponent = async (key: string, field: string, value: any) => {
    const updatedComponents = {
      ...components,
      [key]: {
        ...components[key as keyof BenefitComponents],
        [field]: value,
      },
    }
    setComponents(updatedComponents)

    if (isEditable) {
      try {
        setSaving(true)
        const response = await apiFetch(
          `/api/admin/policies/${policyId}/plan-versions/${planVersion}/benefit-components`,
          {
            method: 'PUT',
            body: JSON.stringify({ components: updatedComponents }),
          }
        )
        if (!response.ok) throw new Error('Failed to update')
      } catch (error) {
        console.error('Error updating:', error)
        fetchBenefitComponents() // Revert on error
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) return <div>Loading benefits configuration...</div>

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium">Benefit Components</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure which OPD tiles are enabled and set optional limits
        </p>
      </div>

      <div className="p-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Component
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enabled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Annual Limit (₹)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visits Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rx Required
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(BENEFIT_LABELS).map(([key, label]) => {
              const component = components[key as keyof BenefitComponents] || { enabled: false }
              return (
                <tr key={key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Switch
                      checked={component.enabled}
                      onCheckedChange={(checked) => updateComponent(key, 'enabled', checked)}
                      disabled={!isEditable}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={component.annualAmountLimit || ''}
                      onChange={(e) =>
                        updateComponent(key, 'annualAmountLimit', e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={!isEditable || !component.enabled}
                      className="w-32 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                      placeholder="No limit"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={component.visitsLimit || ''}
                      onChange={(e) =>
                        updateComponent(key, 'visitsLimit', e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={!isEditable || !component.enabled}
                      className="w-20 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {['pharmacy', 'diagnostics'].includes(key) && (
                      <Switch
                        checked={component.rxRequired || false}
                        onCheckedChange={(checked) => updateComponent(key, 'rxRequired', checked)}
                        disabled={!isEditable || !component.enabled}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!isEditable && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            This plan version is not in DRAFT status and cannot be edited.
          </div>
        )}

        {saving && (
          <div className="mt-4 text-sm text-gray-600">Saving...</div>
        )}
      </div>
    </div>
  )
}