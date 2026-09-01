/**
 * The invoice download — the endpoint that was declared and never called.
 *
 * `CLINIC_BOOKING_API[area].invoice` had zero callers from the day it was
 * written, while `/member/bookings` rendered the bare label "Invoice available"
 * beside the booking. The screen named a document the portal could not produce.
 *
 * **NON-MUTATING and it spends NO run budget.** Every assertion is a GET, and
 * the dental/vision list responses are intercepted so the four cases can be put
 * on screen at once. Nothing is booked, nothing is written.
 *
 * WHY INTERCEPTION IS NOT A CHEAT HERE. The four cases are decided entirely by
 * two fields the API sends (`invoiceGenerated`, `status`), and the member under
 * test owns none of them — every invoiced booking in this database belongs to
 * all@gmail.com or random@gmail.com. Interception supplies the fields; the gate
 * being tested is Angular's and runs unmodified.
 *
 * WHAT THIS CANNOT PROVE, and no local harness can:
 *   That a PDF arrives. Every `invoicePath` in this database is a macOS path
 *   from the original developer's machine (`/Users/nitendraagarwal/...`) and
 *   `api/uploads/invoices/{dental,vision}/` are both EMPTY here. `res.sendFile`
 *   has nothing to send. So case 4 below — the failure being disclosed rather
 *   than swallowed — is not a contrived edge case, it is what this machine
 *   actually does, and it is the more important assertion of the two.
 *
 * CONTROLS
 *   positive — the fixture reached the screen, asserted by a title only it has.
 *   negative — a CONFIRMED booking with invoiceGenerated true offers NO download.
 *              The API refuses anything but COMPLETED
 *              (dental-bookings.service.ts:1256), and the real data contains
 *              exactly this row: VIS-BOOK-1769701879987-3994.
 *   negative — a lab order with reports offers NO download and calls no invoice
 *              endpoint. `hasInvoice` is `reportCount > 0` for lab orders, so a
 *              gate on that flag would fire the vision/dental invoice route for
 *              a lab order.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };

const DENTAL = [
  {
    bookingId: 'DEN-BOOK-FIXTURE-COMPLETED',
    serviceName: 'Invoiced Completed Fixture',
    clinicName: 'Harness Dental',
    appointmentDate: '2026-01-10',
    appointmentTime: '10:00',
    status: 'COMPLETED',
    billAmount: 1000, walletDebitAmount: 400, totalMemberPayment: 0,
    paymentStatus: 'PAID',
    invoiceGenerated: true,
  },
  {
    bookingId: 'DEN-BOOK-FIXTURE-NOINVOICE',
    serviceName: 'Completed No Invoice Fixture',
    clinicName: 'Harness Dental',
    appointmentDate: '2026-01-11',
    appointmentTime: '10:00',
    status: 'COMPLETED',
    billAmount: 1000, walletDebitAmount: 400, totalMemberPayment: 0,
    paymentStatus: 'PAID',
    invoiceGenerated: false,
  },
];

const VISION = [
  {
    bookingId: 'VIS-BOOK-FIXTURE-CONFIRMED',
    serviceName: 'Invoiced Confirmed Fixture',
    clinicName: 'Harness Vision',
    appointmentDate: '2026-01-12',
    appointmentTime: '10:00',
    status: 'CONFIRMED',
    billAmount: 900, walletDebitAmount: 300, totalMemberPayment: 0,
    paymentStatus: 'PAID',
    invoiceGenerated: true,
  },
];

/**
 * A lab order WITH reports. Without this the lab assertions pass vacuously —
 * the first run reported "neither label present", which proves nothing about a
 * flag that only misbehaves when it is set. `toLabOrder` derives reportCount
 * from `reports.length` (lab.mapper.ts:173), so the reports array is the input.
 */
const LAB_ORDERS = [
  {
    _id: 'ORD-FIXTURE-REPORTED',
    orderId: 'ORD-FIXTURE-REPORTED',
    patientName: 'Harness Patient',
    status: 'COMPLETED',
    orderDate: '2026-01-05',
    collectionDate: '2026-01-05',
    totalAmount: 500,
    walletDeduction: 500,
    finalPayable: 0,
    paymentStatus: 'PAID',
    tests: [{ testName: 'Harness Panel' }],
    reports: [{ fileName: 'report-a.pdf' }, { fileName: 'report-b.pdf' }],
  },
];

