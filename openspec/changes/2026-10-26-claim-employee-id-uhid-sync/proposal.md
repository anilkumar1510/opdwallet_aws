# Proposal: Claim Submission Employee ID & UHID Sync

## Why
When members submitted reimbursement claims via the Member Portal (`new-claim-page.ts`), the outbound claim payload failed to carry `employeeId` and `uhid`. This caused newly created claims to display placeholder text (or `null`) for Employee ID and UHID in Twenty CRM backoffice (`OPD-2026-00081`), requiring manual investigator intervention to locate the member's company and UHID identifiers.

## What Changes
1. **Member Model & DTOs**:
   - Extended `FamilyMemberResource` in `projects/member/src/app/core/member/member.dto.ts` to include optional `employee_id?: string; employeeId?: string;`.
   - Updated `FamilyMember` domain interface in `member.model.ts` to include `employeeId?: string | null;`.
   - Extended `family-mapper.ts` to extract `employeeId: resource.employee_id?.trim() || resource.employeeId?.trim() || null`.
   - Extended `member.mapper.ts` to map `employeeId: resource.employee_id || resource.employeeId || null`.
2. **Claim Submission Flow (`new-claim-page.ts`)**:
   - In `submitClaim()`, extracts `uhid` and `employeeId` for the target beneficiary (selected family member or primary member).
   - Injects `employeeId` and `uhid` into the submission payload passed to `opdClaimApi.createClaim()`.

## Capabilities
- Accurate member identification payload sent to `habit-opd` backend during claim submission.

## Impact
- `projects/member/src/app/core/member/family-mapper.ts`
- `projects/member/src/app/core/member/member.dto.ts`
- `projects/member/src/app/core/member/member.mapper.ts`
- `projects/member/src/app/core/member/member.model.ts`
- `projects/member/src/app/features/claims/new-claim-page.ts`
