const specialties = [
  {
    specialtyId: 'SPEC001',
    code: 'GENERAL_PHYSICIAN',
    name: 'General Physician',
    description: 'General medical consultation and primary care',
    icon: 'stethoscope',
    isActive: true,
    displayOrder: 1
  },
  {
    specialtyId: 'SPEC002',
    code: 'GYNECOLOGIST',
    name: 'Gynaecologist',
    description: 'Women\'s health and reproductive care',
    icon: 'female-doctor',
    isActive: true,
    displayOrder: 2
  },
  {
    specialtyId: 'SPEC003',
    code: 'PSYCHOLOGIST',
    name: 'Psychologist',
    description: 'Mental health and psychological counseling',
    icon: 'brain',
    isActive: true,
    displayOrder: 3
  },
  {
    specialtyId: 'SPEC004',
    code: 'DERMATOLOGIST',
    name: 'Dermatologist',
    description: 'Skin, hair, and nail care specialist',
    icon: 'skin',
    isActive: true,
    displayOrder: 4
  },
  {
    specialtyId: 'SPEC005',
    code: 'NUTRITIONIST',
    name: 'Nutritionist',
    description: 'Diet and nutrition consultation',
    icon: 'apple',
    isActive: true,
    displayOrder: 5
  },
  {
    specialtyId: 'SPEC006',
    code: 'SEXOLOGIST',
    name: 'Sexologist',
    description: 'Sexual health and wellness',
    icon: 'heart',
    isActive: true,
    displayOrder: 6
  },
  {
    specialtyId: 'SPEC007',
    code: 'CARDIOLOGIST',
    name: 'Cardiologist',
    description: 'Heart and cardiovascular care',
    icon: 'heart-pulse',
    isActive: true,
    displayOrder: 7
  },
  {
    specialtyId: 'SPEC008',
    code: 'PAEDIATRICIAN',
    name: 'Paediatrician',
    description: 'Child health and development',
    icon: 'baby',
    isActive: true,
    displayOrder: 8
  },
  {
    specialtyId: 'SPEC009',
    code: 'DIABETOLOGIST',
    name: 'Diabetologist',
    description: 'Diabetes management and care',
    icon: 'glucose',
    isActive: true,
    displayOrder: 9
  }
];

db = db.getSiblingDB('opd_wallet');

db.specialty_master.insertMany(specialties);

print('✅ Seeded ' + specialties.length + ' specialties successfully!');