'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFamily } from '../../src/contexts/FamilyContext';
import apiClient from '../../src/lib/api/client';

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
  primary: '#034DA2',
  primaryLight: '#0E51A2',
  textDark: '#1c1c1c',
  textGray: '#6B7280',
  background: '#f7f7fc',
  white: '#FFFFFF',
  border: '#E5E7EB',
  cardBorder: '#E5E7EB',
  success: '#16a34a',
  error: '#DC2626',
  selectedBorder: '#86ACD8',
  iconBg: 'rgba(3, 77, 162, 0.1)',
};

// ============================================================================
// SVG ICONS
// ============================================================================

function ArrowLeftIcon({ size = 24, color = '#0E51A2' }: { size?: number; color?: string }) {
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

function MagnifyingGlassIcon({ size = 24, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21L15.8033 15.8033M15.8033 15.8033C17.1605 14.4461 18 12.5711 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18C12.5711 18 14.4461 17.1605 15.8033 15.8033Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentTextIcon({ size = 24, color = '#0F5FDC' }: { size?: number; color?: string }) {
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

function CalendarIcon({ size = 24, color = '#0F5FDC' }: { size?: number; color?: string }) {
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

function ClockIcon({ size = 24, color = '#6B7280' }: { size?: number; color?: string }) {
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

function UserIcon({ size = 24, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MapPinIcon({ size = 24, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.6569 16.6569C16.7202 17.5935 14.7616 19.5521 13.4138 20.8999C12.6327 21.681 11.3677 21.6814 10.5866 20.9003C9.26234 19.576 7.34159 17.6553 6.34315 16.6569C3.21895 13.5327 3.21895 8.46734 6.34315 5.34315C9.46734 2.21895 14.5327 2.21895 17.6569 5.34315C20.781 8.46734 20.781 13.5327 17.6569 16.6569Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function VideoCameraIcon({ size = 24, color = '#0F5FDC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15.75 10.5L20.4697 5.78033C20.9421 5.30786 21.75 5.64248 21.75 6.31066V17.6893C21.75 18.3575 20.9421 18.6921 20.4697 18.2197L15.75 13.5M4.5 18.75H13.5C14.7426 18.75 15.75 17.7426 15.75 16.5V7.5C15.75 6.25736 14.7426 5.25 13.5 5.25H4.5C3.25736 5.25 2.25 6.25736 2.25 7.5V16.5C2.25 17.7426 3.25736 18.75 4.5 18.75Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function CloudArrowDownIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 10V16M12 16L9 13M12 16L15 13M6.5 20C4.01472 20 2 17.9853 2 15.5C2 13.5 3.2 11.7 5 11C5 7.13401 8.13401 4 12 4C15.866 4 19 7.13401 19 11C20.8 11.7 22 13.5 22 15.5C22 17.9853 19.9853 20 17.5 20H6.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BeakerIcon({ size = 24, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.75 3.104V5.25C9.75 5.66421 9.41421 6 9 6H7.5C6.25736 6 5.25 7.00736 5.25 8.25V9.75M14.25 3.104V5.25C14.25 5.66421 14.5858 6 15 6H16.5C17.7426 6 18.75 7.00736 18.75 8.25V9.75M5.25 9.75V18C5.25 19.2426 6.25736 20.25 7.5 20.25H16.5C17.7426 20.25 18.75 19.2426 18.75 18V9.75M5.25 9.75H18.75M9 3.104C9 2.21882 9.71882 1.5 10.604 1.5H13.396C14.2812 1.5 15 2.21882 15 3.104V3.104C15 3.04627 14.9537 3 14.896 3H9.104C9.04627 3 9 3.04627 9 3.104V3.104Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ============================================================================
// INTERFACES
// ============================================================================

interface AppointmentInfo {
  appointmentId: string;
  appointmentNumber: string;
  appointmentType: string;
  appointmentDate: string;
  timeSlot: string;
  clinicName?: string;
  clinicAddress?: string;
  specialty: string;
  consultationFee: number;
  status: string;
  doctorName?: string;
}

interface MedicineItem {
  medicineName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
}

interface LabTestItem {
  testName: string;
  instructions?: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  doctorName: string;
  patientName: string;
  uploadDate: string;
  diagnosis?: string;
  notes?: string;
  fileName: string;
  fileSize: number;
  appointmentId?: AppointmentInfo;
}

interface DigitalPrescription {
  _id: string;
  prescriptionId: string;
  doctorName: string;
  doctorQualification?: string;
  patientName: string;
  createdDate: string;
  chiefComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  medicines: MedicineItem[];
  labTests: LabTestItem[];
  generalInstructions?: string;
  dietaryAdvice?: string;
  followUpDate?: string;
  followUpInstructions?: string;
  prescriptionType: 'DIGITAL' | 'UPLOADED_PDF';
  pdfGenerated: boolean;
  appointmentId?: AppointmentInfo;
}

interface Bill {
  _id: string;
  paymentId: string;
  amount: number;
  paymentType: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  serviceType: string;
  serviceReferenceId: string;
  description: string;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HealthRecordsPage() {
  const { viewingUserId } = useFamily();
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'bills'>('prescriptions');
  const [searchTerm, setSearchTerm] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [digitalPrescriptions, setDigitalPrescriptions] = useState<DigitalPrescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [visibleBillsCount, setVisibleBillsCount] = useState(2);
  const [loading, setLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      fetchAllPrescriptions();
    } else if (activeTab === 'bills') {
      fetchBills();
    }
  }, [activeTab, viewingUserId]);

  const fetchBills = async () => {
    try {
      setBillsLoading(true);
      setError('');
      setVisibleBillsCount(2); // Reset pagination

      // Fetch completed payments
      const response = await apiClient.get('/payments', {
        params: {
          status: 'COMPLETED',
          limit: '100',
        },
      });

      // Handle different response structures
      const allPayments = response.data?.payments || response.data || [];

      // Filter for dental, vision, lab, and appointment service types
      const filteredBills = Array.isArray(allPayments)
        ? allPayments.filter(
            (p: Bill) => ['DENTAL', 'VISION', 'LAB_ORDER', 'APPOINTMENT'].includes(p.serviceType)
          )
        : [];

      console.log('[HealthRecords] Bills fetched:', filteredBills.length);
      setBills(filteredBills);
    } catch (err: any) {
      console.error('Error fetching bills:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load bills';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to load bills');
      setBills([]);
    } finally {
      setBillsLoading(false);
    }
  };

  const fetchAllPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');

      const params = viewingUserId ? `?userId=${viewingUserId}` : '';

      // Fetch both PDF and digital prescriptions in parallel
      const [pdfResponse, digitalResponse] = await Promise.all([
        apiClient.get(`/member/prescriptions${params}`),
        apiClient.get(`/member/digital-prescriptions${params}`),
      ]);

      setPrescriptions(pdfResponse.data.prescriptions || []);
      setDigitalPrescriptions(digitalResponse.data.prescriptions || []);
    } catch (err: any) {
      console.error('Error fetching prescriptions:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load prescriptions';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const viewPrescription = async (prescriptionId: string) => {
    setDownloadingId(prescriptionId);
    try {
      const response = await apiClient.get(`/member/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob',
      });

      const blob = response.data;

      if (Platform.OS === 'web') {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        // For native, convert to data URI
        const reader = new FileReader();
        reader.onloadend = () => {
          Linking.openURL(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to view prescription';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadPrescription = async (prescriptionId: string, fileName: string) => {
    setDownloadingId(`download-${prescriptionId}`);
    try {
      const response = await apiClient.get(`/member/prescriptions/${prescriptionId}/download`, {
        responseType: 'blob',
      });

      const blob = response.data;

      if (Platform.OS === 'web') {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        // For native - same as view
        const reader = new FileReader();
        reader.onloadend = () => {
          Linking.openURL(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to download prescription';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadDigitalPrescriptionPDF = async (prescriptionId: string) => {
    setDownloadingId(`digital-${prescriptionId}`);
    try {
      const response = await apiClient.get(
        `/member/digital-prescriptions/${prescriptionId}/download-pdf`,
        { responseType: 'blob' }
      );

      const blob = response.data;

      if (Platform.OS === 'web') {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `prescription-${prescriptionId}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          Linking.openURL(reader.result as string);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to download prescription PDF';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter prescriptions based on search
  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDigitalPrescriptions = digitalPrescriptions.filter(
    (p) =>
      p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.medicines &&
        p.medicines.some(
          (m) =>
            m.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.genericName && m.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
        ))
  );

  const totalPrescriptions = filteredPrescriptions.length + filteredDigitalPrescriptions.length;

  const ContainerComponent = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <ContainerComponent style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/member')}
            style={{
              padding: 8,
              borderRadius: 12,
            }}
          >
            <ArrowLeftIcon size={24} color={COLORS.primaryLight} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primaryLight }}>Health Records</Text>
            <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 2 }}>
              View your prescriptions and medical records
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Search Bar */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              paddingHorizontal: 12,
            }}
          >
            <MagnifyingGlassIcon size={20} color={COLORS.primary} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search prescriptions by doctor, diagnosis, or patient..."
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingHorizontal: 12,
                fontSize: 14,
                color: COLORS.textDark,
              }}
            />
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            borderBottomWidth: 2,
            borderBottomColor: COLORS.border,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('prescriptions')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderBottomWidth: activeTab === 'prescriptions' ? 4 : 0,
              borderBottomColor: COLORS.primary,
              marginBottom: -2,
            }}
          >
            <DocumentTextIcon size={20} color={activeTab === 'prescriptions' ? COLORS.primaryLight : COLORS.textGray} />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: '600',
                color: activeTab === 'prescriptions' ? COLORS.primaryLight : COLORS.textGray,
              }}
            >
              Prescriptions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('bills')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderBottomWidth: activeTab === 'bills' ? 4 : 0,
              borderBottomColor: COLORS.primary,
              marginBottom: -2,
            }}
          >
            <DocumentTextIcon size={20} color={activeTab === 'bills' ? COLORS.primaryLight : COLORS.textGray} />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: '600',
                color: activeTab === 'bills' ? COLORS.primaryLight : COLORS.textGray,
              }}
            >
              Bills & Invoices
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error ? (
          <View
            style={{
              marginBottom: 24,
              padding: 16,
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 14, color: COLORS.error }}>{error}</Text>
          </View>
        ) : null}

        {/* Content */}
        {activeTab === 'prescriptions' ? (
          loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              {/* Digital Prescriptions */}
              {filteredDigitalPrescriptions.map((prescription) => (
                <DigitalPrescriptionCard
                  key={prescription._id}
                  prescription={prescription}
                  onDownload={() => downloadDigitalPrescriptionPDF(prescription.prescriptionId)}
                  isDownloading={downloadingId === `digital-${prescription.prescriptionId}`}
                />
              ))}

              {/* PDF Prescriptions */}
              {filteredPrescriptions.map((prescription) => (
                <PDFPrescriptionCard
                  key={prescription._id}
                  prescription={prescription}
                  onView={() => viewPrescription(prescription.prescriptionId)}
                  onDownload={() => downloadPrescription(prescription.prescriptionId, prescription.fileName)}
                  isViewing={downloadingId === prescription.prescriptionId}
                  isDownloading={downloadingId === `download-${prescription.prescriptionId}`}
                />
              ))}

              {/* Empty State */}
              {totalPrescriptions === 0 && !loading && <EmptyState type="prescriptions" />}
            </View>
          )
        ) : (
          billsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : bills.length === 0 ? (
            <EmptyState type="bills" />
          ) : (
            <View style={{ gap: 16 }}>
              {bills.slice(0, visibleBillsCount).map((bill, index) => (
                <View key={bill._id}>
                  <BillCard bill={bill} />
                  {/* Load More button on the last visible card if there are more bills */}
                  {index === visibleBillsCount - 1 && visibleBillsCount < bills.length && (
                    <TouchableOpacity
                      onPress={() => setVisibleBillsCount((prev) => prev + 2)}
                      style={{
                        marginTop: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        backgroundColor: COLORS.iconBg,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary }}>
                        Load More ({bills.length - visibleBillsCount} remaining)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </ContainerComponent>
  );
}

// ============================================================================
// DIGITAL PRESCRIPTION CARD
// ============================================================================

function DigitalPrescriptionCard({
  prescription,
  onDownload,
  isDownloading,
}: {
  prescription: DigitalPrescription;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  const appointment = prescription.appointmentId;

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
      }}
    >
      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.iconBg,
            }}
          >
            <DocumentTextIcon size={24} color={COLORS.primary} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primaryLight }}>
              Digital Prescription
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textGray }}>{prescription.prescriptionType}</Text>
          </View>
        </View>

        {/* Appointment Details */}
        {appointment && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
              Appointment Details
            </Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <UserIcon size={20} color={COLORS.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark }}>
                    {prescription.doctorName}
                  </Text>
                  {prescription.doctorQualification && (
                    <Text style={{ fontSize: 13, color: COLORS.textGray }}>
                      {prescription.doctorQualification}
                    </Text>
                  )}
                  <Text style={{ fontSize: 13, color: COLORS.textGray }}>{appointment.specialty}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CalendarIcon size={20} color={COLORS.primary} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark, marginLeft: 12 }}>
                  {formatDate(appointment.appointmentDate)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Clinical Information */}
        {(prescription.chiefComplaint || prescription.diagnosis) && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16, gap: 12 }}>
            {prescription.chiefComplaint && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Chief Complaint
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textDark }}>{prescription.chiefComplaint}</Text>
              </View>
            )}
            {prescription.diagnosis && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Diagnosis
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textDark }}>{prescription.diagnosis}</Text>
              </View>
            )}
          </View>
        )}

        {/* Medicines */}
        {prescription.medicines && prescription.medicines.length > 0 && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
              Prescribed Medicines (Rx)
            </Text>
            <View style={{ gap: 12 }}>
              {prescription.medicines.map((medicine, idx) => (
                <View key={idx} style={{ backgroundColor: COLORS.iconBg, padding: 16, borderRadius: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 }}>
                    {medicine.medicineName}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 12, color: COLORS.textGray }}>Dosage:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}>{medicine.dosage}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 12, color: COLORS.textGray }}>Frequency:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}>{medicine.frequency}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 12, color: COLORS.textGray }}>Duration:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}>{medicine.duration}</Text>
                    </View>
                    <View style={{ width: '45%' }}>
                      <Text style={{ fontSize: 12, color: COLORS.textGray }}>Route:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textDark }}>{medicine.route}</Text>
                    </View>
                  </View>
                  {medicine.instructions && (
                    <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 8, fontStyle: 'italic' }}>
                      {medicine.instructions}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lab Tests */}
        {prescription.labTests && prescription.labTests.length > 0 && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <BeakerIcon size={16} color={COLORS.textGray} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 }}>
                Lab Tests / Investigations
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {prescription.labTests.map((test, idx) => (
                <View key={idx} style={{ backgroundColor: COLORS.iconBg, padding: 12, borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                    {idx + 1}. {test.testName}
                  </Text>
                  {test.instructions && (
                    <Text style={{ fontSize: 13, color: COLORS.textGray, marginTop: 4 }}>{test.instructions}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {(prescription.generalInstructions || prescription.dietaryAdvice) && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16, gap: 12 }}>
            {prescription.generalInstructions && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  General Instructions
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textDark, lineHeight: 20 }}>
                  {prescription.generalInstructions}
                </Text>
              </View>
            )}
            {prescription.dietaryAdvice && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Dietary Advice
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textDark, lineHeight: 20 }}>
                  {prescription.dietaryAdvice}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Follow-up */}
        {(prescription.followUpDate || prescription.followUpInstructions) && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Follow-up
            </Text>
            {prescription.followUpDate && (
              <Text style={{ fontSize: 14, color: COLORS.textDark }}>Date: {formatDate(prescription.followUpDate)}</Text>
            )}
            {prescription.followUpInstructions && (
              <Text style={{ fontSize: 13, color: COLORS.textDark, marginTop: 4 }}>
                {prescription.followUpInstructions}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {prescription.pdfGenerated && (
          <TouchableOpacity
            onPress={onDownload}
            disabled={isDownloading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: COLORS.primary,
              opacity: isDownloading ? 0.7 : 1,
            }}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CloudArrowDownIcon size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15, marginLeft: 8 }}>
                  Download PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Prescription ID & Date */}
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <Text style={{ fontSize: 12, color: COLORS.textGray, textAlign: 'center' }}>
            ID: {prescription.prescriptionId} • Created: {formatDate(prescription.createdDate)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// PDF PRESCRIPTION CARD
// ============================================================================

function PDFPrescriptionCard({
  prescription,
  onView,
  onDownload,
  isViewing,
  isDownloading,
}: {
  prescription: Prescription;
  onView: () => void;
  onDownload: () => void;
  isViewing: boolean;
  isDownloading: boolean;
}) {
  const appointment = prescription.appointmentId;

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
      }}
    >
      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.iconBg,
            }}
          >
            <DocumentTextIcon size={24} color={COLORS.primary} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primaryLight }}>PDF Prescription</Text>
            <View
              style={{
                backgroundColor: '#DCFCE7',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                alignSelf: 'flex-start',
                marginTop: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#15803D' }}>Active</Text>
            </View>
          </View>
        </View>

        {/* Appointment Details Section */}
        {appointment && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
              Appointment Details
            </Text>

            <View style={{ gap: 12 }}>
              {/* Doctor & Specialty */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <UserIcon size={20} color={COLORS.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textDark }}>
                    {appointment.doctorName || prescription.doctorName}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textGray }}>{appointment.specialty}</Text>
                </View>
              </View>

              {/* Date & Time */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CalendarIcon size={20} color={COLORS.primary} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                    {formatDate(appointment.appointmentDate)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ClockIcon size={16} color={COLORS.textGray} />
                    <Text style={{ fontSize: 13, color: COLORS.textGray, marginLeft: 4 }}>{appointment.timeSlot}</Text>
                  </View>
                </View>
              </View>

              {/* Location/Type */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {appointment.appointmentType === 'ONLINE' ? (
                  <>
                    <VideoCameraIcon size={20} color={COLORS.primary} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>Online Consultation</Text>
                      <Text style={{ fontSize: 12, color: COLORS.textGray }}>Video Call</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <MapPinIcon size={20} color={COLORS.primary} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }}>
                        {appointment.clinicName || 'In-Clinic Visit'}
                      </Text>
                      {appointment.clinicAddress && (
                        <Text style={{ fontSize: 12, color: COLORS.textGray }}>{appointment.clinicAddress}</Text>
                      )}
                    </View>
                  </>
                )}
              </View>

              {/* Patient */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <UserIcon size={20} color={COLORS.textGray} />
                <Text style={{ fontSize: 13, color: COLORS.textGray, marginLeft: 12 }}>
                  Patient: <Text style={{ fontWeight: '500', color: COLORS.textDark }}>{prescription.patientName}</Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Clinical Information */}
        {(prescription.diagnosis || prescription.notes) && (
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16, gap: 12 }}>
            {prescription.diagnosis && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Diagnosis
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textDark }}>{prescription.diagnosis}</Text>
              </View>
            )}
            {prescription.notes && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Doctor's Notes
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textDark, lineHeight: 20 }}>{prescription.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* File Information */}
        <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 }}>
                <DocumentTextIcon size={24} color={COLORS.error} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textDark }} numberOfLines={1}>
                  {prescription.fileName}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                  {formatFileSize(prescription.fileSize)} • PDF Document
                </Text>
              </View>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 8 }}>
            Uploaded: {formatDate(prescription.uploadDate)} • {formatTime(prescription.uploadDate)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={onView}
            disabled={isViewing}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: COLORS.primary,
              opacity: isViewing ? 0.7 : 1,
            }}
          >
            {isViewing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <EyeIcon size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15, marginLeft: 8 }}>View PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDownload}
            disabled={isDownloading}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.white,
              opacity: isDownloading ? 0.7 : 1,
            }}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={COLORS.textDark} />
            ) : (
              <>
                <CloudArrowDownIcon size={20} color={COLORS.textDark} />
                <Text style={{ color: COLORS.textDark, fontWeight: '600', fontSize: 15, marginLeft: 8 }}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Prescription ID */}
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <Text style={{ fontSize: 12, color: COLORS.textGray, textAlign: 'center' }}>ID: {prescription.prescriptionId}</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// BILL CARD
// ============================================================================

