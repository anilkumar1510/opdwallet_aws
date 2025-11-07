# Automated Testing Infrastructure (NOT YET IMPLEMENTED)

**Status:** 🟡 Planned for Future Implementation
**Priority:** High
**Estimated Effort:** 2-3 days for complete setup

---

## Overview

This document outlines a **professional, enterprise-grade automated testing solution** designed for the OPD Wallet application. This approach is used by companies like Netflix, Airbnb, Stripe, and other top-tier tech companies.

### What This Enables

- **One-command testing** of complete user flows (e.g., `npm run test:flow online-booking`)
- **Automated detection** of bugs in frontend, backend, and database
- **Visual proof** with screenshots and videos
- **No manual clicking** required
- **Professional test reports** for stakeholders
- **CI/CD ready** for deployment gates

---

## Testing Stack (Enterprise Standard)

| Tool | Purpose | Used By |
|------|---------|---------|
| **Playwright** | E2E browser automation | Microsoft, Google, Netflix |
| **Supertest** | API integration testing | Stripe, Shopify |
| **Jest** | Test runner & assertions | Facebook, Uber |
| **Docker** | Isolated test environment | Everyone |
| **Allure** | Professional test reporting | Amazon, eBay |

---

## Architecture Overview

### Three-Layer Testing Strategy

```
┌─────────────────────────────────────────┐
│  LAYER 1: E2E Browser Tests (Playwright)│  ← Tests like a real user
│  - Clicks buttons, fills forms          │
│  - Navigates pages                       │
│  - Verifies UI elements                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  LAYER 2: API Integration Tests         │  ← Tests API directly
│  - Direct HTTP calls to backend          │
│  - Validates response structure          │
│  - Checks status codes                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  LAYER 3: Database Verification          │  ← Verifies data persistence
│  - Checks records created/updated        │
│  - Validates relationships               │
│  - Ensures data consistency              │
└─────────────────────────────────────────┘
```

---

## Planned Project Structure

```
/tests
  /e2e                         # End-to-end browser tests
    /flows
      - online-booking.spec.ts
      - clinic-booking.spec.ts
      - prescription-view.spec.ts
      - wallet-refund.spec.ts
      - claim-submission.spec.ts
      - appointment-cancel.spec.ts
      - lab-test-order.spec.ts

    /pages                     # Page Object Model (Reusable UI)
      - BasePage.ts
      - LoginPage.ts
      - DashboardPage.ts
      - OnlineConsultPage.ts
      - AppointmentBookingPage.ts
      - WalletPage.ts
      - PrescriptionPage.ts

    /components                # Reusable UI components
      - AppointmentCard.ts
      - PaymentModal.ts
      - WalletWidget.ts

    /fixtures                  # Test data
      - users.json
      - doctors.json
      - clinics.json
      - appointments.json

  /api                         # API integration tests (faster)
    /appointments
      - create-appointment.test.ts
      - cancel-appointment.test.ts
      - refund-calculation.test.ts
    /wallet
      - debit-wallet.test.ts
      - credit-wallet.test.ts
      - balance-check.test.ts
    /prescriptions
      - upload-prescription.test.ts
      - download-prescription.test.ts
    /claims
      - submit-claim.test.ts
      - approve-claim.test.ts

  /helpers
    - db-seeder.ts             # Create test data
    - db-cleaner.ts            # Clean after tests
    - api-client.ts            # Direct API calls
    - auth-helper.ts           # Login tokens
    - screenshot-helper.ts     # Visual regression
    - logger.ts                # Test logging

  /config
    - playwright.config.ts
    - jest.config.ts
    - test-setup.ts
    - docker-compose.test.yml

  /reports                     # Generated automatically
    - allure-results/
    - screenshots/
    - videos/
    - trace-files/
```

---

## How It Works - Example Flow

### When you run: `npm run test:flow online-booking`

**Complete automation of:**

1. ✅ **Setup Phase**
   - Create test user with ₹5000 wallet balance
   - Seed test doctor (Dr. Test, General Physician)
   - Clean previous test data

