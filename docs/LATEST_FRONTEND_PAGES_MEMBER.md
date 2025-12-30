# Member Portal Frontend Pages

This document lists all frontend pages/routes in the Member Portal (web-member).

---

## Authentication

| Path | Description |
|------|-------------|
| / | Member login page with email/password authentication |

---

## Dashboard

| Path | Description |
|------|-------------|
| /member | Main member dashboard with OPD cards, wallet balance, and quick actions |

---

## Profile & Settings

| Path | Description |
|------|-------------|
| /member/profile | Edit member personal information and view dependents |
| /member/settings | Account settings, notifications, and preferences |

---

## Family Management

| Path | Description |
|------|-------------|
| /member/family | List all family members covered under policy |
| /member/family/add | Multi-step form to add new family member |

---

## Benefits & Policy

| Path | Description |
|------|-------------|
| /member/benefits | Comprehensive benefits overview with usage tracking |
| /member/policy-details/[policyId] | View detailed policy information |

---

## Wallet & Transactions

| Path | Description |
|------|-------------|
| /member/wallet | Detailed wallet balance with category breakdown |
| /member/transactions | Complete transaction history with filters |
| /member/orders | View all orders and transaction history |
| /member/orders/[transactionId] | View specific order details |

---

## In-Clinic Appointments

| Path | Description |
|------|-------------|
| /member/appointments | List all in-clinic appointments |
| /member/appointments/specialties | Browse specialties for in-clinic booking |
| /member/appointments/doctors | Select doctor with location filters |
| /member/appointments/select-patient | Select family member for appointment |
| /member/appointments/select-slot | Select date and time slot |
| /member/appointments/confirm | Review and confirm appointment with payment |

---

## Online Consultations

| Path | Description |
|------|-------------|
| /member/online-consult | List all online consultations |
| /member/online-consult/specialties | Browse specialties for online consultation |
| /member/online-consult/doctors | Select doctor for online consultation |
| /member/online-consult/confirm | Review and confirm online consultation |

---

## Consultations & Prescriptions

| Path | Description |
|------|-------------|
| /member/consultations/[appointmentId] | View consultation details and prescriptions |
| /member/health-records | Access prescriptions and medical documents |

---

## Claims

| Path | Description |
|------|-------------|
| /member/claims | View all submitted claims with status tracking |
| /member/claims/new | Multi-step claim filing form with document upload |
| /member/claims/[id] | View detailed claim information |

---

## Lab Tests

| Path | Description |
|------|-------------|
| /member/lab-tests | View lab test prescriptions and orders with enhanced UI (shows upload time, lab tests included, order status badges) |
| /member/lab-tests/upload | Upload lab test prescription |
| /member/lab-tests/cart/[id] | View and edit lab test cart |
| /member/lab-tests/cart/[id]/vendor/[vendorId] | Select lab vendor for tests |
| /member/lab-tests/booking/[cartId] | Complete lab test booking with 3-step wizard (vendor selection, slot booking, payment processing) |
| /member/lab-tests/orders | View all lab test orders |
| /member/lab-tests/orders/[orderId] | View lab test order details |

**Lab Booking Flow:**
1. **Step 1 - Vendor Selection**: Choose from assigned vendors with detailed pricing breakdown for each test
2. **Step 2 - Slot Selection**: Select collection type (Home Collection with charges or Lab Visit), appointment date, and available time slot
3. **Step 3 - Payment**: Review booking summary, validate order, and complete payment with insurance calculation and wallet deduction
4. **Confirmation**: Display booking success with order ID and appointment details

---

## Diagnostic Services

| Path | Description |
|------|-------------|
| /member/diagnostics | View diagnostic test prescriptions and orders with enhanced UI (separate from lab tests) |
| /member/diagnostics/upload | Upload diagnostic test prescription |
| /member/diagnostics/cart/[id] | View and edit diagnostic test cart |
| /member/diagnostics/cart/[id]/vendor/[vendorId] | Select diagnostic center/vendor |
| /member/diagnostics/orders | View all diagnostic test orders |
| /member/diagnostics/orders/[orderId] | View diagnostic test order details |

**Note:** Diagnostics is a separate service from Lab Tests with its own vendors, pricing, and workflows

---

## Health & Wellness

| Path | Description |
|------|-------------|
| /member/health-checkup | Annual health checkup packages (coming soon) |
| /member/wellness | Wellness and preventive care services (coming soon) |
| /member/dental | Dental care services (coming soon) |
| /member/vision | Eye care and vision services (coming soon) |
| /member/pharmacy | Medicine ordering service (coming soon) |

---

## Bookings

| Path | Description |
|------|-------------|
| /member/bookings | Multi-tab view for doctors, lab, dental, vision bookings (supports tab navigation via ?tab=lab query parameter) |
| /member/bookings/new | Multi-step booking wizard |
| /member/services | Directory of all available services |

---

## Payments

| Path | Description |
|------|-------------|
| /member/payments/[paymentId] | View payment details |

---

**Total Pages: ~49**
