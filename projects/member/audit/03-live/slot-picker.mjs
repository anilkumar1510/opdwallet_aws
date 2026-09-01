// Slot-aware selection for harnesses that book real appointments.
//
// Every run consumes a slot, so a fixed position (first, last) is taken by the
// next run — three 400s in session 25 were exactly this. The fix is selection
// strategy: try candidates until one is not already booked.
//
// NOTE: this cannot rescue ONLINE/NOW. Its slot id is deterministic per doctor
// per day by the reference's own formula, so a same-day rerun collides with its
// own earlier booking. That is a property of the flow, not of the harness, and
// changing the formula to suit the tooling would be diverging from the reference.

// The API says this three different ways. A collision detector that knows only
// one of them silently reports "refused for another reason" and stops retrying —
// which is how dental looked like a defect for one run.
export const ALREADY_BOOKED = /already been booked|fully booked|no longer available/i;

/**
 * Clicks candidates one at a time, submitting after each, until the submit is
 * accepted. Returns { ok, attempts, lastStatus }.
 *
 * @param page          Playwright page
 * @param candidates    locator resolving to the choosable slots
 * @param submit        () => Promise<void> — performs the commit
 * @param accepted      () => Promise<boolean> — true when the commit succeeded
 */
export async function bookFirstFreeSlot(page, candidates, submit, accepted, max = 8) {
  const total = await candidates.count();
  if (!total) return { ok: false, attempts: 0, reason: 'no slots offered' };

  for (let i = 0; i < Math.min(total, max); i++) {
    await candidates.nth(i).click().catch(() => {});
    await page.waitForTimeout(400);
    await submit();
    await page.waitForTimeout(3500);
    if (await accepted()) return { ok: true, attempts: i + 1 };

    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    if (!ALREADY_BOOKED.test(body)) {
      return { ok: false, attempts: i + 1, reason: `refused for another reason: ${body.slice(0, 120)}` };
    }
    // collision — stay on the screen and try the next candidate
  }
  return { ok: false, attempts: Math.min(total, max), reason: 'every candidate tried was already booked' };
}