const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const pg = await ctx.newPage();

  const calls = [];
  pg.on('request', (r) => {
    const u = new URL(r.url()).pathname;
    if (u.includes('/api/')) calls.push(`${r.method()} ${u}`);
  });

  // A BARE ARRAY, not an envelope. `BookingsStore.service()` does
  // `http.get<ServiceBookingDto[]>(url).then((rows) => rows.map(...))` with no
  // unwrapping, so a `{success, data}` wrapper throws on `.map` and the tab
  // renders "Could not load" — which is exactly what the first run of this
  // harness did, and it is worth leaving recorded: an interception whose SHAPE
  // is wrong fails as a load error, which reads like a defect in the thing
  // under test.
  const envelope = (data) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
  await pg.route('**/api/dental-bookings/user/**', (r) => r.fulfill(envelope(DENTAL)));
  await pg.route('**/api/vision-bookings/user/**', (r) => r.fulfill(envelope(VISION)));
  // Lab orders DO use the {success, data} envelope — `labLike` unwraps it,
  // unlike the dental/vision loader. Two shapes in one store.
  await pg.route('**/api/member/lab/orders**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: LAB_ORDERS }) }));

  // The real endpoint, failing the way it really fails here: the stored path is
  // a macOS path and the uploads directory is empty, so sendFile 500s.
  let invoiceHits = 0;
  await pg.route('**/invoice', (r) => {
    invoiceHits++;
    return r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"ENOENT"}' });
  });

  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });

  await pg.goto(APP + '/member/bookings?tab=dental', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(1600);

  const text = async () => (await pg.locator('#main, body').first().innerText()).replace(/\s+/g, ' ').trim();
  const dentalText = await text();

  rec('POSITIVE CONTROL — the fixture reached the screen',
    /Invoiced Completed Fixture/.test(dentalText), dentalText.slice(0, 120));

  const downloads = pg.getByRole('button', { name: /download invoice/i });
  rec('COMPLETED + invoiceGenerated renders a download control',
    (await downloads.count()) === 1, `${await downloads.count()} control(s) on the dental tab`);

  rec('NEGATIVE — a COMPLETED booking with no invoice offers nothing',
    !/Completed No Invoice Fixture[\s\S]{0,80}Download invoice/.test(dentalText),
    'no control on the un-invoiced row');

  calls.length = 0;
  await downloads.first().click();
  await pg.waitForTimeout(2500);

  const invoiceCall = calls.find((c) => /\/invoice$/.test(c));
  rec('The previously-dead endpoint is now actually called, with the business id',
    Boolean(invoiceCall) && invoiceCall.includes('dental-bookings/DEN-BOOK-FIXTURE-COMPLETED/invoice'),
    invoiceCall ?? 'no invoice request observed');

  rec('IDENTIFIER — the request carries DEN-BOOK-…, not a Mongo _id',
    Boolean(invoiceCall) && !/[0-9a-f]{24}/.test(invoiceCall), invoiceCall ?? '-');

  // The one that matters on this machine: the file does not exist, so this is
  // the branch a real member hits today.
  const afterFail = await text();
  rec('FAILURE IS DISCLOSED — a 500 is told to the member, not swallowed',
    /could not download that invoice/i.test(afterFail),
    afterFail.match(/[^.]*could not download[^.]*/i)?.[0]?.slice(0, 120) ?? 'no message shown');

  rec('The control recovers — it does not stay stuck on the pending label',
    (await pg.getByRole('button', { name: /download invoice/i }).count()) === 1,
    'button returned to its resting label');

  // Vision: CONFIRMED + invoiceGenerated. The API would refuse it.
  await pg.goto(APP + '/member/bookings?tab=vision', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(1400);
  const visionText = await text();
  rec('POSITIVE CONTROL — the vision fixture reached the screen',
    /Invoiced Confirmed Fixture/.test(visionText), visionText.slice(0, 100));
  rec('NEGATIVE — CONFIRMED + invoiceGenerated offers NO download (the API requires COMPLETED)',
    (await pg.getByRole('button', { name: /download invoice/i }).count()) === 0,
    'no control on a booking the API would refuse');

  // Lab: hasInvoice means reportCount here. It must not reach an invoice route.
  await pg.goto(APP + '/member/bookings?tab=lab', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(1400);
  const labText = await text();
  const labButtons = await pg.getByRole('button', { name: /download invoice/i }).count();
  rec('NEGATIVE — a lab order never offers an invoice download',
    labButtons === 0, `${labButtons} control(s) on the lab tab`);
  rec('POSITIVE CONTROL — the report-bearing lab order reached the screen',
    /Harness Panel|ORD-FIXTURE-REPORTED/.test(labText), labText.slice(0, 120));
  rec('A lab order with reports says "Reports available", not "Invoice available"',
    /Reports available/.test(labText) && !/Invoice available/.test(labText),
    /Reports available/.test(labText) ? 'reads "Reports available"' : 'label missing or still says Invoice');

  rec('The invoice endpoint was hit exactly once, by the one control that offers it',
    invoiceHits === 1, `${invoiceHits} hit(s)`);
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
