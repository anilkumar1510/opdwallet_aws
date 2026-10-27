import { Page, expect } from '@playwright/test';

/**
 * Puts the claim form's location fields into typing mode, the way a member
 * gets there when Google Maps cannot load: block Maps, open the picker from the
 * first location field and choose "Type it instead". Call after choosing a
 * category; afterwards `#providerName` / `#purchaseLocation` are text inputs
 * for the rest of the form.
 */
export async function typeLocations(page: Page): Promise<void> {
  if (await page.locator('input#providerName').count()) return;
  await page.route('https://maps.googleapis.com/**', (route) => route.abort());
  await page.locator('button#providerName').click();
  await page.getByRole('button', { name: 'Type it instead' }).click({ timeout: 20000 });
  await expect(page.locator('input#providerName')).toBeVisible({ timeout: 5000 });
}
