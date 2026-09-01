/**
 * The desktop home layout, rebuilt to the design the member supplied.
 *
 * **NON-MUTATING.** Two page loads, no clicks that write.
 *
 * What changed: Quick Actions moved out of the sidebar into a full-width row of
 * pills; the wallet balance moved INTO the sidebar as the blue illustrated card;
 * Health Benefits went from four columns to two; More Services became a
 * full-width row of pills below both columns.
 *
 * CONTROLS
 *   positive — every section is present and populated with real data.
 *   negative — **mobile is unchanged.** The whole change is `lg:` styling, and
 *              the phone layout was already signed off. A desktop rework that
 *              silently alters the phone is the most likely way this breaks, and
 *              nothing else here would catch it.
 *   negative — the six Quick Action pills sit on ONE row. They wrapped to two on
 *              the first attempt, and a count-only assertion passes either way.
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
  await pg.waitForTimeout(2800);
};
/**
 * Quick Actions and More Services are each rendered TWICE — a desktop instance
 * and a mobile one, shown or hidden by CSS, the pattern the shell already uses.
 * Every locator here must therefore be `:visible`, or it picks up the hidden
 * copy and gets a null bounding box.
 */
/** Left edge and top of a box, for asserting arrangement rather than existence. */
const box = async (loc) => (await loc.first().boundingBox()) ?? { x: -1, y: -1, width: 0 };

