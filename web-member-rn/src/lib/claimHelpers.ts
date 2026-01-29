import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Document preview interface for React Native
 */
export interface DocumentPreview {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'pdf';
  size: number;
  mimeType: string;
}

/**
 * Pick documents from device storage
 */
export async function pickDocuments(): Promise<DocumentPreview[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return [];
    }

    return result.assets.map((asset) => ({
      id: Math.random().toString(36).substring(7),
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType?.startsWith('image/') ? 'image' : 'pdf',
      size: asset.size || 0,
      mimeType: asset.mimeType || 'application/octet-stream',
    }));
  } catch (error) {
    console.error('Error picking documents:', error);
    return [];
  }
}

/**
 * Take a photo using camera
 */
export async function takePhoto(): Promise<DocumentPreview | null> {
  try {
    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Camera permission is required to take photos');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      id: Math.random().toString(36).substring(7),
      uri: asset.uri,
      name: `photo_${Date.now()}.jpg`,
      type: 'image',
      size: asset.fileSize || 0,
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
}

/**
 * Pick image from gallery
 */
export async function pickImage(): Promise<DocumentPreview | null> {
  try {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Photo library permission is required to select images');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      id: Math.random().toString(36).substring(7),
      uri: asset.uri,
      name: asset.fileName || `image_${Date.now()}.jpg`,
      type: 'image',
      size: asset.fileSize || 0,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

/**
 * Get file size error message
 */
export function getFileSizeErrorMessage(maxSizeMB: number = 5): string {
  return `File size must be less than ${maxSizeMB}MB`;
}

/**
 * Save draft to AsyncStorage
 */
export async function saveDraft(data: any): Promise<void> {
  try {
    await AsyncStorage.setItem('claimDraft', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

/**
 * Load draft from AsyncStorage
 */
export async function loadDraft(): Promise<any | null> {
  try {
    const draft = await AsyncStorage.getItem('claimDraft');
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

/**
 * Clear draft from AsyncStorage
 */
export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem('claimDraft');
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

/**
 * Create FormData for file upload
 * Returns a properly formatted object for axios multipart upload
 */
export async function createClaimFormData(
  claimData: any,
  documents: DocumentPreview[]
): Promise<FormData> {
  const formData = new FormData();

  // Add claim fields
  Object.keys(claimData).forEach((key) => {
    const value = claimData[key];
    if (value !== undefined && value !== null && key !== 'documents') {
      formData.append(key, value.toString());
    }
  });

  // Add files
  for (const doc of documents) {
    try {
      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(doc.uri);

      if (fileInfo.exists) {
        // Create file object for FormData
        const file: any = {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType,
        };

        formData.append('documents', file);
      }
    } catch (error) {
      console.error('Error adding file to FormData:', error);
    }
  }

  return formData;
}

/**
 * Create FormData with separate prescription and bill files
 */
export async function createConsultationFormData(
  claimData: any,
  prescriptionFiles: DocumentPreview[],
  billFiles: DocumentPreview[]
): Promise<FormData> {
  const formData = new FormData();

  // Add claim fields
  Object.keys(claimData).forEach((key) => {
    const value = claimData[key];
    if (value !== undefined && value !== null && key !== 'documents') {
      formData.append(key, value.toString());
    }
  });

  // Add prescription files
  for (const doc of prescriptionFiles) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(doc.uri);
      if (fileInfo.exists) {
        const file: any = {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType,
        };
        formData.append('prescriptionFiles', file);
      }
    } catch (error) {
      console.error('Error adding prescription file:', error);
    }
  }

  // Add bill files
  for (const doc of billFiles) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(doc.uri);
      if (fileInfo.exists) {
        const file: any = {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType,
        };
        formData.append('billFiles', file);
      }
    } catch (error) {
      console.error('Error adding bill file:', error);
    }
  }

  return formData;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validation helper
 */
export function validateStep1(
  formData: any,
  selectedUserId: string,
  availableBalance: number
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!selectedUserId) {
    errors.user = 'Please select a family member';
  }

  if (!formData.category) {
    errors.category = 'Please select a category';
  }

  if (!formData.treatmentDate) {
    errors.treatmentDate = 'Treatment date is required';
  }

  if (!formData.billAmount || parseFloat(formData.billAmount) <= 0) {
    errors.billAmount = 'Valid bill amount is required';
  } else if (formData.category) {
    const amount = parseFloat(formData.billAmount);
    if (amount > availableBalance) {
      errors.billAmount = `Amount exceeds available balance ₹${availableBalance.toLocaleString()}`;
    }
  }

  return errors;
}

/**
 * Validation for document upload step
 */
export function validateStep2(
  isConsultation: boolean,
  prescriptionFiles: DocumentPreview[],
  billFiles: DocumentPreview[],
  documentPreviews: DocumentPreview[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (isConsultation) {
    if (prescriptionFiles.length === 0) {
      errors.prescription = 'Please upload at least one prescription document';
    }
    if (billFiles.length === 0) {
      errors.bills = 'Please upload at least one bill document';
    }
  } else {
    if (documentPreviews.length === 0) {
      errors.documents = 'Please upload at least one document';
    }
  }

  return errors;
}
