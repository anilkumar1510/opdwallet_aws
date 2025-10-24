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
      <CardContent className="bg-white p-0">
        {categoriesLoading ? (
          <div className="text-center py-8 text-gray-600">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No active categories found. Please create categories first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Enabled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Annual Limit (₹)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Online</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Offline</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">VAS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category, index) => {
                  const benefit = currentBenefits[category.categoryId];
                  const isAvailableOnline = (category as any).isAvailableOnline;

                  return (
                    <tr key={category.categoryId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-600">ID: {category.categoryId}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                          )}
                          {selectedRelationship !== 'PRIMARY' && isInheriting && (
                            <div className="text-xs text-green-600 mt-1">✓ Inherited</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          id={`${category.categoryId}-enabled`}
                          checked={benefit?.enabled || false}
                          onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'enabled', checked)}
                          disabled={isDisabled}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          id={`${category.categoryId}-limit`}
                          type="number"
                          value={benefit?.enabled ? (benefit.annualLimit || '') : ''}
                          onChange={(e) => onUpdateBenefit(category.categoryId, 'annualLimit', parseInt(e.target.value) || 0)}
                          disabled={isDisabled || !benefit?.enabled}
                          placeholder="0"
                          className="w-full text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isAvailableOnline ? (
                          <Switch
                            id={`${category.categoryId}-online`}
                            checked={benefit?.enabled ? (benefit.onlineEnabled || false) : false}
                            onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'onlineEnabled', checked)}
                            disabled={isDisabled || !benefit?.enabled}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          id={`${category.categoryId}-offline`}
                          checked={benefit?.enabled ? (benefit.offlineEnabled || false) : false}
                          onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'offlineEnabled', checked)}
                          disabled={isDisabled || !benefit?.enabled}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          id={`${category.categoryId}-vas`}
                          checked={benefit?.enabled ? (benefit.vasEnabled || false) : false}
                          onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'vasEnabled', checked)}
                          disabled={isDisabled || !benefit?.enabled}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          id={`${category.categoryId}-notes`}
                          type="text"
                          value={benefit?.enabled ? (benefit.notes || '') : ''}
                          onChange={(e) => onUpdateBenefit(category.categoryId, 'notes', e.target.value)}
                          disabled={isDisabled || !benefit?.enabled}
                          placeholder="Notes..."
                          className="w-full text-sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
