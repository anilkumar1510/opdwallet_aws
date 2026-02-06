'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// DateTimePicker only works on native - we'll handle web separately
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFamily } from '../../../src/contexts/FamilyContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { fetchWalletBalance } from '../../../src/lib/api/wallet';
import apiClient, { storage } from '../../../src/lib/api/client';

// ============================================================================
// COLORS - Matching Home Page
// ============================================================================
const COLORS = {
  primary: '#034DA2',
  orange: '#F5821E',
  textDark: '#303030',
  textGray: '#545454',
  textLight: '#6b7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  success: '#16a34a',
  error: '#ef4444',
  warning: '#f59e0b',
};

// ============================================================================
// SVG ICONS - Updated with Home Page Style (Blue + Orange accents)
// ============================================================================

function ArrowLeftIcon({ size = 24, color = COLORS.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRightIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 20, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 9L12 16L5 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparklesIcon({ size = 32, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3V7M3 5H7M6 17V21M4 19H8M13 3L15.2857 9.85714L21 12L15.2857 14.1429L13 21L10.7143 14.1429L5 12L10.7143 9.85714L13 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserGroupIcon({ size = 24, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 18.72C19.0615 18.2731 19.9097 17.4278 20.3796 16.3476C20.8494 15.2673 20.9066 14.0354 20.54 12.91C20.1734 11.7846 19.4092 10.8426 18.3991 10.2752C17.3889 9.70771 16.2065 9.55492 15.09 9.85M15 7C15 8.06087 14.5786 9.07828 13.8284 9.82843C13.0783 10.5786 12.0609 11 11 11C9.93913 11 8.92172 10.5786 8.17157 9.82843C7.42143 9.07828 7 8.06087 7 7C7 5.93913 7.42143 4.92172 8.17157 4.17157C8.92172 3.42143 9.93913 3 11 3C12.0609 3 13.0783 3.42143 13.8284 4.17157C14.5786 4.92172 15 5.93913 15 7ZM3 20.4V19C3 17.4087 3.63214 15.8826 4.75736 14.7574C5.88258 13.6321 7.4087 13 9 13H13C14.5913 13 16.1174 13.6321 17.2426 14.7574C18.3679 15.8826 19 17.4087 19 19V20.4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TagIcon({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 7H7.01M7 3H12C12.5119 2.99999 13.0237 3.19525 13.414 3.58579L20.414 10.5858C20.7889 10.9609 20.9996 11.4696 20.9996 12C20.9996 12.5304 20.7889 13.0391 20.414 13.414L13.414 20.414C13.0391 20.7889 12.5304 20.9996 12 20.9996C11.4696 20.9996 10.9609 20.7889 10.5858 20.414L3.58579 13.414C3.21071 13.0391 3 12.5304 3 12V7C3 5.93913 3.42143 4.92172 4.17157 4.17157C4.92172 3.42143 5.93913 3 7 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 24, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 24, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CurrencyRupeeIcon({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 8H15M9 12H15M9 16L15 20M9 4V20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentTextIcon({ size = 24, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExclamationTriangleIcon({ size = 20, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.2 21.01 3.56 21.01H20.44C20.8 21.01 21.14 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.31 12.97 3.13C12.67 2.95 12.34 2.86 12 2.86C11.66 2.86 11.33 2.95 11.03 3.13C10.73 3.31 10.47 3.56 10.29 3.86Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentPlusIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 13H15M12 10V16M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CameraIcon({ size = 20, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9C3 8.46957 3.21071 7.96086 3.58579 7.58579C3.96086 7.21071 4.46957 7 5 7H5.93C6.59 7 7.21 6.68 7.59 6.14L8.41 4.86C8.79 4.32 9.41 4 10.07 4H13.93C14.59 4 15.21 4.32 15.59 4.86L16.41 6.14C16.79 6.68 17.41 7 18.07 7H19C19.5304 7 20.0391 7.21071 20.4142 7.58579C20.7893 7.96086 21 8.46957 21 9V18C21 18.5304 20.7893 19.0391 20.4142 19.4142C20.0391 19.7893 19.5304 20 19 20H5C4.46957 20 3.96086 19.7893 3.58579 19.4142C3.21071 19.0391 3 18.5304 3 18V9Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 16C13.6569 16 15 14.6569 15 13C15 11.3431 13.6569 10 12 10C10.3431 10 9 11.3431 9 13C9 14.6569 10.3431 16 12 16Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XMarkIcon({ size = 20, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18L18 6M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloudArrowUpIcon({ size = 32, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 16V8M12 8L9 11M12 8L15 11M6.73 19C4.12 19 2 16.87 2 14.25C2 12.11 3.41 10.29 5.36 9.64C5.8 6.48 8.57 4 12 4C15.43 4 18.2 6.48 18.64 9.64C20.59 10.29 22 12.11 22 14.25C22 16.87 19.88 19 17.27 19H6.73Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PhotoIcon({ size = 40, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentCheckIcon({ size = 32, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 24, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ size = 24, color = '#1D4ED8' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12C21 11.4477 20.5523 11 20 11H16C14.8954 11 14 11.8954 14 13C14 14.1046 14.8954 15 16 15H20C20.5523 15 21 14.5523 21 14V12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 11V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InformationCircleIcon({ size = 24, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ClaimFormData {
  claimType: string;
  category: string;
  treatmentDate: string;
  billAmount: string;
  billNumber: string;
  treatmentDescription: string;
  patientName: string;
  relationToMember: string;
}

interface DocumentPreview {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'pdf';
  size: number;
  file?: any;
}

interface FamilyMember {
  userId: string;
  name: string;
  memberId: string;
  isPrimary: boolean;
  relationship: string;
}

interface Category {
  id: string;
  name: string;
  categoryId: string;
  categoryCode: string;
  claimCategory: string;
  annualLimit?: number;
  perClaimLimit?: number;
}

interface WalletRules {
  totalAnnualAmount?: number;
  perClaimLimit?: number;
  copay?: { mode: string; value: number };
  partialPaymentEnabled?: boolean;
  categoryLimits?: Record<string, { perClaimLimit: number }>;
}

// ============================================================================
// CLAIM CATEGORY MAPPING
// ============================================================================

const CLAIM_CATEGORY_MAP: Record<string, string> = {
  CAT001: 'IN_CLINIC_CONSULTATION',
  CAT002: 'PHARMACY',
  CAT003: 'DIAGNOSTIC_SERVICES',
  CAT004: 'LABORATORY_SERVICES',
  CAT005: 'ONLINE_CONSULTATION',
  CAT006: 'DENTAL_SERVICES',
  CAT007: 'VISION_CARE',
  CAT008: 'WELLNESS_PROGRAMS',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewClaimPage() {
  const { width } = useWindowDimensions();
  const { activeMember, profileData } = useFamily();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [walletData, setWalletData] = useState<any>(null);
  const [walletRules, setWalletRules] = useState<WalletRules | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [formData, setFormData] = useState<ClaimFormData>({
    claimType: 'reimbursement',
    category: '',
    treatmentDate: '',
    billAmount: '',
    billNumber: '',
    treatmentDescription: '',
    patientName: '',
    relationToMember: 'self',
  });
  const [prescriptionFiles, setPrescriptionFiles] = useState<DocumentPreview[]>([]);
  const [billFiles, setBillFiles] = useState<DocumentPreview[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<DocumentPreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string>('');
  const [previewImageName, setPreviewImageName] = useState<string>('');

  const scrollRef = useRef<ScrollView>(null);

  // Handle viewing an image
  const handleViewImage = (uri: string, name: string) => {
    setPreviewImageUri(uri);
    setPreviewImageName(name);
    setShowImagePreview(true);
  };

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch family members on mount
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const response = await apiClient.get('/member/profile');
        const data = response.data;

        const members: FamilyMember[] = [
          {
            userId: data.user._id,
            name: `${data.user.name.firstName} ${data.user.name.lastName}`,
            memberId: data.user.memberId,
            isPrimary: true,
            relationship: 'Self',
          },
          ...data.dependents.map((dep: any) => ({
            userId: dep._id,
            name: `${dep.name.firstName} ${dep.name.lastName}`,
            memberId: dep.memberId,
            isPrimary: false,
            relationship: dep.relationship,
          })),
        ];

        setFamilyMembers(members);

        const selectedId = activeMember?._id || data.user._id;
        setSelectedUserId(selectedId);
      } catch (error) {
        console.error('Error fetching family members:', error);
      }
    };
    fetchFamilyMembers();
  }, [activeMember]);

  // Fetch wallet data and categories when user is selected
  useEffect(() => {
    if (!selectedUserId) return;

    const fetchData = async () => {
      try {
        // Fetch wallet balance
        const walletBalance = await fetchWalletBalance(selectedUserId);
        setWalletData(walletBalance);

        // Fetch available categories
        const categoriesResponse = await apiClient.get('/member/claims/available-categories');
        const categories = categoriesResponse.data;

        const enrichedCategories = categories.map((cat: any) => ({
          id: cat.claimCategory,
          name: cat.name,
          categoryId: cat.categoryId,
          categoryCode: cat.categoryId,
          claimCategory: cat.claimCategory,
          annualLimit: cat.annualLimit,
          perClaimLimit: cat.perClaimLimit,
        }));

        setAvailableCategories(enrichedCategories);

        // Build wallet rules from categories for per-claim limit warnings
        const categoryLimits: Record<string, { perClaimLimit: number }> = {};
        categories.forEach((cat: any) => {
          if (cat.perClaimLimit) {
            categoryLimits[cat.categoryId] = { perClaimLimit: cat.perClaimLimit };
          }
        });
        setWalletRules({ categoryLimits });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [selectedUserId]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getAvailableBalance = (): number => {
    if (!walletData || !formData.category) return 0;
    const categoryBalance = walletData.categories?.find(
      (b: any) => b.categoryCode === formData.category
    );
    return categoryBalance?.available || 0;
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const member = familyMembers.find((m) => m.userId === userId);
    if (member) {
      setFormData((prev) => ({
        ...prev,
        patientName: member.name,
        relationToMember: member.relationship,
      }));
    }
    setShowMemberPicker(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, category: categoryId }));
    setShowCategoryPicker(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!selectedUserId) newErrors.member = 'Please select a family member';
      if (!formData.category) newErrors.category = 'Please select a category';
      if (!formData.treatmentDate) newErrors.treatmentDate = 'Treatment date is required';
      if (!formData.billAmount || parseFloat(formData.billAmount) <= 0) {
        newErrors.billAmount = 'Valid bill amount is required';
      } else {
        const amount = parseFloat(formData.billAmount);
        const availableBalance = getAvailableBalance();
        if (formData.category && amount > availableBalance) {
          newErrors.billAmount = `Amount exceeds available balance ₹${availableBalance.toLocaleString()}`;
        }
      }
    } else if (step === 2) {
      const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005';
      if (isConsult) {
        if (prescriptionFiles.length === 0) {
          newErrors.prescription = 'Please upload at least one prescription';
        }
        if (billFiles.length === 0) {
          newErrors.bills = 'Please upload at least one bill';
        }
      } else {
        if (documentPreviews.length === 0) {
          newErrors.documents = 'Please upload at least one document';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(3, currentStep + 1));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const pickImage = async (target: 'prescription' | 'bill' | 'document') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles: DocumentPreview[] = result.assets.map((asset) => ({
          id: Math.random().toString(36).substring(7),
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image',
          size: asset.fileSize || 0,
        }));

        if (target === 'prescription') {
          setPrescriptionFiles((prev) => [...prev, ...newFiles]);
        } else if (target === 'bill') {
          setBillFiles((prev) => [...prev, ...newFiles]);
        } else {
          setDocumentPreviews((prev) => [...prev, ...newFiles]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const takePhoto = async (target: 'prescription' | 'bill' | 'document') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newFile: DocumentPreview = {
          id: Math.random().toString(36).substring(7),
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image',
          size: asset.fileSize || 0,
        };

        if (target === 'prescription') {
          setPrescriptionFiles((prev) => [...prev, newFile]);
        } else if (target === 'bill') {
          setBillFiles((prev) => [...prev, newFile]);
        } else {
          setDocumentPreviews((prev) => [...prev, newFile]);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const pickDocument = async (target: 'prescription' | 'bill' | 'document') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: DocumentPreview[] = result.assets.map((asset) => ({
          id: Math.random().toString(36).substring(7),
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType?.includes('pdf') ? 'pdf' : 'image',
          size: asset.size || 0,
        }));

        if (target === 'prescription') {
          setPrescriptionFiles((prev) => [...prev, ...newFiles]);
        } else if (target === 'bill') {
          setBillFiles((prev) => [...prev, ...newFiles]);
        } else {
          setDocumentPreviews((prev) => [...prev, ...newFiles]);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const removeFile = (id: string, target: 'prescription' | 'bill' | 'document') => {
    if (target === 'prescription') {
      setPrescriptionFiles((prev) => prev.filter((f) => f.id !== id));
    } else if (target === 'bill') {
      setBillFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      setDocumentPreviews((prev) => prev.filter((f) => f.id !== id));
    }
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================

  // Helper function to convert URI to Blob for web platform
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return response.blob();
  };

  // Helper function to append file to FormData (handles both web and native)
  const appendFileToFormData = async (
    formDataToSend: FormData,
    fieldName: string,
    doc: DocumentPreview
  ) => {
    const mimeType = doc.type === 'pdf' ? 'application/pdf' : 'image/jpeg';

    if (Platform.OS === 'web') {
      // On web, convert URI to Blob and create File object
      try {
        const blob = await uriToBlob(doc.uri);
        const file = new File([blob], doc.name, { type: mimeType });
        formDataToSend.append(fieldName, file);
      } catch (error) {
        console.error('Error converting file for web:', error);
        throw new Error(`Failed to process file: ${doc.name}`);
      }
    } else {
      // On native (iOS/Android), use the standard format
      const fileData = {
        uri: doc.uri,
        name: doc.name,
        type: mimeType,
      };
      formDataToSend.append(fieldName, fileData as any);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const selectedCategory = availableCategories.find(
        (cat) => cat.categoryId === formData.category
      );
      const claimCategory =
        selectedCategory?.claimCategory || CLAIM_CATEGORY_MAP[formData.category];

      const formDataToSend = new FormData();

      // Add userId for the selected family member
      formDataToSend.append('userId', selectedUserId);

      // Add claim fields (matching Next.js exactly)
      formDataToSend.append('claimType', 'REIMBURSEMENT');
      formDataToSend.append('category', claimCategory || 'IN_CLINIC_CONSULTATION');
      formDataToSend.append('treatmentDate', formData.treatmentDate);
      formDataToSend.append('providerName', 'Self Service');
      formDataToSend.append('billAmount', formData.billAmount);

      if (formData.billNumber) {
        formDataToSend.append('billNumber', formData.billNumber);
      }
      if (formData.treatmentDescription) {
        formDataToSend.append('treatmentDescription', formData.treatmentDescription);
      }

      // Get the selected family member's name for patientName
      const selectedMember = familyMembers.find((m) => m.userId === selectedUserId);
      if (selectedMember) {
        formDataToSend.append('patientName', selectedMember.name);
        formDataToSend.append('relationToMember', selectedMember.relationship);
      }

      // Add files based on category with explicit document types
      const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005';

      if (isConsult) {
        // For Consult: Add prescription and bill files with specific field names
        for (const doc of prescriptionFiles) {
          await appendFileToFormData(formDataToSend, 'prescriptionFiles', doc);
        }
        for (const doc of billFiles) {
          await appendFileToFormData(formDataToSend, 'billFiles', doc);
        }
      } else {
        // For Lab/Pharmacy: Add generic documents
        for (const doc of documentPreviews) {
          await appendFileToFormData(formDataToSend, 'documents', doc);
        }
      }

      console.log('Submitting claim with userId:', selectedUserId);
      console.log('Category:', claimCategory);
      console.log('Bill Amount:', formData.billAmount);

      // Step 1: Create the claim
      const createResponse = await apiClient.post('/member/claims', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const claimId = createResponse.data.claim.claimId;
      console.log('Claim created:', claimId);

      // Step 2: Submit the claim (this will debit the wallet)
      const submitResponse = await apiClient.post(`/member/claims/${claimId}/submit`);
      const submitResult = submitResponse.data;
      console.log('Claim submitted successfully:', submitResult);

      // Show success message with cap info if applicable
      let successMessage = 'Your claim has been submitted successfully!';
      if (submitResult.wasCapped) {
        successMessage =
          `Claim submitted successfully!\n\n` +
          `Note: Your bill amount of ₹${submitResult.originalBillAmount?.toLocaleString()} ` +
          `was capped to ₹${submitResult.cappedAmount?.toLocaleString()} ` +
          `as it exceeded the per-claim limit of ₹${submitResult.perClaimLimitApplied?.toLocaleString()}.`;
      }

      // Handle alert and navigation based on platform
      if (Platform.OS === 'web') {
        // On web, use window.alert and then navigate
        window.alert(successMessage);
        router.replace('/member/claims');
      } else {
        // On native, use Alert.alert with callback
        Alert.alert('Success', successMessage, [
          { text: 'OK', onPress: () => router.replace('/member/claims') },
        ]);
      }
    } catch (error: any) {
      console.error('Submission failed:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit claim';

      if (Platform.OS === 'web') {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER STEP INDICATOR
  // ============================================================================

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Details', completed: currentStep > 1 },
      { number: 2, title: 'Documents', completed: currentStep > 2 },
      { number: 3, title: 'Review', completed: currentStep > 3 },
    ];

    return (
      <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <View style={{ alignItems: 'center' }}>
                {step.completed ? (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.success,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleIcon size={18} color={COLORS.white} />
                  </View>
                ) : currentStep === step.number ? (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.white }}>
                      {step.number}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textLight }}>
                      {step.number}
                    </Text>
                  </View>
                )}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '500',
                    color: step.completed ? COLORS.success : currentStep === step.number ? COLORS.primary : COLORS.textLight,
                    marginTop: 6,
                  }}
                >
                  {step.title}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View style={{ flex: 1, marginHorizontal: 8, marginBottom: 20 }}>
                  <View
                    style={{
                      height: 3,
                      backgroundColor: step.completed ? COLORS.success : COLORS.border,
                      borderRadius: 2,
                    }}
                  />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 8,
            backgroundColor: '#E5E7EB',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#1F63B4', '#5DA4FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: '100%',
              width: `${(currentStep / 3) * 100}%`,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    );
  };

  // ============================================================================
  // RENDER STEP 1: TREATMENT DETAILS
  // ============================================================================

  const renderStep1 = () => (
    <View style={{ gap: 16 }}>
      {/* Family Member Selection */}
      {familyMembers.length > 0 && (
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(217, 217, 217, 0.48)',
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 10 }}>
            Family Member
          </Text>
          <TouchableOpacity
            onPress={() => setShowMemberPicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: COLORS.background,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.textDark }}>
              {familyMembers.find((m) => m.userId === selectedUserId)?.name || 'Select member'}
            </Text>
            <ChevronDownIcon size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      )}

      {/* Category Selection */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(217, 217, 217, 0.48)',
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 10 }}>
          Claim Category <Text style={{ color: COLORS.error }}>*</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setShowCategoryPicker(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: errors.category ? '#FEF2F2' : COLORS.background,
            borderWidth: 1,
            borderColor: errors.category ? '#FECACA' : COLORS.border,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '500',
              color: formData.category ? COLORS.textDark : COLORS.textLight,
            }}
          >
            {availableCategories.find((c) => c.categoryId === formData.category)?.name ||
              'Select a category'}
          </Text>
          <ChevronDownIcon size={18} color={COLORS.textLight} />
        </TouchableOpacity>

        {errors.category && (
          <Text style={{ fontSize: 13, color: COLORS.error, marginTop: 8 }}>
            {errors.category}
          </Text>
        )}

        {/* Available Balance */}
        {formData.category && walletData && (
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(3, 77, 162, 0.05)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.textGray }}>Available Balance</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primary }}>
              ₹{getAvailableBalance().toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Billing Date */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(217, 217, 217, 0.48)',
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 10 }}>
          Billing Date <Text style={{ color: COLORS.error }}>*</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={{
            backgroundColor: errors.treatmentDate ? '#FEF2F2' : COLORS.background,
            borderWidth: 1,
            borderColor: errors.treatmentDate ? '#FECACA' : COLORS.border,
            borderRadius: 12,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '500',
              color: formData.treatmentDate ? COLORS.textDark : COLORS.textLight,
            }}
          >
            {formData.treatmentDate ? formatDate(formData.treatmentDate) : 'Select date'}
          </Text>
          <CalendarIcon size={18} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Date Picker - Platform specific */}
        {showDatePicker && Platform.OS === 'web' && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              />
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 16,
                  padding: 24,
                  width: '90%',
                  maxWidth: 340,
                  zIndex: 10,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginBottom: 16 }}>
                  Select Billing Date
                </Text>
                <View style={{ marginBottom: 16 }}>
                  <TextInput
                    value={formData.treatmentDate}
                    onChangeText={(text) => {
                      // Allow manual entry in YYYY-MM-DD format
                      setFormData((prev) => ({ ...prev, treatmentDate: text }));
                      if (errors.treatmentDate) {
                        setErrors((prev) => ({ ...prev, treatmentDate: '' }));
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    style={{
                      backgroundColor: COLORS.background,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      fontWeight: '500',
                      color: COLORS.textDark,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 8 }}>
                    Format: YYYY-MM-DD (e.g., 2025-01-15)
                  </Text>
                </View>
                {/* Quick date buttons */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const today = new Date();
                      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      setFormData((prev) => ({ ...prev, treatmentDate: dateStr }));
                    }}
                    style={{
                      backgroundColor: 'rgba(3, 77, 162, 0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
                      setFormData((prev) => ({ ...prev, treatmentDate: dateStr }));
                    }}
                    style={{
                      backgroundColor: 'rgba(3, 77, 162, 0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>Yesterday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const lastWeek = new Date();
                      lastWeek.setDate(lastWeek.getDate() - 7);
                      const dateStr = `${lastWeek.getFullYear()}-${String(lastWeek.getMonth() + 1).padStart(2, '0')}-${String(lastWeek.getDate()).padStart(2, '0')}`;
                      setFormData((prev) => ({ ...prev, treatmentDate: dateStr }));
                    }}
                    style={{
                      backgroundColor: 'rgba(3, 77, 162, 0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.primary }}>Last Week</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.background,
                      padding: 14,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textGray }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.primary,
                      padding: 14,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Native DateTimePicker for iOS/Android */}
        {showDatePicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={formData.treatmentDate ? new Date(formData.treatmentDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate && event.type !== 'dismissed') {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                setFormData((prev) => ({ ...prev, treatmentDate: `${year}-${month}-${day}` }));
                if (errors.treatmentDate) {
                  setErrors((prev) => ({ ...prev, treatmentDate: '' }));
                }
              }
            }}
          />
        )}

        {errors.treatmentDate && (
          <Text style={{ fontSize: 13, color: COLORS.error, marginTop: 8 }}>
            {errors.treatmentDate}
          </Text>
        )}
      </View>

      {/* Bill Amount & Bill Number Row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Bill Amount */}
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(217, 217, 217, 0.48)',
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 10 }}>
            Bill Amount <Text style={{ color: COLORS.error }}>*</Text>
          </Text>
          <TextInput
            value={formData.billAmount}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, billAmount: text }))}
            placeholder="₹ 0"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            style={{
              backgroundColor: errors.billAmount ? '#FEF2F2' : COLORS.background,
              borderWidth: 1,
              borderColor: errors.billAmount ? '#FECACA' : COLORS.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.textDark,
            }}
          />
          {errors.billAmount && (
            <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 8 }}>
              {errors.billAmount}
            </Text>
          )}
        </View>

        {/* Bill Number */}
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(217, 217, 217, 0.48)',
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 10 }}>
            Bill Number
          </Text>
          <TextInput
            value={formData.billNumber}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, billNumber: text }))}
            placeholder="INV-12345"
            placeholderTextColor={COLORS.textLight}
            style={{
              backgroundColor: COLORS.background,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              fontWeight: '500',
              color: COLORS.textDark,
            }}
          />
        </View>
      </View>

      {/* Per-Claim Limit Warning */}
      {formData.billAmount && formData.category && walletRules?.categoryLimits && (() => {
        const categoryLimit = walletRules.categoryLimits[formData.category]?.perClaimLimit;
        const billAmount = parseFloat(formData.billAmount);

        if (categoryLimit && billAmount > categoryLimit) {
          const approvedAmount = Math.min(billAmount, categoryLimit);

          return (
            <View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(217, 217, 217, 0.48)',
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 11 },
                shadowOpacity: 0.08,
                shadowRadius: 23,
                elevation: 3,
              }}
            >
              {/* Warning row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: '#FEF3C7',
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>
                  Bill amount exceeds per-claim limit (₹{categoryLimit.toLocaleString()})
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>
                  -₹{(billAmount - categoryLimit).toLocaleString()}
                </Text>
              </View>

              {/* Approved amount */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, color: COLORS.textGray }}>
                  Amount for Approval
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>
                  ₹{approvedAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          );
        }
        return null;
      })()}

      {/* Treatment Description */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(217, 217, 217, 0.48)',
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 10 }}>
          Treatment Description <Text style={{ fontSize: 12, color: COLORS.textLight }}>(optional)</Text>
        </Text>
        <TextInput
          value={formData.treatmentDescription}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, treatmentDescription: text }))}
          placeholder="Brief details about the treatment..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{
            backgroundColor: COLORS.background,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            fontWeight: '500',
            color: COLORS.textDark,
            minHeight: 80,
          }}
        />
      </View>
    </View>
  );

  // ============================================================================
  // RENDER STEP 2: DOCUMENT UPLOAD
  // ============================================================================

  const renderUploadSection = (
    title: string,
    subtitle: string,
    files: DocumentPreview[],
    target: 'prescription' | 'bill' | 'document',
    isGreen: boolean = false,
    error?: string
  ) => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(217, 217, 217, 0.48)',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 4 }}>
        {title} <Text style={{ color: COLORS.error }}>*</Text>
      </Text>
      <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 12 }}>{subtitle}</Text>

      {/* Upload buttons */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => pickDocument(target)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            backgroundColor: COLORS.primary,
            borderRadius: 10,
          }}
        >
          <DocumentPlusIcon size={18} color={COLORS.white} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>Choose Files</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => takePhoto(target)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: COLORS.primary,
            borderRadius: 10,
            backgroundColor: COLORS.white,
          }}
        >
          <CameraIcon size={18} color={COLORS.primary} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Camera</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 11, color: COLORS.textLight, textAlign: 'center' }}>
        PDF, JPG, PNG up to 5MB each
      </Text>

      {/* Error */}
      {error && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FEF2F2',
            padding: 10,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.error }}>{error}</Text>
        </View>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
            {files.length} file(s) uploaded
          </Text>

          {files.map((doc) => (
            <View
              key={doc.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: COLORS.background,
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              {doc.type === 'image' ? (
                <Image
                  source={{ uri: doc.uri }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: '#FEE2E2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DocumentTextIcon size={20} color={COLORS.error} />
                </View>
              )}

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {doc.name}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textGray }}>
                  {(doc.size / 1024).toFixed(1)} KB
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, flexShrink: 0 }}>
                {doc.type === 'image' && (
                  <TouchableOpacity
                    onPress={() => handleViewImage(doc.uri, doc.name)}
                    style={{ padding: 6, borderRadius: 6, backgroundColor: 'rgba(3, 77, 162, 0.1)' }}
                  >
                    <EyeIcon size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => removeFile(doc.id, target)}
                  style={{ padding: 6, borderRadius: 6, backgroundColor: '#FEF2F2' }}
                >
                  <XMarkIcon size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep2 = () => {
    const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005';

    return (
      <View style={{ gap: 16 }}>

        {isConsult ? (
          <>
            {renderUploadSection(
              'Prescription Documents',
              "Upload doctor's prescription",
              prescriptionFiles,
              'prescription',
              false,
              errors.prescription
            )}
            {renderUploadSection(
              'Bill Documents',
              'Upload consultation bills',
              billFiles,
              'bill',
              true,
              errors.bills
            )}
          </>
        ) : (
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(217, 217, 217, 0.48)',
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 11 },
              shadowOpacity: 0.08,
              shadowRadius: 23,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 14, color: COLORS.primary, marginBottom: 4 }}>
              Upload Documents <Text style={{ color: COLORS.error }}>*</Text>
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 12 }}>
              Add bills and reports
            </Text>

            {/* Upload buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => pickDocument('document')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  backgroundColor: COLORS.primary,
                  borderRadius: 10,
                }}
              >
                <DocumentPlusIcon size={18} color={COLORS.white} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>Choose Files</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => takePhoto('document')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  borderRadius: 10,
                  backgroundColor: COLORS.white,
                }}
              >
                <CameraIcon size={18} color={COLORS.primary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Camera</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, color: COLORS.textLight, textAlign: 'center' }}>
              PDF, JPG, PNG up to 5MB each
            </Text>

            {/* Error */}
            {errors.documents && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#FEF2F2',
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 12,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.error }}>
                  {errors.documents}
                </Text>
              </View>
            )}

            {/* File Previews */}
            {documentPreviews.length > 0 && (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
                  {documentPreviews.length} file(s) uploaded
                </Text>

                {documentPreviews.map((doc) => (
                  <View
                    key={doc.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: COLORS.background,
                      borderRadius: 10,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    {doc.type === 'image' ? (
                      <Image
                        source={{ uri: doc.uri }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          backgroundColor: '#FEE2E2',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <DocumentTextIcon size={20} color={COLORS.error} />
                      </View>
                    )}

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {doc.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.textGray }}>
                        {(doc.size / 1024).toFixed(1)} KB
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6, flexShrink: 0 }}>
                      {doc.type === 'image' && (
                        <TouchableOpacity
                          onPress={() => handleViewImage(doc.uri, doc.name)}
                          style={{ padding: 6, borderRadius: 6, backgroundColor: 'rgba(3, 77, 162, 0.1)' }}
                        >
                          <EyeIcon size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => removeFile(doc.id, 'document')}
                        style={{ padding: 6, borderRadius: 6, backgroundColor: '#FEF2F2' }}
                      >
                        <XMarkIcon size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // ============================================================================
  // RENDER STEP 3: REVIEW
  // ============================================================================

  const renderStep3 = () => {
    const isConsult = formData.category === 'CAT001' || formData.category === 'CAT005';
    const totalDocuments = isConsult
      ? prescriptionFiles.length + billFiles.length
      : documentPreviews.length;

    const billAmount = parseFloat(formData.billAmount || '0');
    const categoryLimit = walletRules?.categoryLimits?.[formData.category]?.perClaimLimit;
    const availableBalance = getAvailableBalance();
    const isCapped = categoryLimit && billAmount > categoryLimit;
    const approvedAmount = isCapped ? Math.min(billAmount, categoryLimit) : billAmount;
    const walletDeduction = Math.min(approvedAmount, availableBalance);
    const outOfPocket = approvedAmount - walletDeduction;

    return (
      <View style={{ gap: 16 }}>
        {/* Claim Details Card */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(217, 217, 217, 0.48)',
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Claim Details
          </Text>

          {/* Details rows */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>Category</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark, maxWidth: '60%', textAlign: 'right' }} numberOfLines={1}>
                {availableCategories.find((c) => c.categoryId === formData.category)?.name || '-'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>Billing Date</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark }}>
                {formData.treatmentDate ? formatDate(formData.treatmentDate) : '-'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>Bill Number</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark }}>
                {formData.billNumber || '-'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>Documents</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.success }}>
                {totalDocuments} file{totalDocuments !== 1 ? 's' : ''} uploaded
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Summary Card */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(217, 217, 217, 0.48)',
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 16 }}>
            Payment Summary
          </Text>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>Bill Amount</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textDark }}>
                ₹{billAmount.toLocaleString()}
              </Text>
            </View>

            {isCapped && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#FEF3C7', borderRadius: 6, marginHorizontal: -4 }}>
                <Text style={{ fontSize: 12, color: '#92400E' }}>Per-claim limit applied</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400E' }}>
                  -₹{(billAmount - categoryLimit).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}>Amount for Approval</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.success }}>
                ₹{approvedAmount.toLocaleString()}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: COLORS.textGray }}>Wallet Balance</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>
                ₹{availableBalance.toLocaleString()}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}>Wallet Deduction</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary }}>
                ₹{walletDeduction.toLocaleString()}
              </Text>
            </View>

            {outOfPocket > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#FEF2F2', borderRadius: 6, marginHorizontal: -4 }}>
                <Text style={{ fontSize: 12, color: COLORS.error }}>Not Covered</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.error }}>
                  ₹{outOfPocket.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms Card */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(217, 217, 217, 0.48)',
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 11 },
            shadowOpacity: 0.08,
            shadowRadius: 23,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 12, color: COLORS.textGray, lineHeight: 18 }}>
            By submitting, you confirm all information is accurate. Expected processing: <Text style={{ fontWeight: '600', color: COLORS.orange }}>3-5 business days</Text>
          </Text>
        </View>
      </View>
    );
  };

  // ============================================================================
  // PICKER MODALS
  // ============================================================================

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { value: string; label: string; subtitle?: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: COLORS.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '70%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textDark }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <XMarkIcon size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => onSelect(option.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: selectedValue === option.value ? 'rgba(3, 77, 162, 0.1)' : COLORS.background,
                  borderWidth: 1,
                  borderColor: selectedValue === option.value ? COLORS.primary : COLORS.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: selectedValue === option.value ? COLORS.primary : COLORS.textDark,
                    }}
                  >
                    {option.label}
                  </Text>
                  {option.subtitle && (
                    <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 4 }}>
                      {option.subtitle}
                    </Text>
                  )}
                </View>
                {selectedValue === option.value && (
                  <CheckCircleIcon size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ height: 32 }} />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const ContainerComponent = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <ContainerComponent style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header - Matching Home Page Style */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8, borderRadius: 12 }}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>
                New Claim
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
                Step {currentStep} of 3
              </Text>
            </View>
            {isDraftSaved && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                }}
              >
                <CheckCircleIcon size={14} color={COLORS.success} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.success }}>Saved</Text>
              </View>
            )}
          </View>
        </View>

        {renderStepIndicator()}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%' }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 16,
          paddingBottom: Platform.OS === 'web' ? 16 : Math.max(16, insets.bottom),
          paddingHorizontal: 16,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 11 },
          shadowOpacity: 0.08,
          shadowRadius: 23,
          elevation: 10,
        }}
      >
        <View style={{ maxWidth: 480, marginHorizontal: 'auto', width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentStep === 1}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: currentStep === 1 ? COLORS.border : COLORS.primary,
              opacity: currentStep === 1 ? 0.5 : 1,
            }}
          >
            <ArrowLeftIcon size={20} color={currentStep === 1 ? COLORS.textLight : COLORS.primary} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: currentStep === 1 ? COLORS.textLight : COLORS.primary,
              }}
            >
              Previous
            </Text>
          </TouchableOpacity>

          {currentStep < 3 ? (
            <TouchableOpacity onPress={handleNext} style={{ overflow: 'hidden', borderRadius: 12 }}>
              <LinearGradient
                colors={[COLORS.primary, '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 32,
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>Next Step</Text>
                <ArrowRightIcon size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{ overflow: 'hidden', borderRadius: 12, opacity: isSubmitting ? 0.7 : 1 }}
            >
              <LinearGradient
                colors={isSubmitting ? [COLORS.textLight, COLORS.textLight] : [COLORS.primary, '#5DA4FB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 32,
                  paddingVertical: 14,
                }}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color={COLORS.white} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>
                      Submitting...
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>
                    Submit Claim
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Picker Modals */}
      {renderPickerModal(
        showMemberPicker,
        () => setShowMemberPicker(false),
        'Select Family Member',
        familyMembers.map((m) => ({
          value: m.userId,
          label: m.name,
          subtitle: m.isPrimary ? 'Self' : m.relationship,
        })),
        selectedUserId,
        handleUserChange
      )}

      {renderPickerModal(
        showCategoryPicker,
        () => setShowCategoryPicker(false),
        'Select Claim Category',
        availableCategories.map((c) => ({
          value: c.categoryId,
          label: c.name,
        })),
        formData.category,
        handleCategoryChange
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setShowImagePreview(false)}
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 10,
              padding: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 24,
            }}
          >
            <XMarkIcon size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Image Name */}
          <View
            style={{
              position: 'absolute',
              top: 50,
              left: 20,
              right: 80,
              zIndex: 10,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}
              numberOfLines={1}
            >
              {previewImageName}
            </Text>
          </View>

          {/* Image */}
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={{
                width: '90%',
                height: '70%',
                resizeMode: 'contain',
              }}
            />
          ) : null}
        </View>
      </Modal>
    </ContainerComponent>
  );
}