2. ✅ **Frontend Testing**
   - Open browser (headless or visible)
   - Navigate to login page
   - Fill email/password fields
   - Click login button
   - Verify redirect to dashboard

3. ✅ **User Flow Simulation**
   - Click "Online Consultation" button
   - Click "Consult Now"
   - Select "General Physician" specialty
   - Choose "Dr. Test Doctor"
   - Fill appointment form (date, time, phone)
   - Select "Use Wallet" option
   - Click "Confirm Booking"

4. ✅ **API Verification**
   - Intercept POST /appointments API call
   - Verify request payload structure
   - Check response status (201 Created)
   - Validate appointmentId format
   - Confirm walletDebitAmount = ₹500

5. ✅ **UI Validation**
   - Wait for success message
   - Verify "Appointment Confirmed" appears
   - Check appointmentId displayed
   - Capture screenshot

6. ✅ **Database Verification**
   - Query appointment record by ID
   - Verify consultationFee = ₹500
   - Verify walletDebitAmount = ₹500
   - Check status = 'CONFIRMED'
   - Validate wallet transaction created (DEBIT)
   - Confirm wallet balance = ₹4500 (5000 - 500)
   - Verify transaction summary exists

7. ✅ **Cleanup Phase**
   - Delete test appointment
   - Remove test data
   - Close browser
   - Generate report

**Total Time:** ~12 seconds
**Screenshots:** 8 captured
**API Calls:** 15 logged
**Database Changes:** 3 verified

---

## Test Commands (When Implemented)

```bash
# Test specific flow
npm run test:flow online-booking
npm run test:flow prescription-viewing
npm run test:flow wallet-refund
npm run test:flow claim-submission

# Test all flows
npm run test:all

# Test with visible browser
npm run test:flow online-booking --headed

# Debug mode (slow, step-by-step)
npm run test:flow online-booking --debug

# Watch mode (reruns on file changes)
npm run test:watch online-booking

# Test only changed files
npm run test:affected

# Generate visual report
npm run test:report
```

---

## Expected Test Output

```
Test Results:
─────────────────────────────────────────
✅ Online Booking Flow        12.3s  PASSED
✅ Clinic Booking Flow        10.1s  PASSED
❌ Wallet Refund Flow          8.7s  FAILED
✅ Prescription View Flow      5.2s  PASSED
✅ Claim Submission Flow      15.4s  PASSED
✅ Appointment Cancel Flow     7.2s  PASSED

Total: 6 tests, 5 passed, 1 failed
Duration: 53.7s

Failed Test Details:
─────────────────────────────────────────
Test: Wallet Refund Flow
Step: Verify refund amount
Expected: ₹500
Received: ₹1000

Screenshot: screenshots/refund-failure.png
API Log: logs/refund-api-call.json
Database State: snapshots/before-after-refund.json

Issue Found:
  File: appointments.service.ts:827
  Line: appointment.consultationFee
  Should be: appointment.walletDebitAmount

Suggested Fix Generated: fixes/wallet-refund-fix.patch

View Full Report: http://localhost:9000/allure-report
```

---

## Example Test Code

### Complete Online Booking Test

