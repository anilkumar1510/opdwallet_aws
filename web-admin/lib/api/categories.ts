import { apiFetch } from '../api';

export interface Category {
  _id?: string;
  categoryId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoriesResponse {
  data: Category[];
  total: number;
  page?: number;
  pageSize?: number;
}

export const categoriesApi = {
  // Get all categories (for dropdowns and selections)
  getAll: async (params?: { isActive?: boolean; search?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const url = `/api/categories${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiFetch(url);
    return response.json() as Promise<CategoriesResponse>;
  },

  // Get active categories only (for benefit configuration)
  getActive: async () => {
    const response = await apiFetch('/api/categories?isActive=true');
    return response.json() as Promise<CategoriesResponse>;
  },

  // Get category by ID
  get: async (id: string) => {
    const response = await apiFetch(`/api/categories/${id}`);
    return response.json() as Promise<Category>;
  },

  // Create category
  create: async (data: Omit<Category, '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    const response = await apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Category>;
  },

  // Update category
  update: async (id: string, data: Partial<Category>) => {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Category>;
  },

  // Delete category
  delete: async (id: string) => {
    const response = await apiFetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Toggle active status
  toggleActive: async (id: string) => {
    const response = await apiFetch(`/api/categories/${id}/toggle-active`, {
      method: 'PUT',
    });
    return response.json() as Promise<Category>;
  }
};