# Screens Parity Checklist — web-member-rn

Tracks parity between the Next.js member portal (`web-member`) and the React Native / Expo member portal (`web-member-rn`).

**Last verified:** July 28, 2026 (against `web-member-rn/app/` and `web-member/app/`)

Legend:
- [x] Built in RN
- [ ] Not built in RN
- **RN-only** — exists in RN but not in the web portal

> Route naming diverges between the two apps. RN uses `app/member/...` (Expo Router) with
> service-oriented names, while web uses `app/member/...` with the older names. The mapping
> below is the source of truth — do not assume the paths match.

---

## Authentication & Entry

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Entry / redirect | `/` | `app/index.tsx` | [x] |
| Login | `/` | `app/login.tsx` | [x] |

---

## Core Member Screens

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Dashboard | `/member` | `member/index.tsx` | [x] |
| Profile | `/member/profile` | `member/profile.tsx` | [x] |
| Wallet | `/member/wallet` | `member/wallet.tsx` | [x] |
| Transactions | `/member/transactions` | `member/transactions.tsx` | [x] |
| Services | `/member/services` | `member/services.tsx` | [x] |
| Health Records | `/member/health-records` | `member/health-records.tsx` | [x] |
| Helpline | `/member/helpline` | `member/helpline.tsx` | [x] |
| Bookings | `/member/bookings` | `member/bookings.tsx` | [x] |
| Notifications | — | `member/notifications.tsx` | **RN-only** |
| Carts (unified) | — | `member/carts.tsx` | **RN-only** |
| Settings | `/member/settings` | — | [ ] |
| Benefits | `/member/benefits` | — | [ ] |

---

## Claims

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Claims List | `/member/claims` | `member/claims.tsx` | [x] |
| Claim Details | `/member/claims/[id]` | `member/claims/[id].tsx` | [x] |
| New Claim | `/member/claims/new` | `member/claims/new.tsx` | [x] |

> Draft persistence for the new-claim form is still outstanding — see [TECH_DEBT.md](../TECH_DEBT.md).

---

## In-Clinic Consultation (web: "Appointments")

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Home / List | `/member/appointments` | `member/in-clinic-consultation/index.tsx` | [x] |
| Specialties | `/member/appointments/specialties` | `member/in-clinic-consultation/specialties.tsx` | [x] |
| Doctors | `/member/appointments/doctors` | `member/in-clinic-consultation/doctors.tsx` | [x] |
| Select Patient | `/member/appointments/select-patient` | `member/in-clinic-consultation/select-patient.tsx` | [x] |
| Select Slot | `/member/appointments/select-slot` | `member/in-clinic-consultation/select-slot.tsx` | [x] |
| Confirm | `/member/appointments/confirm` | `member/in-clinic-consultation/confirm.tsx` | [x] |

---

## Online Consultation (web: "Online Consult")

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Home | `/member/online-consult` | `member/online-consultation.tsx` | [x] |
| Specialties | `/member/online-consult/specialties` | `member/online-consultation/specialties.tsx` | [x] |
| Doctors | `/member/online-consult/doctors` | `member/online-consultation/doctors.tsx` | [x] |
| Confirm | `/member/online-consult/confirm` | `member/online-consultation/confirm.tsx` | [x] |
| Consultation Room | `/member/consultations/[appointmentId]` | `member/consultations/[appointmentId].tsx` | [x] |

---

## Pathology Lab (web: "Lab Tests")

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Home | `/member/lab-tests` | `member/pathology-lab/index.tsx` | [x] |
| Upload Prescription | `/member/lab-tests/upload` | `member/pathology-lab/upload.tsx` | [x] |
| Booking | `/member/lab-tests/booking/[cartId]` | `member/pathology-lab/booking/[cartId].tsx` | [x] |
| Cart | `/member/lab-tests/cart/[id]` | — (folded into `member/carts.tsx`) | [ ] |
| Vendor Selection | `/member/lab-tests/cart/[id]/vendor/[vendorId]` | — | [ ] |
| Orders List | `/member/lab-tests/orders` | — (folded into `member/bookings.tsx`) | [ ] |
| Order Details | `/member/lab-tests/orders/[orderId]` | — | [ ] |

---

