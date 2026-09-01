#!/usr/bin/env node
/**
 * Flags DTO fields that appear in no captured response.
 *
 *   node tools/capture-fixtures.mjs && node tools/dto-drift.mjs
 *
 * The failure this catches: a mapper reads a field that does not exist, gets
 * undefined, and the screen renders an empty list or a zero. Nothing throws,
 * nothing logs, and the empty state reads as a legitimate answer. Four real
 * bugs shipped that way — `isAvailable` and `availableCapacity` on lab slots,
 * `walletAmount` on validate-booking, and a whole slot-template model that the
 * API never returned.
 *
 * A flagged field is a suspicion, not a verdict: it may belong to a state no
 * fixture covers (an error body, an empty-cart branch). Verify, then either fix
 * the DTO or add it to KNOWN below with the reason.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CORE = join(ROOT, 'projects', 'member', 'src', 'app', 'core');
const FIXTURES = join(ROOT, 'projects', 'member', 'src', 'testing', 'fixtures');

/** Fields that legitimately never appear in a captured 2xx body. */
const KNOWN = new Map([
  ['error', 'only present when success is false'],
  ['success', 'absent on routes that answer at the top level'],
  ['message', 'error bodies and some envelopes'],
  ['valid', 'the lab/clinic spelling; appointments uses isAllowed'],
  ['isAllowed', 'the appointments spelling; others use valid'],
  ['refreshToken', 'login only'],
  ['expiresIn', 'login only'],
  ['mustChangePassword', 'login only'],
  ['token', 'login only'],
  ['fullName', 'flat-name endpoints; nested name elsewhere'],
  ['phoneNumber', 'alternate spelling of phone'],
  ['dateOfBirth', 'alternate spelling of dob'],
  ['orderId', 'returned when an order is created'],
  ['isRefund', 'refund payments only'],
  ['isBooked', 'removed — kept only to spot regressions'],
  // Nested keys inside arrays that are empty for the seeded members. Verified
  // present in the reference's own interfaces; re-check if that data lands.
  ['changedAt', 'claim timeline is empty for every seeded claim'],
  ['changedBy', 'claim timeline is empty for every seeded claim'],
  ['changedByRole', 'claim timeline is empty for every seeded claim'],
  ['timestamp', 'no TPA notes on any seeded claim'],
  ['collectionDate', 'no lab order has a collection slot yet'],
  ['collectionTime', 'no lab order has a collection slot yet'],
  ['price', 'no AHC vendors are configured'],
  ['totalPrice', 'no AHC vendors are configured'],
  ['nextEligibleDate', 'only sent when the member is NOT eligible'],
  ['insufficientBalance', 'breakdown is null when valid is false; seen when true'],
  ['addressLine2', 'the one seeded address has no second line'],
  ['memberConsumption', 'floater wallets only; this plan is INDIVIDUAL'],
  ['viewingUserId', 'echoed only when the userId param is sent'],
  ['processedAt', 'wallet ledger falls back to createdAt'],
  ['company', 'alternate spelling of companyName on older policies'],
  ['companyName', 'absent on the seeded policy; corporate falls back'],
  ['id', 'login response only, which is not captured'],
]);

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

/** Every key appearing anywhere in the captured bodies. */
const seen = new Set();
const collect = (value) => {
  if (Array.isArray(value)) return value.forEach(collect);
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      seen.add(key);
      collect(nested);
    }
  }
};

let fixtureCount = 0;
walk(FIXTURES, (file) => {
  if (!file.endsWith('.json')) return;
  fixtureCount++;
  collect(JSON.parse(readFileSync(file, 'utf8')).body);
});

/** Every field declared on a *Dto interface, with where it came from. */
const declared = new Map();
walk(CORE, (file) => {
  if (!file.endsWith('.ts') || file.endsWith('.check.ts')) return;
  const source = readFileSync(file, 'utf8');
  const where = file.slice(CORE.length + 1).split(sep).join('/');

  for (const match of source.matchAll(/export interface (\w*Dto)\s*\{([\s\S]*?)\n\}/g)) {
    const [, name, body] = match;
    for (const field of body.matchAll(/^\s{2,}(\w+)\??:/gm)) {
      const key = field[1];
      if (!declared.has(key)) declared.set(key, []);
      declared.get(key).push(`${where} ${name}`);
    }
  }
});

const missing = [...declared.entries()]
  .filter(([field]) => !seen.has(field) && !KNOWN.has(field))
  .sort();

console.log(
  `\n${fixtureCount} fixtures, ${seen.size} distinct response keys, ` +
    `${declared.size} declared DTO fields\n`,
);

if (missing.length) {
  console.log(`Declared in a DTO but present in NO captured response — ${missing.length}:`);
  for (const [field, sources] of missing) {
    console.log(`  ${field}`);
    for (const source of [...new Set(sources)]) console.log(`      ${source}`);
  }
} else {
  console.log('Every declared DTO field appears in at least one captured response.');
}

process.exitCode = missing.length ? 1 : 0;
