# OPD WALLET - DATABASE OVERVIEW

**Document Version:** 3.3
**Last Updated:** October 15, 2025 (Video Consultations Integration)
**Database:** MongoDB (opd_wallet)
**Total Collections:** 30

> **Related Documents:**
> - [Core Schemas](./CORE_SCHEMAS.md) - users, policies, plan_configs, userPolicyAssignments, counters, auditLogs
> - [Master Data Schemas](./MASTER_DATA_SCHEMAS.md) - category_master, service_master, relationship_masters, cug_master, specialty_master
> - [Healthcare Schemas](./HEALTHCARE_SCHEMAS.md) - doctors, clinics, doctor_prescriptions, doctor_slots, appointments, video_consultations
> - [Wallet & Claims Schemas](./WALLET_CLAIMS_SCHEMAS.md) - user_wallets, wallet_transactions, memberclaims, payments, transaction_summaries
> - [Lab Diagnostics Schemas](./LAB_DIAGNOSTICS_SCHEMAS.md) - lab_prescriptions, lab_carts, lab_services, lab_vendors, lab_vendor_pricing, lab_vendor_slots, lab_orders
> - [Notifications Schemas](./NOTIFICATIONS_SCHEMAS.md) - notifications

---

## TABLE OF CONTENTS

1. [Database Overview](#database-overview)
2. [Collections Summary](#collections-summary)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Data Integrity Rules](#data-integrity-rules)
5. [Indexes & Performance](#indexes--performance)
6. [Sample Queries](#sample-queries)
7. [Credentials & Connection](#credentials--connection)
8. [Migration Notes](#migration-notes)

---

## DATABASE OVERVIEW

**Database Name:** `opd_wallet`
**Authentication:** MongoDB Admin Auth
**Total Collections:** 30
**Total Documents:** Variable (production usage-dependent)

### Current Data Distribution

| Collection | Document Count | Status |
|-----------|----------------|--------|
| **Core System** | | |
| users | 4+ | Active |
| policies | 1+ | Active |
| plan_configs | 1+ | Active |
| userPolicyAssignments | Variable | Auto-managed |
| **Master Data** | | |
| category_master | 4 | Active |
| service_master | 4+ | Active |
| relationship_masters | 5 | Active |
| cug_master | 8+ | Active |
| specialty_master | 9 | Active |
| **Wallet System** | | |
| user_wallets | Auto | Auto-created on assignment |
| wallet_transactions | Variable | Transaction history |
| **Healthcare** | | |
| doctors | 6+ | Active |
| clinics | 5+ | Active |
| doctor_slots | 17+ | Active |
| appointments | Variable | Operational |
| video_consultations | Variable | Operational ✨ NEW (v6.7) |
| **Claims & TPA** | | |
| memberclaims | Variable | Operational ✨ NEW |
| **Notifications** | | |
| notifications | Variable | Operational ✨ NEW |
| **Lab Diagnostics** | | |
| lab_prescriptions | Variable | Operational ✨ NEW |
| lab_carts | Variable | Operational ✨ NEW |
| lab_services | Admin-managed | Active ✨ NEW |
| lab_vendors | Admin-managed | Active ✨ NEW |
| lab_vendor_pricing | Admin-managed | Active ✨ NEW |
| lab_vendor_slots | Admin-managed | Active ✨ NEW |
| lab_orders | Variable | Operational ✨ NEW |
| **System** | | |
| counters | Variable | System-managed |
| auditLogs | Variable | TTL 2 years |

---

## COLLECTIONS SUMMARY

### Core Collections
- **users** - User accounts (employees, members, dependents, admins)
- **policies** - Insurance policy definitions
- **plan_configs** - Policy plan configurations with benefits and wallet rules

### Assignment & Wallet Collections
- **userPolicyAssignments** - Links users to policies with effective dates
- **user_wallets** - User wallet balances per policy ✅ AUTO-CREATED ON ASSIGNMENT
- **wallet_transactions** - All wallet transactions history (Future use)

### Master Data Collections
- **category_master** - Service categories (Consultation, Pharmacy, etc.)
- **service_master** - Services within categories
- **relationship_masters** - Family relationship types
- **cug_master** - Corporate User Groups
- **specialty_master** - Medical specialties

### Healthcare Collections
- **doctors** - Doctor profiles with clinics and availability
- **clinics** - Clinic/hospital locations with operating hours
- **doctor_slots** - Weekly recurring time slots for doctors
- **appointments** - Appointment bookings
- **video_consultations** - Video consultation sessions for online appointments ✨ NEW (v6.7)

### Claims & TPA Collections ✨ NEW
- **memberclaims** - Complete claims/reimbursement management with TPA integration
- **notifications** - System notifications for claims and status updates

### Lab Diagnostics Collections ✨ NEW
- **lab_prescriptions** - Uploaded lab test prescriptions
- **lab_carts** - Digitized test carts from prescriptions
- **lab_services** - Master catalog of lab services/tests
- **lab_vendors** - Partner laboratory vendors
- **lab_vendor_pricing** - Vendor-specific service pricing
- **lab_vendor_slots** - Available time slots for sample collection
- **lab_orders** - Final lab orders with reports

### Payment & Transaction Collections
- **payments** - Payment transactions for all services (appointments, claims, lab orders, pharmacy, wallet top-ups)
- **transaction_summaries** - Transaction summaries with payment breakdown (wallet vs self-paid)

### System Collections
- **counters** - Auto-increment counters for IDs
- **auditLogs** - Audit trail with TTL (2 years retention)

---

## RELATIONSHIPS & FOREIGN KEYS

### Key Relationships

```
users._id ← userPolicyAssignments.userId
policies._id ← plan_configs.policyId
policies._id ← userPolicyAssignments.policyId
userPolicyAssignments._id ← user_wallets.policyAssignmentId
user_wallets._id ← wallet_transactions.userWalletId
users._id ← appointments.userId
specialty_master.specialtyId ← doctors.specialtyId
category_master.code ← service_master.category

// Video Consultations Relationships ✨ NEW (v6.7)
appointments._id ← video_consultations.appointmentId
users._id ← video_consultations.doctorId
users._id ← video_consultations.patientId
doctor_prescriptions._id ← video_consultations.prescriptionId

// Claims & TPA Relationships
users._id ← memberclaims.userId
users._id ← memberclaims.assignedTo (TPA_USER)
users._id ← memberclaims.assignedBy (TPA_ADMIN)
policies._id ← memberclaims.policyId
userPolicyAssignments._id ← memberclaims.assignmentId
memberclaims._id ← notifications.claimId

// Lab Diagnostics Relationships
users._id ← lab_prescriptions.userId
lab_prescriptions._id ← lab_carts.prescriptionId
lab_carts._id ← lab_orders.cartId
lab_prescriptions._id ← lab_orders.prescriptionId
lab_vendors._id ← lab_orders.vendorId
lab_vendors._id ← lab_vendor_pricing.vendorId
lab_vendors._id ← lab_vendor_slots.vendorId
lab_services._id ← lab_vendor_pricing.serviceId
lab_services._id ← lab_carts.items.serviceId
lab_services._id ← lab_orders.items.serviceId
lab_vendor_slots._id ← lab_orders.slotId

// Payment & Transaction Relationships
users._id ← payments.userId
users._id ← payments.markedAsPaidBy
appointments._id ← payments.serviceId (when serviceType = APPOINTMENT)
memberclaims._id ← payments.serviceId (when serviceType = CLAIM)
lab_orders._id ← payments.serviceId (when serviceType = LAB_ORDER)
users._id ← transaction_summaries.userId
payments._id ← transaction_summaries.paymentId
wallet_transactions._id ← transaction_summaries.walletTransactionIds
appointments._id ← transaction_summaries.serviceId (when serviceType = APPOINTMENT)
memberclaims._id ← transaction_summaries.serviceId (when serviceType = CLAIM)
lab_orders._id ← transaction_summaries.serviceId (when serviceType = LAB_ORDER)
```

---

## DATA INTEGRITY RULES

1. **User Relationships:** primaryMemberId must reference a valid user with relationship='SELF'
2. **Policy Lifecycle:** DRAFT → ACTIVE → (INACTIVE or EXPIRED)
3. **Plan Versions:** Only one isCurrent=true per policyId
4. **Wallet Balance:** allocated = current + consumed (always maintained)
5. **Transaction Atomicity:** Balance updates and transaction records must be atomic
6. **Audit Immutability:** Audit logs should never be updated or deleted manually
7. **TTL Enforcement:** auditLogs automatically deleted after 2 years

---

## INDEXES & PERFORMANCE

All collections have appropriate indexes for query performance. Key considerations:
- Unique indexes enforce data integrity
- Compound indexes support complex queries
- Sparse indexes for optional fields (e.g., employeeId)
- TTL index for automatic audit log cleanup

---

## SAMPLE QUERIES

### Find active users
```javascript
db.users.find({ status: "ACTIVE" })
```

### Find current plan config for a policy
```javascript
db.plan_configs.findOne({ policyId: ObjectId("..."), isCurrent: true })
```

### Get user's wallet transactions
```javascript
db.wallet_transactions.find({ userId: ObjectId("...") }).sort({ createdAt: -1 })
```

### Find doctors by specialty
```javascript
db.doctors.find({ specialtyId: "SPEC-GP", isActive: true })
```

### Get user's active policy assignment
```javascript
db.userPolicyAssignments.findOne({
  userId: ObjectId("..."),
  isActive: true,
  effectiveFrom: { $lte: new Date() },
  effectiveTo: { $gte: new Date() }
})
```

### Find upcoming appointments
```javascript
db.appointments.find({
  userId: ObjectId("..."),
  appointmentDate: { $gte: new Date() },
  status: "SCHEDULED"
}).sort({ appointmentDate: 1 })
```

---

## CREDENTIALS & CONNECTION

### MongoDB Connection

**Connection String:**
```
mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin
```

**Database:** `opd_wallet`
**Username:** `admin`
**Password:** `admin123` (CHANGE IN PRODUCTION)

### Environment Variables

```bash
MONGODB_URI=mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin123
MONGO_INITDB_DATABASE=opd_wallet
NODE_ENV=development
PORT=4000
JWT_SECRET=change_me_in_production_use_strong_secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

---

## MIGRATION NOTES

### Schema Evolution Strategy

1. **Adding Fields:** Add optional fields, use defaults, run migration if needed
2. **Modifying Fields:** Create migration script, test thoroughly
3. **Renaming Fields:** Add new field, migrate data, deprecate old field
4. **Adding Indexes:** Build in background to avoid blocking

### Pending Migrations

None currently identified

---

**Document Version:** 3.3
**Last Updated:** October 15, 2025 (Video Consultations Integration - v6.7)
**For Questions:** Contact development team
