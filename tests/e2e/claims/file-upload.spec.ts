import { test, expect } from '@playwright/test';
import { injectSessionCookie } from '../../utils/session';
import fs from 'fs';
import path from 'path';
import os from 'os';

test.describe('File upload', () => {
  test.beforeEach(async ({ page }) => {
    await injectSessionCookie(page);
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor({ timeout: 10000 });
    
    // Wait for patient dropdown to be populated (family loading effect)
    const patientOption = page.locator('#patient option:not([disabled])').first();
    await expect(patientOption).toBeAttached({ timeout: 15000 });
    
    // Advance to step 2.
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('#providerName').fill('Test Clinic');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.locator('#billAmount').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Wait for step 2 - Documents heading
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10000 });
  });

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

  test('attach files appear in the list with correct names', async ({ page }) => {
    const invoice = createTempPdf('invoice.pdf');
    const report = createTempPdf('report.pdf');

    // Upload bill (first file input for bill slot)
    await page.locator('#doc-bill').setInputFiles(invoice);
    // Wait for upload to complete and file to appear in list
    await expect(page.locator('li:has-text("invoice.pdf")')).toBeVisible({ timeout: 20000 });

    // Upload prescription (second file input for prescription slot)
    await page.locator('#doc-prescription').setInputFiles(report);
    await expect(page.locator('li:has-text("report.pdf")')).toBeVisible({ timeout: 20000 });
  });

  test('remove file clears it from the list', async ({ page }) => {
    const file = createTempPdf('invoice.pdf');
    await page.locator('#doc-bill').setInputFiles(file);
    await expect(page.locator('li:has-text("invoice.pdf")')).toBeVisible({ timeout: 20000 });

    await page.locator('button', { hasText: 'Remove' }).first().click();
    await expect(page.locator('li:has-text("invoice.pdf")')).not.toBeVisible({ timeout: 5000 });
  });

  test('cancelled cheque over 5 MB is rejected', async ({ page }) => {
    // 6 MB file (> MAX_BYTES of 5 MB).
    const oversized = createTempPdf('cheque.pdf');
    fs.truncateSync(oversized, 6 * 1024 * 1024);

    await page.locator('#cheque').setInputFiles(oversized);
    await expect(page.locator('text=is larger than 5 MB')).toBeVisible({ timeout: 5000 });
  });
});