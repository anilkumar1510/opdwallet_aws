'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface LabCategory {
  category: string;
  name: string;
  description: string;
  icon: string;
}

interface LabCategorySelectorProps {
  categoryId: string;
  policyId: string;
  version: number;
  selectedCategories: string[];
  onSelectionChange: (categories: string[]) => void;
  disabled?: boolean;
  isNew?: boolean;
}

export function LabCategorySelector({
  categoryId,
  policyId,
  version,
  selectedCategories,
  onSelectionChange,
  disabled = false,
  isNew = false,
}: LabCategorySelectorProps) {
  const [labCategories, setLabCategories] = useState<LabCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailableLabCategories();
  }, [categoryId]);

  const fetchAvailableLabCategories = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(
        `/api/admin/categories/${categoryId}/available-services`
      );

      if (response.ok) {
        const data = await response.json();
        setLabCategories(data || []);
      } else {
        toast.error('Failed to fetch available lab categories');
      }
    } catch (error) {
      console.error('Error fetching lab categories:', error);
      toast.error('Failed to fetch lab categories');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = async (category: string, checked: boolean) => {
    if (disabled) return;

    const newSelection = checked
      ? [...selectedCategories, category]
      : selectedCategories.filter((c) => c !== category);

    // Update local state
    onSelectionChange(newSelection);

    // Skip API call for new configs
    if (isNew) return;

    setSaving(true);
    try {
      // Save to backend for existing configs
      const response = await apiFetch(
        `/api/policies/${policyId}/config/${version}/services/${categoryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ serviceIds: newSelection }),
        }
      );

      if (!response.ok) {
        // Revert on error
        onSelectionChange(selectedCategories);
        const error = await response.json();
        toast.error(error.message || 'Failed to update lab category selection');
      }
    } catch (error) {
      console.error('Error updating lab category:', error);
      // Revert on error
      onSelectionChange(selectedCategories);
      toast.error('Failed to update lab category selection');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = async () => {
    if (disabled || saving) return;

    const allCategories = labCategories.map((c) => c.category);
    onSelectionChange(allCategories);

    // Skip API call for new configs
    if (isNew) return;

    setSaving(true);
    try {
      const response = await apiFetch(
        `/api/policies/${policyId}/config/${version}/services/${categoryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ serviceIds: allCategories }),
        }
      );

      if (!response.ok) {
        onSelectionChange(selectedCategories);
        toast.error('Failed to select all categories');
      } else {
        toast.success('All lab categories selected');
      }
    } catch (error) {
      console.error('Error selecting all:', error);
      onSelectionChange(selectedCategories);
      toast.error('Failed to select all categories');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (disabled || saving) return;

    onSelectionChange([]);

    // Skip API call for new configs
    if (isNew) return;

    setSaving(true);
    try {
      const response = await apiFetch(
        `/api/policies/${policyId}/config/${version}/services/${categoryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ serviceIds: [] }),
        }
      );

      if (!response.ok) {
        onSelectionChange(selectedCategories);
        toast.error('Failed to clear categories');
      } else {
        toast.success('All lab categories cleared');
      }
    } catch (error) {
      console.error('Error clearing all:', error);
      onSelectionChange(selectedCategories);
      toast.error('Failed to clear categories');
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selectedCategories.length;
  const totalCount = labCategories.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (labCategories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No lab service categories available for this benefit.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">{selectedCount}</span> of{' '}
          <span className="font-semibold">{totalCount}</span> lab categories selected
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            disabled={disabled || saving || selectedCount === totalCount}
            className="px-3 py-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            disabled={disabled || saving || selectedCount === 0}
            className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Info Message */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Only selected lab service categories will be available to members with this policy.
          {selectedCount === 0 && ' No categories are currently selected - members won\'t be able to order lab tests.'}
        </p>
      </div>

      {/* Lab Categories List */}
      <div className="space-y-3">
        {labCategories.map((labCategory) => {
          const isSelected = selectedCategories.includes(labCategory.category);
          return (
            <div
              key={labCategory.category}
              className={`
                flex items-start p-4 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => !disabled && handleToggleCategory(labCategory.category, !isSelected)}
            >
              <div className="flex items-start flex-1">
                <span className="text-3xl mr-4">{labCategory.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900">
                      {labCategory.name}
                    </h4>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={(checked) => handleToggleCategory(labCategory.category, checked)}
                      disabled={disabled || saving}
                      className="ml-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {labCategory.description}
                  </p>
                  <div className="text-xs text-gray-500 mt-2 font-mono">
                    Category: {labCategory.category}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
