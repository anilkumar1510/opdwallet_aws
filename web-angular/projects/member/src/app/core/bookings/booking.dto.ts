/**
 * Dental and vision bookings share one shape.
 * Source: api/src/modules/dental-bookings and /vision-bookings controllers,
 * GET /{dental,vision}-bookings/user/:userId
 *
 * Unlike appointments, these carry a real 24-hour `appointmentTime` ("12:30"),
 * so the scheduled moment can be reconstructed exactly.
 */
export interface ClinicAddressDto {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ServiceBookingDto {
  _id?: string;
  bookingId?: string;
  patientName?: string;
  serviceCode?: string;
  serviceName?: string;
  categoryCode?: string;
  clinicName?: string;
  clinicAddress?: ClinicAddressDto;
  clinicContact?: string;
  /** Vaccination names the same fields vendorName/vendorAddress instead. */
  vendorName?: string;
  vendorAddress?: ClinicAddressDto;
  /** Midnight ISO timestamp; the time of day lives in appointmentTime. */
  appointmentDate?: string;
  /** 24-hour "HH:mm". */
  appointmentTime?: string;
  billAmount?: number;
  copayAmount?: number;
  walletDebitAmount?: number;
  totalMemberPayment?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  invoiceGenerated?: boolean;
  bookedAt?: string;
  createdAt?: string;
}

/**
 * `GET member/ahc/orders` — an annual-health-check order.
 *
 * Envelope is `{ success, data }`, unlike the bare arrays dental and vision
 * return. Money lands in `finalAmount` / `walletDeduction` / `copayAmount`, and
 * there is no appointment date: an AHC order is placed, then scheduled by the
 * vendor, so `placedAt` is the only time it carries.
 */
export interface AhcOrderDto {
  _id?: string;
  orderId?: string;
  packageName?: string;
  patientName?: string;
  status?: string;
  paymentStatus?: string;
  finalAmount?: number;
  walletDeduction?: number;
  copayAmount?: number;
  finalPayable?: number;
  placedAt?: string;
  createdAt?: string;
}
