import { apiFetch } from '../api';

export interface PlanConfig {
  _id?: string;
  policyId: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED';
  isCurrent: boolean;
  benefits: {
    [categoryId: string]: {
      enabled: boolean;
      claimEnabled: boolean;
      vasEnabled: boolean;
      annualLimit?: number;
      notes?: string;
    };
  };
  wallet: {
    totalAnnualAmount?: number;
    perClaimLimit?: number;
    copay?: { mode: 'PERCENT' | 'AMOUNT'; value: number };
    partialPaymentEnabled?: boolean;
    carryForward?: { enabled: boolean; percent?: number; months?: number };
    topUpAllowed?: boolean;
  };
  createdBy?: string;
  updatedBy?: string;
  publishedBy?: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const planConfigApi = {
  // Create new config version
  create: async (policyId: string, data: Partial<PlanConfig>) => {
    console.log('🟡 [API DEBUG] planConfigApi.create called');
    console.log('🟡 [API DEBUG] Policy ID:', policyId);
    console.log('🟡 [API DEBUG] Data to send:', JSON.stringify(data, null, 2));

    const url = `/api/policies/${policyId}/config`;
    console.log('🟡 [API DEBUG] Request URL:', url);

    const requestBody = JSON.stringify(data);
    console.log('🟡 [API DEBUG] Request body length:', requestBody.length);

    try {
      console.log('🟡 [API DEBUG] Making apiFetch request...');
      const response = await apiFetch(url, {
        method: 'POST',
        body: requestBody,
      });

      console.log('🟡 [API DEBUG] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      if (!response.ok) {
        console.error('🔴 [API DEBUG] Response not ok, status:', response.status);
        const errorText = await response.text();
        console.error('🔴 [API DEBUG] Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('🟡 [API DEBUG] Response parsed successfully:', result);
      return result;

    } catch (error) {
      console.error('🔴 [API DEBUG] apiFetch error:', error);
      throw error;
    }
  },

  // Get current or specific version
  get: async (policyId: string, version?: number) => {
    const url = version
      ? `/api/policies/${policyId}/config?version=${version}`
      : `/api/policies/${policyId}/config`;
    const response = await apiFetch(url);
    return response.json();
  },

  // Get all versions
  getAll: async (policyId: string) => {
    const response = await apiFetch(`/api/policies/${policyId}/config/all`);
    return response.json();
  },

  // Update draft config
  update: async (policyId: string, version: number, data: Partial<PlanConfig>) => {
    console.log('🟠 [UPDATE API DEBUG] planConfigApi.update called');
    console.log('🟠 [UPDATE API DEBUG] Policy ID:', policyId);
    console.log('🟠 [UPDATE API DEBUG] Version:', version);
    console.log('🟠 [UPDATE API DEBUG] Data to send:', JSON.stringify(data, null, 2));

    const url = `/api/policies/${policyId}/config/${version}`;
    console.log('🟠 [UPDATE API DEBUG] Request URL:', url);

    const requestBody = JSON.stringify(data);
    console.log('🟠 [UPDATE API DEBUG] Request body length:', requestBody.length);

    try {
      console.log('🟠 [UPDATE API DEBUG] Making apiFetch request...');
      const response = await apiFetch(url, {
        method: 'PUT',
        body: requestBody,
      });

      console.log('🟠 [UPDATE API DEBUG] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      if (!response.ok) {
        console.error('🔴 [UPDATE API DEBUG] Response not ok, status:', response.status);
        const errorText = await response.text();
        console.error('🔴 [UPDATE API DEBUG] Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('🟠 [UPDATE API DEBUG] Response parsed successfully:', result);
      return result;

    } catch (error) {
      console.error('🔴 [UPDATE API DEBUG] apiFetch error:', error);
      throw error;
    }
  },

  // Publish config
  publish: async (policyId: string, version: number) => {
    const response = await apiFetch(`/api/policies/${policyId}/config/${version}/publish`, {
      method: 'POST',
    });
    return response.json();
  },

  // Set as current
  setCurrent: async (policyId: string, version: number) => {
    const response = await apiFetch(`/api/policies/${policyId}/config/${version}/set-current`, {
      method: 'POST',
    });
    return response.json();
  },

  // Delete draft
  delete: async (policyId: string, version: number) => {
    const response = await apiFetch(`/api/policies/${policyId}/config/${version}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};