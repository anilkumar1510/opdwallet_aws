/**
 * Extended criterion 6: a terminal state is not terminal while money is owed.
 *
 * A harness that books something takes a snapshot before the flow and asks
 * afterwards which PENDING payments are new. One the journey NAVIGATED the
 * member to is the flow working; one left behind on a screen that says the
 * booking is complete is `audit/20-copay-continuation.md`.
 *
 * Reads only. The driver comes from the API's own node_modules — nothing new is
 * installed, and a TLS-intercepting proxy on this machine means nothing can be.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MongoClient } = require('../../../../../api/node_modules/mongodb/lib/index.js');

const URI = 'mongodb://localhost:27017';
const DB = 'opd_wallet';

async function withDb(fn) {
  const client = await new MongoClient(URI).connect();
  try {
    return await fn(client.db(DB));
  } finally {
    await client.close();
  }
}

const rows = (db) =>
  db.collection('payments').find({ status: 'PENDING' }).project({ paymentId: 1, serviceType: 1, amount: 1, serviceReferenceId: 1 }).toArray();

/** Every PENDING payment reference that exists right now. */
export async function pendingSnapshot() {
  return withDb(async (db) => new Set((await rows(db)).map((r) => r.paymentId)));
}

/** PENDING payments that did not exist when the snapshot was taken. */
export async function pendingSince(before) {
  return withDb(async (db) => (await rows(db)).filter((r) => !before.has(r.paymentId)));
}

/**
 * Both controls for the criterion itself, so a harness proves the query works
 * before trusting what it says about the flow.
 *
 * POSITIVE — `PAY-20260808-0188` must be found at all. It is a real obligation
 * session 31 reached and paid through the transaction detail, so a query that
 * misses it is not looking at the right collection.
 *
 * NEGATIVE — a reference that cannot exist must not be found, which is what
 * stops "no new pending payments" being an artifact of a query that finds
 * nothing at all.
 */
export async function controls() {
  return withDb(async (db) => {
    const all = await db.collection('payments').find({}).project({ paymentId: 1 }).toArray();
    const ids = new Set(all.map((r) => r.paymentId));
    return {
      positive: ids.has('PAY-20260808-0188'),
      negative: !ids.has('PAY-00000000-0000'),
      total: ids.size,
    };
  });
}

/** Formats new rows for a harness note. */
export const describe = (list) =>
  list.length
    ? list.map((r) => `${r.paymentId} ${r.serviceType} ₹${r.amount} -> ${r.serviceReferenceId}`).join('; ')
    : 'none';
