# Online Consultation API Integration Specification

## Purpose

Enables real-time retrieval of doctors, specialties, slots, and booking data from the Habit OPD Teleconsultation backend service to replace static mock data.

## ADDED Requirements

### Requirement: Fetch Available Specialities
The system SHALL fetch and display available online consultation specialties from the `TELE_SPECIALITY_LISTING` API endpoint.

#### Scenario: Successful speciality fetch
- **WHEN** user opens the online consultation page
- **THEN** system calls `GET /habit-opd/api/v1/opd_tele_booking?queryId=TELE_SPECIALITY_LISTING&args=cug_code:cug_code_data,mode_of_appointment:opd_network`
- **AND** displays specialties where each has `speciality_id`, `speciality_name`, and `speciality_code`

#### Scenario: API failure handling
- **WHEN** the speciality API returns an error
- **THEN** system displays an error message and allows retry

### Requirement: Search Doctors by Speciality
The system SHALL fetch doctors from `TELE_DOCTOR_LISTING` API filtered by the selected speciality code.

#### Scenario: Doctor search with results
- **WHEN** user selects a speciality
- **THEN** system calls `TELE_DOCTOR_LISTING` with `speciality_code=<SELECTED_CODE>`
- **AND** displays doctors sorted by earliest availability
- **AND** each doctor shows: name, qualification, experience, fee, rating, gender, languages, nextIn

#### Scenario: Doctor search with zero results
- **WHEN** no doctors match the selected speciality
- **THEN** system displays "No doctors match" message
- **AND** displays empanelment request option

### Requirement: Fetch Available Slots
The system SHALL fetch available consultation slots from `TELE_SLOT_AVAILABILITY` API for a selected doctor and date.

#### Scenario: Slot availability fetch
- **WHEN** user selects "Schedule for Later"
- **THEN** system calls `TELE_SLOT_AVAILABILITY` with `practitioner_id` and `slot_date`
- **AND** displays available 15-minute slots with status "available"

#### Scenario: No slots available
- **WHEN** no slots exist for the selected date
- **THEN** system displays message indicating no availability

### Requirement: Retrieve Patient List
The system SHALL fetch the authenticated user's family member list from `GET_FAMILY_LIST` API.

#### Scenario: Patient list fetch
- **WHEN** user proceeds to consultation details
- **THEN** system calls `GET /account-management/api/v1/user_relationship_mapping?queryId=GET_FAMILY_LIST`
- **AND** displays self + dependents (if primary member) or self only (if dependent)

### Requirement: Add Consultation to Cart
The system SHALL submit consultation details to the cart via the `cart_add` action endpoint.

#### Scenario: Successful cart addition
- **WHEN** user confirms doctor, slot, and patient selection
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=cart_add` with base64-encoded cart snapshot
- **AND** receives `cart_id` and initial billing breakdown

### Requirement: Calculate Checkout Amounts
The system SHALL fetch wallet coverage calculation via the `checkout` action endpoint.

#### Scenario: Checkout calculation
- **WHEN** cart is ready for payment
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=checkout` with base64-encoded checkout snapshot
- **AND** calculates: consultation fee, wallet coverage (up to ₹300 per transaction), 20% copay, excess self-pay

### Requirement: Book Appointment
The system SHALL finalize the booking via the `book_appointment` action endpoint.

#### Scenario: Successful booking
- **WHEN** payment is confirmed or wallet-only payment
- **THEN** system calls `POST /habit-opd/api/v1/opd_tele_booking?action=book_appointment`
- **AND** receives `service_request_id` for video call integration

## Error Handling

### Required error codes
- Network failure: Show retry option
- API error response (errCode !== 0): Display error message
- Timeout: Allow retry after 30 seconds
- Validation error: Show specific field error