# Screens Replication Checklist

Track progress of replicating web-member portal screens to React Native.

Legend:
- [x] Completed
- [ ] Not started
- [WIP] Work in progress

---

## Authentication

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Login | `/` | `/(auth)/index.tsx` | [x] Completed |

---

## Core Member Screens

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Dashboard | `/member` | `/(member)/index.tsx` | [x] Completed |
| Profile | `/member/profile` | `/(member)/profile.tsx` | [ ] |
| Settings | `/member/settings` | `/(member)/settings.tsx` | [ ] |
| Wallet | `/member/wallet` | `/(member)/wallet.tsx` | [ ] |
| Transactions | `/member/transactions` | `/(member)/transactions.tsx` | [ ] |
| Benefits | `/member/benefits` | `/(member)/benefits.tsx` | [ ] |
| Services | `/member/services` | `/(member)/services.tsx` | [ ] |
| Helpline | `/member/helpline` | `/(member)/helpline.tsx` | [ ] |
| Health Records | `/member/health-records` | `/(member)/health-records.tsx` | [ ] |

---

## Appointments Flow

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Appointments List | `/member/appointments` | `/(member)/appointments/index.tsx` | [ ] |
| Specialties | `/member/appointments/specialties` | `/(member)/appointments/specialties.tsx` | [ ] |
| Doctors | `/member/appointments/doctors` | `/(member)/appointments/doctors.tsx` | [ ] |
| Select Patient | `/member/appointments/select-patient` | `/(member)/appointments/select-patient.tsx` | [ ] |
| Select Slot | `/member/appointments/select-slot` | `/(member)/appointments/select-slot.tsx` | [ ] |
| Confirm | `/member/appointments/confirm` | `/(member)/appointments/confirm.tsx` | [ ] |

---

## Bookings

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Bookings List | `/member/bookings` | `/(member)/bookings/index.tsx` | [ ] |
| New Booking | `/member/bookings/new` | `/(member)/bookings/new.tsx` | [ ] |

---

## Claims

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Claims List | `/member/claims` | `/(member)/claims/index.tsx` | [ ] |
| Claim Details | `/member/claims/[id]` | `/(member)/claims/[id].tsx` | [ ] |
| New Claim | `/member/claims/new` | `/(member)/claims/new.tsx` | [ ] |

---

## Orders

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Orders List | `/member/orders` | `/(member)/orders/index.tsx` | [ ] |
| Order Details | `/member/orders/[transactionId]` | `/(member)/orders/[transactionId].tsx` | [ ] |

---

## Lab Tests

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Lab Tests Home | `/member/lab-tests` | `/(member)/lab-tests/index.tsx` | [ ] |
| Cart | `/member/lab-tests/cart/[id]` | `/(member)/lab-tests/cart/[id].tsx` | [ ] |
| Vendor Selection | `/member/lab-tests/cart/[id]/vendor/[vendorId]` | `/(member)/lab-tests/vendor/[vendorId].tsx` | [ ] |
| Booking | `/member/lab-tests/booking/[cartId]` | `/(member)/lab-tests/booking/[cartId].tsx` | [ ] |
| Orders | `/member/lab-tests/orders` | `/(member)/lab-tests/orders/index.tsx` | [ ] |
| Order Details | `/member/lab-tests/orders/[orderId]` | `/(member)/lab-tests/orders/[orderId].tsx` | [ ] |
| Upload | `/member/lab-tests/upload` | `/(member)/lab-tests/upload.tsx` | [ ] |

---

## Diagnostics

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Diagnostics Home | `/member/diagnostics` | `/(member)/diagnostics/index.tsx` | [ ] |
| Cart | `/member/diagnostics/cart/[id]` | `/(member)/diagnostics/cart/[id].tsx` | [ ] |
| Vendor Selection | `/member/diagnostics/cart/[id]/vendor/[vendorId]` | `/(member)/diagnostics/vendor/[vendorId].tsx` | [ ] |
| Booking | `/member/diagnostics/booking/[cartId]` | `/(member)/diagnostics/booking/[cartId].tsx` | [ ] |
| Orders | `/member/diagnostics/orders` | `/(member)/diagnostics/orders/index.tsx` | [ ] |
| Order Details | `/member/diagnostics/orders/[orderId]` | `/(member)/diagnostics/orders/[orderId].tsx` | [ ] |
| Upload | `/member/diagnostics/upload` | `/(member)/diagnostics/upload.tsx` | [ ] |

---