function BillCard({ bill }: { bill: Bill }) {
  // Helper to safely convert any value to string
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'DENTAL':
        return 'Dental Service';
      case 'VISION':
        return 'Vision Service';
      case 'LAB_ORDER':
        return 'Lab Test';
      case 'APPOINTMENT':
        return 'Consultation';
      default:
        return safeString(type) || 'Service';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return COLORS.success;
      case 'PENDING':
        return '#F59E0B';
      case 'FAILED':
      case 'CANCELLED':
        return COLORS.error;
      default:
        return COLORS.textGray;
    }
  };

  // Safely format date
  const safeFormatDate = (dateStr: any): string => {
    if (!dateStr) return 'N/A';
    try {
      return formatDate(safeString(dateStr));
    } catch {
      return 'N/A';
    }
  };

  return (
    <View
      style={{
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: COLORS.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DocumentTextIcon size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.primaryLight }}>
              {getServiceTypeLabel(bill.serviceType)}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 2 }}>
              {safeFormatDate(bill.createdAt)}
            </Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: getStatusColor(safeString(bill.status)),
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.white }}>{safeString(bill.status)}</Text>
        </View>
      </View>

      {/* Details */}
      <View
        style={{
          borderRadius: 12,
          padding: 12,
          backgroundColor: COLORS.iconBg,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 14, color: COLORS.textDark, marginBottom: 8 }}>{safeString(bill.description) || 'Payment'}</Text>
        {bill.transactionId && (
          <Text style={{ fontSize: 12, color: COLORS.textGray }}>Transaction ID: {safeString(bill.transactionId)}</Text>
        )}
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: COLORS.textGray }}>ID: {safeString(bill.paymentId)}</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>₹{safeString(bill.amount)}</Text>
      </View>

      {bill.paidAt && (
        <Text style={{ fontSize: 12, color: COLORS.textGray, marginTop: 8 }}>
          Paid on: {safeFormatDate(bill.paidAt)}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ type }: { type: 'prescriptions' | 'bills' }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        backgroundColor: COLORS.white,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 11 },
        shadowOpacity: 0.08,
        shadowRadius: 23,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.iconBg,
          marginBottom: 24,
        }}
      >
        <DocumentTextIcon size={40} color={COLORS.primary} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.primaryLight, marginBottom: 8, textAlign: 'center' }}>
        {type === 'prescriptions' ? 'No prescriptions found' : 'No bills found'}
      </Text>
      <Text style={{ fontSize: 14, color: COLORS.textGray, textAlign: 'center' }}>
        {type === 'prescriptions'
          ? 'Prescriptions from your doctor will appear here'
          : 'Your bills and invoices from dental, vision, and other services will appear here'}
      </Text>
    </View>
  );
}
