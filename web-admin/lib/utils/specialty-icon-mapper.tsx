import {
  Stethoscope,        // General Physician, Internal Medicine
  Heart,              // Cardiology
  Baby,               // Pediatrics
  Users,              // Gynecology
  Activity,           // Orthopedics
  Brain,              // Neurology, Psychiatry
  Eye,                // Ophthalmology
  Ear,                // ENT
  Droplet,            // Nephrology, Urology
  Wind,               // Pulmonology
  Pill,               // Pharmacy, General Medicine
  Syringe,            // Vaccination, Injections
  HeartPulse,         // Critical Care, Emergency
  Bone,               // Orthopedics
  Scale,              // Endocrinology
  type LucideIcon,
} from 'lucide-react';

// Icon name to component mapping
const ICON_MAP: Record<string, LucideIcon> = {
  // Direct mappings from production database
  'stethoscope': Stethoscope,
  'heart-pulse': HeartPulse,
  'baby': Baby,
  'female-doctor': Users,
  'bone': Bone,
  'brain': Brain,
  'eye': Eye,
  'ear': Ear,
  'droplet': Droplet,
  'wind': Wind,

  // Intelligent aliases (similar meanings)
  'heart': Heart,
  'cardio': HeartPulse,
  'pediatric': Baby,
  'child': Baby,
  'gynecology': Users,
  'orthopedic': Bone,
  'neuro': Brain,
  'ophthalmology': Eye,
  'ent': Ear,
  'kidney': Droplet,
  'lung': Wind,
  'pulmonary': Wind,
  'medicine': Pill,
  'general': Stethoscope,
  'physician': Stethoscope,
  'activity': Activity,
  'syringe': Syringe,
  'scale': Scale,
};

// Check if string is emoji (single Unicode character)
function isEmoji(str: string): boolean {
  return /\p{Emoji}/u.test(str) && str.length <= 4;
}

// Get icon component from name
export function getSpecialtyIcon(iconName: string | undefined): {
  type: 'component' | 'emoji' | 'none';
  value: LucideIcon | string | null;
} {
  if (!iconName) return { type: 'none', value: null };

  // Check if it's an emoji
  if (isEmoji(iconName)) {
    return { type: 'emoji', value: iconName };
  }

  // Convert to lowercase and remove special characters for matching
  const normalized = iconName.toLowerCase().replace(/[_-]/g, '');

  // Try direct match
  if (ICON_MAP[iconName.toLowerCase()]) {
    return { type: 'component', value: ICON_MAP[iconName.toLowerCase()] };
  }

  // Try normalized match
  const matchedKey = Object.keys(ICON_MAP).find(
    key => key.replace(/[_-]/g, '') === normalized
  );

  if (matchedKey) {
    return { type: 'component', value: ICON_MAP[matchedKey] };
  }

  // Default fallback: stethoscope (medical icon)
  return { type: 'component', value: Stethoscope };
}
