# Payment Integration Specification

## Purpose

Handles payment processing for teleconsultation including Razorpay integration, wallet integration, and payment status management.

## ADDED Requirements

### Requirement: Razorpay Payment Flow
The system SHALL process self-pay amounts through Razorpay payment gateway.

#### Scenario: Razorpay order creation
- **WHEN** self-pay amount > 0
- **THEN** system calls backend to create Razorpay order with amount in paise
- **AND** system receives razorpay_order_id, amount, currency (INR)

#### Scenario: Razorpay modal opening
- **WHEN** Razorpay order is created
- **THEN** system opens Razorpay checkout modal with:
  - order_id
  - amount
  - currency: INR
  - prefill: patient contact details
  - handler: payment success callback

#### Scenario: Payment success
- **WHEN** Razorpay handler receives success response
- **THEN** system receives:
  - razorpay_payment_id
  - razorpay_order_id
  - razorpay_signature
- **THEN** system includes payment details in booking snapshot
- **THEN** system calls book_appointment with payment details

#### Scenario: Payment failure
- **WHEN** Razorpay modal closes without payment
- **OR** payment fails
- **THEN** system displays error
- **AND** user can retry or cancel

### Requirement: Wallet Integration
The system SHALL handle wallet-based payments with per-transaction limits and copay.

#### Scenario: Wallet coverage calculation
- **GIVEN** consultation fee and user wallet balance
- **WHEN** checkout is calculated
- **THEN** wallet_coverage = min(fee, ₹300 per_transaction_limit)
- **AND** copay = 20% of wallet_coverage
- **AND** wallet_block = wallet_coverage - copay
- **AND** excess = max(0, fee - 300)
- **AND** self_pay = copay + excess

#### Scenario: Wallet-only payment
- **WHEN** self_pay === 0 (fee ≤ 300 and wallet covers it)
- **THEN** system bypasses Razorpay entirely
- **AND** proceeds directly to booking with wallet block

#### Scenario: Wallet block on payment
- **WHEN** booking is confirmed
- **THEN** wallet amount is blocked immediately
- **AND** wallet balance updates reflect blocked amount

### Requirement: Payment Status Management
The system SHALL track and display payment status throughout the flow.

#### Scenario: Payment status states
- **Pending**: Payment initiated, awaiting Razorpay completion
- **Success**: Payment confirmed, booking confirmed
- **Failed**: Payment failed, user can retry
- **Wallet-only**: No external payment needed

## Data Contracts

### Razorpay Order Request
```json
{
  "amount": 50000,        // Amount in paise (₹500)
  "currency": "INR",
  "receipt": "order_receipt_id"
}
```

### Razorpay Order Response
```json
{
  "id": "order_xyz123",
  "entity": "order",
  "amount": 50000,
  "currency": "INR",
  "status": "created"
}
```

### Razorpay Payment Response (Success Callback)
```json
{
  "razorpay_payment_id": "pay_abc123",
  "razorpay_order_id": "order_xyz123",
  "razorpay_signature": "sha256_signature"
}
```

### Payment Details in Booking Snapshot
```json
{
  "payment_details": [{
    "payment_type": "E-Payment",
    "payment_status": "Success",
    "razorpay_payment_id": "pay_abc123",
    "razorpay_order_id": "order_xyz123",
    "razorpay_signature": "sha256_signature"
  }]
}
```

## Error Handling
- Razorpay order creation failure → Retry option
- Razorpay modal dismiss → Allow retry or cancel
- Payment verification failure → Show error, allow retry
- Signature verification failure → Security alert, abort booking