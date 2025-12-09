'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Category } from '@/lib/api/categories';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { SpecialtySelector } from './SpecialtySelector';
import { LabCategorySelector } from './LabCategorySelector';
import { ServiceTypeSelector } from './ServiceTypeSelector';

interface BenefitsConfigTabProps {
  categories: Category[];
  categoriesLoading: boolean;
  currentBenefits: any;
  isInheriting: boolean;
  isReadOnly: boolean;
  selectedRelationship: string;
  relationships: any[];
  policyId: string;
  version: number;
  isNew: boolean;
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
  policyId,
  version,
  isNew,
  onUpdateBenefit
}: BenefitsConfigTabProps) {
  const isDisabled = isReadOnly || (selectedRelationship !== 'PRIMARY' && isInheriting);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (categoryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryType = (categoryId: string): 'specialty' | 'lab' | 'service' | 'none' => {
    if (categoryId === 'CAT001' || categoryId === 'CAT005') return 'specialty';
    if (categoryId === 'CAT003' || categoryId === 'CAT004') return 'lab';
    if (categoryId === 'CAT006' || categoryId === 'CAT007' || categoryId === 'CAT008') return 'service';
    return 'none';
  };

  const getServicesCount = (categoryId: string, benefit: any): number => {
    const type = getCategoryType(categoryId);
    if (type === 'specialty') {
      return benefit?.allowedSpecialties?.length || 0;
    } else if (type === 'lab') {
      return benefit?.allowedLabServiceCategories?.length || 0;
    } else if (type === 'service') {
      return benefit?.allowedServiceCodes?.length || 0;
    }
    return 0;
  };

  const handleServiceSelectionChange = (categoryId: string, selection: string[]) => {
    const type = getCategoryType(categoryId);
    if (type === 'specialty') {
      onUpdateBenefit(categoryId, 'allowedSpecialties', selection);
    } else if (type === 'lab') {
      onUpdateBenefit(categoryId, 'allowedLabServiceCategories', selection);
    } else if (type === 'service') {
      onUpdateBenefit(categoryId, 'allowedServiceCodes', selection);
    }
  };

  const renderServiceSelector = (categoryId: string, categoryName: string, benefit: any) => {
    const type = getCategoryType(categoryId);

    if (type === 'specialty') {
      return (
        <SpecialtySelector
          categoryId={categoryId}
          policyId={policyId}
          version={version}
          selectedSpecialtyIds={benefit?.allowedSpecialties || []}
          onSelectionChange={(ids) => handleServiceSelectionChange(categoryId, ids)}
          disabled={isDisabled || !benefit?.enabled}
          isNew={isNew}
        />
      );
    } else if (type === 'lab') {
      return (
        <LabCategorySelector
          categoryId={categoryId}
          policyId={policyId}
          version={version}
          selectedCategories={benefit?.allowedLabServiceCategories || []}
          onSelectionChange={(cats) => handleServiceSelectionChange(categoryId, cats)}
          disabled={isDisabled || !benefit?.enabled}
          isNew={isNew}
        />
      );
    } else if (type === 'service') {
      return (
        <ServiceTypeSelector
          categoryId={categoryId}
          categoryName={categoryName}
          policyId={policyId}
          version={version}
          selectedServiceCodes={benefit?.allowedServiceCodes || []}
          onSelectionChange={(codes) => handleServiceSelectionChange(categoryId, codes)}
          disabled={isDisabled || !benefit?.enabled}
          isNew={isNew}
        />
      );
    }
    return null;
  };

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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Enabled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Annual Limit (₹)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Per Claim Limit (₹)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Claims</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">VAS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category, index) => {
                  const benefit = currentBenefits[category.categoryId];
                  const categoryType = getCategoryType(category.categoryId);
                  const hasServiceConfig = categoryType !== 'none';
                  const isExpanded = expandedRows.has(category.categoryId);
                  const servicesCount = getServicesCount(category.categoryId, benefit);

                  return (
                    <>
                      <tr key={category.categoryId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3">
                          {hasServiceConfig && benefit?.enabled && (
                            <button
                              onClick={() => toggleRow(category.categoryId)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              disabled={isDisabled}
                            >
                              {isExpanded ? (
                                <ChevronDownIcon className="h-5 w-5" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                            <div className="text-xs text-gray-600">ID: {category.categoryId}</div>
                            {category.description && (
                              <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                            )}
                            {hasServiceConfig && benefit?.enabled && (
                              <div className="text-xs text-blue-600 mt-1">
                                {servicesCount > 0 ? `${servicesCount} services selected` : 'No services selected'}
                              </div>
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
                            onCheckedChange={(checked) => {
                              onUpdateBenefit(category.categoryId, 'enabled', checked);
                              // Auto-expand when enabled if it has service config
                              if (checked && hasServiceConfig) {
                                setExpandedRows(prev => new Set(prev).add(category.categoryId));
                              }
                            }}
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
                        {/* Per Claim Limit */}
                        <td className="px-4 py-3">
                          <Input
                            id={`${category.categoryId}-per-claim-limit`}
                            type="number"
                            value={benefit?.enabled && benefit?.claimEnabled ? (benefit.perClaimLimit || '') : ''}
                            onChange={(e) => onUpdateBenefit(category.categoryId, 'perClaimLimit', parseInt(e.target.value) || 0)}
                            disabled={isDisabled || !benefit?.enabled || !benefit?.claimEnabled}
                            placeholder="Optional"
                            className="w-full text-sm"
                            title="Maximum amount per claim. Leave blank for no limit."
                          />
                          {benefit?.enabled && benefit?.claimEnabled && benefit?.perClaimLimit && (
                            <div className="text-xs text-gray-500 mt-1">
                              Max ₹{benefit.perClaimLimit.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            id={`${category.categoryId}-claim`}
                            checked={benefit?.enabled ? (benefit.claimEnabled || false) : false}
                            onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'claimEnabled', checked)}
                            disabled={isDisabled || !benefit?.enabled}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            id={`${category.categoryId}-vas`}
                            checked={benefit?.vasEnabled || false}
                            onCheckedChange={(checked) => onUpdateBenefit(category.categoryId, 'vasEnabled', checked)}
                            disabled={isDisabled}
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
                      {/* Expandable Service Selector Row */}
                      {isExpanded && hasServiceConfig && benefit?.enabled && (
                        <tr key={`${category.categoryId}-expanded`} className="bg-gray-100">
                          <td colSpan={7} className="px-4 py-4">
                            {renderServiceSelector(category.categoryId, category.name, benefit)}
                          </td>
                        </tr>
                      )}
                    </>
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
