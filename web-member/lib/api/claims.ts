import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ClaimDocument {
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
  documentType: string;
}

export interface Claim {
  _id?: string;
  claimId: string;
  userId: string;
  memberName: string;
  memberId?: string;
  patientName?: string;
  relationToMember: string;
  claimType: 'REIMBURSEMENT' | 'CASHLESS_PREAUTH';
  category: string;
  treatmentDate: string;
  providerName: string;
  providerLocation?: string;
  billAmount: number;
  billNumber?: string;
  treatmentDescription?: string;
  documents: ClaimDocument[];
  status: string;
  approvedAmount?: number;
  copayAmount?: number;
  deductibleAmount?: number;
  reimbursableAmount?: number;
  paymentStatus: string;
  paymentDate?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewComments?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClaimData {
  claimType: string;
  category: string;
  treatmentDate: string;
  providerName: string;
  providerLocation?: string;
  billAmount: number;
  billNumber?: string;
  treatmentDescription?: string;
  patientName?: string;
  relationToMember?: string;
  isUrgent?: boolean;
  requiresPreAuth?: boolean;
  preAuthNumber?: string;
}

export interface ClaimsSummary {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  totalPaidAmount: number;
}

// Create a new claim with file uploads
export async function createClaim(
  data: CreateClaimData,
  files?: File[]
): Promise<{ message: string; claim: Claim }> {
  console.log('=== createClaim API CALLED ===');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Claim Data:', data);
  console.log('Files Count:', files?.length || 0);

  const formData = new FormData();

  // Add claim data fields
  Object.keys(data).forEach((key) => {
    const value = data[key as keyof CreateClaimData];
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
      console.log(`FormData append: ${key} = ${value}`);
    }
  });

  // Add files
  if (files && files.length > 0) {
    console.log('Adding files to FormData:');
    files.forEach((file, index) => {
      formData.append('documents', file);
      console.log(`File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`);
    });
  } else {
    console.log('No files to upload');
  }

  try {
    console.log('Sending POST request to:', `${API_BASE_URL}/api/member/claims`);
    const response = await axios.post(`${API_BASE_URL}/api/member/claims`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      },
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('=== CREATE CLAIM API ERROR ===');
    console.error('Error:', error);
    console.error('Error Response:', error.response);
    console.error('Error Response Data:', error.response?.data);
    throw error;
  }
}

// Submit a draft claim
export async function submitClaim(claimId: string): Promise<{ message: string; claim: Claim }> {
  console.log('=== submitClaim API CALLED ===');
  console.log('Claim ID:', claimId);
  console.log('API Endpoint:', `${API_BASE_URL}/api/member/claims/${claimId}/submit`);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/member/claims/${claimId}/submit`,
      {},
      { withCredentials: true }
    );

    console.log('Submit Response Status:', response.status);
    console.log('Submit Response Data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('=== SUBMIT CLAIM API ERROR ===');
    console.error('Error:', error);
    console.error('Error Response:', error.response);
    console.error('Error Response Data:', error.response?.data);
    throw error;
  }
}

// Get all claims for the current user
export async function getUserClaims(
  status?: string,
  page = 1,
  limit = 10
): Promise<{ claims: Claim[]; total: number; page: number; totalPages: number }> {
  const params: any = { page, limit };
  if (status) {
    params.status = status;
  }

  const response = await axios.get(`${API_BASE_URL}/api/member/claims`, {
    params,
    withCredentials: true,
  });

  return response.data;
}

// Get claim by ID
export async function getClaimById(id: string): Promise<{ message: string; claim: Claim }> {
  const response = await axios.get(`${API_BASE_URL}/api/member/claims/${id}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get claim by claim ID
export async function getClaimByClaimId(
  claimId: string
): Promise<{ message: string; claim: Claim }> {
  const response = await axios.get(`${API_BASE_URL}/api/member/claims/claim/${claimId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Update a draft claim
export async function updateClaim(
  id: string,
  data: Partial<CreateClaimData>
): Promise<{ message: string; claim: Claim }> {
  const response = await axios.patch(`${API_BASE_URL}/api/member/claims/${id}`, data, {
    withCredentials: true,
  });
  return response.data;
}

// Add documents to a claim
export async function addDocumentsToClaim(
  claimId: string,
  files: File[]
): Promise<{ message: string; claim: Claim }> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('documents', file);
  });

  const response = await axios.post(
    `${API_BASE_URL}/api/member/claims/${claimId}/documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    }
  );

  return response.data;
}

// Remove document from a claim
export async function removeDocumentFromClaim(
  claimId: string,
  documentId: string
): Promise<{ message: string; claim: Claim }> {
  const response = await axios.delete(
    `${API_BASE_URL}/api/member/claims/${claimId}/documents/${documentId}`,
    { withCredentials: true }
  );
  return response.data;
}

// Delete a draft claim
export async function deleteClaim(id: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/api/member/claims/${id}`, {
    withCredentials: true,
  });
}

// Get claims summary for the current user
export async function getClaimsSummary(): Promise<{ message: string; summary: ClaimsSummary }> {
  const response = await axios.get(`${API_BASE_URL}/api/member/claims/summary`, {
    withCredentials: true,
  });
  return response.data;
}

// Get file URL for viewing
export function getFileUrl(userId: string, fileName: string): string {
  return `${API_BASE_URL}/api/member/claims/files/${userId}/${fileName}`;
}