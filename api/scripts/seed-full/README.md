# Full Database Seed (`seed-full`)

A complete, portable snapshot of the `opd_wallet` database — **all portals' data**
(members, doctors, appointments, wallets, payments, claims, lab/diagnostic/dental/
vision orders, policies, plan configs, masters, etc.), including the member
**shivam@gmail.com** (MEM35637).

Use it to recreate this exact database state on any machine or environment.

## Contents

- `data/*.json` — one Extended-JSON file per collection (74 collections, 2238 docs),
  exported with `mongoexport --jsonArray`. Extended JSON preserves BSON types
  (`$oid`, `$date`, …), so ObjectIds and Dates restore exactly.
- `seed-full.js` — Node runner that reads `data/` and inserts every collection,
  restoring types via the BSON EJSON codec.

## Usage

```bash
# From this folder. Default target = mongodb://localhost:27017/opd_wallet (local, no auth)
node seed-full.js

# Target a different DB / host
MONGODB_URI="mongodb://user:pass@host:27017/opd_wallet?authSource=admin" node seed-full.js
```

### Flags

| Flag | Behavior |
|------|----------|
| _(none)_ | For each data file, **drop that collection** then insert. Idempotent per collection. |
| `--keep` | Insert **without** dropping (appends; may cause duplicate-key errors on re-run). |
| `--drop-all` | Drop **every** collection in the target DB first (clean slate), then insert. |

The script prints per-collection counts and finishes with a verification line
confirming `shivam@gmail.com` is present.

## Refreshing the snapshot

If the source DB changes and you want a new snapshot:

```bash
URI="mongodb://localhost:27017/opd_wallet"
cd api/scripts/seed-full
rm -f data/*.json
for c in $(mongosh "$URI" --quiet --eval \
  'db.getCollectionNames().filter(c=>!c.startsWith("system.")&&db.getCollection(c).countDocuments({})>0).forEach(c=>print(c))' \
  | grep -E '^[A-Za-z0-9_]+$'); do
  mongoexport --uri="$URI" --collection="$c" --jsonArray --out="data/$c.json"
done
```

## Notes

- Requires the `mongodb` and `bson` packages — already present in `api/node_modules`,
  so run it from within the `api` workspace (or `node` with that `node_modules` on the path).
- The snapshot includes legacy/duplicate collections that exist in the source DB
  (e.g. both `plan_configs` and `planconfigs`, `user_wallets` and `userwallets`) so the
  restore is faithful to the current database.
- Verified: seeding into a scratch DB reproduces all **2238 documents / 74 collections**
  with correct BSON types.
