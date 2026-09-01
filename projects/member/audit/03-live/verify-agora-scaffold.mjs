/**
 * The Agora consultation room — scaffold behaviour.
 *
 * **NON-MUTATING against the API.** `POST video-consultations/join` is a write
 * (it stamps `patientJoinedAt`), so every run here INTERCEPTS it. Nothing
 * reaches the server.
 *
 * What this proves, and what it cannot:
 *   - it CAN prove the screen tells the truth about why a call will not connect,
 *     that the join path is wired, and that a bad token surfaces as an error
 *   - it CANNOT prove a call connects. That needs an Agora app id, a token
 *     signed with the App Certificate, and a doctor on the other end — none of
 *     which exist. See audit/41-agora-scaffold.md.
 *
 * CONTROLS
 *   positive — with the API's REAL response shape (Daily room, no Agora fields)
 *              the screen names the missing token and offers the Daily room.
 *   negative — and it offers NO "Join call" control in that state. A join button
 *              over a connection that cannot be made is the exact failure this
 *              scaffold exists to avoid.
 *   positive — with Agora fields present, the join control appears.
 *   negative — a bogus token fails LOUDLY: an error is shown, not a spinner.
 */
import { chromium } from 'playwright';

const APP = 'http://localhost:4200';
const APPOINTMENT = '6a3923a6f850e643fc79296b';
const R = [];
const rec = (n, p, note) => { R.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}\n        ${note}`); };

const DAILY_ONLY = {
  consultationId: 'VC-FIXTURE-1',
  roomName: 'opd-fixture-room',
  roomUrl: 'https://example.daily.co/opd-fixture-room',
  doctorName: 'Dr Ramkrishan',
  patientName: 'Shivam Jha',
  status: 'IN_PROGRESS',
};
const WITH_AGORA = {
  ...DAILY_ONLY,
  agora: { appId: '00000000000000000000000000000000', channel: 'opd-fixture', token: 'bogus-token', uid: 42 },
};

const open = async (b, body) => {
  const ctx = await b.newContext({ permissions: ['camera', 'microphone'] });
  const pg = await ctx.newPage();
  let joinCalls = 0;
  await pg.route('**/api/video-consultations/join', (r) => {
    joinCalls++;
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await pg.goto(APP + '/login', { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.getByLabel(/email/i).fill('shivam@gmail.com');
  await pg.getByLabel(/password/i).fill('12345678');
  await pg.getByRole('button', { name: /sign in/i }).click();
  await pg.waitForURL('**/member**', { timeout: 20000 });
  await pg.goto(`${APP}/member/consultations/${APPOINTMENT}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(2500);
  return { pg, calls: () => joinCalls };
};
const txt = async (pg) => (await pg.locator('#main, body').first().innerText()).replace(/\s+/g, ' ');

const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
try {
  // ---- The response the API actually sends today
  {
    const { pg, calls } = await open(b, DAILY_ONLY);
    const body = await txt(pg);

    rec('POSITIVE CONTROL — the room screen loads and names the consultation',
      /Video consultation/.test(body) && /Dr Ramkrishan/.test(body), body.slice(0, 110));
    rec('The join endpoint is called exactly once for the appointment',
      calls() === 1, `${calls()} call(s)`);

    // With nothing configured the FIRST missing piece is the app id, not the
    // token — readiness reports them in the order the member would hit them.
    // The first version of this assertion expected the token message and failed
    // against correct code.
    rec('UNREADY — it names the FIRST missing piece: no app id in this build',
      /no Agora app id is set/i.test(body),
      (body.match(/Video calling is not configured[^.]*\./) ?? ['missing'])[0].slice(0, 120));

    rec('NEGATIVE CONTROL — it offers NO join control it cannot honour',
      (await pg.getByRole('button', { name: /join call/i }).count()) === 0, 'no Join call button');

    const fallback = pg.getByRole('link', { name: /open the consultation room/i });
    rec('UNREADY — the member is not stranded: the Daily room is offered',
      (await fallback.count()) === 1 &&
        (await fallback.getAttribute('href')) === DAILY_ONLY.roomUrl,
      (await fallback.getAttribute('href')) ?? 'no fallback link');
    await pg.close();
  }

  // ---- App id and channel present, token absent: the server-side gap
  {
    const { pg } = await open(b, {
      ...DAILY_ONLY,
      agora: { appId: '00000000000000000000000000000000', channel: 'opd-fixture' },
    });
    const body = await txt(pg);
    rec('UNREADY — with an app id and channel but no token, it names the TOKEN',
      /no Agora token/i.test(body) && /App Certificate/i.test(body),
      (body.match(/This consultation has no Agora token[^.]*\./) ?? ['missing'])[0].slice(0, 130));
    rec('NEGATIVE CONTROL — still no join control without a token',
      (await pg.getByRole('button', { name: /join call/i }).count()) === 0, 'no Join call button');
    await pg.close();
  }

  // ---- What it does once the API can supply Agora fields
  {
    const { pg } = await open(b, WITH_AGORA);
    const body = await txt(pg);

    rec('READY — with app id, channel and token the join control appears',
      (await pg.getByRole('button', { name: /join call/i }).count()) === 1, 'Join call offered');
    rec('READY — and the unready notice is gone',
      !/not ready yet/i.test(body), 'no warning panel');

    // A bogus token cannot connect. What matters is that it says so.
    await pg.getByRole('button', { name: /join call/i }).click();
    await pg.waitForTimeout(9000);
    const after = await txt(pg);
    const failedLoudly = /could not|invalid|expired|token|error|failed/i.test(
      after.slice(after.indexOf('Join call') >= 0 ? 0 : 0),
    );
    rec('NEGATIVE CONTROL — a bogus token fails LOUDLY rather than hanging',
      failedLoudly && !/Waiting for the doctor/i.test(after),
      after.match(/[A-Z][^.]{0,120}(token|invalid|failed|could not)[^.]{0,60}/i)?.[0] ?? after.slice(-140));
    await pg.close();
  }
} finally {
  await b.close();
}
console.log(`\npass ${R.filter(Boolean).length}/${R.length}`);
