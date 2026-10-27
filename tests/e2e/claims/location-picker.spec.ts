import { test, expect, Page } from '@playwright/test';
import { injectSessionCookie } from '../../utils/session';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * The claim form's map location picker, against a fake Google Maps installed
 * before the app boots. The loader finds `google.maps.importLibrary` already on
 * the page, so no key is fetched and no Google script is loaded.
 */

const APOLLO_LABEL = 'Apollo Pharmacy, Road No. 1, Banjara Hills, Hyderabad, Telangana';
const CARE_LABEL = 'Care Clinic, Ameerpet, Hyderabad, Telangana';

/** Runs in the browser before any app script. Search text picks the rows. */
function installFakeGoogle(): void {
  const rows = [
    { key: 'apollo', main: 'Apollo Pharmacy', secondary: 'Road No. 1, Banjara Hills, Hyderabad, Telangana, India', lat: 17.41, lng: 78.44 },
    { key: 'care', main: 'Care Clinic', secondary: 'Ameerpet, Hyderabad, Telangana, India', lat: 17.43, lng: 78.45 },
  ];
  const prediction = (row: (typeof rows)[number]) => ({
    place_id: row.key,
    description: `${row.main}, ${row.secondary}`,
    structured_formatting: { main_text: row.main, secondary_text: row.secondary },
  });
  // The last map's options, so a test can see where the picker opened.
  const w = window as unknown as { google: unknown; __lastMapOptions?: unknown };
  const libraries: Record<string, unknown> = {
    maps: {
      Map: class {
        constructor(_el: unknown, options: unknown) {
          w.__lastMapOptions = options;
        }
        panTo() {}
        setZoom() {}
      },
    },
    marker: { AdvancedMarkerElement: class {} },
    places: {
      AutocompleteSessionToken: class {},
      AutocompleteService: class {
        async getPlacePredictions({ input }: { input: string }) {
          return { predictions: rows.filter((row) => input.toLowerCase().includes(row.key)).map(prediction) };
        }
      },
      PlacesService: class {
        getDetails({ placeId }: { placeId: string }, callback: (result: unknown, status: string) => void) {
          const row = rows.find((r) => r.key === placeId);
          if (row) callback({ geometry: { location: { toJSON: () => ({ lat: row.lat, lng: row.lng }) } } }, 'OK');
          else callback(null, 'NOT_FOUND');
        }
      },
    },
  };
  w.google = {
    maps: { importLibrary: async (name: string) => libraries[name] },
  };
}

/** Opens the picker from a location field, searches, picks the first row and confirms. */
async function pickLocation(page: Page, fieldId: string, search: string, rowName: string): Promise<void> {
  await page.locator(`button#${fieldId}`).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Search for a place').fill(search);
  await dialog.getByRole('option', { name: new RegExp(rowName) }).click();
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await expect(dialog).toBeHidden();
}

function createTempPdf(name: string): string {
  const file = path.join(os.tmpdir(), name);
  fs.writeFileSync(file, '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF');
  return file;
}

