export const PREDEFINED_CATEGORIES = [
  {
    id: 'CAT001',
    name: 'In-Clinic',
    fullName: 'In-Clinic Consultation',
    hasSpecialties: true,
  },
  {
    id: 'CAT002',
    name: 'Pharmacy',
    fullName: 'Pharmacy',
    hasSpecialties: false,
  },
  {
    id: 'CAT003',
    name: 'Diagnostic',
    fullName: 'Diagnostic Services',
    hasSpecialties: false,
  },
  {
    id: 'CAT004',
    name: 'Laboratory',
    fullName: 'Laboratory Services',
    hasSpecialties: false,
  },
  {
    id: 'CAT005',
    name: 'Online',
    fullName: 'Online Consultation',
    hasSpecialties: true,
  },
  {
    id: 'CAT006',
    name: 'Dental',
    fullName: 'Dental Services',
    hasSpecialties: false,
  },
  {
    id: 'CAT007',
    name: 'Vision',
    fullName: 'Vision Care',
    hasSpecialties: false,
  },
  {
    id: 'CAT008',
    name: 'Wellness',
    fullName: 'Wellness Programs',
    hasSpecialties: false,
  },
] as const;

export type CategoryId = typeof PREDEFINED_CATEGORIES[number]['id'];
