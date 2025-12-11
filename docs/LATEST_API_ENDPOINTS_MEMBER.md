# Member Portal API Endpoints

This document lists all API endpoints used by the Member Portal (web-member).

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Member login with credentials |
| POST | /auth/logout | Member logout |
| GET | /auth/me | Get current member information |

---

## Member Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/profile | Get member profile with family |
| GET | /member/family | Get family members |
| PATCH | /member/profile | Update member profile |
| GET | /member/addresses | Get member addresses |
| POST | /member/addresses | Create member address |
| PATCH | /member/addresses/:addressId/default | Set default address |
| DELETE | /member/addresses/:addressId | Delete member address |

---

## Policy & Benefits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /assignments/my-policy | Get current user's policy with copay details |
| GET | /member/benefits/:categoryId/services | Get allowed services for category |
| GET | /member/benefits/:categoryId/specialties | Get allowed specialties |
| GET | /member/benefits/:categoryId/lab-services | Get allowed lab service categories |

---

## Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallet/transactions | Get wallet transactions with pagination |
| GET | /wallet/balance | Get wallet balance |

---

## Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /appointments | Create new appointment |
| POST | /appointments/validate-booking | Validate booking and get payment breakdown with service limits |
| GET | /appointments/user/:userId | Get appointments for specific user |
| GET | /appointments/user/:userId/ongoing | Get ongoing appointments for user |
| GET | /appointments/:appointmentId | Get appointment details |
| PATCH | /appointments/:appointmentId/user-cancel | Member cancels appointment |

---

## Doctors & Specialties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /doctors | Get all doctors with filters |
| GET | /doctors/:doctorId/slots | Get doctor slots by clinic/date |
| GET | /doctors/:doctorId | Get doctor details |
| GET | /specialties | Get all active specialties |

---

## Video Consultations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /video-consultations/join | Join video consultation (member) |
| GET | /video-consultations/:consultationId/status | Get consultation status |
| GET | /video-consultations/patient/history | Get patient's consultation history |

---

## Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/claims/available-categories | Get available claim categories based on member's policy |
| POST | /member/claims | Create new claim with documents |
| POST | /member/claims/:claimId/submit | Submit claim |
| GET | /member/claims | Get claims with pagination |
| GET | /member/claims/summary | Get claims summary |
| GET | /member/claims/:claimId/timeline | Get claim timeline |
| GET | /member/claims/:claimId/tpa-notes | Get TPA notes for claim |
| GET | /member/claims/:id | Get claim by ID |
| GET | /member/claims/claim/:claimId | Get claim by claim ID |
| PATCH | /member/claims/:id | Update claim |
| POST | /member/claims/:claimId/documents | Add documents to claim |
| DELETE | /member/claims/:claimId/documents/:documentId | Delete document from claim |
| DELETE | /member/claims/:id | Delete claim |
| GET | /member/claims/files/:userId/:filename | Download claim document |
| POST | /member/claims/:claimId/resubmit-documents | Resubmit documents after rejection |
| PATCH | /member/claims/:claimId/cancel | Cancel claim |

---

## Lab Tests (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /member/lab/prescriptions/upload | Upload prescription |
| GET | /member/lab/prescriptions | Get user prescriptions |
| GET | /member/lab/prescriptions/:id | Get prescription details |
| GET | /member/lab/carts/active | Get active carts for user |
| GET | /member/lab/carts/:cartId | Get cart by ID |
| GET | /member/lab/carts/:cartId/vendors | Get vendors for cart |
| DELETE | /member/lab/carts/:cartId | Delete cart |
| GET | /member/lab/vendors/available | Get available vendors by pincode |
| GET | /member/lab/vendors/:vendorId/pricing | Get vendor pricing |
| GET | /member/lab/vendors/:vendorId/slots | Get available slots |
| POST | /member/lab/orders | Create order |
| GET | /member/lab/orders | Get user orders |
| GET | /member/lab/orders/:orderId | Get order details |

---

## Prescriptions (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/prescriptions | Get member's prescriptions |
| GET | /member/prescriptions/:prescriptionId | Get prescription details |
| GET | /member/prescriptions/:prescriptionId/download | Download prescription |

---

## Digital Prescriptions (Member)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /member/digital-prescriptions | Get member's digital prescriptions |
| GET | /member/digital-prescriptions/:prescriptionId | Get digital prescription details |
| GET | /member/digital-prescriptions/:prescriptionId/download-pdf | Download prescription PDF |

---

## Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /transactions | Get user transaction history with filters |
| GET | /transactions/summary | Get transaction summary statistics |
| GET | /transactions/:transactionId | Get transaction details by ID |

---

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /payments | Get user payment history with filters |
| GET | /payments/:paymentId | Get payment details by ID |
| POST | /payments | Create new payment request |

---

## Location

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /location/reverse-geocode | Reverse geocode coordinates to address |
| GET | /location/geocode | Forward geocode address query to coordinates |
| GET | /location/autocomplete | Location autocomplete search |

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | Get user notifications with filters |
| GET | /notifications/unread-count | Get unread notification count |
| PATCH | /notifications/:id/read | Mark notification as read |
| PATCH | /notifications/mark-all-read | Mark all notifications as read |

---

## Clinics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /clinics | Get all clinics with filters |
| GET | /clinics/:clinicId | Get clinic by ID |

---

## Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | Get all categories |

---

**Total Endpoints: ~67**
