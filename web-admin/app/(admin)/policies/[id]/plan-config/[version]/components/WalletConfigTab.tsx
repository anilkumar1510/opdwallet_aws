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
              <tr className="bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700 w-1/3">Per Claim Limit</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">₹</span>
                    <Input
                      type="number"
                      value={currentWallet?.perClaimLimit || ''}
                      onChange={(e) => onUpdateWallet('perClaimLimit', parseInt(e.target.value) || 0)}
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
