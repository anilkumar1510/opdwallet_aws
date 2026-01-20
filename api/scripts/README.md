# Database Scripts

This directory contains all database-related scripts for the OPD Wallet application, organized by purpose.

## Directory Structure

```
scripts/
├── seed-all-collections.ts    # PRIMARY comprehensive seeder
├── seed/                       # Individual seed scripts
├── utilities/                  # Utility scripts
├── init/                       # Initialization scripts
└── archive/                    # Historical scripts (do not run)
```

## Active Scripts

### Seeding

**Primary Seeder (Recommended):**
```bash
npm run seed:all
```
- **File:** `seed-all-collections.ts` (961 lines, 39KB)
- **Purpose:** Seeds ALL database collections in proper dependency order
- **Use Case:** Fresh database setup, complete data reset
- **Collections:** Counters, categories, relationships, CUG, services, specialties, medicines, symptoms, diagnoses, lab tests, clinics, doctors, users, policies, plan configs
- **Features:** Tier-based seeding (Tier 0-3), comprehensive master data, test users

**Individual Seeders (Optional):**
```bash
npm run seed              # Basic seed (users, policies, assignments)
npm run seed:medicines    # Medicine database (~100 medicines)
npm run seed:diagnoses    # ICD-10 diagnosis codes
npm run seed:symptoms     # Symptom database
npm run seed:lab          # Lab test data
```

**When to use individual seeders:**
- Updating specific master data without full reset
- Development/testing specific modules
- Partial data refresh

### Migrations

Database schema migrations are handled via API endpoints (SUPER_ADMIN only):

```bash
# Via API (requires authentication)
POST /api/migration/spouse-coverage
POST /api/migration/service-transaction-limits
```

**Controller:** `api/src/modules/migration/migration.controller.ts`

**Note:** One-time migrations have been archived to `archive/migrations/`

### Utilities

```bash
# Update admin password
npm run admin:update-password

# Initialize MongoDB with authentication
npm run db:init

# Reset doctor password (direct script)
node scripts/utilities/reset-doctor-password.js

# Create test plan configuration
ts-node scripts/utilities/create-test-plan-config.ts

# Validate plan versions
node scripts/utilities/validate-plan-versions.js
```

### Initialization

```bash
# Initialize MongoDB
npm run db:init

# Setup AWS Secrets Manager (requires AWS credentials)
bash scripts/init/setup-secrets.sh
```

## Archive Directory

**⚠️ DO NOT RUN ARCHIVED SCRIPTS ON PRODUCTION**

The `archive/` directory contains:

### `archive/migrations/` - Completed One-Time Migrations
- `migrate-spouse-coverage.js` - Added spouse coverage to plan configs ✅ COMPLETED
- `migrate-plan-config-benefits.ts` - Updated plan config schema ✅ COMPLETED
- `migrate-users-segregation.ts` - Segregated internal users from members ✅ COMPLETED
- `cleanup-migrated-users.ts` - Post-migration cleanup ✅ COMPLETED
- `rollback-user-segregation.ts` - Rollback script (if needed)

### `archive/fixes/` - One-Time Data Fixes
- `cleanup-mem003-mem002.js` - Fixed specific member data ✅ COMPLETED
- `fix-relationship-data.js` - Corrected relationship data ✅ COMPLETED
- `fix-prescription-ids.js` - Fixed prescription ID issues ✅ COMPLETED
- `fix-doctor-names.js` - Corrected doctor name formatting ✅ COMPLETED
- `fix-cug-index.js` - Removed orphaned 'code_1' index from cug_master ✅ COMPLETED (2026-01-20)
  - **Issue:** E11000 duplicate key error on CUG creation
  - **Solution:** `docker exec -it opd-mongodb-prod mongosh opd_wallet --eval 'db.cug_master.dropIndex("code_1")'`
  - **Script:** Comprehensive fix script available for reference

### `archive/legacy-seeders/` - Replaced by seed-all-collections.ts
- `seed-aws-data.js` - AWS deployment master data (16KB)
- `seed-500-doctors.js` - Bulk doctor seeding (9.6KB)
- `seed-clinics.js` - Clinic data (5.3KB)
- `seed-doctor-slots.js` - Doctor availability (5.5KB)
- `seed-doctors.js` - Doctor data (4.1KB)
- `seed-medical-data.js` - Medical reference data (12KB)
- `seed-specialties.js` - Medical specialties (2.0KB)

**Why archived:** These scripts have been superseded by `seed-all-collections.ts`, which provides a comprehensive, tier-based seeding approach with proper dependency management.

## Usage Guidelines

### For Development

1. **Fresh Database Setup:**
   ```bash
   # Drop existing database (if needed)
   mongosh opd_wallet --eval "db.dropDatabase()"

   # Seed all collections
   cd api
   npm run seed:all
   ```

2. **Update Specific Master Data:**
   ```bash
   npm run seed:medicines    # Update medicine database only
   ```

3. **Test User Setup:**
   ```bash
   npm run seed              # Creates basic test users
   ```

### For Production

1. **Initial Setup:**
   ```bash
   # Use comprehensive seeder
   MONGODB_URI="mongodb://prod-uri" npm run seed:all
   ```

2. **Schema Migrations:**
   ```bash
   # Use API endpoints (authenticated)
   curl -X POST https://api.domain.com/migration/spouse-coverage \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

3. **Backup First:**
   ```bash
   # Always backup before running seeders
   mongodump --uri="mongodb://prod-uri" --out=backup-$(date +%Y%m%d)
   ```

## Environment Variables

All scripts respect these environment variables:

```bash
MONGODB_URI="mongodb://localhost:27017/opd_wallet"  # Database connection
NODE_ENV="development"                               # Environment
```

## Script Maintenance

### Adding New Scripts

1. Place in appropriate directory:
   - `seed/` - New seed scripts
   - `utilities/` - Utility/maintenance scripts
   - `init/` - Initialization scripts

2. Update `package.json` if it's a commonly used script

3. Document in this README

### Archiving Scripts

When a migration or fix is completed:

1. Move to appropriate `archive/` subdirectory
2. Add ✅ COMPLETED marker in this README
3. Document completion date and purpose

### Testing Scripts

Always test scripts in development before production:

```bash
# Test with local database
MONGODB_URI="mongodb://localhost:27017/opd_wallet_test" npm run seed:all

# Verify collections
mongosh opd_wallet_test --eval "db.getCollectionNames()"
```

## Troubleshooting

### Connection Issues

```bash
# Check MongoDB is running
docker ps | grep mongo

# Test connection
mongosh $MONGODB_URI --eval "db.adminCommand('ping')"
```

### Permission Issues

```bash
# Ensure MongoDB authentication is configured
# Check MONGODB_URI includes credentials if required
```

### Missing Dependencies

```bash
# Install dependencies
cd api
npm install
```

## Support

For issues or questions:
- Check script comments for detailed documentation
- Review Git history for context: `git log --follow scripts/`
- Contact: Development Team

---

**Last Updated:** 2026-01-19
**Maintained By:** OPD Wallet Development Team
