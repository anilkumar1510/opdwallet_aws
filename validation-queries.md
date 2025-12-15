# Database Validation Queries

## Overview

This document contains MongoDB queries to validate data integrity, verify migration success, check indexes, and compare performance after user segregation migration.

Run these queries in **mongosh** (MongoDB Shell) or through your MongoDB client.

## Connection

```bash
mongosh "mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin"
```

---

## 1. Count Verification

### 1.1 Total Users (Before vs After)

```javascript
// Backup count (original total before migration)
db.users_backup_pre_segregation.countDocuments();

// Current users count (members + doctors)
db.users.countDocuments();

// Internal users count
db.internal_users.countDocuments();

// Total after migration (should equal backup count)
db.users.countDocuments() + db.internal_users.countDocuments();
```

**Expected:** Total after migration = Backup count (no data loss)

### 1.2 Count by Role

```javascript
// Members in users collection
db.users.countDocuments({ role: 'MEMBER' });

// Doctors in users collection
db.users.countDocuments({ role: 'DOCTOR' });

// SUPER_ADMIN in internal_users
db.internal_users.countDocuments({ role: 'SUPER_ADMIN' });

// ADMIN in internal_users
db.internal_users.countDocuments({ role: 'ADMIN' });

// TPA roles in internal_users
db.internal_users.countDocuments({ role: { $in: ['TPA', 'TPA_ADMIN', 'TPA_USER'] } });

// FINANCE_USER in internal_users
db.internal_users.countDocuments({ role: 'FINANCE_USER' });

// OPS in internal_users
db.internal_users.countDocuments({ role: 'OPS' });
```

### 1.3 Internal Users in Users Collection (After Cleanup)

```javascript
// Should be 0 after cleanup script runs
db.users.countDocuments({
  role: { $in: ['SUPER_ADMIN', 'ADMIN', 'TPA', 'TPA_ADMIN', 'TPA_USER', 'FINANCE_USER', 'OPS'] }
});
```

**Expected:** 0 after cleanup, or count of internal users before cleanup

---

## 2. Field Integrity

### 2.1 Member Fields in Internal Users (Should NOT Exist)

```javascript
// Check for member-specific fields in internal_users
db.internal_users.find({
  $or: [
    { uhid: { $exists: true } },
    { memberId: { $exists: true } },
    { relationship: { $exists: true } },
    { primaryMemberId: { $exists: true } },
    { dob: { $exists: true } },
    { gender: { $exists: true } },
    { bloodGroup: { $exists: true } },
    { corporateName: { $exists: true } },
    { cugId: { $exists: true } }
  ]
}, { email: 1, uhid: 1, memberId: 1, relationship: 1 });
```

**Expected:** 0 documents (no member fields in internal_users)

### 2.2 Internal User Required Fields

```javascript
// Verify all internal users have employeeId
db.internal_users.find({ employeeId: { $exists: false } }, { email: 1 });

// Verify all have userType: 'internal'
db.internal_users.find({ userType: { $ne: 'internal' } }, { email: 1, userType: 1 });

// Verify phone is object format
db.internal_users.find({
  $or: [
    { 'phone.countryCode': { $exists: false } },
    { 'phone.number': { $exists: false } }
  ]
}, { email: 1, phone: 1 });
```

**Expected:** All queries return 0 documents

### 2.3 Member Required Fields

```javascript
// Verify members have UHID
db.users.find({
  role: 'MEMBER',
  uhid: { $exists: false }
}, { email: 1 });

// Verify members have memberId
db.users.find({
  role: 'MEMBER',
  memberId: { $exists: false }
}, { email: 1 });

// Verify members have relationship
db.users.find({
  role: 'MEMBER',
  relationship: { $exists: false }
}, { email: 1 });
```

**Expected:** 0 documents (all members have required fields)

---

## 3. Unique Constraints

### 3.1 Email Uniqueness (Across Both Collections)

```javascript
// Get all emails from both collections
const usersEmails = db.users.find({}, { email: 1 }).toArray().map(u => u.email);
const internalEmails = db.internal_users.find({}, { email: 1 }).toArray().map(u => u.email);
const allEmails = usersEmails.concat(internalEmails);

// Check for duplicates
const emailCounts = {};
allEmails.forEach(email => {
  emailCounts[email] = (emailCounts[email] || 0) + 1;
});

Object.entries(emailCounts).filter(([email, count]) => count > 1);
```

