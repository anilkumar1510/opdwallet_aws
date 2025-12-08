'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ServiceType {
  _id: string;
  code: string;
  name: string;
  description?: string;
}

interface ServiceTypeSelectorProps {
  categoryId: string;
  categoryName: string;
  policyId: string;
  version: number;
  selectedServiceCodes: string[];
  onSelectionChange: (serviceCodes: string[]) => void;
  disabled?: boolean;
  isNew?: boolean;
}

export function ServiceTypeSelector({
  categoryId,
  categoryName,
  policyId,
  version,
  selectedServiceCodes,
  onSelectionChange,
  disabled = false,
  isNew = false,
}: ServiceTypeSelectorProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailableServiceTypes();
  }, [categoryId]);

  const fetchAvailableServiceTypes = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(
        `/api/admin/categories/${categoryId}/available-services`
      );

      if (response.ok) {
        const data = await response.json();
        setServiceTypes(data || []);
      } else {
        toast.error('Failed to fetch available service types');
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
      toast.error('Failed to fetch service types');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async (serviceCode: string, checked: boolean) => {
    if (disabled) return;

    const newSelection = checked
      ? [...selectedServiceCodes, serviceCode]
      : selectedServiceCodes.filter((code) => code !== serviceCode);

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
        onSelectionChange(selectedServiceCodes);
        const error = await response.json();
        toast.error(error.message || 'Failed to update service selection');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      // Revert on error
      onSelectionChange(selectedServiceCodes);
      toast.error('Failed to update service selection');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = async () => {
    if (disabled || saving) return;

    const allServiceCodes = filteredServices.map((s) => s.code);
    onSelectionChange(allServiceCodes);

    // Skip API call for new configs
    if (isNew) return;

    setSaving(true);
    try {
      const response = await apiFetch(
        `/api/policies/${policyId}/config/${version}/services/${categoryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ serviceIds: allServiceCodes }),
        }
      );

      if (!response.ok) {
        onSelectionChange(selectedServiceCodes);
        toast.error('Failed to select all services');
      } else {
        toast.success('All services selected');
      }
    } catch (error) {
      console.error('Error selecting all:', error);
      onSelectionChange(selectedServiceCodes);
      toast.error('Failed to select all services');
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
        onSelectionChange(selectedServiceCodes);
        toast.error('Failed to clear services');
      } else {
        toast.success('All services cleared');
      }
    } catch (error) {
      console.error('Error clearing all:', error);
      onSelectionChange(selectedServiceCodes);
      toast.error('Failed to clear services');
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = serviceTypes.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = selectedServiceCodes.length;
  const totalCount = serviceTypes.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (serviceTypes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="mb-2">No service types available for {categoryName}.</p>
        <p className="text-sm text-gray-500">
          Create service types in the Service Management section first.
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
            placeholder={`Search ${categoryName.toLowerCase()} services...`}
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
        <span className="font-semibold">{totalCount}</span> services selected
      </div>

      {/* Info Message */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Only selected services will be visible to members with this policy.
          {selectedCount === 0 && ' No services are currently selected - members won\'t see any options.'}
        </p>
      </div>

      {/* Services List */}
      <div className="space-y-2">
        {filteredServices.map((service) => {
          const isSelected = selectedServiceCodes.includes(service.code);
          return (
            <div
              key={service.code}
              className={`
                flex items-center justify-between p-3 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => !disabled && handleToggleService(service.code, !isSelected)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {service.code}
                  </span>
                  <h4 className="text-sm font-medium text-gray-900">
                    {service.name}
                  </h4>
                </div>
                {service.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {service.description}
                  </p>
                )}
              </div>
              <Switch
                checked={isSelected}
                onCheckedChange={(checked) => handleToggleService(service.code, checked)}
                disabled={disabled || saving}
                className="ml-4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          No services found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
}
