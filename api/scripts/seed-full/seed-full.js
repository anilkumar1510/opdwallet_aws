/**
 * Full Database Seed Script
 * =========================
 *
 * Restores a COMPLETE snapshot of the opd_wallet database (all portals' data,
 * including the shivam@gmail.com member) from the Extended-JSON files in ./data.
 *
 * Each file in ./data/<collection>.json is a JSON array of documents exported
 * with `mongoexport --jsonArray`, so it preserves types via Extended JSON
 * ($oid, $date, $numberLong, etc.). We parse it back with the BSON EJSON codec
 * so ObjectIds and Dates are restored exactly as they were.
 *
 * Usage:
 *   node seed-full.js                 # seed into default local DB (drops matching collections first)
 *   MONGODB_URI=... node seed-full.js # seed into a specific DB
 *   node seed-full.js --keep          # insert WITHOUT dropping existing collections
 *   node seed-full.js --drop-all      # drop EVERY existing collection first (clean slate), then seed
 *
 * Default URI: mongodb://localhost:27017/opd_wallet   (matches api/.env local, no auth)
 *
 * Safe to re-run: by default each seeded collection is dropped and recreated,
 * so running twice yields the same result (idempotent per collection).
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet';
const DATA_DIR = path.join(__dirname, 'data');

const args = process.argv.slice(2);
const KEEP = args.includes('--keep'); // do not drop the collection before inserting
const DROP_ALL = args.includes('--drop-all'); // drop every collection in the DB first

async function main() {
  console.log('🚀 Full DB seed starting');
  console.log(`   Target: ${MONGODB_URI.replace(/:[^:@/]*@/, ':****@')}`);
  console.log(`   Data dir: ${DATA_DIR}`);
  console.log(
    `   Mode: ${DROP_ALL ? 'drop-all + seed' : KEEP ? 'insert (keep existing)' : 'drop-per-collection + seed'}\n`,
  );

  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Data directory not found: ${DATA_DIR}`);
  }
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    throw new Error(`No .json data files found in ${DATA_DIR}`);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  console.log(`📡 Connected to "${db.databaseName}"\n`);

  if (DROP_ALL) {
    const existing = await db.listCollections().toArray();
    for (const c of existing) {
      if (c.name.startsWith('system.')) continue;
      await db.dropCollection(c.name).catch(() => {});
    }
    console.log(`🗑️  Dropped ${existing.length} existing collections\n`);
  }

  let totalDocs = 0;
  let totalColls = 0;
  const summary = [];

  for (const file of files) {
    const collName = path.basename(file, '.json');
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');

    let docs;
    try {
      docs = EJSON.parse(raw, { relaxed: false });
    } catch (e) {
      // mongoexport --jsonArray emits relaxed EJSON; fall back to relaxed parse
      docs = EJSON.parse(raw, { relaxed: true });
    }
    if (!Array.isArray(docs)) docs = [docs];

    const coll = db.collection(collName);
    if (!KEEP && !DROP_ALL) {
      await coll.drop().catch(() => {}); // ignore "ns not found"
    }

    if (docs.length > 0) {
      // ordered:false so one bad/duplicate doc doesn't abort the whole collection
      await coll.insertMany(docs, { ordered: false });
    }

    totalDocs += docs.length;
    totalColls += 1;
    summary.push(`${collName} (${docs.length})`);
    console.log(`   ✓ ${collName.padEnd(34)} ${docs.length} docs`);
  }

  console.log(
    `\n✅ Done: ${totalDocs} documents across ${totalColls} collections`,
  );

  // Sanity check: confirm the requested user is present
  try {
    const shivam = await db
      .collection('users')
      .findOne({ email: 'shivam@gmail.com' });
    console.log(
      shivam
        ? `🔎 Verified: shivam@gmail.com present (memberId ${shivam.memberId})`
        : '⚠️  Warning: shivam@gmail.com not found after seed',
    );
  } catch (_) {
    /* users collection may not exist in a partial snapshot */
  }

  await client.close();
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
