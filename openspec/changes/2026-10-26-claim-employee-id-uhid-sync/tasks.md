# Tasks: Claim Submission Employee ID & UHID Sync

- [x] **1. Model & Mapper Updates**
  - [x] Add `employee_id` / `employeeId` to `FamilyMemberResource` in `member.dto.ts`
  - [x] Add `employeeId` to `FamilyMember` in `member.model.ts`
  - [x] Map `employeeId` in `family-mapper.ts`
  - [x] Map `employeeId` in `member.mapper.ts`

- [x] **2. Claim Submission Form**
  - [x] Extract beneficiary `uhid` and `employeeId` in `new-claim-page.ts`
  - [x] Pass `employeeId` and `uhid` in `createClaim()` payload

- [x] **3. Build & Conflict Verification**
  - [x] Merge upstream branch `origin/member-portal-frontend` cleanly
  - [x] Resolve conflict in `family-mapper.ts` preserving new relationship fields
  - [x] Verify production build passes: `npm run build` (0 errors)
  - [x] Commit and push to `bugfix/claim-employee-id-uhid-sync`
