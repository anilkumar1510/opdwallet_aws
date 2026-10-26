# Design

## Context

The Policy Version API (`GET /habit-opd/api/v1/opd_policy_version`) returns `claim_expiry` (number of days) representing the maximum allowable elapsed time between medical treatment and claim filing.

In `NewClaimPage` (`projects/member/src/app/features/claims/new-claim-page.ts`), Step 1 collects:
- Patient selection
- Claim category
- Claim type
- **Treatment date (`input#treatmentDate`)**
- Location details
- Bill amount and number
- Description

## Technical Design

### 1. Dynamic Window Resolution
`PolicyStore.version()` holds the active `OpdPolicyVersionDto`.
- `claimExpiryDays = computed(() => policyStore.version()?.claim_expiry ?? 45)`
- `minTreatmentDate`: Computed by subtracting `claimExpiryDays()` from today's local date, formatted as `YYYY-MM-DD`.
- `today`: Local current date formatted as `YYYY-MM-DD`.

### 2. UI Constraints & Form Field
The HTML5 `<input type="date">` supports standard `min` and `max` constraints:
```html
<input
  id="treatmentDate"
  name="treatmentDate"
  type="date"
  [min]="minTreatmentDate()"
  [max]="today"
  [ngModel]="treatmentDate()"
  (ngModelChange)="treatmentDate.set($event)"
/>
```
Below the input:
```html
<p class="mt-1 text-xs text-ink-500">
  Claims must be submitted within {{ claimExpiryDays() }} days of treatment.
</p>
```

### 3. Validation Logic in `missingStep1()`
HTML input constraints prevent graphical selection in supported browsers, but users can still manually type dates or paste invalid strings.
In `missingStep1()`:
```typescript
if (this.treatmentDate() === '') return 'Choose the treatment date.';
if (this.treatmentDate() > this.today) return 'Treatment date cannot be in the future.';
if (this.treatmentDate() < this.minTreatmentDate()) {
  return `Treatment date must be within the last ${this.claimExpiryDays()} days as per policy terms.`;
}
```
If an invalid date is entered, the form displays an inline error banner and prevents progression to Step 2 (Documents).
