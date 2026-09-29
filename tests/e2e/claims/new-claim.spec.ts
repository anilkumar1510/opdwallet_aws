import { test, expect } from '@playwright/test';
import { injectSessionCookie } from '../../utils/session';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Minimal valid PDF content for testing
const validPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Test PDF) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
299
%%EOF`;

function createTempPdf(name: string): string {
  const tmp = path.join(os.tmpdir(), name);
  fs.writeFileSync(tmp, validPdfContent);
  return tmp;
}

test.describe('New claim', () => {
  test.beforeEach(async ({ page }) => {
    await injectSessionCookie(page);
    await page.goto('/member/claims/new');
    await page.evaluate(() => localStorage.removeItem('opd.bankDetails.placeholder'));
    await page.reload();
    await page.getByRole('heading', { name: 'New Claim' }).waitFor({ timeout: 10000 });
    
    await expect(page.locator('#patient option:not([disabled])').first()).toBeAttached({ timeout: 15000 });
  });

  test('step 1 validation blocks Continue with missing fields', async ({ page }) => {
    const continueBtn = page.getByRole('button', { name: 'Continue' });

    // Without selecting a category, both category and providerName validations should appear
    await continueBtn.click();
    await expect(page.locator('text=Choose a claim category.')).toBeVisible({ timeout: 5000 });

    // Now select a category to trigger providerName validation
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await continueBtn.click();
    await expect(page.locator('text=Enter the doctor location.')).toBeVisible({ timeout: 5000 });
  });

  test('navigates step 1 → 2 → 3 with valid data', async ({ page }) => {
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('#providerName').fill('Test Clinic');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.locator('#billAmount').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10000 });

    // Upload required documents for ONLINE_CONSULTATION: bill + prescription
    const billFile = createTempPdf('bill.pdf');
    const prescriptionFile = createTempPdf('prescription.pdf');
    await page.locator('#doc-bill').setInputFiles(billFile);
    await expect(page.locator('li:has-text("bill.pdf")')).toBeVisible({ timeout: 20000 });
    await page.locator('#doc-prescription').setInputFiles(prescriptionFile);
    await expect(page.locator('li:has-text("prescription.pdf")')).toBeVisible({ timeout: 20000 });

    // Fill bank details (required when no saved bank details)
    await page.locator('#bankHolder').fill('Test User');
    await page.locator('#bankAccount').fill('123456789012');
    await page.locator('#bankIfsc').fill('HDFC0001234');
    await page.locator('#bankName').fill('HDFC Bank');
    // Upload cancelled cheque (required) - appears as text, not in li
    const chequeFile = createTempPdf('cheque.pdf');
    await page.locator('#cheque').setInputFiles(chequeFile);
    await expect(page.locator('text=cheque.pdf')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Review your claim' })).toBeVisible({ timeout: 10000 });
  });

  test('review summary reflects entered data', async ({ page }) => {
    await page.locator('#category').selectOption('VISION');
    await page.locator('#providerName').fill('Eye Clinic');
    await page.locator('#purchaseLocation').fill('Optical Shop');
    await page.locator('#treatmentDate').fill('2026-09-15');
    await page.locator('#billAmount').fill('250');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Upload required documents for VISION: bill + prescription
    const billFile = createTempPdf('bill.pdf');
    const prescriptionFile = createTempPdf('prescription.pdf');
    await page.locator('#doc-bill').setInputFiles(billFile);
    await expect(page.locator('li:has-text("bill.pdf")')).toBeVisible({ timeout: 20000 });
    await page.locator('#doc-prescription').setInputFiles(prescriptionFile);
    await expect(page.locator('li:has-text("prescription.pdf")')).toBeVisible({ timeout: 20000 });

    // Fill bank details
    await page.locator('#bankHolder').fill('Test User');
    await page.locator('#bankAccount').fill('123456789012');
    await page.locator('#bankIfsc').fill('HDFC0001234');
    await page.locator('#bankName').fill('HDFC Bank');
    // Upload cancelled cheque - appears as text, not in li
    const chequeFile = createTempPdf('cheque.pdf');
    await page.locator('#cheque').setInputFiles(chequeFile);
    await expect(page.locator('text=cheque.pdf')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('dd', { hasText: 'Vision' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=₹250').first()).toBeVisible({ timeout: 10000 });
    // Verify both location fields appear in review
    await expect(page.locator('dt', { hasText: 'Clinic (where eye power prescribed)' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('dt', { hasText: 'Optician (where eyewear bought)' })).toBeVisible({ timeout: 5000 });
  });

  test('over-limit bill shows cap notice on submit', async ({ page }) => {
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('#providerName').fill('Habit Health Clinic');
    await page.locator('#billAmount').fill('600');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Upload required documents for ONLINE_CONSULTATION: bill + prescription
    for (const id of ['#doc-bill', '#doc-prescription']) {
      await page.locator(id).setInputFiles({
        name: 'claim-document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from(validPdfContent),
      });
    }
    await expect(page.locator('li:has-text("claim-document.pdf")')).toHaveCount(2);

    // Fill bank details
    await page.locator('#bankHolder').fill('Shivam Jha');
    await page.locator('#bankAccount').fill('123456789012');
    await page.locator('#bankIfsc').fill('HDFC0001234');
    await page.locator('#bankName').fill('HDFC Bank');
    // Upload cancelled cheque - appears as text, not in li
    await page.locator('#cheque').setInputFiles({
      name: 'cheque.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(validPdfContent),
    });
    await expect(page.locator('text=cheque.pdf')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Submit claim' }).click();

    await expect(page.locator('text=was capped to')).toBeVisible({ timeout: 10000 });
  });
});