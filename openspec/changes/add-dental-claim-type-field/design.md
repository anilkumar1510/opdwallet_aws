## Context

The new-claim form already captures dental sub-type (Consultation/Procedure) via `dentalSubType` signal in `new-claim-page.ts`:
- Lines 429-433: Signal with options `{ value: 'consultation', label: 'Consultation' }` and `{ value: 'procedure', label: 'Procedure' }`
- Lines 128-138: Conditional UI renders when `isDental()` returns true (category is DENTAL/CAT006)
- Line 580: Review summary shows "Dental type" 
- `document-requirements.ts` uses this for document rules (procedures require lab reports)

However, the `submit()` method (lines 916-954) builds a payload object that is base64-encoded and sent to `habit-opd/api/v1/claim` without this field.

The claim detail page (`claim-detail-page.ts`) displays claim data from GET_PAGE response but doesn't show dental claim type.

## Goals / Non-Goals

**Goals:**
- Include `dental_claim_type` in claim submission payload when applicable
- Display `dental_claim_type` on claim detail page when present
- Conditionally send the field ONLY for dental categories extending existing e2e test

**Non-Goals:**
- Backend implementation (API contract change)
- New validation rules (UI already validates)
- Changes to document requirements (already handled)

## Decisions

### 1. Field Name: `dental_claim_type`
**Rationale:** User confirmed this exact field name. Matches snake_case convention used in payload.

### 2. Conditional Field Inclusion (Only for Dental)
**Rationale:** User specified to omit field for non-dental categories. Only include `dental_claim_type` when category is DENTAL/CAT006. This avoids sending irrelevant data and keeps payload clean.

**Alternative Considered:** Always send with empty string. Rejected per user direction - non-dental claims shouldn't have this field at all.

### 3. Value Mapping
**Rationale:** UI uses `consultation`/`procedure` values. Send these directly as they're clear and match what adjudicators expect.

### 4. Display Location on Detail Page
**Rationale:** Add after "Claim type" row in summary section (around line 131 in `claim-detail-page.ts`). Consistent with review summary.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Backend doesn't accept field yet | Field is optional; backend can ignore unknown fields. Coordinate with backend team. |
| Field name mismatch with backend | Confirm exact field name with backend API spec before deploying. |
| GET_PAGE doesn't return field yet | Display conditionally - only show if present in response. |
| Base64 encoding breaks with new field | Payload structure unchanged, just one more key. Low risk. |

## Migration Plan

1. Deploy frontend changes (field included in payload)
2. Backend adds field to schema/validation (can be done independently)
3. Backend returns field in GET_PAGE response
4. Frontend displays field (already coded conditionally)

**Rollback:** Remove field from payload - backward compatible since field is optional.

## Open Questions

- [ ] Confirm exact backend field name with API team
- [ ] Verify GET_PAGE response includes `dental_claim_type` after backend update
- [ ] Coordinate deployment timing with backend