```typescript
// tests/e2e/flows/online-booking.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OnlineConsultPage } from '../pages/OnlineConsultPage';
import { dbSeeder } from '../helpers/db-seeder';
import { dbCleaner } from '../helpers/db-cleaner';
import { apiClient } from '../helpers/api-client';

test.describe('Online Doctor Booking Flow', () => {
  let testUserId: string;
  let testDoctorId: string;

  test.beforeEach(async () => {
    // Setup test data
    testUserId = await dbSeeder.createUser({
      email: '1@2.com',
      name: 'John Doe',
      walletBalance: 5000
    });

    testDoctorId = await dbSeeder.createDoctor({
      doctorId: 'DOC-TEST-001',
      name: 'Dr. Test Doctor',
      specialty: 'General Physician'
    });
  });

  test.afterEach(async () => {
    // Cleanup
    await dbCleaner.cleanUser(testUserId);
    await dbCleaner.cleanDoctor(testDoctorId);
  });

  test('User can book online consultation with wallet payment', async ({ page, request }) => {
    // STEP 1: Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('1@2.com', 'password123');

    // Verify: Redirected to dashboard
    await expect(page).toHaveURL('/member/dashboard');
    await page.screenshot({ path: 'screenshots/step-1-logged-in.png' });

    // STEP 2: Navigate to Online Consultation
    const consultPage = new OnlineConsultPage(page);
    await consultPage.goto();
    await expect(consultPage.consultNowButton).toBeVisible();

    // STEP 3: Start booking flow
    await consultPage.clickConsultNow();

    // STEP 4: Select specialty
    await page.click('text=General Physician');
    await page.waitForURL('**/doctors**');

    // STEP 5: Choose doctor
    await page.click('text=Dr. Test Doctor');

    // STEP 6: Fill appointment form
    await page.fill('[name="appointmentDate"]', '2025-12-20');
    await page.click('text=2:00 PM');
    await page.fill('[name="contactNumber"]', '+919999999999');
    await page.click('text=Use Wallet');

    // STEP 7: Intercept API call
    const apiPromise = page.waitForResponse(
      response => response.url().includes('/appointments') &&
                  response.request().method() === 'POST'
    );

    await page.click('button:has-text("Confirm Booking")');

    // STEP 8: Verify API response
    const apiResponse = await apiPromise;
    const appointmentData = await apiResponse.json();

    expect(apiResponse.status()).toBe(201);
    expect(appointmentData.appointmentId).toMatch(/APT-.*/);
    expect(appointmentData.walletDebitAmount).toBe(500);
    expect(appointmentData.status).toBe('CONFIRMED');

    // STEP 9: Verify UI
    await expect(page.locator('text=Appointment Confirmed')).toBeVisible();
    await page.screenshot({ path: 'screenshots/step-9-confirmed.png' });

    // STEP 10: Verify database
    const dbAppointment = await apiClient.getAppointment(appointmentData.appointmentId);
    expect(dbAppointment.consultationFee).toBe(500);
    expect(dbAppointment.walletDebitAmount).toBe(500);

    // STEP 11: Verify wallet transaction
    const walletTxn = await apiClient.getWalletTransactions(testUserId);
    expect(walletTxn[0].type).toBe('DEBIT');
    expect(walletTxn[0].amount).toBe(500);

    // STEP 12: Verify wallet balance
    const wallet = await apiClient.getWallet(testUserId);
    expect(wallet.balance).toBe(4500); // 5000 - 500

    // STEP 13: Verify transaction summary
    const transaction = await apiClient.getTransaction(appointmentData.transactionId);
    expect(transaction.totalAmount).toBe(500);
    expect(transaction.status).toBe('COMPLETED');
  });
});
```

### Page Object Model Example

```typescript
// tests/e2e/pages/LoginPage.ts

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[name="email"]');
    this.passwordInput = page.locator('[name="password"]');
    this.loginButton = page.locator('button:has-text("Login")');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('http://localhost:3001/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible();
  }
}
```

---

## Handling Changes

### When UI Changes (e.g., button text)

**Before:** Button says "Confirm Booking"
**After:** Button says "Book Appointment"

**Update Required:**
```typescript
// OLD
await page.click('button:has-text("Confirm Booking")')

// NEW
await page.click('button:has-text("Book Appointment")')

// BEST (use data-testid, resilient to text changes)
await page.click('[data-testid="confirm-booking-btn"]')
```

### When API Response Changes

**Before:** `{ appointmentId: "APT-001" }`
**After:** `{ data: { appointmentId: "APT-001" } }`

**Update Required:**
```typescript
// OLD
expect(response.appointmentId).toMatch(/APT-.*/)

// NEW
expect(response.data.appointmentId).toMatch(/APT-.*/)
```

### When New Field Added to Form

**Update Required:**
```typescript
// Add new line for new field
await page.fill('[name="reasonForVisit"]', 'Regular checkup')
```

### When Workflow Changes (New Step)

**Example:** Email OTP now required before booking

