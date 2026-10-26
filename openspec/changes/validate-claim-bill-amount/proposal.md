# Proposal

## Why

In `opd-new-claim-page`, the Bill Amount field permitted negative values or zero (e.g. typing `-500` or pasting negative numbers). Since medical claim bill amounts can never be zero or negative, allowing negative input degraded data integrity and created confusion for users and claim processing systems.

This change introduces multi-layer validation and input sanitization to ensure that bill amounts are strictly positive (> 0), negative input characters (`-`, `+`, `e`, `E`) are blocked at the keyboard/paste level, an inline error alert is rendered when an invalid value is present, and form progression is blocked with an explicit error message.

## What Changes

- **Keyboard Input Interception**: Added `onAmountKeyDown()` to block typing `-`, `+`, `e`, and `E`.
- **Paste Protection**: Added `onAmountPaste()` to reject clipboard text containing negative or plus symbols.
- **Input Sanitization**: Added `onBillAmountChange()` to sanitize numerical values and handle empty inputs cleanly.
- **HTML5 Input Constraints**: Updated `<input id="billAmount">` with `min="1"`, `step="any"`, and `inputmode="decimal"`.
- **Inline Error Alert**: Displays `<p class="text-danger-700">Bill amount must be greater than zero.</p>` and highlights the input border when `isNegativeOrZeroBill()` is true.
- **Step 1 Progression Guard**: Updated `missingStep1()` to distinguish between missing amount (`'Enter the bill amount.'`) and non-positive amount (`'Bill amount must be greater than zero.'`).

## Capabilities

### New Capabilities
- `claim-bill-amount-validation`: Prevents negative or zero bill amount values through keyboard blocking, paste sanitization, inline error indicators, and step progression validation.

### Modified Capabilities
- None

## Impact

- `projects/member/src/app/features/claims/new-claim-page.ts`: Adds negative value guards, keydown/paste handlers, reactive error state, and step 1 validation.
