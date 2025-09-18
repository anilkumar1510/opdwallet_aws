import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoverageTab } from '../CoverageTab';
import { toast } from 'react-hot-toast';

// Mock the toast library
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('CoverageTab Component', () => {
  const mockPolicyId = 'policy123';
  const mockVersion = 'v1.0';
  const mockIsEditable = true;

  const mockCategories = [
    { categoryId: 'CAT001', name: 'Dental', active: true },
    { categoryId: 'CAT002', name: 'Vision', active: true },
    { categoryId: 'CAT003', name: 'Medical', active: true },
  ];

  const mockServices = [
    { serviceCode: 'SVC001', name: 'Cleaning', categoryId: 'CAT001' },
    { serviceCode: 'SVC002', name: 'Filling', categoryId: 'CAT001' },
    { serviceCode: 'SVC003', name: 'Eye Exam', categoryId: 'CAT002' },
  ];

  const mockCoverageMatrix = {
    rows: [
      { categoryId: 'CAT001', serviceCode: 'SVC001', enabled: true, notes: 'Covered' },
      { categoryId: 'CAT001', serviceCode: 'SVC002', enabled: false, notes: '' },
      { categoryId: 'CAT002', serviceCode: 'SVC003', enabled: true, notes: '' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/api/admin/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServices),
        });
      }
      if (url.includes('/api/admin/benefit-coverage-matrix')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCoverageMatrix),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Rendering', () => {
    it('should render the coverage tab with loading state', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      expect(screen.getByText('Loading coverage matrix...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading coverage matrix...')).not.toBeInTheDocument();
      });
    });

    it('should render coverage table with categories and services', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
        expect(screen.getByText('Cleaning')).toBeInTheDocument();
        expect(screen.getByText('Filling')).toBeInTheDocument();
        expect(screen.getByText('Vision')).toBeInTheDocument();
        expect(screen.getByText('Eye Exam')).toBeInTheDocument();
      });
    });

    it('should show read-only message when not editable', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/This plan version is PUBLISHED/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by category', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Select Dental category filter
      const categorySelect = screen.getByRole('combobox', { name: /filter by category/i });
      fireEvent.change(categorySelect, { target: { value: 'CAT001' } });

      // Should only show Dental services
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Filling')).toBeInTheDocument();
      expect(screen.queryByText('Eye Exam')).not.toBeInTheDocument();
    });

    it('should filter by search text', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Search for "Clean"
      const searchInput = screen.getByPlaceholderText('Search categories or services...');
      fireEvent.change(searchInput, { target: { value: 'Clean' } });

      // Should only show Cleaning service
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
      expect(screen.queryByText('Filling')).not.toBeInTheDocument();
      expect(screen.queryByText('Eye Exam')).not.toBeInTheDocument();
    });

    it('should filter by enabled status', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Check "Show enabled only"
      const checkbox = screen.getByRole('checkbox', { name: /show enabled only/i });
      fireEvent.click(checkbox);

      // Should only show enabled services
      expect(screen.getByText('Cleaning')).toBeInTheDocument();
      expect(screen.queryByText('Filling')).not.toBeInTheDocument(); // This is disabled
      expect(screen.getByText('Eye Exam')).toBeInTheDocument();
    });
  });

  describe('Editing', () => {
    it('should toggle individual service coverage', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Find the checkbox for Filling (which is initially disabled)
      const fillingCheckboxes = screen.getAllByRole('checkbox');
      const fillingCheckbox = fillingCheckboxes.find(cb =>
        cb.getAttribute('aria-label')?.includes('Filling')
      );

      if (fillingCheckbox) {
        fireEvent.click(fillingCheckbox);
      }

      // Should show unsaved changes indicator
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });

    it('should enable all services in a category', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Click "Enable All" for Dental category
      const enableAllButtons = screen.getAllByText('Enable All');
      fireEvent.click(enableAllButtons[0]); // First one should be Dental

      // Should show unsaved changes
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });

    it('should disable all services in a category', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Click "Disable All" for Dental category
      const disableAllButtons = screen.getAllByText('Disable All');
      fireEvent.click(disableAllButtons[0]); // First one should be Dental

      // Should show unsaved changes
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });

    it('should update notes for a service', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Find and update notes input for Cleaning
      const notesInputs = screen.getAllByPlaceholderText('Add notes...');
      fireEvent.change(notesInputs[0], { target: { value: 'Updated coverage note' } });

      // Should show unsaved changes
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Saving', () => {
    it('should save changes successfully', async () => {
      (fetch as jest.Mock).mockImplementationOnce((url: string) => {
        if (url.includes('/api/admin/benefit-coverage-matrix')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCoverageMatrix),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Make a change
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      // Save changes
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Coverage matrix saved successfully');
      });
    });

    it('should handle save errors', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Mock fetch to fail on save
      (fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
        })
      );

      // Make a change
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      // Try to save
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save coverage matrix');
      });
    });

    it('should cancel changes', async () => {
      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Dental')).toBeInTheDocument();
      });

      // Make a change
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      // Should show unsaved changes
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();

      // Cancel changes
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should not show unsaved changes anymore
      await waitFor(() => {
        expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load coverage matrix');
      });
    });

    it('should handle empty coverage matrix', async () => {
      (fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategories),
          });
        }
        if (url.includes('/api/admin/services')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockServices),
          });
        }
        if (url.includes('/api/admin/benefit-coverage-matrix')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ rows: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(
        <CoverageTab
          policyId={mockPolicyId}
          version={mockVersion}
          isEditable={mockIsEditable}
        />
      );

      await waitFor(() => {
        // Should still render categories and services with all disabled
        expect(screen.getByText('Dental')).toBeInTheDocument();
        expect(screen.getByText('Vision')).toBeInTheDocument();
      });
    });
  });
});