## Radiology & Cardiology (web: "Diagnostics")

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Home | `/member/diagnostics` | `member/radiology-cardiology.tsx` | [x] |
| Upload Prescription | `/member/diagnostics/upload` | `member/radiology-cardiology/upload.tsx` | [x] |
| Booking | `/member/diagnostics/booking/[cartId]` | `member/radiology-cardiology/booking/[cartId].tsx` | [x] |
| Cart | `/member/diagnostics/cart/[id]` | — (folded into `member/carts.tsx`) | [ ] |
| Vendor Selection | `/member/diagnostics/cart/[id]/vendor/[vendorId]` | — | [ ] |
| Orders List | `/member/diagnostics/orders` | — (folded into `member/bookings.tsx`) | [ ] |
| Order Details | `/member/diagnostics/orders/[orderId]` | — | [ ] |

---

## Dental

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Dental Home | `/member/dental` | `member/dental.tsx` | [x] |
| Clinics | `/member/dental/clinics` | `member/dental/clinics.tsx` | [x] |
| Select Patient | `/member/dental/select-patient` | `member/dental/select-patient.tsx` | [x] |
| Select Slot | `/member/dental/select-slot` | `member/dental/select-slot.tsx` | [x] |
| Confirm | `/member/dental/confirm` | `member/dental/confirm.tsx` | [x] |

---

## Vision

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Vision Home | `/member/vision` | `member/vision.tsx` | [x] |
| Clinics | `/member/vision/clinics` | `member/vision/clinics.tsx` | [x] |
| Select Patient | `/member/vision/select-patient` | `member/vision/select-patient.tsx` | [x] |
| Select Slot | `/member/vision/select-slot` | `member/vision/select-slot.tsx` | [x] |
| Confirm | `/member/vision/confirm` | `member/vision/confirm.tsx` | [x] |
| Payment | `/member/vision/payment/[bookingId]` | `member/vision/payment/[bookingId].tsx` | [x] |

---

## Vaccination (RN-only — ahead of web)

Added February 11, 2026. The web member portal has **no** vaccination screens; booking is
available on RN only. Admin and Operations portals have the corresponding management screens.

| Screen | RN Path | Status |
|--------|---------|--------|
| Vaccination Home | `member/vaccination/index.tsx` | **RN-only** |
| Select Patient | `member/vaccination/select-patient.tsx` | **RN-only** |
| Select Vendor | `member/vaccination/select-vendor.tsx` | **RN-only** |
| Select Slot | `member/vaccination/select-slot.tsx` | **RN-only** |
| Confirm | `member/vaccination/confirm.tsx` | **RN-only** |

---

## AHC (Annual Health Checkup)

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| AHC Home | — | `member/ahc/index.tsx` | **RN-only** |
| AHC Booking | `/member/ahc/booking` | `member/ahc/booking/index.tsx` | [x] |
| AHC Diagnostic | `/member/ahc/booking/diagnostic` | `member/ahc/booking/diagnostic.tsx` | [x] |
| AHC Payment | `/member/ahc/booking/payment` | `member/ahc/booking/payment.tsx` | [x] |

---

## Other Healthcare

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Pharmacy | `/member/pharmacy` | `member/pharmacy.tsx` | [x] |
| Health Packages (web: "Wellness Services") | `/member/wellness` | `member/health-packages.tsx` | [x] |
| Annual Health Check | `/member/health-checkup` | — | [ ] |

> `health-packages.tsx` is internally still named `WellnessProgramsPage` — it loads the AHC
> package and eligibility, then routes into the AHC booking flow. It corresponds to web's
> **Wellness**, not to `/member/health-checkup`, which is a "Coming Soon" placeholder.
> Category CAT008 was renamed from *Wellness Programs* to *Health Packages* in February 2026.

---

## Policy & Payments

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Policy Details | `/member/policy-details/[policyId]` | `member/policy-details/[policyId].tsx` | [x] |
| Payments | `/member/payments/[paymentId]` | `member/payments/[paymentId].tsx` | [x] |

---

## Not Yet Started

| Screen | Web Path |
|--------|----------|
| Settings | `/member/settings` |
| Benefits | `/member/benefits` |
| Family Members | `/member/family` |
| Add Family Member | `/member/family/add` |
| Orders List | `/member/orders` |
| Order Details | `/member/orders/[transactionId]` |
| Annual Health Check | `/member/health-checkup` (placeholder on web too) |
| Pathology / Radiology cart + vendor + order-detail screens | see sections above |

---

## Summary

| | Count |
|---|---|
| RN screen files (excluding `_layout.tsx`) | **56** |
| Web member routes | 61 |
| Web screens still missing in RN | 8 standalone + 8 cart/vendor/order sub-screens |
| RN-only screens (no web equivalent) | 8 (vaccination ×5, notifications, carts, AHC home) |

---

*Re-verify this file by listing `web-member-rn/app/**/*.tsx` and `web-member/app/**/page.tsx` — do not update it from memory.*