**Update Required:**
```typescript
// Add after form filling, before submit
await page.click('button:has-text("Send OTP")')
await page.fill('[name="otp"]', '123456')
await page.click('button:has-text("Verify OTP")')

// Then continue with existing flow
await page.click('button:has-text("Confirm Booking")')
```

---

## Development Rules (When Implemented)

### Rule #1: Test-Driven Feature Development ⚠️ CRITICAL

**When implementing ANY feature (new or modifying existing):**

#### MANDATORY Steps:
1. ✅ **Before coding**: Review if existing tests need updates
2. ✅ **During coding**: Update/create tests alongside feature code
3. ✅ **After coding**: Run full test suite before committing
4. ✅ **In PR**: Include test coverage in description

#### What Must Be Tested:
- [ ] Frontend UI interactions (buttons, forms, navigation)
- [ ] API endpoints (request/response)
- [ ] Database operations (create/update/delete)
- [ ] Integration flow (frontend → API → database)
- [ ] Edge cases and error scenarios

#### Test Update Locations:
- `/tests/e2e/flows/` - User flow tests
- `/tests/api/` - API endpoint tests
- `/tests/e2e/pages/` - Page Object Models
- `/tests/fixtures/` - Test data (if schema changed)

#### Before Git Commit:
```bash
git add .
npm run test:affected  # Runs only tests related to changed files
npm run test:all       # Run full suite (if major changes)
git commit -m "..."
```

**⚠️ Failure to update tests will result in broken CI/CD pipeline!**

---

## Benefits Summary

### 1. Speed
- One command tests entire flow
- Runs 1000x faster than manual testing
- Parallel execution (10 tests at once)

### 2. Reliability
- Tests exact same steps every time
- No human error
- Catches regressions immediately

### 3. Documentation
- Tests serve as living documentation
- New developers understand flows from reading tests
- Always up-to-date (or tests fail)

### 4. Confidence
- Deploy with confidence (tests passed = it works)
- Refactor safely (tests catch breaks)
- Ship faster (no manual QA bottleneck)

### 5. Debugging
- Screenshots show exactly where it broke
- Videos replay full test run
- Logs show API requests/responses
- Database snapshots show state changes

### 6. Cost Savings
- No manual QA hours
- Catch bugs before production
- Reduce hotfix deployments

---

## Installation Steps (Future)

```bash
# 1. Install Playwright
npm install -D @playwright/test
npx playwright install

# 2. Install test utilities
npm install -D jest supertest @faker-js/faker

# 3. Install reporting
npm install -D allure-playwright allure-commandline

# 4. Initialize Playwright
npx playwright install-deps
```

---

## Integration with CI/CD (Future)

```yaml
# .github/workflows/test.yml
name: Automated Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Run API tests
        run: npm run test:api

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: reports/

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: screenshots/
```

---

## Key Metrics to Track

When testing is implemented, track:

- **Test Coverage**: Aim for >80% coverage
- **Test Duration**: Keep under 5 minutes for full suite
- **Flaky Tests**: Should be <1%
- **Time Saved**: Compare manual QA hours vs automated
- **Bugs Caught**: Pre-production vs production bugs

---

## Next Steps for Implementation

1. ✅ Install Playwright and dependencies
2. ✅ Create test folder structure
3. ✅ Set up test database
4. ✅ Build Page Object Models
5. ✅ Write first complete test (online booking)
6. ✅ Create database helpers (seeder/cleaner)
7. ✅ Configure Playwright
8. ✅ Add NPM scripts
9. ✅ Document testing guide
10. ✅ Set up CI/CD integration

**Estimated Implementation Time:** 2-3 days for complete setup

---

## Questions/Clarifications Needed

- [ ] Which flows should be prioritized for testing first?
- [ ] Should tests run on every commit or only on PR?
- [ ] Do we need visual regression testing?
- [ ] Should we test mobile responsive views?
- [ ] Integration with existing monitoring/alerting?

---

## References & Resources

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [Page Object Model Pattern](https://martinfowler.com/bliki/PageObject.html)
- [Test Automation Best Practices](https://www.thoughtworks.com/insights/blog/test-automation)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-02
**Status:** 🟡 Awaiting Implementation Approval
