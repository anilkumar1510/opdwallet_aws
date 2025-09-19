import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Switch } from '@/components/ui/switch'

interface WalletTabProps {
  policyId: string
  planVersion: number
  isEditable: boolean
  onUpdate?: (data: any) => void
}

interface WalletRules {
  totalAnnualAmount?: number
  perClaimLimit?: number
  copay?: {
    mode: 'PERCENT' | 'AMOUNT'
    value: number
  }
  partialPaymentEnabled?: boolean
  carryForward?: {
    enabled: boolean
    percent?: number
    months?: number
  }
  topUpAllowed?: boolean
  notes?: string
}

export default function WalletTab({ policyId, planVersion, isEditable, onUpdate }: WalletTabProps) {
  const [walletRules, setWalletRules] = useState<WalletRules>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchWalletRules()
  }, [policyId, planVersion])

  const fetchWalletRules = async () => {
    try {
      console.log('🔄 FETCHING WALLET RULES...')
      console.log('URL:', `/api/admin/policies/${policyId}/plan-versions/${planVersion}/wallet-rules`)

      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/wallet-rules`
      )

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) throw new Error('Failed to fetch wallet rules')

      // Check if response has content
      const text = await response.text()
      console.log('Raw response text:', text)

      let data = {}
      if (text && text.trim()) {
        try {
          data = JSON.parse(text)
          console.log('Parsed wallet rules data:', data)
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError)
          console.log('Using empty object as fallback')
          data = {}
        }
      } else {
        console.log('Empty response, using default empty object')
        data = {}
      }

      setWalletRules(data)

      // Notify parent component of the initial data
      console.log('📤 Notifying parent with initial data:', data)
      if (onUpdate) {
        onUpdate(data)
      }
    } catch (error) {
      console.error('Error fetching wallet rules:', error)
      // If no data exists, notify parent with empty object
      const emptyData = {}
      setWalletRules(emptyData)
      console.log('📤 Notifying parent with empty data due to error')
      if (onUpdate) {
        onUpdate(emptyData)
      }
    } finally {
      setLoading(false)
    }
  }

  const saveWalletRules = async () => {
    if (!isEditable) return

    try {
      setSaving(true)
      const response = await apiFetch(
        `/api/admin/policies/${policyId}/plan-versions/${planVersion}/wallet-rules`,
        {
          method: 'PUT',
          body: JSON.stringify(walletRules),
        }
      )
      if (!response.ok) throw new Error('Failed to update')
    } catch (error) {
      console.error('Error updating:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    console.log(`🔄 HANDLE CHANGE: ${field}`, {
      field,
      newValue: value,
      valueType: typeof value,
      currentRules: walletRules
    })

    const updatedRules = {
      ...walletRules,
      [field]: value
    }

    console.log('Updated rules after change:', updatedRules)
    setWalletRules(updatedRules)

    // Call onUpdate to notify parent component of changes
    if (onUpdate) {
      console.log('📤 Notifying parent with updated rules:', updatedRules)
      onUpdate(updatedRules)
    }
  }

  if (loading) return <div>Loading wallet configuration...</div>

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium">Wallet Rules</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure OPD wallet parameters for this plan version
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Funding Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Funding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Annual Amount (₹)
              </label>
              <input
                type="number"
                value={walletRules.totalAnnualAmount ?? ''}
                onChange={(e) => handleChange('totalAnnualAmount', e.target.value === '' ? undefined : Number(e.target.value))}
                disabled={!isEditable}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
                placeholder="Enter amount (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per Claim Limit (₹)
              </label>
              <input
                type="number"
                value={walletRules.perClaimLimit ?? ''}
                onChange={(e) => handleChange('perClaimLimit', e.target.value === '' ? undefined : Number(e.target.value))}
                disabled={!isEditable}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
                placeholder="No limit (optional)"
              />
            </div>
          </div>
        </div>

        {/* Cost Share Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Cost Share</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Co-pay Mode
              </label>
              <select
                value={walletRules.copay?.mode || 'PERCENT'}
                onChange={(e) =>
                  handleChange('copay', {
                    mode: e.target.value as 'PERCENT' | 'AMOUNT',
                    value: walletRules.copay?.value || 0,
                  })
                }
                disabled={!isEditable}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
              >
                <option value="PERCENT">Percentage</option>
                <option value="AMOUNT">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Co-pay Value {walletRules.copay?.mode === 'PERCENT' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                value={walletRules.copay?.value ?? ''}
                onChange={(e) =>
                  handleChange('copay', e.target.value === '' ? undefined : {
                    mode: walletRules.copay?.mode || 'PERCENT',
                    value: Number(e.target.value),
                  })
                }
                disabled={!isEditable}
                min="0"
                max={walletRules.copay?.mode === 'PERCENT' ? '100' : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
                placeholder="Enter value (optional)"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Partial Payment Enabled
                </label>
                <p className="text-xs text-gray-500">Allow partial claim payments</p>
              </div>
              <Switch
                checked={walletRules.partialPaymentEnabled || false}
                onCheckedChange={(checked) => handleChange('partialPaymentEnabled', checked)}
                disabled={!isEditable}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Top-up Allowed
                </label>
                <p className="text-xs text-gray-500">Members can add funds beyond annual limit</p>
              </div>
              <Switch
                checked={walletRules.topUpAllowed || false}
                onCheckedChange={(checked) => handleChange('topUpAllowed', checked)}
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>

        {/* Carry Forward Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Carry Forward</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Carry Forward Enabled
              </label>
              <Switch
                checked={walletRules.carryForward?.enabled || false}
                onCheckedChange={(checked) =>
                  handleChange('carryForward', {
                    ...walletRules.carryForward,
                    enabled: checked,
                  })
                }
                disabled={!isEditable}
              />
            </div>
            {walletRules.carryForward?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carry Forward Percent (%)
                  </label>
                  <input
                    type="number"
                    value={walletRules.carryForward?.percent ?? ''}
                    onChange={(e) =>
                      handleChange('carryForward', {
                        ...walletRules.carryForward,
                        percent: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    disabled={!isEditable}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
                    placeholder="Enter percentage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={walletRules.carryForward?.months ?? ''}
                    onChange={(e) =>
                      handleChange('carryForward', {
                        ...walletRules.carryForward,
                        months: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    disabled={!isEditable}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
                    placeholder="Enter months"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={walletRules.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={!isEditable}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100"
            placeholder="Optional notes about this configuration"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {isEditable && (
            <button
              onClick={saveWalletRules}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {!isEditable && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            This plan version is not in DRAFT status and cannot be edited.
          </div>
        )}
      </div>
    </div>
  )
}