## Online Consult

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Online Consult Home | `/member/online-consult` | `/(member)/online-consult/index.tsx` | [ ] |
| Specialties | `/member/online-consult/specialties` | `/(member)/online-consult/specialties.tsx` | [ ] |
| Doctors | `/member/online-consult/doctors` | `/(member)/online-consult/doctors.tsx` | [ ] |
| Confirm | `/member/online-consult/confirm` | `/(member)/online-consult/confirm.tsx` | [ ] |
| Consultation Room | `/member/consultations/[appointmentId]` | `/(member)/consultations/[appointmentId].tsx` | [ ] |

---

## Dental

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Dental Home | `/member/dental` | `/(member)/dental/index.tsx` | [ ] |
| Clinics | `/member/dental/clinics` | `/(member)/dental/clinics.tsx` | [ ] |
| Select Patient | `/member/dental/select-patient` | `/(member)/dental/select-patient.tsx` | [ ] |
| Select Slot | `/member/dental/select-slot` | `/(member)/dental/select-slot.tsx` | [ ] |
| Confirm | `/member/dental/confirm` | `/(member)/dental/confirm.tsx` | [ ] |

---

## Vision

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Vision Home | `/member/vision` | `/(member)/vision/index.tsx` | [ ] |
| Clinics | `/member/vision/clinics` | `/(member)/vision/clinics.tsx` | [ ] |
| Select Patient | `/member/vision/select-patient` | `/(member)/vision/select-patient.tsx` | [ ] |
| Select Slot | `/member/vision/select-slot` | `/(member)/vision/select-slot.tsx` | [ ] |
| Confirm | `/member/vision/confirm` | `/(member)/vision/confirm.tsx` | [ ] |
| Payment | `/member/vision/payment/[bookingId]` | `/(member)/vision/payment/[bookingId].tsx` | [ ] |

---

## Other Healthcare

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Pharmacy | `/member/pharmacy` | `/(member)/pharmacy.tsx` | [ ] |
| Health Checkup | `/member/health-checkup` | `/(member)/health-checkup.tsx` | [ ] |
| Wellness | `/member/wellness` | `/(member)/wellness.tsx` | [ ] |

---

## AHC (Annual Health Checkup)

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| AHC Booking | `/member/ahc/booking` | `/(member)/ahc/booking/index.tsx` | [ ] |
| AHC Diagnostic | `/member/ahc/booking/diagnostic` | `/(member)/ahc/booking/diagnostic.tsx` | [ ] |
| AHC Payment | `/member/ahc/booking/payment` | `/(member)/ahc/booking/payment.tsx` | [ ] |

---

## Family

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Family Members | `/member/family` | `/(member)/family/index.tsx` | [ ] |
| Add Family Member | `/member/family/add` | `/(member)/family/add.tsx` | [ ] |

---

## Policy & Payments

| Screen | Web Path | RN Path | Status |
|--------|----------|---------|--------|
| Policy Details | `/member/policy-details/[policyId]` | `/(member)/policy-details/[policyId].tsx` | [ ] |
| Payments | `/member/payments/[paymentId]` | `/(member)/payments/[paymentId].tsx` | [ ] |

---

## Summary

| Category | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| Auth | 1 | 1 | 0 |
| Core | 9 | 1 | 8 |
| Appointments | 6 | 0 | 6 |
| Bookings | 2 | 0 | 2 |
| Claims | 3 | 0 | 3 |
| Orders | 2 | 0 | 2 |
| Lab Tests | 7 | 0 | 7 |
| Diagnostics | 7 | 0 | 7 |
| Online Consult | 5 | 0 | 5 |
| Dental | 5 | 0 | 5 |
| Vision | 6 | 0 | 6 |
| Other Healthcare | 3 | 0 | 3 |
| AHC | 3 | 0 | 3 |
| Family | 2 | 0 | 2 |
| Policy & Payments | 2 | 0 | 2 |
| **TOTAL** | **63** | **2** | **61** |

---

## Recommended Build Order

For efficient development, build screens in this order:

### Phase 1: Core User Features
1. Profile
2. Settings
3. Wallet
4. Transactions

### Phase 2: Main Service Flows
5. Appointments (full flow)
6. Bookings
7. Claims

### Phase 3: Lab & Diagnostics
8. Lab Tests (full flow)
9. Diagnostics (full flow)

### Phase 4: Healthcare Services
10. Online Consult (full flow)
11. Dental (full flow)
12. Vision (full flow)

### Phase 5: Remaining Features
13. Family
14. AHC
15. Other (Pharmacy, Wellness, etc.)

---

*Update this checklist as screens are completed.*
