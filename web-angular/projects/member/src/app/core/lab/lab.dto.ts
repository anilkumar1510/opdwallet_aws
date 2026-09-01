/**
 * Pathology (CAT004) — lab orders, prescriptions and the active cart.
 * Source: api/src/modules/lab/controllers/lab-member.controller.ts
 *
 * These routes wrap their payload as `{ success, data }`, unlike claims or
 * appointments. Diagnostics (CAT003) mirrors this shape under
 * member/diagnostics/*, which is why the mapper takes a serviceType.
 */
export interface LabEnvelopeDto<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface LabOrderItemDto {
  serviceId?: string;
  serviceName?: string;
  serviceCode?: string;
  actualPrice?: number;
  discountedPrice?: number;
}

export interface LabVendorDto {
  _id?: string;
  name?: string;
  code?: string;
}

export interface LabOrderDto {
  _id?: string;
  orderId?: string;
  vendorId?: LabVendorDto | string;
  vendorName?: string;
  serviceType?: string;
  items?: LabOrderItemDto[];
  status?: string;
  collectionType?: string;
  collectionDate?: string;
  collectionTime?: string;
  totalActualPrice?: number;
  totalDiscountedPrice?: number;
  homeCollectionCharges?: number;
  finalAmount?: number;
  copayAmount?: number;
  walletDeduction?: number;
  finalPayable?: number;
  paymentStatus?: string;
  reports?: LabReportDto[];
  placedAt?: string;
  createdAt?: string;
}

/** One uploaded report on an order. `_id` is what the download route takes. */
export interface LabReportDto {
  _id?: string;
  fileName?: string;
  originalName?: string;
  uploadedAt?: string;
}

export interface LabPrescriptionDto {
  _id?: string;
  prescriptionId?: string;
  patientName?: string;
  serviceType?: string;
  source?: string;
  fileName?: string;
  originalName?: string;
  status?: string;
  uploadedAt?: string;
  createdAt?: string;
  /** Present once the prescription has been digitised into a cart. */
  cartId?: string;
  /** Lab returns these; the diagnostics endpoint omits them entirely. */
  hasOrder?: boolean;
  orderCount?: number;
}