const b = await chromium.launch();
try {
  // ------------------------------------------------------------- desktop
  {
    const pg = await (await b.newContext({ viewport: { width: 1600, height: 1200 } })).newPage();
    await login(pg);

    rec('POSITIVE CONTROL — the home screen is populated with real data',
      /Shivam Jha/.test(await pg.locator('#main').innerText()), 'greeting and policy present');

    const pills = pg.locator('opd-quick-links a:visible');
    const count = await pills.count();
    rec('QUICK ACTIONS — all six are shown', count === 6, `${count} visible pill(s)`);

    const tops = [];
    for (let i = 0; i < count; i++) tops.push(Math.round((await pills.nth(i).boundingBox()).y));
    rec('NEGATIVE CONTROL — they sit on ONE row, not wrapped onto two',
      new Set(tops).size === 1, `distinct row positions: ${[...new Set(tops)].join(', ')}`);

    const labels = await pills.allInnerTexts();
    rec('QUICK ACTIONS — no label is truncated',
      !labels.some((l) => l.includes('…')), labels.map((l) => l.trim()).join(' · '));

    // Arrangement: balance under the policy in the LEFT column; benefits right.
    const policy = await box(pg.locator('opd-policy-card:visible'));
    const balance = await box(pg.locator('opd-wallet-balance-card a:visible'));
    const benefits = await box(pg.locator('opd-benefit-card:visible'));
    rec('LAYOUT — the balance sits in the left column, below the policy',
      Math.abs(balance.x - policy.x) < 24 && balance.y > policy.y,
      `policy x=${Math.round(policy.x)} y=${Math.round(policy.y)}, balance x=${Math.round(balance.x)} y=${Math.round(balance.y)}`);
    rec('LAYOUT — health benefits are to the RIGHT of the policy column',
      benefits.x > policy.x + policy.width, `benefits start at x=${Math.round(benefits.x)}`);

    const cardTops = [];
    const cards = pg.locator('opd-benefit-card:visible');
    for (let i = 0; i < (await cards.count()); i++) {
      cardTops.push(Math.round((await cards.nth(i).boundingBox()).y));
    }
    const perRow = cardTops.filter((t) => t === cardTops[0]).length;
    rec('LAYOUT — health benefits are two per row', perRow === 2, `${perRow} card(s) on the first row`);

    // Exact card size, to the supplied measurement. They were 418 wide before,
    // because fractional grid columns stretch the card to fill the column.
    const sizes = await pg.evaluate(() =>
      [...document.querySelectorAll('opd-benefit-card a')]
        .filter((e) => e.offsetParent)
        .map((e) => {
          const r = e.getBoundingClientRect();
          return `${Math.round(r.width * 10) / 10}x${Math.round(r.height * 10) / 10}`;
        }),
    );
    const distinct = [...new Set(sizes)];
    rec('CARD SIZE — every benefit card is exactly 305.5 x 99',
      distinct.length === 1 && distinct[0] === '305.5x99', `${sizes.length} cards: ${distinct.join(', ')}`);

    const card = await pg.evaluate(() => {
      const cards = [...document.querySelectorAll('opd-benefit-card a')].filter((e) => e.offsetParent);
      const discs = cards.map((c) => {
        const cr = c.getBoundingClientRect();
        const d = c.querySelector('span.rounded-full').getBoundingClientRect();
        const h3 = c.querySelector('h3').getBoundingClientRect();
        return {
          gap: Math.round(cr.right - d.right),
          bottom: Math.round(cr.bottom - d.bottom),
          w: Math.round(d.width),
          titleOverlap: Math.round(h3.bottom - d.top),
        };
      });
      const cs = getComputedStyle(cards[0]);
      return {
        radius: cs.borderRadius,
        border: cs.borderTopWidth,
        gaps: [...new Set(discs.map((d) => d.gap))],
        bottoms: [...new Set(discs.map((d) => d.bottom))],
        discW: [...new Set(discs.map((d) => d.w))],
        svgs: [...new Set(cards.map((c) => c.querySelectorAll('svg').length))],
        worstTitleOverlap: Math.max(...discs.map((d) => d.titleOverlap)),
      };
    });
    rec('CARD STYLE — 22px radius and no border, as in the design',
      card.radius === '22px' && card.border === '0px', `radius ${card.radius}, border ${card.border}`);
    rec('CARD STYLE — the chevron disc is 40px',
      card.discW.length === 1 && card.discW[0] === 40, `disc widths: ${card.discW.join(', ')}`);
    // It used to be `ml-[136px]` from the amount, so the disc moved with the
    // width of the figure and the eight never lined up.
    rec('CARD STYLE — every disc sits the same distance from the card edge',
      card.gaps.length === 1, `right gaps: ${card.gaps.join(', ')}`);
    // In the flow the disc centred on the amount's line and, being taller than
    // it, hung past the padding box: 22 from the right but 7 from the bottom.
    rec('CARD STYLE — the disc is the SAME distance from the bottom as from the right',
      card.gaps.length === 1 && card.bottoms.length === 1 && card.gaps[0] === card.bottoms[0],
      `right ${card.gaps.join('/')} vs bottom ${card.bottoms.join('/')}`);
    rec('CARD STYLE — pinning the disc did not push it under the title',
      card.worstTitleOverlap <= 0, `worst title/disc overlap ${card.worstTitleOverlap}px`);
    rec('CARD STYLE — one chevron per card, not two',
      card.svgs.length === 1 && card.svgs[0] === 1, `svg counts: ${card.svgs.join(', ')}`);

    const services = await box(pg.locator('opd-more-services a:visible'));
    rec('LAYOUT — More Services runs full width below both columns',
      services.y > benefits.y && Math.abs(services.x - policy.x) < 24,
      `services x=${Math.round(services.x)} y=${Math.round(services.y)}`);

    // The balance card was rebuilt to a supplied design: taller, bigger figure,
    // illustration anchored to the bottom-right corner.
    const cardBox = await box(pg.locator('opd-wallet-balance-card a:visible'));
    const cardRadius = await pg
      .locator('opd-wallet-balance-card a:visible')
      .evaluate((e) => getComputedStyle(e).borderRadius);
    rec('CARD — the balance card is exactly 411 x 235 with a 20px radius, to spec',
      Math.round(cardBox.width) === 411 && Math.round(cardBox.height) === 235 && cardRadius === '20px',
      `${Math.round(cardBox.width)}x${Math.round(cardBox.height)}, radius ${cardRadius}`);

    const art = await pg.evaluate(() => {
      const img = [...document.querySelectorAll('img[src*="wallet-illustration"]')].find((i) => i.offsetParent);
      if (!img) return null;
      const card = img.closest('a').getBoundingClientRect();
      const r = img.getBoundingClientRect();
      return {
        w: Math.round(r.width),
        rightGap: Math.round(card.right - r.right),
        bottomGap: Math.round(card.bottom - r.bottom),
      };
    });
    rec('CARD — the illustration is large and anchored to the bottom-right corner',
      art && art.w > 160 && art.rightGap < 8 && art.bottomGap < 8, JSON.stringify(art));

    const overlap = await pg.evaluate(() => {
      const p = [...document.querySelectorAll('opd-wallet-balance-card p')].find((n) => n.offsetParent);
      const img = [...document.querySelectorAll('img[src*="wallet-illustration"]')].find((i) => i.offsetParent);
      if (!p || !img) return null;
      return Math.round(p.getBoundingClientRect().right - img.getBoundingClientRect().left);
    });
    rec('CARD — the caption does not run under the illustration',
      overlap !== null && overlap <= 0, `caption overruns illustration by ${overlap}px`);

    rec('LAYOUT — the blue balance card is the desktop surface, not the white one',
      (await pg.locator('opd-wallet-balance-card a:visible').count()) === 1 &&
        (await pg.locator('opd-wallet-balance-card a:visible').getAttribute('style') ?? '').includes('linear-gradient'),
      'one visible balance surface, gradient');
    await pg.close();
  }

  // --------------------------------------------------------- desktop header
  {
    const pg = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
    await login(pg);

    // The header lives in the SHELL now, not in the page: putting the tabs on
    // the home page left every other desktop screen with no navigation at all.
    // So these assertions look at the document, not at #main.
    rec('HEADER — the greeting is shown on desktop, not only on the phone',
      /Hi Shivam!/.test(await pg.locator('body').innerText()), 'greeting present at 1600px');
    rec('HEADER — exactly one greeting is visible, not both the page and the shell copy',
      (await pg.locator('opd-profile-menu:visible').count()) === 1, 'one profile menu');

    // It was styled white-on-blue for the phone hero. On a light page that is
    // invisible, and nothing but a colour check catches it.
    // The greeting text node, found by content rather than by structure.
    const colour = await pg.evaluate(() => {
      const el = [...document.querySelectorAll('opd-profile-menu span')].find(
        (n) => n.textContent.trim().startsWith('Hi ') && n.children.length <= 2,
      );
      return el ? getComputedStyle(el).color : 'not found';
    });
    rec('HEADER — the greeting is legible on the light background, not white-on-white',
      colour !== 'rgb(255, 255, 255)', `computed colour ${colour}`);

    const tabs = pg.locator('nav[aria-label="Main"]:visible a');
    const labels = (await tabs.allInnerTexts()).map((t) => t.trim());
    rec('HEADER — the four destinations are underline tabs',
      labels.join(',') === 'Home,Claims,Bookings,Wallet', labels.join(' · '));

    const tabTops = [];
    for (let i = 0; i < (await tabs.count()); i++) {
      tabTops.push(Math.round((await tabs.nth(i).boundingBox()).y));
    }
    rec('HEADER — the tabs sit on one row', new Set(tabTops).size === 1, `${tabTops.length} tabs`);

    // Precisely: ONE visible main navigation. The first version of this control
    // counted links named "Bookings" and failed on correct code, because
    // "Bookings" is also a Quick Action pill. Counting a label is not counting a
    // navigation.
    const navs = await pg.locator('nav[aria-label="Main"]:visible').count();
    rec('NEGATIVE CONTROL — exactly one main navigation is visible, not tabs AND navy pills',
      navs === 1, `${navs} visible main nav(s)`);

    const icons = pg.locator('a[aria-label^="Notifications"]:visible, a[aria-label="Wallet"]:visible, a[aria-label^="Cart"]:visible');
    // Typography: the greeting must match the page's section headings, and the
    // tabs must match the app's body weight. Measured, because "looks the same"
    // is exactly the claim that goes stale silently.
    const type = await pg.evaluate(() => {
      const pick = (el) => {
        if (!el) return null;
        const c = getComputedStyle(el);
        return { family: c.fontFamily.split(',')[0].trim(), size: c.fontSize, weight: c.fontWeight, color: c.color };
      };
      // The greeting is the span whose FIRST child is the "Hi …" text node.
      const greet = [...document.querySelectorAll('opd-profile-menu span')].find(
        (n) => n.firstChild && n.firstChild.nodeType === 3 && n.firstChild.textContent.trim().startsWith('Hi '),
      );
      return {
        greeting: pick(greet),
        heading: pick(document.querySelector('h2')),
        tab: pick(document.querySelector('nav[aria-label="Main"] a')),
      };
    });
    rec('TYPOGRAPHY — the greeting matches the section headings in size and weight',
      type.greeting && type.heading &&
        type.greeting.size === type.heading.size &&
        type.greeting.weight === type.heading.weight &&
        type.greeting.family === type.heading.family,
      `greeting ${JSON.stringify(type.greeting)} vs heading ${JSON.stringify(type.heading)}`);
    rec('TYPOGRAPHY — the tabs share the app font family and medium weight',
      type.tab && type.tab.family === type.heading.family && type.tab.weight === '500',
      JSON.stringify(type.tab));

    // Every section heading on the page must be on one scale. "Your Wallet
    // Balance" was text-xl/bold/black and "Your Policies" was 18px while the rest
    // were 20px/500/#1c1c1c — both invisible to any per-heading assertion, and
    // both found only by measuring them together.
    const headings = await pg.evaluate(() =>
      [...document.querySelectorAll('h2')]
        .filter((h) => h.offsetParent)
        .map((h) => {
          const c = getComputedStyle(h);
          return { text: h.textContent.trim(), spec: `${c.fontSize}/${c.fontWeight}/${c.color}` };
        }),
    );
    const specs = [...new Set(headings.map((h) => h.spec))];
    rec('TYPOGRAPHY — every visible section heading shares one size, weight and colour',
      specs.length === 1 && headings.length >= 4,
      headings.map((h) => `${h.text}: ${h.spec}`).join(' | '));

    rec('HEADER — bell, wallet and cart are present',
      (await icons.count()) === 3, `${await icons.count()} icon button(s)`);

    rec('NEGATIVE CONTROL — no brand bar remains above the greeting',
      (await pg.locator('img[alt="Habit Health"]:visible').count()) === 0,
      'the logo strip was removed on request');

    // THE REGRESSION THIS SESSION ACTUALLY CAUSED: with the tabs on the home
    // page and the navy bar gone, /member/claims had NO desktop navigation.
    for (const route of ['/member/claims', '/member/bookings', '/member/wallet']) {
      await pg.goto(APP + route, { waitUntil: 'domcontentloaded' });
      await pg.waitForLoadState('networkidle');
      await pg.waitForTimeout(1400);
      const navs = await pg.locator('nav[aria-label="Main"]:visible').count();
      const active = (await pg.locator('nav[aria-label="Main"]:visible a[aria-current=page]').allInnerTexts()).join();
      rec(`NAVIGATION — ${route} still has the tabs, with the right one marked`,
        navs === 1 && active.length > 0, `${navs} nav(s), active: ${active || 'none'}`);
    }
    await pg.close();
  }

  // -------------------------------------------------------------- mobile
  {
    const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await login(pg);
    const body = await pg.locator('#main').innerText();

    rec('NEGATIVE CONTROL — mobile still shows every section',
      /Quick Actions/.test(body) && /Health Benefits/.test(body) && /More Services/.test(body) &&
        /Your Policies/.test(body),
      'all four sections present at 390px');

    const pills = pg.locator('opd-quick-links a:visible');
    const tops = [];
    for (let i = 0; i < (await pills.count()); i++) {
      tops.push(Math.round((await pills.nth(i).boundingBox()).y));
    }
    rec('NEGATIVE CONTROL — mobile Quick Actions is still ONE scrolling row',
      new Set(tops).size === 1, `${await pills.count()} pills on ${new Set(tops).size} row(s)`);

    const cards = pg.locator('opd-benefit-card:visible');
    const cardTops = [];
    for (let i = 0; i < (await cards.count()); i++) {
      cardTops.push(Math.round((await cards.nth(i).boundingBox()).y));
    }
    rec('NEGATIVE CONTROL — mobile benefits are still two per row',
      cardTops.filter((t) => t === cardTops[0]).length === 2, 'unchanged from before the rework');

    const msizes = await pg.evaluate(() =>
      [...document.querySelectorAll('opd-benefit-card a')]
        .filter((e) => e.offsetParent)
        .map((e) => Math.round(e.getBoundingClientRect().width)),
    );
    const mstyle = await pg.evaluate(() => {
      const c = [...document.querySelectorAll('opd-benefit-card a')].filter((e) => e.offsetParent)[0];
      const cs = getComputedStyle(c);
      return { radius: cs.borderRadius, border: cs.borderTopWidth,
               disc: Math.round(c.querySelector('span.rounded-full').getBoundingClientRect().width) };
    });
    rec('NEGATIVE CONTROL — the phone card keeps its own radius, border and disc',
      mstyle.radius === '16px' && mstyle.border !== '0px' && mstyle.disc === 24,
      JSON.stringify(mstyle));

    rec('NEGATIVE CONTROL — the phone benefit cards are NOT forced to the desktop size',
      msizes.length > 0 && msizes.every((w) => w < 300), `phone card widths: ${[...new Set(msizes)].join(', ')}`);

    const mcard = await box(pg.locator('opd-wallet-balance-card a:visible'));
    rec('NEGATIVE CONTROL — the phone balance card is untouched by the desktop rebuild',
      (await pg.locator('opd-wallet-balance-card a:visible').count()) === 1 && mcard.height < 120,
      `one visible surface, ${Math.round(mcard.height)}px tall`);
    await pg.close();
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
