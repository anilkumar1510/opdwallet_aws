import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useFamily } from '../../../src/contexts/FamilyContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import apiClient from '../../../src/lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

interface FamilyMember {
  odUserId: string;
  odUser?: {
    _id: string;
    name?: { firstName?: string; lastName?: string };
    fullName?: string;
  };
  relationship: string;
}

interface Address {
  _id: string;
  addressId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// ============================================================================
// SVG ICONS
// ============================================================================

const ArrowLeftIcon = ({ width = 24, height = 24, color = '#111827' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloudArrowUpIcon = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentTextIcon = ({ width = 24, height = 24, color = '#0F5FDC' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = ({ width = 20, height = 20, color = '#6B7280' }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
    <Path
      d="M5 7.5L10 12.5L15 7.5"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UploadDiagnosticPrescriptionPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { familyMembers, viewingUserId, profileData } = useFamily();

  // Form state
  const [file, setFile] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientRelationship, setPatientRelationship] = useState('SELF');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Data state
  const [memberList, setMemberList] = useState<Array<{ userId: string; name: string; relationship: string }>>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Dropdown states
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Add Address Modal state
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressType: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false,
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Build member list
    const members: Array<{ userId: string; name: string; relationship: string }> = [];

    // Add self
    const selfId = viewingUserId || profileData?.user?._id || profile?.user?._id || user?._id;
    const selfName = profileData?.user?.name
      ? `${profileData.user.name.firstName} ${profileData.user.name.lastName}`.trim()
      : profile?.user?.name
        ? `${profile.user.name.firstName} ${profile.user.name.lastName}`.trim()
        : user?.fullName || 'Self';

    if (selfId) {
      members.push({
        userId: selfId,
        name: selfName,
        relationship: 'SELF',
      });
      setPatientId(selfId);
      setPatientName(selfName);
    }

    // Add family members
    if (familyMembers && familyMembers.length > 0) {
      familyMembers.forEach((member: any) => {
        if (member.odUser && member.odUser._id !== selfId) {
          const memberName = member.odUser.name
            ? `${member.odUser.name.firstName || ''} ${member.odUser.name.lastName || ''}`.trim()
            : member.odUser.fullName || 'Family Member';
          members.push({
            userId: member.odUser._id,
            name: memberName,
            relationship: member.relationship || 'OTHER',
          });
        }
      });
    }

    setMemberList(members);
  }, [viewingUserId, profileData, profile, user, familyMembers]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await apiClient.get('/member/addresses');

      if (response.data?.success && Array.isArray(response.data.data)) {
        setAddresses(response.data.data);

        // Auto-select default address
        const defaultAddress = response.data.data.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        }
      }
    } catch (error) {
      console.error('[DiagnosticUpload] Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = async () => {
    // Validate required fields
    if (!newAddress.addressLine1.trim()) {
      Alert.alert('Missing Field', 'Please enter address line 1');
      return;
    }
    if (!newAddress.city.trim()) {
      Alert.alert('Missing Field', 'Please enter city');
      return;
    }
    if (!newAddress.state.trim()) {
      Alert.alert('Missing Field', 'Please enter state');
      return;
    }
    if (!newAddress.pincode.trim() || newAddress.pincode.length !== 6) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode');
      return;
    }

    setAddingAddress(true);

    try {
      const response = await apiClient.post('/member/addresses', {
        addressType: newAddress.addressType,
        addressLine1: newAddress.addressLine1.trim(),
        addressLine2: newAddress.addressLine2.trim() || undefined,
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
        landmark: newAddress.landmark.trim() || undefined,
        isDefault: newAddress.isDefault,
      });

      if (response.data?.success) {
        // Reset form
        setNewAddress({
          addressType: 'HOME',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
          isDefault: false,
        });

        // Close modal and refresh addresses
        setShowAddAddressModal(false);
        await fetchAddresses();

        // Select the newly added address
        if (response.data.data?._id) {
          setSelectedAddressId(response.data.data._id);
        }

        if (Platform.OS === 'web') {
          window.alert('Address added successfully!');
        } else {
          Alert.alert('Success', 'Address added successfully!');
        }
      }
    } catch (error: any) {
      console.error('[DiagnosticUpload] Error adding address:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add address';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setAddingAddress(false);
    }
  };

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleSelectFile = async () => {
    if (Platform.OS === 'web') {
      // For web, create a hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = (e: any) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
          validateAndSetFile(selectedFile);
        }
      };
      input.click();
    } else {
      // For native, show options
      Alert.alert(
        'Select File',
        'Choose how to upload your prescription',
        [
          {
            text: 'Take Photo',
            onPress: handleTakePhoto,
          },
          {
            text: 'Choose from Gallery',
            onPress: handleChooseFromGallery,
          },
          {
            text: 'Choose PDF',
            onPress: handleChoosePDF,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: `diagnostic_prescription_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      setPreview(asset.uri);
    }
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.fileName || `diagnostic_prescription_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      setPreview(asset.uri);
    }
  };

  const handleChoosePDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFile({
          uri: asset.uri,
          name: asset.name,
          type: 'application/pdf',
        });
        setPreview(null); // No preview for PDF
      }
    } catch (error) {
      console.error('[DiagnosticUpload] Error picking document:', error);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      Alert.alert('Invalid File', 'Please upload an image or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      Alert.alert('File Too Large', 'File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
  };

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleUpload = async () => {
    console.log('[DiagnosticUpload] Starting upload process...');

    if (!file) {
      Alert.alert('Missing File', 'Please select a file');
      return;
    }

    if (!patientName.trim()) {
      Alert.alert('Missing Patient', 'Please select a patient');
      return;
    }

    if (!prescriptionDate) {
      Alert.alert('Missing Date', 'Please select prescription date');
      return;
    }

    if (!selectedAddressId) {
      Alert.alert('Missing Address', 'Please select an address');
      return;
    }

    const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
    if (!selectedAddress) {
      Alert.alert('Error', 'Selected address not found');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      // Append file
      if (Platform.OS === 'web') {
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      }

      // Append other fields
      formData.append('patientId', patientId);
      formData.append('patientName', patientName.trim());
      formData.append('patientRelationship', patientRelationship);
      formData.append('prescriptionDate', prescriptionDate);
      formData.append('addressId', selectedAddressId);
      formData.append('pincode', selectedAddress.pincode);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      console.log('[DiagnosticUpload] FormData prepared');

      const response = await apiClient.post('/member/diagnostics/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[DiagnosticUpload] Response:', response.data);

      if (Platform.OS === 'web') {
        window.alert(response.data?.message || 'Prescription uploaded successfully!');
      } else {
        Alert.alert('Success', response.data?.message || 'Prescription uploaded successfully!');
      }

      router.replace('/member/diagnostics');
    } catch (error: any) {
      console.error('[DiagnosticUpload] Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload prescription';

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Upload Failed', errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
  const selectedMember = memberList.find(m => m.userId === patientId);

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fc' }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0E51A2' }}>
        <LinearGradient
          colors={['#0E51A2', '#1565C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: 16, padding: 4 }}
            >
              <ArrowLeftIcon width={24} height={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                Upload Prescription
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                Upload your diagnostic test prescription
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Upload Area */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
            Select Prescription File
          </Text>

          {!file ? (
            <TouchableOpacity
              onPress={handleSelectFile}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#86ACD8',
                borderRadius: 12,
                padding: 32,
                alignItems: 'center',
              }}
            >
              <CloudArrowUpIcon width={48} height={48} color="#0F5FDC" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2', marginTop: 12 }}>
                {Platform.OS === 'web' ? 'Click to upload' : 'Tap to upload'}
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                JPG, PNG, PDF (Max 10MB)
              </Text>
            </TouchableOpacity>
          ) : (
            <View>
              {/* Preview */}
              <View
                style={{
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  alignItems: 'center',
                }}
              >
                {preview ? (
                  <Image
                    source={{ uri: preview }}
                    style={{ width: '100%', height: 200, borderRadius: 8 }}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={{ paddingVertical: 32 }}>
                    <DocumentTextIcon width={64} height={64} color="#0F5FDC" />
                  </View>
                )}
              </View>

              {/* File Info */}
              <View
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#0E51A2' }} numberOfLines={1}>
                    {file.name}
                  </Text>
                  {file.size && (
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={handleRemoveFile}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#DC2626' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Patient Information - Only show after file selected */}
        {file && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
              Patient Information
            </Text>

            {/* Patient Selection */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                Select Patient <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowPatientDropdown(!showPatientDropdown)}
                style={{
                  borderWidth: 2,
                  borderColor: '#86ACD8',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, color: selectedMember ? '#111827' : '#9CA3AF' }}>
                  {selectedMember
                    ? `${selectedMember.name}${selectedMember.relationship !== 'SELF' ? ` (${selectedMember.relationship})` : ''}`
                    : 'Select a patient'}
                </Text>
                <ChevronDownIcon width={20} height={20} color="#6B7280" />
              </TouchableOpacity>

              {showPatientDropdown && (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    marginTop: 4,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {memberList.map((member) => (
                    <TouchableOpacity
                      key={member.userId}
                      onPress={() => {
                        setPatientId(member.userId);
                        setPatientName(member.name);
                        setPatientRelationship(member.relationship);
                        setShowPatientDropdown(false);
                      }}
                      style={{
                        padding: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F3F4F6',
                        backgroundColor: patientId === member.userId ? '#EFF4FF' : '#FFFFFF',
                      }}
                    >
                      <Text style={{ fontSize: 14, color: '#111827' }}>
                        {member.name} {member.relationship !== 'SELF' && `(${member.relationship})`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Prescription Date */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                Prescription Date <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    borderRadius: 12,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    // For native, would use a date picker
                    // For simplicity, using current date
                    setPrescriptionDate(new Date().toISOString().split('T')[0]);
                  }}
                  style={{
                    borderWidth: 2,
                    borderColor: '#86ACD8',
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <Text style={{ fontSize: 14, color: prescriptionDate ? '#111827' : '#9CA3AF' }}>
                    {prescriptionDate || 'Select date'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Address Selection */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                Select Address <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>

              {loadingAddresses ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0F5FDC" />
                </View>
              ) : addresses.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                    No addresses found. Please add an address first.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddAddressModal(true)}
                    style={{
                      backgroundColor: '#0F5FDC',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>
                      Add New Address
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setShowAddressDropdown(!showAddressDropdown)}
                    style={{
                      borderWidth: 2,
                      borderColor: '#86ACD8',
                      borderRadius: 12,
                      padding: 14,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: selectedAddress ? '#111827' : '#9CA3AF', flex: 1 }} numberOfLines={1}>
                      {selectedAddress
                        ? `${selectedAddress.addressLine1}, ${selectedAddress.city} - ${selectedAddress.pincode}`
                        : 'Select an address'}
                    </Text>
                    <ChevronDownIcon width={20} height={20} color="#6B7280" />
                  </TouchableOpacity>

                  {showAddressDropdown && (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        marginTop: 4,
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      {addresses.map((address) => (
                        <TouchableOpacity
                          key={address._id}
                          onPress={() => {
                            setSelectedAddressId(address._id);
                            setShowAddressDropdown(false);
                          }}
                          style={{
                            padding: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6',
                            backgroundColor: selectedAddressId === address._id ? '#EFF4FF' : '#FFFFFF',
                          }}
                        >
                          <Text style={{ fontSize: 14, color: '#111827' }}>
                            {address.addressLine1}, {address.city} - {address.pincode}
                            {address.isDefault && ' (Default)'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {selectedAddress && (
                    <View
                      style={{
                        backgroundColor: '#EFF4FF',
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#0F5FDC' }}>
                        <Text style={{ fontWeight: '600' }}>Pincode:</Text> {selectedAddress.pincode}
                      </Text>
                    </View>
                  )}

                  {/* Add New Address Button */}
                  <TouchableOpacity
                    onPress={() => setShowAddAddressModal(true)}
                    style={{
                      marginTop: 12,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0F5FDC' }}>
                      + Add New Address
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* Notes - Only show after file selected */}
        {file && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0E51A2', marginBottom: 16 }}>
              Additional Notes (Optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any specific instructions or information..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 2,
                borderColor: '#86ACD8',
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                color: '#111827',
                textAlignVertical: 'top',
                minHeight: 100,
              }}
            />
          </View>
        )}

        {/* Info Card */}
        <View
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0E51A2', marginBottom: 12 }}>
            What happens next?
          </Text>
          {[
            'Your prescription will be reviewed by our team',
            "We'll create a cart with all the tests from your prescription",
            "You'll be notified once your cart is ready for review",
            'Select a diagnostic center and book your slot',
          ].map((step, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#0F5FDC', marginRight: 8 }}>
                {index + 1}.
              </Text>
              <Text style={{ fontSize: 13, color: '#374151', flex: 1 }}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Upload Button - Only show after file selected */}
        {file && (
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.8}
            style={{
              backgroundColor: uploading ? '#93C5FD' : '#0F5FDC',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {uploading && (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
              {uploading ? 'Uploading...' : 'Upload Prescription'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !addingAddress && setShowAddAddressModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '90%',
              }}
            >
              {/* Modal Header */}
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                    Add New Address
                  </Text>
                  <TouchableOpacity
                    onPress={() => !addingAddress && setShowAddAddressModal(false)}
                    style={{ padding: 4 }}
                    disabled={addingAddress}
                  >
                    <Text style={{ fontSize: 24, color: '#6B7280' }}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  Enter the address details below
                </Text>
              </View>

              <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                {/* Address Type */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Address Type <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setNewAddress(prev => ({ ...prev, addressType: type }))}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: newAddress.addressType === type ? '#0F5FDC' : '#E5E7EB',
                          backgroundColor: newAddress.addressType === type ? '#EFF4FF' : '#FFFFFF',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '500',
                          color: newAddress.addressType === type ? '#0F5FDC' : '#6B7280'
                        }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Address Line 1 */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Address Line 1 <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                  <TextInput
                    value={newAddress.addressLine1}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine1: text }))}
                    placeholder="House/Flat no., Building name"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 14,
                      color: '#111827',
                    }}
                    editable={!addingAddress}
                  />
                </View>

                {/* Address Line 2 */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Address Line 2 (Optional)
                  </Text>
                  <TextInput
                    value={newAddress.addressLine2}
                    onChangeText={(text) => setNewAddress(prev => ({ ...prev, addressLine2: text }))}
                    placeholder="Street, Area"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 14,
                      color: '#111827',
                    }}
                    editable={!addingAddress}
                  />
                </View>

                {/* City and State */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                      City <Text style={{ color: '#DC2626' }}>*</Text>
                    </Text>
                    <TextInput
                      value={newAddress.city}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                      placeholder="City"
                      placeholderTextColor="#9CA3AF"
                      style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 14,
                        color: '#111827',
                      }}
                      editable={!addingAddress}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                      State <Text style={{ color: '#DC2626' }}>*</Text>
                    </Text>
                    <TextInput
                      value={newAddress.state}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, state: text }))}
                      placeholder="State"
                      placeholderTextColor="#9CA3AF"
                      style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 14,
                        color: '#111827',
                      }}
                      editable={!addingAddress}
                    />
                  </View>
                </View>

                {/* Pincode and Landmark */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                      Pincode <Text style={{ color: '#DC2626' }}>*</Text>
                    </Text>
                    <TextInput
                      value={newAddress.pincode}
                      onChangeText={(text) => {
                        const numericText = text.replace(/\D/g, '').slice(0, 6);
                        setNewAddress(prev => ({ ...prev, pincode: numericText }));
                      }}
                      placeholder="6-digit pincode"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={6}
                      style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 14,
                        color: '#111827',
                      }}
                      editable={!addingAddress}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                      Landmark (Optional)
                    </Text>
                    <TextInput
                      value={newAddress.landmark}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, landmark: text }))}
                      placeholder="Nearby landmark"
                      placeholderTextColor="#9CA3AF"
                      style={{
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 14,
                        color: '#111827',
                      }}
                      editable={!addingAddress}
                    />
                  </View>
                </View>

                {/* Set as Default */}
                <TouchableOpacity
                  onPress={() => setNewAddress(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
                  disabled={addingAddress}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: newAddress.isDefault ? '#0F5FDC' : '#D1D5DB',
                      backgroundColor: newAddress.isDefault ? '#0F5FDC' : '#FFFFFF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8,
                    }}
                  >
                    {newAddress.isDefault && (
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: '#374151' }}>Set as default address</Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                  <TouchableOpacity
                    onPress={() => setShowAddAddressModal(false)}
                    disabled={addingAddress}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      alignItems: 'center',
                      opacity: addingAddress ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddAddress}
                    disabled={addingAddress}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: addingAddress ? '#93C5FD' : '#0F5FDC',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    {addingAddress && (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>
                      {addingAddress ? 'Adding...' : 'Add Address'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
