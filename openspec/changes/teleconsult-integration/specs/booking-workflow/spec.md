# Online Consultation Booking Workflow Specification

## Purpose

Enables end-to-end booking workflow for teleconsultation from cart creation through checkout to booking confirmation, including wallet integration and payment processing.

## ADDED Requirements

### Requirement: Cart Creation
The system SHALL create a cart with consultation details.

#### Scenario: Successful cart creation
- **WHEN** user confirms doctor, slot, patient, and consultation type
- **THEN** system builds cart snapshot with all consultation details
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=cart_add` with base64-encoded cart snapshot
- **AND** receives `cart_id` and cart snapshot with pricing details

#### Scenario: Cart creation failure
- **WHEN** cart_add API fails
- **THEN** system displays error with retry option

### Requirement: Checkout Calculation
The system SHALL calculate payment breakdown including wallet coverage and copay.

#### Scenario: Successful checkout calculation
- **WHEN** cart is created successfully
- **THEN** system builds checkout snapshot with patient, facility, doctor, slot details
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=checkout` with base64-encoded checkout snapshot
- **AND** receives payment breakdown:
  - Consultation fee
  - Wallet eligible amount (max ₹300 per transaction)
  - Copay amount (20% of wallet eligible)
  - Wallet block amount
  - Excess amount (above ₹300 limit)
  - Self-pay amount (copay + excess)

#### Scenario: Wallet-only payment
- **WHEN** self-pay amount is 0 (fully covered by wallet)
- **THEN** system bypasses Razorpay
- **AND** proceeds directly to booking

#### Scenario: Partial wallet payment
- **WHEN** self-pay amount > 0
- **THEN** system proceeds to Razorpay payment

### Requirement: Booking Confirmation
The system SHALL finalize the booking after payment.

#### Scenario: Successful booking
- **WHEN** payment is confirmed (or wallet-only)
- **THEN** system builds booking snapshot with payment details
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=book_appointment` with base64-encoded booking snapshot
- **AND** receives `service_request_id` for video call integration
- **AND** system generates invoice
- **AND** system stores invoice under Health Records → Invoices

#### Scenario: Invoice generation
- **WHEN** booking is confirmed
- **THEN** system generates invoice record
- **AND** invoice is accessible under Health Records → Invoices

### Requirement: Wallet Integration
The system SHALL apply wallet coverage with per-transaction limits and copay.

#### Scenario: Wallet coverage calculation
- **GIVEN** consultation fee and wallet balance
- **WHEN** checkout is calculated
- **THEN** wallet coverage = min(fee, ₹300 per transaction limit)
- **AND** copay = 20% of wallet coverage
- **AND** wallet block = wallet coverage - copay
- **AND** excess = max(0, fee - ₹300)
- **AND** self-pay = copay + excess

### Requirement: Razorpay Integration
The system SHALL integrate with Razorpay for self-pay amount.

#### Scenario: Razorpay payment flow
- **WHEN** self-pay > 0
- **THEN** system creates Razorpay order with amount
- **THEN** system opens Razorpay modal
- **ON** payment success callback
- **THEN** system calls book_appointment with payment details (razorpay_payment_id, razorpay_order_id, razorpay_signature)

## Data Contracts

### Cart Snapshot (base64 encoded)
```json
{
  "cart_snapshot": {
    "opdcart": {
      "serviceItemId": "doctor_id",
      "serviceItemName": "Dr. Name",
      "consultation_type_code": "video|audio",
      "serviceDate": 1234567890,
      "serviceStartTime": 1234567890,
      "serviceEndTime": 1234567890,
      "slotId": "slot_id",
      "patient_id": "patient_id",
      "speciality_id": "speciality_id",
      "facility_id": "facility_id",
      "provider_code": "HCL-001",
      "serviceType_code": "op_consultation",
      "mode_of_appointment": "habithealth",
      "serviceType": "OP Consultation",
      "serviceItemCode": "doctor_code"
    }
  }
}
```

### Checkout Snapshot (base64 encoded)
```json
{
  "checkout_snapshot": {
    "patient_id": "patient_id",
    "checkoutsnapshot": {
      "facility_id": "facility_id",
      "doctor_id": "doctor_id",
      "speciality_id": "speciality_id",
      "consultation_type": "video|audio",
      "consultation_type_code": "video|audio",
      "patient_type": "OP",
      "slot_id": "slot_id",
      "serviceDate": 1234567890,
      "serviceStartTime": 1234567890,
      "serviceEndTime": 1234567890,
      "serviceItemId": "doctor_id"
    }
  }
}
```

### Booking Snapshot (base64 encoded)
```json
{
  "booking_snapshot": {
    "serviceRequestHandler": {
      "patient_details": {
        "patient_id": "patient_id",
        "patientType": "OP",
        "uhId": "uh_id",
        "payer_info": { "id": "cash", "payer_type": "cash", "payer_name": "Cash" }
      },
      "facility_id": "facility_id",
      "doctor_id": "doctor_id",
      "services": [{
        "id": "doctor_id",
        "serviceItemId": "doctor_id",
        "serviceItemName": "Dr. Name",
        "consultation_type": "video|audio",
        "consultation_type_code": "video|audio",
        "serviceType": "OP Consultation",
        "serviceType_code": "op_consultation",
        "slotId": "slot_id"
      }],
      "payment_details": [{ "payment_type": "E-Payment", "payment_status": "Pending" }],
      "mode_of_appointment": "habithealth"
    }
  }
}
```

### Payment Breakdown
```typescript
interface PaymentBreakdown {
  fee: number;           // Consultation fee
  covered: number;       // Wallet eligible (max 300)
  copay: number;         // 20% of covered
  walletBlock: number;   // covered - copay
  excess: number;        // max(0, fee - 300)
  selfPay: number;       // copay + excess
}
```

## Error Handling
- Cart creation failure → Retry option
- Checkout failure → Retry option
- Booking failure → Display error, allow retry
- Payment failure → Retry Razorpay
- Network failure → Retry option