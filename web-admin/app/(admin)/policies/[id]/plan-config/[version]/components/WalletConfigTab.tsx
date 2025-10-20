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
      <CardContent className="space-y-6 bg-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="total-amount">Total Annual Amount (₹)</Label>
            <Input
              id="total-amount"
              type="number"
              value={currentWallet?.totalAnnualAmount || ''}
              onChange={(e) => onUpdateWallet('totalAnnualAmount', parseInt(e.target.value) || 0)}
              disabled={isDisabled}
              className="bg-white"
            />
            {selectedRelationship !== 'PRIMARY' && isInheriting && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Inherited from Primary Member
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="claim-limit">Per Claim Limit (₹)</Label>
            <Input
              id="claim-limit"
              type="number"
              value={currentWallet?.perClaimLimit || ''}
              onChange={(e) => onUpdateWallet('perClaimLimit', parseInt(e.target.value) || 0)}
              disabled={isDisabled}
              className="bg-white"
            />
            {selectedRelationship !== 'PRIMARY' && isInheriting && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Inherited from Primary Member
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="bg-white">
            <h4 className="font-medium mb-4 text-gray-900">Copay Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="copay-mode">Copay Mode</Label>
                <Select
                  value={currentWallet?.copay?.mode || 'PERCENT'}
                  onValueChange={(value) => onUpdateCopay('mode', value)}
                  disabled={isDisabled}
                >
                  <SelectTrigger id="copay-mode" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage</SelectItem>
                    <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="copay-value">
                  Copay Value {currentWallet?.copay?.mode === 'PERCENT' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="copay-value"
                  type="number"
                  min="0"
                  step={currentWallet?.copay?.mode === 'PERCENT' ? "0.01" : "1"}
                  value={currentWallet?.copay?.value !== undefined ? currentWallet.copay.value : ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    onUpdateCopay('value', value);
                  }}
                  disabled={isDisabled}
                  className="bg-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              id="partial-payment"
              checked={currentWallet?.partialPaymentEnabled || false}
              onCheckedChange={(checked) => onUpdateWallet('partialPaymentEnabled', checked)}
              disabled={isDisabled}
            />
            <Label htmlFor="partial-payment">Enable Partial Payments</Label>
            {selectedRelationship !== 'PRIMARY' && isInheriting && (
              <span className="text-xs text-green-600 ml-2">
                ✓ Inherited
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="topup"
              checked={currentWallet?.topUpAllowed || false}
              onCheckedChange={(checked) => onUpdateWallet('topUpAllowed', checked)}
              disabled={isDisabled}
            />
            <Label htmlFor="topup">Allow Top-ups</Label>
            {selectedRelationship !== 'PRIMARY' && isInheriting && (
              <span className="text-xs text-green-600 ml-2">
                ✓ Inherited
              </span>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Carry Forward Settings</h4>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={currentWallet?.carryForward?.enabled || false}
                    onCheckedChange={(checked) => onUpdateCarryForward('enabled', checked)}
                    disabled={isDisabled}
                  />
                  {selectedRelationship !== 'PRIMARY' && isInheriting && (
                    <span className="text-xs text-green-600">
                      ✓ Inherited
                    </span>
                  )}
                </div>
              </div>

              {currentWallet?.carryForward?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="carry-percent">Carry Forward Percentage (%)</Label>
                    <Input
                      id="carry-percent"
                      type="number"
                      value={currentWallet?.carryForward?.percent || ''}
                      onChange={(e) => onUpdateCarryForward('percent', parseInt(e.target.value) || 0)}
                      disabled={isDisabled}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carry-months">Valid for (Months)</Label>
                    <Input
                      id="carry-months"
                      type="number"
                      value={currentWallet?.carryForward?.months || ''}
                      onChange={(e) => onUpdateCarryForward('months', parseInt(e.target.value) || 0)}
                      disabled={isDisabled}
                      className="bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