**Expected:** Empty array (no duplicate emails)

### 3.2 userId Uniqueness

```javascript
// Get all userIds from both collections
const usersUserIds = db.users.find({ userId: { $exists: true } }, { userId: 1 }).toArray().map(u => u.userId);
const internalUserIds = db.internal_users.find({ userId: { $exists: true } }, { userId: 1 }).toArray().map(u => u.userId);
const allUserIds = usersUserIds.concat(internalUserIds);

// Check for duplicates
const userIdCounts = {};
allUserIds.forEach(userId => {
  userIdCounts[userId] = (userIdCounts[userId] || 0) + 1;
});

Object.entries(userIdCounts).filter(([userId, count]) => count > 1);
```

**Expected:** Empty array (no duplicate userIds)

### 3.3 employeeId Uniqueness

```javascript
// Check for duplicate employeeIds in internal_users
db.internal_users.aggregate([
  { $group: { _id: '$employeeId', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
]);
```

**Expected:** 0 documents (no duplicate employeeIds)

### 3.4 memberId Uniqueness

```javascript
// Check for duplicate memberIds in users
db.users.aggregate([
  { $match: { role: 'MEMBER' } },
  { $group: { _id: '$memberId', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
]);
```

**Expected:** 0 documents (no duplicate memberIds)

---

## 4. Password Hash Integrity

### 4.1 Compare Password Hashes with Backup

```javascript
// Sample 5 internal users and verify passwords match backup
const sampleUsers = db.internal_users.find({}).limit(5).toArray();

sampleUsers.forEach(user => {
  const backupUser = db.users_backup_pre_segregation.findOne({ _id: user._id });
  if (backupUser) {
    if (user.passwordHash === backupUser.passwordHash) {
      print(`✅ ${user.email} - Password hash matches`);
    } else {
      print(`❌ ${user.email} - Password hash MISMATCH!`);
    }
  } else {
    print(`⚠️  ${user.email} - Not found in backup`);
  }
});
```

**Expected:** All password hashes match

---

## 5. Index Verification

### 5.1 Internal Users Indexes

```javascript
// List all indexes on internal_users
db.internal_users.getIndexes();
```

**Expected Indexes:**
- `_id_` (default)
- `userId_1` (unique)
- `employeeId_1` (unique)
- `email_1` (unique)
- `phone.number_1`
- `role_1_status_1`
- `department_1`
- `reportingTo_1`
- `lastLoginAt_-1`

### 5.2 Users Indexes (Unchanged)

```javascript
// List all indexes on users
db.users.getIndexes();
```

**Expected:** All original indexes still present

---

## 6. Foreign Key Integrity

### 6.1 Policy References

```javascript
// Check if all policy userIds reference valid users
const policies = db.policies.find({}).toArray();

let invalidRefs = 0;
policies.forEach(policy => {
  const userId = policy.userId || policy.memberId;
  if (userId) {
    const inUsers = db.users.findOne({ userId: userId });
    const inInternal = db.internal_users.findOne({ userId: userId });

    if (!inUsers && !inInternal) {
      print(`❌ Policy ${policy._id} references invalid userId: ${userId}`);
      invalidRefs++;
    }
  }
});

print(`Total invalid policy references: ${invalidRefs}`);
```

**Expected:** 0 invalid references

### 6.2 Appointment References

```javascript
// Check if all appointment userIds reference valid users
const appointments = db.appointments.find({}).toArray();

let invalidApptRefs = 0;
appointments.forEach(appointment => {
  const userId = appointment.userId || appointment.memberId;
  if (userId) {
    const inUsers = db.users.findOne({ userId: userId });
    const inInternal = db.internal_users.findOne({ userId: userId });

    if (!inUsers && !inInternal) {
      print(`❌ Appointment ${appointment._id} references invalid userId: ${userId}`);
      invalidApptRefs++;
    }
  }
});

print(`Total invalid appointment references: ${invalidApptRefs}`);
```

**Expected:** 0 invalid references

### 6.3 Claim References

```javascript
// Check if all claim userIds reference valid users
const claims = db.claims.find({}).toArray();

let invalidClaimRefs = 0;
claims.forEach(claim => {
  const userId = claim.userId || claim.memberId;
  if (userId) {
    const inUsers = db.users.findOne({ userId: userId });
    const inInternal = db.internal_users.findOne({ userId: userId });

    if (!inUsers && !inInternal) {
      print(`❌ Claim ${claim._id} references invalid userId: ${userId}`);
      invalidClaimRefs++;
    }
  }
});

print(`Total invalid claim references: ${invalidClaimRefs}`);
```

