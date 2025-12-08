export const PREDEFINED_CATEGORIES = [
  {
    id: 'CAT001',
    name: 'In-Clinic',
    fullName: 'In-Clinic Consultation',
    hasSpecialties: true,
    hasLabServices: false,
  },
  {
    id: 'CAT002',
    name: 'Pharmacy',
    fullName: 'Pharmacy',
    hasSpecialties: false,
    hasLabServices: false,
  },
  {
    id: 'CAT003',
    name: 'Diagnostic',
    fullName: 'Diagnostic Services',
    hasSpecialties: false,
    hasLabServices: true,
    labServiceCategories: ['RADIOLOGY', 'ENDOSCOPY'],
  },
  {
    id: 'CAT004',
    name: 'Laboratory',
    fullName: 'Laboratory Services',
    hasSpecialties: false,
    hasLabServices: true,
    labServiceCategories: ['PATHOLOGY', 'CARDIOLOGY', 'OTHER'],
  },
  {
    id: 'CAT005',
    name: 'Online',
    fullName: 'Online Consultation',
    hasSpecialties: true,
    hasLabServices: false,
  },
  {
    id: 'CAT006',
    name: 'Dental',
    fullName: 'Dental Services',
    hasSpecialties: false,
    hasLabServices: false,
  },
  {
    id: 'CAT007',
    name: 'Vision',
    fullName: 'Vision Care',
    hasSpecialties: false,
    hasLabServices: false,
  },
  {
    id: 'CAT008',
    name: 'Wellness',
    fullName: 'Wellness Programs',
    hasSpecialties: false,
    hasLabServices: false,
  },
] as const;

export type CategoryId = typeof PREDEFINED_CATEGORIES[number]['id'];
