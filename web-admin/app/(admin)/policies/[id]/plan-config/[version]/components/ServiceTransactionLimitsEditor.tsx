'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { SpecialtyIcon } from '@/components/ui/specialty-icon';

interface Service {
  _id: string;
  specialtyId?: string;
  serviceId?: string;
  code: string;
  category?: string;
  name: string;
  description?: string;
  icon?: string;
}

interface ServiceTransactionLimitsEditorProps {
  categoryId: string;
  categoryType: 'specialty' | 'lab' | 'service';
  selectedServiceIds: string[];
  currentLimits: { [serviceId: string]: number };
  onLimitsChange: (limits: { [serviceId: string]: number }) => void;
  disabled?: boolean;
  policyId: string;
  version: number;
  isNew?: boolean;
}

export function ServiceTransactionLimitsEditor({
  categoryId,
  categoryType,
  selectedServiceIds,
  currentLimits,
  onLimitsChange,
  disabled = false,
  policyId,
  version,
  isNew = false,
}: ServiceTransactionLimitsEditorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLimitValue, setBulkLimitValue] = useState<string>('');

  useEffect(() => {
    if (selectedServiceIds.length > 0) {
      fetchServices();
    } else {
      setServices([]);
      setLoading(false);
    }
  }, [categoryId, selectedServiceIds.join(',')]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(
        `/api/admin/categories/${categoryId}/available-services`
      );

      if (response.ok) {
        const data = await response.json();
        // Filter to only show selected services
        // Handle IDs (for specialties), codes (for service types), and categories (for lab services)
        const filtered = data.filter((service: Service) =>
          selectedServiceIds.includes(service._id) ||
          selectedServiceIds.includes(service.code) ||
          (service.category && selectedServiceIds.includes(service.category))
        );
        setServices(filtered);
      } else {
        toast.error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const getServiceKey = (service: Service): string => {
    // For service type categories, use code; for lab categories, use category; for specialties, use _id
    if (categoryType === 'service') return service.code;
    if (categoryType === 'lab') return service.category || service._id;
    return service._id;
  };

  const handleLimitChange = (serviceKey: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const newLimits = { ...currentLimits };

    if (numValue > 0) {
      newLimits[serviceKey] = numValue;
    } else {
      // Remove limit if value is 0 or empty
      delete newLimits[serviceKey];
    }

    onLimitsChange(newLimits);
  };

  const handleBulkSetLimits = () => {
    if (!bulkLimitValue || disabled) return;

    const numValue = parseInt(bulkLimitValue);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    const newLimits = { ...currentLimits };
    // For service types, use codes; for specialties/lab, use IDs
    services.forEach((service) => {
      const key = getServiceKey(service);
      newLimits[key] = numValue;
    });

    onLimitsChange(newLimits);
    toast.success(`Set limit of ₹${numValue} for all services`);
    setBulkLimitValue('');
  };

  const handleClearAllLimits = () => {
    if (disabled) return;

    // Remove all limits for selected services
    const newLimits = { ...currentLimits };
    services.forEach((service) => {
      const key = getServiceKey(service);
      delete newLimits[key];
    });

    onLimitsChange(newLimits);
    toast.success('All transaction limits cleared');
  };

  const getLimitsCount = () => {
    return services.filter((service) => {
      const key = getServiceKey(service);
      return currentLimits[key] && currentLimits[key] > 0;
    }).length;
  };

  if (selectedServiceIds.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>No services selected.</strong> Please select services above to configure transaction limits.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  const limitsCount = getLimitsCount();

  return (
    <div className="mt-4 bg-white p-4 rounded-lg border border-gray-300">
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          Service Transaction Limits (Applied after copay)
        </h4>
        <p className="text-xs text-gray-600">
          Set maximum insurance payment per transaction for each service. The limit applies to the insurance-eligible amount (bill amount minus copay).
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="mb-1">
              <strong>How it works:</strong> Bill Amount → Copay (member pays) → Insurance Eligible Amount → Transaction Limit (caps insurance payment)
            </p>
            <p className="mb-1">
              <strong>Example:</strong> ₹1500 bill, 50% copay (₹750), ₹500 limit → Member pays ₹750 + ₹250 = ₹1000, Insurance pays ₹500
            </p>
            <p>
              <strong>Note:</strong> Leave blank for no limit. These limits work independently of annual and per-claim limits.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Operations */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
            Bulk Operations:
          </label>
          <Input
            type="number"
            placeholder="Enter limit amount"
            value={bulkLimitValue}
            onChange={(e) => setBulkLimitValue(e.target.value)}
            disabled={disabled}
            className="w-32 text-sm"
          />
          <button
            onClick={handleBulkSetLimits}
            disabled={disabled || !bulkLimitValue}
            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Apply to All
          </button>
          <button
            onClick={handleClearAllLimits}
            disabled={disabled || limitsCount === 0}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Clear All
          </button>
          <span className="ml-auto text-xs text-gray-600">
            {limitsCount} of {selectedServiceIds.length} services have limits set
          </span>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Service
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">
                Transaction Limit (₹)
              </th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((service, index) => {
              const serviceKey = getServiceKey(service);
              const currentLimit = currentLimits[serviceKey] || '';
              const hasLimit = currentLimit && parseInt(currentLimit.toString()) > 0;

              return (
                <tr
                  key={serviceKey}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {categoryType === 'specialty' && (
                        <SpecialtyIcon
                          icon={service.icon || ''}
                          name={service.name}
                          size="sm"
                          className="mr-2"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-xs text-gray-500">
                            {service.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Code: {service.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={currentLimit}
                      onChange={(e) => handleLimitChange(serviceKey, e.target.value)}
                      disabled={disabled}
                      placeholder="No limit"
                      className="w-full text-sm"
                      min="0"
                    />
                    {hasLimit && (
                      <div className="text-xs text-gray-500 mt-1">
                        Max ₹{parseInt(currentLimit.toString()).toLocaleString()} per transaction
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleLimitChange(serviceKey, '0')}
                      disabled={disabled || !hasLimit}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Warning for unset limits */}
      {limitsCount < selectedServiceIds.length && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>Note:</strong> {selectedServiceIds.length - limitsCount} service(s) have no transaction limit set.
          Insurance will pay the full eligible amount (after copay) for these services.
        </div>
      )}
    </div>
  );
}