**Expected:** 0 invalid references

### 6.4 Dependent Relationships

```javascript
// Check if all dependents reference valid primary members
db.users.find({
  role: 'MEMBER',
  primaryMemberId: { $exists: true, $ne: null }
}).forEach(dependent => {
  const primaryMember = db.users.findOne({ memberId: dependent.primaryMemberId });

  if (!primaryMember) {
    print(`❌ Dependent ${dependent.email} references invalid primary member: ${dependent.primaryMemberId}`);
  } else if (primaryMember.relationship !== 'SELF' && primaryMember.relationship !== 'REL001') {
    print(`⚠️  Dependent ${dependent.email} primary member is not SELF: ${primaryMember.email}`);
  } else {
    print(`✅ Dependent ${dependent.email} → Primary ${primaryMember.email}`);
  }
});
```

**Expected:** All dependents reference valid SELF primary members

---

## 7. Performance Testing

### 7.1 Query Response Time - Find by Email

```javascript
// Before migration (from backup)
const start1 = Date.now();
db.users_backup_pre_segregation.findOne({ email: 'john.member@test.com' });
const time1 = Date.now() - start1;
print(`Backup collection: ${time1}ms`);

// After migration - members
const start2 = Date.now();
db.users.findOne({ email: 'john.member@test.com' });
const time2 = Date.now() - start2;
print(`Users collection: ${time2}ms`);

// After migration - internal users
const start3 = Date.now();
db.internal_users.findOne({ email: 'john.admin@test.com' });
const time3 = Date.now() - start3;
print(`Internal users collection: ${time3}ms`);
```

**Expected:** Similar or better performance

### 7.2 Query Response Time - List with Filter

```javascript
// Members - list all active
const start1 = Date.now();
db.users.find({ role: 'MEMBER', status: 'ACTIVE' }).limit(100).toArray();
const time1 = Date.now() - start1;
print(`List members: ${time1}ms`);

// Internal users - list all active admins
const start2 = Date.now();
db.internal_users.find({ role: 'ADMIN', status: 'ACTIVE' }).limit(100).toArray();
const time2 = Date.now() - start2;
print(`List internal users: ${time2}ms`);
```

**Expected:** Fast query times (< 100ms for small datasets)

### 7.3 Aggregation Performance

```javascript
// Count users by role
const start1 = Date.now();
db.users.aggregate([
  { $group: { _id: '$role', count: { $sum: 1 } } }
]);
const time1 = Date.now() - start1;
print(`Users aggregation: ${time1}ms`);

const start2 = Date.now();
db.internal_users.aggregate([
  { $group: { _id: '$role', count: { $sum: 1 } } }
]);
const time2 = Date.now() - start2;
print(`Internal users aggregation: ${time2}ms`);
```

**Expected:** Fast aggregations

---

## 8. Migration Logs

### 8.1 Migration Log Verification

```javascript
// Find migration log
db.migration_logs.find({ scriptName: 'migrate-users-segregation' }).sort({ timestamp: -1 }).limit(1).pretty();

// Check status
db.migration_logs.findOne({
  scriptName: 'migrate-users-segregation',
  status: 'completed'
});
```

**Expected:** Migration log exists with status 'completed'

### 8.2 Cleanup Log (If Cleanup Was Run)

```javascript
// Find cleanup log
db.migration_logs.find({ scriptName: 'cleanup-migrated-users' }).sort({ timestamp: -1 }).limit(1).pretty();
```

### 8.3 Rollback Log (If Rollback Was Run)

```javascript
// Find rollback log
db.migration_logs.find({ scriptName: 'rollback-user-segregation' }).sort({ timestamp: -1 }).limit(1).pretty();
```

---

## 9. Data Sampling

### 9.1 Sample Internal Users

```javascript
// Sample 5 internal users
db.internal_users.find({}).limit(5).pretty();

// Verify they have:
// - employeeId
// - userType: 'internal'
// - phone as object { countryCode, number }
// - No member fields (uhid, memberId, etc.)
```

### 9.2 Sample Members

```javascript
// Sample 5 members
db.users.find({ role: 'MEMBER' }).limit(5).pretty();

// Verify they have:
// - uhid
// - memberId
// - relationship
// - No internal-only fields (employeeId, department, etc.)
```

