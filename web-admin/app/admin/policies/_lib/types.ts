export enum PolicyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED'
}

export enum OwnerPayerType {
  CORPORATE = 'CORPORATE',
  INSURER = 'INSURER',
  HYBRID = 'HYBRID'
}

export interface Policy {
  _id: string
  policyNumber: string
  name: string
  description?: string
  ownerPayer: OwnerPayerType
  sponsorName?: string
  status: PolicyStatus
  effectiveFrom: string
  effectiveTo?: string | null
  currentPlanVersion: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface PolicyListResponse {
  data: Policy[]
  items?: Policy[] // Support both formats
  page: number
  pageSize: number
  total: number
}

export interface PolicyQueryParams {
  page?: number
  pageSize?: number
  q?: string
  status?: string | string[]
  ownerPayer?: string | string[]
  dateFrom?: string
  dateTo?: string
  sortBy?: 'effectiveFrom' | 'updatedAt' | 'name' | 'policyNumber' | 'status' | 'currentPlanVersion'
  sortDir?: 'asc' | 'desc'
}

export interface PlanVersion {
  planVersion: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  effectiveFrom: string
  effectiveTo?: string
  copay?: number
  coinsurance?: number
  deductible?: number
  maxCoverage?: number
}