test.describe('Claim location picker', () => {
  test.beforeEach(async ({ page }) => {
    await injectSessionCookie(page);
    await page.addInitScript(installFakeGoogle);
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor({ timeout: 10000 });
    await expect(page.locator('#patient option:not([disabled])').first()).toBeAttached({ timeout: 15000 });
  });

  test('search, pick and confirm writes the readable name into the field', async ({ page }) => {
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('button#providerName').click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Doctor location' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();

    await pickLocation(page, 'providerName', 'apollo', 'Apollo Pharmacy');
    await expect(page.locator('#providerName')).toHaveText(APOLLO_LABEL);
    await expect(page.locator('#providerName')).not.toContainText('India');
    await expect(page.locator('#providerName')).toBeFocused();
  });

  test('reopening a filled field shows its pick selected and on the map', async ({ page }) => {
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await pickLocation(page, 'providerName', 'apollo', 'Apollo Pharmacy');

    await page.locator('button#providerName').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Road No. 1, Banjara Hills, Hyderabad, Telangana')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Confirm' })).toBeEnabled();
    const options = await page.evaluate(() => (window as unknown as { __lastMapOptions?: unknown }).__lastMapOptions);
    expect(options).toMatchObject({ center: { lat: 17.41, lng: 78.44 }, zoom: 16 });

    // After a clear, the picker opens empty again.
    await dialog.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'Clear Doctor location' }).click();
    await page.locator('button#providerName').click();
    await expect(dialog.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  test('confirming one of two location fields leaves the other unchanged', async ({ page }) => {
    await page.locator('#category').selectOption('PHARMACY');
    await pickLocation(page, 'providerName', 'care', 'Care Clinic');
    await pickLocation(page, 'purchaseLocation', 'apollo', 'Apollo Pharmacy');
    await expect(page.locator('#providerName')).toHaveText(CARE_LABEL);
    await expect(page.locator('#purchaseLocation')).toHaveText(APOLLO_LABEL);
  });

  test('cancelling after a pick leaves the field unchanged', async ({ page }) => {
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    await page.locator('button#providerName').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Search for a place').fill('apollo');
    await dialog.getByRole('option', { name: /Apollo Pharmacy/ }).click();
    await expect(dialog.getByRole('button', { name: 'Confirm' })).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('#providerName')).not.toContainText('Apollo');
  });

  test('clearing an optional Vaccination provider lets the claim continue', async ({ page }) => {
    await page.locator('#category').selectOption('VACCINATION');
    await pickLocation(page, 'providerName', 'care', 'Care Clinic');
    await page.getByRole('button', { name: 'Clear Provider (optional)' }).click();
    await expect(page.locator('#providerName')).not.toContainText('Care Clinic');

    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.locator('#billAmount').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10000 });
  });

  test('an empty required location asks the member to choose it', async ({ page }) => {
    await page.locator('#category').selectOption('DENTAL');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.locator('#billAmount').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('text=Choose the clinic location.')).toBeVisible({ timeout: 5000 });
  });

  test('a submitted Pharmacy claim carries the picked names', async ({ page }) => {
    await page.locator('#category').selectOption('PHARMACY');
    await pickLocation(page, 'providerName', 'care', 'Care Clinic');
    await pickLocation(page, 'purchaseLocation', 'apollo', 'Apollo Pharmacy');
    await page.locator('#treatmentDate').fill('2026-09-01');
    await page.locator('#billAmount').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10000 });

    for (const input of await page.locator('input[type="file"][id^="doc-"]').all()) {
      const id = (await input.getAttribute('id')) ?? 'doc';
      const file = createTempPdf(`${id}-location-picker.pdf`);
      await input.setInputFiles(file);
      await expect(page.locator(`li:has-text("${path.basename(file)}")`)).toBeVisible({ timeout: 20000 });
    }
    if (await page.locator('#cheque').count()) {
      const cheque = createTempPdf('cheque-location-picker.pdf');
      await page.locator('#cheque').setInputFiles(cheque);
      await expect(page.locator(`text=${path.basename(cheque)}`)).toBeVisible({ timeout: 20000 });
    }
    if (await page.locator('#bankHolder').count()) {
      await page.locator('#bankHolder').fill('Test User');
      await page.locator('#bankAccount').fill('123456789012');
      await page.locator('#bankIfsc').fill('HDFC0001234');
      await page.locator('#bankName').fill('HDFC Bank');
    }

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Review your claim' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('dd', { hasText: CARE_LABEL })).toBeVisible();
    await expect(page.locator('dd', { hasText: APOLLO_LABEL })).toBeVisible();

    const submit = page.waitForRequest((req) => req.url().includes('habit-opd/api/v1/opd_claim') && req.method() === 'POST');
    await page.getByRole('button', { name: 'Submit claim' }).click();
    const resource = new URLSearchParams((await submit).postData() ?? '').get('resource') ?? '';
    const payload = JSON.parse(Buffer.from(resource, 'base64').toString('utf8'));
    expect(payload.provider).toBe(CARE_LABEL);
    expect(payload.pharmacy).toBe(APOLLO_LABEL);
    expect(payload.lat_long_providerName).toBe('17.43,78.45');
    expect(payload.lat_long_purchaseLocation).toBe('17.41,78.44');
  });
});

test.describe('Claim location picker — loading', () => {
  test('no Places key is requested until a location field is clicked', async ({ page }) => {
    const keyRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('third_party_app_credentials') && req.url().includes('Places_API_KEY')) keyRequests.push(req.url());
    });
    await page.route('https://maps.googleapis.com/**', (route) => route.abort());
    await injectSessionCookie(page);
    await page.goto('/member/claims/new');
    await page.getByRole('heading', { name: 'New Claim' }).waitFor({ timeout: 10000 });
    await expect(page.locator('#patient option:not([disabled])').first()).toBeAttached({ timeout: 15000 });
    await page.locator('#category').selectOption('ONLINE_CONSULTATION');
    expect(keyRequests).toHaveLength(0);

    await page.locator('button#providerName').click();
    await expect.poll(() => keyRequests.length, { timeout: 10000 }).toBe(1);
  });
});