---

## 10. Comprehensive Validation Script

Run this all-in-one validation:

```javascript
print('\n========================================');
print('COMPREHENSIVE DATABASE VALIDATION');
print('========================================\n');

// 1. Count Verification
print('1. COUNT VERIFICATION\n');
const backupCount = db.users_backup_pre_segregation.countDocuments();
const usersCount = db.users.countDocuments();
const internalCount = db.internal_users.countDocuments();
const totalCount = usersCount + internalCount;

print(`   Backup count: ${backupCount}`);
print(`   Users count: ${usersCount}`);
print(`   Internal users count: ${internalCount}`);
print(`   Total: ${totalCount}`);
print(`   Match: ${totalCount === backupCount ? '✅ YES' : '❌ NO - DATA LOSS!'}\n`);

// 2. Role Distribution
print('2. ROLE DISTRIBUTION\n');
const members = db.users.countDocuments({ role: 'MEMBER' });
const doctors = db.users.countDocuments({ role: 'DOCTOR' });
const superAdmins = db.internal_users.countDocuments({ role: 'SUPER_ADMIN' });
const admins = db.internal_users.countDocuments({ role: 'ADMIN' });
const tpaUsers = db.internal_users.countDocuments({ role: { $in: ['TPA', 'TPA_ADMIN', 'TPA_USER'] } });
const financeUsers = db.internal_users.countDocuments({ role: 'FINANCE_USER' });
const opsUsers = db.internal_users.countDocuments({ role: 'OPS' });

print(`   Members: ${members}`);
print(`   Doctors: ${doctors}`);
print(`   SUPER_ADMIN: ${superAdmins}`);
print(`   ADMIN: ${admins}`);
print(`   TPA/TPA_ADMIN/TPA_USER: ${tpaUsers}`);
print(`   FINANCE_USER: ${financeUsers}`);
print(`   OPS: ${opsUsers}\n`);

// 3. Field Integrity
print('3. FIELD INTEGRITY\n');
const memberFieldsInInternal = db.internal_users.countDocuments({
  $or: [
    { uhid: { $exists: true } },
    { memberId: { $exists: true } },
    { relationship: { $exists: true } }
  ]
});
print(`   Member fields in internal_users: ${memberFieldsInInternal} ${memberFieldsInInternal === 0 ? '✅' : '❌'}\n`);

// 4. Index Verification
print('4. INDEX VERIFICATION\n');
const internalIndexes = db.internal_users.getIndexes();
print(`   Internal users indexes: ${internalIndexes.length}`);
print(`   Expected: 9+ indexes\n`);

// 5. Migration Log
print('5. MIGRATION LOG\n');
const migrationLog = db.migration_logs.findOne({
  scriptName: 'migrate-users-segregation',
  status: 'completed'
});
if (migrationLog) {
  print(`   ✅ Migration logged at ${migrationLog.timestamp}`);
  print(`   Users migrated: ${migrationLog.usersMigrated || 0}\n`);
} else {
  print(`   ⚠️  No migration log found\n`);
}

print('========================================');
print('VALIDATION COMPLETE');
print('========================================\n');
```

---

## Expected Results Summary

After running all validation queries:

- ✅ Total user count matches backup (no data loss)
- ✅ All members have role 'MEMBER' in users collection
- ✅ All internal users in internal_users collection
- ✅ No member-specific fields in internal_users
- ✅ All internal users have employeeId
- ✅ No duplicate emails, userIds, employeeIds, memberIds
- ✅ All password hashes preserved
- ✅ All expected indexes present
- ✅ No broken foreign key references
- ✅ Query performance acceptable
- ✅ Migration log exists with status 'completed'

---

## Troubleshooting

### Issue: Total count doesn't match backup

**Possible Causes:**
1. Migration script failed midway
2. Data was deleted/modified during migration
3. Backup was created after some users were already deleted

**Solution:** Run rollback and investigate

### Issue: Member fields found in internal_users

**Possible Causes:**
1. Migration script didn't strip fields correctly
2. Manual data modification

**Solution:** Run cleanup query to remove fields or re-migrate

### Issue: Broken foreign key references

**Possible Causes:**
1. ObjectIds were not preserved during migration
2. Referenced collections were modified

**Solution:** Verify migration preserved ObjectIds, rollback if needed

---

**Last Updated:** [Date]
**Version:** 1.0
