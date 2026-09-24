import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import os from 'os';

test.describe('File upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor({ timeout: 10000 });
    
    // Wait for patient dropdown to be populated (family loading effect)
    const patientOption = page.locator('#patient option:not([disabled])').first();
    await expect(patientOption).toBeAttached({ timeout: 15000 });
    
    // Advance to step 2.
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.locator('#billAmount').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Wait for step 2 - Documents heading
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10000 });
  });

  function createTempFile(name: string, content = 'test'): string {
    const tmp = path.join(os.tmpdir(), name);
    fs.writeFileSync(tmp, content);
    return tmp;
  }

  test('attach files appear in the list with correct names', async ({ page }) => {
    const invoice = createTempFile('invoice.pdf');
    const report = createTempFile('report.png');

    await page.locator('input[type="file"]').nth(0).setInputFiles(invoice);
    await page.locator('input[type="file"]').nth(1).setInputFiles(report);

    await expect(page.locator('text=invoice.pdf')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=report.png')).toBeVisible({ timeout: 5000 });
  });

  test('remove file clears it from the list', async ({ page }) => {
    const file = createTempFile('invoice.pdf');
    await page.locator('input[type="file"]').first().setInputFiles(file);
    await expect(page.locator('text=invoice.pdf')).toBeVisible({ timeout: 5000 });

    await page.locator('button', { hasText: 'Remove' }).first().click();
    await expect(page.locator('text=invoice.pdf')).not.toBeVisible({ timeout: 5000 });
  });

  test('cancelled cheque over 5 MB is rejected', async ({ page }) => {
    // 6 MB file (> MAX_BYTES of 5 MB).
    const oversized = createTempFile('cheque.pdf');
    fs.truncateSync(oversized, 6 * 1024 * 1024);

    await page.locator('#cheque').setInputFiles(oversized);
    await expect(page.locator('text=is larger than 5 MB')).toBeVisible({ timeout: 5000 });
  });
});