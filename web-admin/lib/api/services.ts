import { apiFetch } from '../api';

export interface Service {
  _id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  coveragePercentage: number;
  copayAmount: number;
  requiresPreAuth: boolean;
  requiresReferral: boolean;
  priceRange?: {
    min: number;
    max: number;
  };
  annualLimit?: number;
  waitingPeriodDays: number;
  requiredDocuments: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const servicesApi = {
  // Get all services
  getAll: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    category?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);

    const url = `/api/services/types${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await apiFetch(url);
    return response.json();
  },

  // Get services by category
  getByCategory: async (category: string) => {
    console.log('🟢 [SERVICES API DEBUG] getByCategory called for category:', category);
    const response = await apiFetch(`/api/services/categories/${category}`);
    const result = await response.json();
    console.log('🟢 [SERVICES API DEBUG] getByCategory result:', result);
    return result;
  },

  // Get service codes only
  getCodes: async () => {
    const response = await apiFetch('/api/services/types/codes');
    return response.json();
  },
};