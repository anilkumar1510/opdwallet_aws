# Digital Prescription Specification

## Purpose

Enables retrieval and display of digital prescriptions generated after teleconsultation, with download capability and integration with Health Records.

## ADDED Requirements

### Requirement: Fetch Prescription Document
The system SHALL retrieve the digital prescription after teleconsultation completion.

#### Scenario: Successful prescription fetch
- **WHEN** user navigates to prescription step after consultation
- **THEN** system calls `GET /habit-opd/api/v1/opd_tele_booking?queryId=TELE_PRESCRIPTION_DOCUMENT&args=service_request_id:<ID>`
- **AND** system displays prescription with medications, dosages, and duration
- **AND** system shows confirmation that prescription is saved to Health Records

#### Scenario: Prescription not yet available
- **WHEN** prescription generation is still in progress
- **THEN** system displays loading state
- **AND** user can retry or check later

#### Scenario: Prescription fetch failure
- **WHEN** API returns error
- **THEN** system displays error with retry option

### Requirement: Prescription Display
The system SHALL display prescription details in a clear, structured format.

#### Scenario: Prescription with medications
- **WHEN** prescription data is received
- **THEN** system displays each medication with:
  - Medication name
  - Dosage instructions
  - Duration
  - Frequency

#### Scenario: Prescription metadata
- **WHEN** prescription is displayed
- **THEN** system shows doctor name and patient name
- **AND** shows "Saved to Health Records" confirmation

### Requirement: Health Records Integration
The system SHALL make prescription accessible from Health Records.

#### Scenario: Prescription in Health Records
- **WHEN** prescription is generated
- **THEN** system stores prescription under Health Records → My Prescriptions
- **AND** user can access prescription from Health Records section

## Data Contracts

### Prescription Response
```json
{
  "medications": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "1 tablet twice a day after food",
      "duration": "5 days"
    },
    {
      "name": "Cetirizine 10mg",
      "dosage": "1 tablet at night",
      "duration": "3 days"
    }
  ],
  "advice": "plenty of fluids and rest"
}
```

### Prescription Display Fields
- Doctor name
- Patient name
- Consultation date/time
- Medications list with dosage/duration
- Medical advice
- Health Records storage confirmation

## Error Handling
- Network failure → Retry option
- API error (errCode !== 0) → Display message
- Prescription not found → Show appropriate message
- PDF download failure → Retry option