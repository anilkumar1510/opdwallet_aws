/**
 * Support (`/member/helpline`) — claims that need help, and services already used.
 *
 * The Support quick link opened a "Coming Soon" panel with an email address. A
 * member with a rejected claim had to compose the whole story themselves,
 * starting with the reference the desk asks for first.
 *
 * **NON-MUTATING.** No writes; the claims list is intercepted for the populated
 * case because this account has none that qualify.
 *
 * CONTROLS
 *   positive — with REAL data the page loads and lists real past services.
 *   positive — with an intercepted DOCUMENTS_REQUIRED / RESUBMISSION_REQUIRED /
 *              REJECTED claim, each is listed.
 *   negative — **an UNDER_REVIEW / SUBMITTED claim must NOT be listed.** That is
 *              the whole discrimination: those are with the assessor, and telling
 *              a member to chase them is worse than saying nothing. This account
 *              really holds SUBMITTED and ASSIGNED claims, so the control has
 *              teeth even before interception.
 *   negative — the "Ask for help" link carries the claim's own reference, not a
 *              generic address. A mailto with no context is what the page already
 *              had.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };

const login = async (pg) => {
  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });
};
const txt = async (pg) => (await pg.locator('#main, body').first().innerText()).replace(/\s+/g, ' ');

const b = await chromium.launch();
try {
  // ---------------------------------------------------- real data
  {
    const pg = await (await b.newContext()).newPage();
    await login(pg);
    await pg.goto(APP + '/member/helpline', { waitUntil: 'domcontentloaded' });
    await pg.waitForLoadState('networkidle');
    await pg.waitForTimeout(2500);
    const body = await txt(pg);

    rec('POSITIVE CONTROL — the Support screen loads', /Support/.test(body), body.slice(0, 90));
    rec('It no longer presents itself as an unbuilt feature',
      !/^.*Coming Soon/.test(body.slice(0, 400)), 'no "Coming Soon" banner over the page');

    rec('CLAIMS — with nothing stuck, it says so rather than showing an empty box',
      /Nothing needs your attention/i.test(body),
      (body.match(/Nothing needs your attention[^.]*\./) ?? ['missing'])[0].slice(0, 90));

    rec('NEGATIVE CONTROL — this account has SUBMITTED and ASSIGNED claims and NONE are listed',
      !/CLM-/.test(body.slice(0, body.indexOf('Services you have used'))),
      'no claim references in the claims section');

    // The heading became a <summary> inside the disclosure, so the old
    // `section:has(h2:...)` locator matches nothing.
    const services = await pg
      .locator('opd-disclosure')
      .filter({ hasText: 'Services you have used' })
      .locator('li')
      .count();
    rec('SERVICES — real past services are listed', services > 0, `${services} service(s)`);

    // The services list is a DROPDOWN, closed by default so ten rows of history
    // do not push the actionable list off the screen. Assert on VISIBILITY, not
    // on DOM count: a closed <details> keeps its children in the DOM, so
    // counting `li` would report ten rows on a collapsed section.
    const svc = pg.locator('opd-disclosure').filter({ hasText: 'Services you have used' });
    rec('DROPDOWN — services is a collapsible section', (await svc.count()) === 1, `${await svc.count()} section(s)`);
    rec('DROPDOWN — it starts closed',
      !(await svc.locator('li').first().isVisible()), 'rows hidden until opened');
    rec('DROPDOWN — the summary states how many are inside without opening it',
      (await svc.locator('summary').innerText()).includes(String(services)),
      (await svc.locator('summary').innerText()).replace(/\s+/g, ' ').trim());
    await svc.locator('summary').click();
    await pg.waitForTimeout(600);
    rec('DROPDOWN — opening it reveals the rows',
      await svc.locator('li').first().isVisible(), `${await svc.locator('li').count()} rows now visible`);

    const asks = pg.locator('section:has(h2:text-is("Services you have used")) button:text-is("Ask for help"), opd-disclosure button:text-is("Ask for help")');
    rec('SERVICES — every row offers a way to ask for help',
      (await asks.count()) === services, `${await asks.count()} control(s) for ${services} row(s)`);

    // The questions. The form must ASK, not just open a blank email.
    await asks.first().click();
    await pg.waitForTimeout(700);
    const form = pg.locator('opd-support-request').first();
    rec('QUESTIONS — a form opens rather than a blank email',
      (await form.count()) === 1, `${await form.count()} form(s)`);
    const options = await form.locator('input[type=radio]').count();
    rec('QUESTIONS — it asks what kind of problem, with routable options',
      options >= 4, `${options} option(s)`);
    rec('QUESTIONS — it asks what happened',
      (await form.locator('textarea').count()) === 1, 'one detail field');
    const phone = form.locator('input[type=tel]');
    rec('QUESTIONS — it asks where to reach the member, prefilled from the profile',
      (await phone.count()) === 1 && ((await phone.inputValue()) ?? '').length > 0,
      `prefilled "${await phone.inputValue()}"`);

    const send = form.locator('a:text-is("Send to support")');
    rec('NEGATIVE CONTROL — send is blocked until the questions are answered',
      (await send.getAttribute('href')) === null && (await send.getAttribute('aria-disabled')) === 'true',
      'no href while incomplete');
    rec('NEGATIVE CONTROL — and it names WHICH answer is missing',
      /Choose what you need help with/i.test(await txt(pg)), 'names the missing piece');

    await form.locator('input[type=radio]').first().check();
    await form.locator('textarea').fill('The lab never collected the sample and nobody called me.');
    await pg.waitForTimeout(600);
    const href = decodeURIComponent((await send.getAttribute('href')) ?? '');
    rec('QUESTIONS — a completed form composes mail with the answers AND the context',
      /Issue:/.test(href) && /never collected the sample/.test(href) && /Reference:/.test(href) &&
        /Contact:/.test(href),
      href.slice(0, 150));
    await pg.close();
  }

  // ------------------------------------------- forced: claims that need help
  {
    const pg = await (await b.newContext()).newPage();
    const CLAIMS = [
      { _id: 'a1', claimId: 'CLM-FIXTURE-REJECTED', status: 'REJECTED', category: 'CONSULTATION',
        billAmount: 1200, providerName: 'Harness Clinic', patientName: 'Shivam Jha' },
      { _id: 'a2', claimId: 'CLM-FIXTURE-DOCS', status: 'DOCUMENTS_REQUIRED', category: 'PHARMACY',
        billAmount: 800, providerName: 'Harness Pharmacy', patientName: 'Shivam Jha' },
      { _id: 'a3', claimId: 'CLM-FIXTURE-RESUB', status: 'RESUBMISSION_REQUIRED', category: 'LAB',
        billAmount: 500, providerName: 'Harness Lab', patientName: 'Shivam Jha' },
      // Must NOT appear — with the assessor, not the member.
      { _id: 'a4', claimId: 'CLM-FIXTURE-REVIEW', status: 'UNDER_REVIEW', category: 'CONSULTATION',
        billAmount: 900, providerName: 'Harness Clinic', patientName: 'Shivam Jha' },
      { _id: 'a5', claimId: 'CLM-FIXTURE-APPROVED', status: 'APPROVED', category: 'DENTAL',
        billAmount: 700, providerName: 'Harness Dental', patientName: 'Shivam Jha' },
    ];
    // `{ claims: [...] }` — NOT `{ success, data }`. ClaimsStore reads
    // `list.claims` (claims.store.ts:234). This codebase has at least THREE
    // response shapes: a bare array (dental/vision bookings), `{success,data}`
    // (lab) and `{claims}` here, and a wrong-shaped fixture fails as an empty
    // list, which reads exactly like the feature not working.
    const envelope = { status: 200, contentType: 'application/json',
      body: JSON.stringify({ claims: CLAIMS, total: CLAIMS.length }) };
    await pg.route('**/api/member/claims?**', (r) => r.fulfill(envelope));
    await pg.route('**/api/member/claims', (r) => r.fulfill(envelope));

    await login(pg);
    await pg.goto(APP + '/member/helpline', { waitUntil: 'domcontentloaded' });
    await pg.waitForLoadState('networkidle');
    await pg.waitForTimeout(2500);
    const body = await txt(pg);

    // Guard: without this the two negative controls below pass on an empty
    // screen, which is what the first run of this harness did.
    const listed = ['CLM-FIXTURE-REJECTED', 'CLM-FIXTURE-DOCS', 'CLM-FIXTURE-RESUB']
      .filter((ref) => body.includes(ref)).length;
    rec('POSITIVE CONTROL — the fixture reached the screen, so the negatives mean something',
      listed > 0, `${listed} of 3 needing-help fixtures rendered`);

    // The claims dropdown starts OPEN — it is the actionable list and it has
    // something in it. Hiding work the member has to do would be the wrong
    // default, and is the opposite choice from the services list.
    const claimsBox = pg.locator('opd-disclosure').filter({ hasText: 'Claims that need your help' });
    rec('DROPDOWN — claims is a collapsible section too',
      (await claimsBox.count()) === 1, `${await claimsBox.count()} section(s)`);
    rec('DROPDOWN — it starts OPEN, because something needs doing',
      await claimsBox.locator('li').first().isVisible(), 'rows visible without opening');
    rec('DROPDOWN — its summary counts the stuck claims',
      (await claimsBox.locator('summary').innerText()).includes('3'),
      (await claimsBox.locator('summary').innerText()).replace(/\s+/g, ' ').trim());

    for (const ref of ['CLM-FIXTURE-REJECTED', 'CLM-FIXTURE-DOCS', 'CLM-FIXTURE-RESUB']) {
      rec(`CLAIMS — ${ref.replace('CLM-FIXTURE-', '')} is listed as needing help`,
        body.includes(ref), body.includes(ref) ? 'listed' : 'absent');
    }
    rec('NEGATIVE CONTROL — an UNDER_REVIEW claim is NOT listed',
      !body.includes('CLM-FIXTURE-REVIEW'), 'with the assessor, not the member');
    rec('NEGATIVE CONTROL — an APPROVED claim is NOT listed',
      !body.includes('CLM-FIXTURE-APPROVED'), 'nothing to help with');

    // Topics must differ by WHY the claim is stuck.
    // The heading is now a <summary> inside the disclosure, not an <h2>.
    const claimsSection = claimsBox;
    const rejectedRow = claimsSection.locator('li').filter({ hasText: 'CLM-FIXTURE-REJECTED' });
    await rejectedRow.locator('button:text-is("Ask for help")').click();
    await pg.waitForTimeout(700);
    const rejectedOpts = await rejectedRow.locator('opd-support-request label').allInnerTexts();
    rec('QUESTIONS — a REJECTED claim is asked about the decision',
      rejectedOpts.some((o) => /rejected|decision/i.test(o)), rejectedOpts.join(' | ').slice(0, 110));

    const docsRow = claimsSection.locator('li').filter({ hasText: 'CLM-FIXTURE-DOCS' });
    await docsRow.locator('button:text-is("Ask for help")').click();
    await pg.waitForTimeout(700);
    const docsOpts = await docsRow.locator('opd-support-request label').allInnerTexts();
    rec('QUESTIONS — a DOCUMENTS_REQUIRED claim is asked about documents instead',
      docsOpts.some((o) => /documents/i.test(o)) && !docsOpts.some((o) => /rejected/i.test(o)),
      docsOpts.join(' | ').slice(0, 110));
    rec('NEGATIVE CONTROL — only one form is open at a time',
      (await pg.locator('opd-support-request').count()) === 1, 'the previous form closed');

    await docsRow.locator('input[type=radio]').first().check();
    await docsRow.locator('textarea').fill('I uploaded the bill twice and it still says documents required.');
    await pg.waitForTimeout(500);
    const decoded = decodeURIComponent(
      (await docsRow.locator('a:text-is("Send to support")').getAttribute('href')) ?? '',
    );
    rec('CLAIMS — the mail carries the reference, the status and the answers',
      /CLM-FIXTURE-DOCS/.test(decoded) && /Status:/.test(decoded) && /Issue:/.test(decoded) &&
        /uploaded the bill twice/.test(decoded),
      decoded.slice(0, 150));
    rec('CLAIMS — each row also links to the claim itself',
      (await claimsSection.locator('a:text-is("View claim")').count()) === 3,
      'three View claim links');
    await pg.close();
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
