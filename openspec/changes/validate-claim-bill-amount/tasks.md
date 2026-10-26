# Tasks

## 1. Specification & Design
- [x] 1.1 Document proposal and design in OpenSpec change `validate-claim-bill-amount`.
- [x] 1.2 Define spec delta requirements and scenarios for non-negative bill amount validation.

## 2. Implementation
- [x] 2.1 Add `isNegativeOrZeroBill` computed signal in `NewClaimPage` checking for values `<= 0`.
- [x] 2.2 Add `onAmountKeyDown` handler to prevent typing `-`, `+`, `e`, `E`.
- [x] 2.3 Add `onAmountPaste` handler to prevent pasting negative numbers.
- [x] 2.4 Add `onBillAmountChange` handler to sanitize incoming numeric input.
- [x] 2.5 Update bill amount input attributes (`min="1"`, `step="any"`, `inputmode="decimal"`) and inline danger message.
- [x] 2.6 Enhance `missingStep1()` validation to explicitly block values `<= 0` with `'Bill amount must be greater than zero.'`.

## 3. Verification
- [x] 3.1 Validate OpenSpec change with `npx openspec validate validate-claim-bill-amount`.
- [x] 3.2 Run TypeScript compilation check with `npx tsc --noEmit -p projects/member/tsconfig.app.json`.
