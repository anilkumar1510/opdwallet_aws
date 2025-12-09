'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WalletConfigTabProps {
  currentWallet: any;
  isInheriting: boolean;
  isReadOnly: boolean;
  selectedRelationship: string;
  relationships: any[];
  coveredRelationships: string[];  // NEW - to show floater members
  onUpdateWallet: (field: string, value: any) => void;
  onUpdateCopay: (field: string, value: any) => void;
  onUpdateCarryForward: (field: string, value: any) => void;
}

export function WalletConfigTab({
  currentWallet,
  isInheriting,
  isReadOnly,
  selectedRelationship,
  relationships,
  coveredRelationships,  // NEW
  onUpdateWallet,
  onUpdateCopay,
  onUpdateCarryForward
}: WalletConfigTabProps) {
  const isDisabled = isReadOnly || (selectedRelationship !== 'PRIMARY' && isInheriting);

  return (
    <Card className="bg-white">
      <CardHeader className="bg-white">
        <CardTitle className="text-gray-900">
          Wallet Configuration
          {selectedRelationship !== 'PRIMARY' && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              for {relationships.find(r => r.relationshipCode === selectedRelationship)?.displayName || selectedRelationship}
            </span>
          )}
        </CardTitle>
        {selectedRelationship !== 'PRIMARY' && isInheriting && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div className="text-sm text-green-800">
              <strong>Note:</strong> This relationship is inheriting wallet settings from the Primary Member.
              Turn off &quot;Inherit from Primary&quot; above to create custom wallet configurations.
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="bg-white p-0">
        {/* Allocation Type Section - Only for PRIMARY relationship */}
        {selectedRelationship === 'PRIMARY' && (
          <div className="p-6 border-b border-gray-200">
            <Label className="text-sm font-semibold text-gray-700 mb-3 block">
              Wallet Allocation Type
            </Label>

            <div className="flex gap-4">
              {/* Individual Option */}
              <div
                onClick={() => !isDisabled && onUpdateWallet('allocationType', 'INDIVIDUAL')}
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  (currentWallet?.allocationType || 'INDIVIDUAL') === 'INDIVIDUAL'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    (currentWallet?.allocationType || 'INDIVIDUAL') === 'INDIVIDUAL'
                      ? 'border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {(currentWallet?.allocationType || 'INDIVIDUAL') === 'INDIVIDUAL' && (
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Individual</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Each family member gets their own separate wallet with dedicated balance
                    </div>
                  </div>
                </div>
              </div>

              {/* Floater Option */}
              <div
                onClick={() => !isDisabled && onUpdateWallet('allocationType', 'FLOATER')}
                className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  currentWallet?.allocationType === 'FLOATER'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    currentWallet?.allocationType === 'FLOATER'
                      ? 'border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {currentWallet?.allocationType === 'FLOATER' && (
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Floater</div>
                    <div className="text-sm text-gray-600 mt-1">
                      All family members share one common wallet pool
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floater Members Display */}
            {currentWallet?.allocationType === 'FLOATER' && coveredRelationships?.length > 0 && (
              <div className="mt-3 p-3 bg-white border border-blue-200 rounded">
                <div className="text-sm text-gray-700">
                  <strong>Sharing Members:</strong> Primary Member
                  {coveredRelationships.map(code => {
                    const rel = relationships.find(r => r.relationshipCode === code);
                    return rel ? `, ${rel.displayName}` : '';
                  }).join('')}
                </div>
              </div>
            )}

            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              <strong>Note:</strong> Allocation type applies to the entire wallet and cannot be changed mid-year. Choose carefully.
            </div>
          </div>
        )}

        {/* Wallet Settings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" colSpan={3}>
                  Wallet Settings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Primary Limits */}
              <tr className="bg-white">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Total Annual Amount</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">₹</span>
                    <Input
                      type="number"
                      value={currentWallet?.totalAnnualAmount || ''}
                      onChange={(e) => onUpdateWallet('totalAnnualAmount', parseInt(e.target.value) || 0)}
                      disabled={isDisabled}
                      className="w-32 bg-white text-sm"
                      placeholder="0"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {selectedRelationship !== 'PRIMARY' && isInheriting && (
                    <span className="text-green-600">✓ Inherited</span>
                  )}
                </td>
              </tr>
              {/* DEPRECATED: Per-claim limits now configured in Benefits tab */}
              <tr className="bg-gray-50/50 opacity-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">
                  <div>Per Claim Limit</div>
                  <div className="text-xs text-amber-600 font-normal">
                    Deprecated: Configure per-category in Benefits tab
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">₹</span>
                    <Input
                      type="number"
                      value={currentWallet?.perClaimLimit || ''}
                      disabled={true}
                      className="w-32 bg-gray-100 text-sm cursor-not-allowed"
                      placeholder="0"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-amber-600">
                  Moved to Benefits tab
                </td>
              </tr>

              {/* Copay Settings */}
              <tr>
                <td colSpan={3} className="px-4 py-3 bg-gray-100 border-t border-gray-300">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Copay Settings</span>
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Copay Mode</td>
                <td className="px-4 py-3">
                  <Select
                    value={currentWallet?.copay?.mode || 'PERCENT'}
                    onValueChange={(value) => onUpdateCopay('mode', value)}
                    disabled={isDisabled}
                  >
                    <SelectTrigger className="w-40 bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">Percentage</SelectItem>
                      <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {selectedRelationship !== 'PRIMARY' && isInheriting && (
                    <span className="text-green-600">✓ Inherited</span>
                  )}
                </td>
              </tr>
              <tr className="bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Copay Value</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {currentWallet?.copay?.mode === 'PERCENT' ? '%' : '₹'}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step={currentWallet?.copay?.mode === 'PERCENT' ? "0.01" : "1"}
                      value={currentWallet?.copay?.value !== undefined ? currentWallet.copay.value : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                        onUpdateCopay('value', value);
                      }}
                      disabled={isDisabled}
                      className="w-32 bg-white text-sm"
                      placeholder="0"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {selectedRelationship !== 'PRIMARY' && isInheriting && (
                    <span className="text-green-600">✓ Inherited</span>
                  )}
                </td>
              </tr>

              {/* Features */}
              <tr>
                <td colSpan={3} className="px-4 py-3 bg-gray-100 border-t border-gray-300">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Features</span>
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Partial Payments</td>
                <td className="px-4 py-3">
                  <Switch
                    checked={currentWallet?.partialPaymentEnabled || false}
                    onCheckedChange={(checked) => onUpdateWallet('partialPaymentEnabled', checked)}
                    disabled={isDisabled}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {currentWallet?.partialPaymentEnabled ? 'Enabled' : 'Disabled'}
                  {selectedRelationship !== 'PRIMARY' && isInheriting && (
                    <span className="text-green-600 ml-2">✓ Inherited</span>
                  )}
                </td>
              </tr>
              <tr className="bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Allow Top-ups</td>
                <td className="px-4 py-3">
                  <Switch
                    checked={currentWallet?.topUpAllowed || false}
                    onCheckedChange={(checked) => onUpdateWallet('topUpAllowed', checked)}
                    disabled={isDisabled}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {currentWallet?.topUpAllowed ? 'Allowed' : 'Not Allowed'}
                  {selectedRelationship !== 'PRIMARY' && isInheriting && (
                    <span className="text-green-600 ml-2">✓ Inherited</span>
                  )}
                </td>
              </tr>

              {/* Carry Forward */}
              <tr>
                <td colSpan={3} className="px-4 py-3 bg-gray-100 border-t border-gray-300">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Carry Forward Settings</span>
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Enable Carry Forward</td>
                <td className="px-4 py-3">
                  <Switch
                    checked={currentWallet?.carryForward?.enabled || false}
                    onCheckedChange={(checked) => onUpdateCarryForward('enabled', checked)}
                    disabled={isDisabled}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {currentWallet?.carryForward?.enabled ? 'Enabled' : 'Disabled'}
                  {selectedRelationship !== 'PRIMARY' && isInheriting && (
                    <span className="text-green-600 ml-2">✓ Inherited</span>
                  )}
                </td>
              </tr>
              {currentWallet?.carryForward?.enabled && (
                <>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Carry Forward Percentage</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={currentWallet?.carryForward?.percent || ''}
                          onChange={(e) => onUpdateCarryForward('percent', parseInt(e.target.value) || 0)}
                          disabled={isDisabled}
                          className="w-32 bg-white text-sm"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {selectedRelationship !== 'PRIMARY' && isInheriting && (
                        <span className="text-green-600">✓ Inherited</span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Valid for (Months)</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={currentWallet?.carryForward?.months || ''}
                          onChange={(e) => onUpdateCarryForward('months', parseInt(e.target.value) || 0)}
                          disabled={isDisabled}
                          className="w-32 bg-white text-sm"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">months</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {selectedRelationship !== 'PRIMARY' && isInheriting && (
                        <span className="text-green-600">✓ Inherited</span>
                      )}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <strong>Important Notes:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li>Total Annual Amount defines the maximum wallet balance for the policy year</li>
              <li>Per Claim Limit sets the maximum amount that can be claimed per transaction</li>
              <li>Copay settings determine the member's contribution for each claim</li>
              <li>Carry Forward allows unused balance to be transferred to the next policy period</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
