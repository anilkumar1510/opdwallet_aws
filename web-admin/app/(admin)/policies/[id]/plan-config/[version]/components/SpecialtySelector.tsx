'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Specialty {
  _id: string;
  specialtyId: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
}

interface SpecialtySelectorProps {
  categoryId: string;
  policyId: string;
  version: number;
  selectedSpecialtyIds: string[];
  onSelectionChange: (specialtyIds: string[]) => void;
  disabled?: boolean;
  isNew?: boolean;
}

export function SpecialtySelector({
  categoryId,
  policyId,
  version,
  selectedSpecialtyIds,
  onSelectionChange,
  disabled = false,
  isNew = false,
}: SpecialtySelectorProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailableSpecialties();
  }, [categoryId]);

  const fetchAvailableSpecialties = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(
        `/api/admin/categories/${categoryId}/available-services`
      );

      if (response.ok) {
        const data = await response.json();
        setSpecialties(data || []);
      } else {
        toast.error('Failed to fetch available specialties');
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast.error('Failed to fetch specialties');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSpecialty = async (specialtyId: string, checked: boolean) => {
    if (disabled) return;

    const newSelection = checked
      ? [...selectedSpecialtyIds, specialtyId]
      : selectedSpecialtyIds.filter((id) => id !== specialtyId);

    // Update local state
    onSelectionChange(newSelection);

    // Skip API call for new configs (not yet saved to database)
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
        onSelectionChange(selectedSpecialtyIds);
        const error = await response.json();
        toast.error(error.message || 'Failed to update specialty selection');
      }
    } catch (error) {
      console.error('Error updating specialty:', error);
      // Revert on error
      onSelectionChange(selectedSpecialtyIds);
      toast.error('Failed to update specialty selection');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = async () => {
    if (disabled || saving) return;

    const allSpecialtyIds = filteredSpecialties.map((s) => s._id);
    onSelectionChange(allSpecialtyIds);

    // Skip API call for new configs
    if (isNew) return;

    setSaving(true);
    try {
      const response = await apiFetch(
        `/api/policies/${policyId}/config/${version}/services/${categoryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ serviceIds: allSpecialtyIds }),
        }
      );

      if (!response.ok) {
        onSelectionChange(selectedSpecialtyIds);
        toast.error('Failed to select all specialties');
      } else {
        toast.success('All specialties selected');
      }
    } catch (error) {
      console.error('Error selecting all:', error);
      onSelectionChange(selectedSpecialtyIds);
      toast.error('Failed to select all specialties');
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
        onSelectionChange(selectedSpecialtyIds);
        toast.error('Failed to clear specialties');
      } else {
        toast.success('All specialties cleared');
      }
    } catch (error) {
      console.error('Error clearing all:', error);
      onSelectionChange(selectedSpecialtyIds);
      toast.error('Failed to clear specialties');
    } finally {
      setSaving(false);
    }
  };

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    specialty.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = selectedSpecialtyIds.length;
  const totalCount = specialties.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (specialties.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="mb-2">No specialties available for this category.</p>
        <p className="text-sm text-gray-500">
          Configure specialty mappings in the Service Management section.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 relative mr-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
          />
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

      {/* Selection Counter */}
      <div className="mb-3 text-sm text-gray-700">
        <span className="font-semibold">{selectedCount}</span> of{' '}
        <span className="font-semibold">{totalCount}</span> specialties selected
      </div>

      {/* Info Message */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Only selected specialties will be visible to members with this policy.
          {selectedCount === 0 && ' No specialties are currently selected - members won\'t see any options.'}
        </p>
      </div>

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSpecialties.map((specialty) => {
          const isSelected = selectedSpecialtyIds.includes(specialty._id);
          return (
            <div
              key={specialty._id}
              className={`
                flex items-center p-3 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => !disabled && handleToggleSpecialty(specialty._id, !isSelected)}
            >
              <div className="flex items-center flex-1">
                {specialty.icon && (
                  <span className="text-2xl mr-3">{specialty.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {specialty.name}
                  </div>
                  {specialty.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {specialty.description}
                    </div>
                  )}
                </div>
              </div>
              <Switch
                checked={isSelected}
                onCheckedChange={(checked) => handleToggleSpecialty(specialty._id, checked)}
                disabled={disabled || saving}
                className="ml-2"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>

      {filteredSpecialties.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          No specialties found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
}
