# Design

## Context

In `NewClaimPage` (`projects/member/src/app/features/claims/new-claim-page.ts`), Step 1 collects Treatment details including `billAmount`. Standard HTML `<input type="number">` allows typing `-` in most modern browsers. If a user enters or pastes negative numbers or `0`, the form previously used an ambiguous check `((this.billAmount() ?? 0) <= 0)` that only prompted `'Enter the bill amount.'`.

## Technical Design

### 1. Keyboard and Clipboard Interception
To prevent negative characters from ever entering the number field:
```typescript
/** Prevents typing negative signs, plus signs, and exponential notation in currency inputs. */
protected onAmountKeyDown(event: KeyboardEvent): void {
  if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
    event.preventDefault();
  }
}

/** Prevents pasting negative numbers into the bill amount input. */
protected onAmountPaste(event: ClipboardEvent): void {
  const text = event.clipboardData?.getData('text') ?? '';
  if (text.includes('-') || text.includes('+')) {
    event.preventDefault();
  }
}
```

### 2. Value Sanitization
`onBillAmountChange()` cleans up input and handles empty strings gracefully:
```typescript
protected onBillAmountChange(value: any): void {
  if (value === null || value === undefined || value === '') {
    this.billAmount.set(null);
    return;
  }
  const num = Number(value);
  this.billAmount.set(isNaN(num) ? null : num);
}
```

### 3. Reactive Validation State and Inline UI
```typescript
/** Whether the user has entered a non-positive bill amount (<= 0). */
protected readonly isNegativeOrZeroBill = computed<boolean>(() => {
  const val = this.billAmount();
  return val !== null && val !== undefined && val <= 0;
});
```

Template binding:
```html
<input
  id="billAmount"
  name="billAmount"
  type="number"
  min="1"
  step="any"
  inputmode="decimal"
  class="min-h-touch w-full rounded-xl border border-surface-border bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
  [class.border-danger-500]="isNegativeOrZeroBill()"
  [ngModel]="billAmount()"
  (ngModelChange)="onBillAmountChange($event)"
  (keydown)="onAmountKeyDown($event)"
  (paste)="onAmountPaste($event)"
/>
@if (isNegativeOrZeroBill()) {
  <p class="mt-1 text-xs text-danger-700" role="alert">Bill amount must be greater than zero.</p>
}
```

### 4. Step Progression Guard
In `missingStep1()`:
```typescript
const bill = this.billAmount();
if (bill === null || bill === undefined) return 'Enter the bill amount.';
if (bill <= 0) return 'Bill amount must be greater than zero.';
```
This blocks the user from proceeding to Step 2 and displays an explicit, actionable error message.
