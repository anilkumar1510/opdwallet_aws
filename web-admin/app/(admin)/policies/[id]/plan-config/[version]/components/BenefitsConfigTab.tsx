'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Category } from '@/lib/api/categories';

interface BenefitsConfigTabProps {
  categories: Category[];
  categoriesLoading: boolean;
  currentBenefits: any;
  isInheriting: boolean;
  isReadOnly: boolean;
  selectedRelationship: string;
  relationships: any[];
  onUpdateBenefit: (categoryId: string, field: string, value: any) => void;
}

export function BenefitsConfigTab({
  categories,
  categoriesLoading,
  currentBenefits,
  isInheriting,
  isReadOnly,
  selectedRelationship,
  relationships,
  onUpdateBenefit
}: BenefitsConfigTabProps) {
  const isDisabled = isReadOnly || (selectedRelationship !== 'PRIMARY' && isInheriting);

  return (
    <Card className="bg-white">
      <CardHeader className="bg-white">
        <CardTitle className="text-gray-900">
          Benefits Configuration
          {selectedRelationship !== 'PRIMARY' && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              for {relationships.find(r => r.relationshipCode === selectedRelationship)?.displayName || selectedRelationship}
            </span>
          )}
        </CardTitle>
        {selectedRelationship !== 'PRIMARY' && isInheriting && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <div className="text-sm text-green-800">
              <strong>Note:</strong> This relationship is inheriting benefits from the Primary Member.
              Turn off &quot;Inherit from Primary&quot; above to create custom benefit configurations.
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 bg-white">
        {categoriesLoading ? (
          <div className="text-center py-8 text-gray-600">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No active categories found. Please create categories first.
          </div>
        ) : (
          categories.map((category) => {
            const benefit = currentBenefits[category.categoryId];

            return (
              <div key={category.categoryId} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor={`${category.categoryId}-enabled`} className="text-lg font-medium">
                        {category.name}
                      </Label>
                      <div className="text-sm text-gray-500 mt-1">
                        Category ID: {category.categoryId}
                      </div>
                      {selectedRelationship !== 'PRIMARY' && isInheriting && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Inherited from Primary Member
                        </div>
                      )}
                    </div>
                    <Switch
                      id={`${category.categoryId}-enabled`}
                      checked={benefit?.enabled || false}
                      onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'enabled', checked)}
                      disabled={isDisabled}
                    />
                  </div>

                  {benefit?.enabled && (
                    <div className="space-y-4 pl-4">
                      <div>
                        <Label htmlFor={`${category.categoryId}-limit`}>Annual Limit (₹)</Label>
                        <Input
                          id={`${category.categoryId}-limit`}
                          type="number"
                          value={benefit.annualLimit || ''}
                          onChange={(e) => onUpdateBenefit(category.categoryId, 'annualLimit', parseInt(e.target.value) || 0)}
                          disabled={isDisabled}
                          placeholder="Enter annual limit"
                          className="bg-white"
                        />
                      </div>

                      {(category as any).isAvailableOnline && (
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${category.categoryId}-online`}
                              checked={benefit.onlineEnabled || false}
                              onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'onlineEnabled', checked)}
                              disabled={isDisabled}
                            />
                            <Label htmlFor={`${category.categoryId}-online`}>Online</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${category.categoryId}-offline`}
                              checked={benefit.offlineEnabled || false}
                              onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'offlineEnabled', checked)}
                              disabled={isDisabled}
                            />
                            <Label htmlFor={`${category.categoryId}-offline`}>Offline</Label>
                          </div>
                        </div>
                      )}
                      {!(category as any).isAvailableOnline && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`${category.categoryId}-offline`}
                            checked={benefit.offlineEnabled || false}
                            onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'offlineEnabled', checked)}
                            disabled={isDisabled}
                          />
                          <Label htmlFor={`${category.categoryId}-offline`}>Offline</Label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${category.categoryId}-vas`}
                          checked={benefit.vasEnabled || false}
                          onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'vasEnabled', checked)}
                          disabled={isDisabled}
                        />
                        <Label htmlFor={`${category.categoryId}-vas`}>VAS Enabled</Label>
                      </div>

                      <div>
                        <Label htmlFor={`${category.categoryId}-notes`}>Notes</Label>
                        <Textarea
                          id={`${category.categoryId}-notes`}
                          value={benefit.notes || ''}
                          onChange={(e) => onUpdateBenefit(category.categoryId, 'notes', e.target.value)}
                          disabled={isDisabled}
                          placeholder="Additional notes or conditions"
                          rows={2}
                          className="bg-white"
                        />
                      </div>

                      {category.description && (
                        <div className="text-sm text-gray-600 italic">
                          {category.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
