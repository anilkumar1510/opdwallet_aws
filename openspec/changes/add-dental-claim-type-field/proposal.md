## Why

The claim submission form already captures the dental sub-type (Consultation vs Procedure) in the UI for dental category claims, but this field is not sent to the backend API. The dental claim type determines document requirements (procedures require lab/diagnostic reports) and is needed by the adjudication team for proper claim assessment.

## What Changes

- Add `dental_claim_type` field to the claim submission payload sent to the Twenty API (`habit-opd/api/v1/claim`)
- Display `dental_claim_type` on the claim detail page when present in the GET_PAGE response
- Always send the field (value for dental category, empty string for other categories)

## Capabilities

### New Capabilities

- `dental-claim-type-submission`: Submit dental claim type (Consultation/Procedure) with claim data for proper adjudication
- `dental-claim-type-display`: Display dental claim type on claim detail page for member visibility

### Modified Capabilities

- `claim-submission`: Extended to include dental_claim_type field in submission payload
- `claim-detail`: Extended to display dental_claim_type when available

## Impact

### Affected Files
- `projects/member/src/app/features/claims/new-claim-page.ts` - Add field to submit payload
- `projects/member/src/app/features/claims/claim-detail-page.ts` - Display field in claim details

### Affected APIs
- `habit-opd/api/v1/claim` (POST) - Claim submission endpoint receives new field in base64-encoded JSON payload
- `GET_PAGE` endpoint - Claim detail response may include `dental_claim_type` field

### No Breaking Changes
- Field is optional in payload (empty for non-dental categories)
- Backend can ignore unknown field if not yet implemented
- UI already captures the data, just wasn't transmitting it