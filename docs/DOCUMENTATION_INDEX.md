# OPD Wallet - Documentation Index

**Last Updated**: October 20, 2025
**Version**: 2.0 (Restructured)

> **Note:** Documentation has been restructured for better organization. See [README.md](./README.md) for the complete master index.

---

## 📚 Documentation Structure

This documentation is now organized into **focused documents** by domain for better clarity and maintainability.

### 🏗️ Architecture Documentation (NEW: Split into 4 files)

Located in `/docs/architecture/`:

1. **[Architecture Overview](./architecture/ARCHITECTURE_OVERVIEW.md)** (622 lines) - System overview, tech stack, high-level design
2. **[Backend Architecture](./architecture/BACKEND_ARCHITECTURE.md)** (1,080 lines) - NestJS modules, design patterns
3. **[API Endpoints](./architecture/API_ENDPOINTS.md)** (685 lines) - Complete API reference (194+ endpoints)
4. **[Deployment Infrastructure](./architecture/DEPLOYMENT_INFRASTRUCTURE.md)** (963 lines) - Docker, NGINX, deployment

**Original:** [01_PRODUCT_ARCHITECTURE.md](./01_PRODUCT_ARCHITECTURE.md) (3,619 lines - kept as backup)

### 🗄️ Database Documentation (NEW: Split into 7 files)

Located in `/docs/database/`:

1. **[Database Overview](./database/DATABASE_OVERVIEW.md)** (297 lines) - Connections, relationships, indexes
2. **[Core Schemas](./database/CORE_SCHEMAS.md)** (685 lines) - users, policies, plan_configs, assignments
3. **[Master Data Schemas](./database/MASTER_DATA_SCHEMAS.md)** (550 lines) - categories, services, relationships, CUGs
4. **[Healthcare Schemas](./database/HEALTHCARE_SCHEMAS.md)** (844 lines) - doctors, clinics, appointments, video consultations
5. **[Wallet & Claims Schemas](./database/WALLET_CLAIMS_SCHEMAS.md)** (827 lines) - wallets, transactions, claims, payments
6. **[Lab Diagnostics Schemas](./database/LAB_DIAGNOSTICS_SCHEMAS.md)** (730 lines) - lab prescriptions, carts, orders
7. **[Notifications Schema](./database/NOTIFICATIONS_SCHEMAS.md)** (128 lines) - notifications

**Original:** [02_DATA_SCHEMA_AND_CREDENTIALS.md](./02_DATA_SCHEMA_AND_CREDENTIALS.md) (3,856 lines - kept as backup)

### 👥 Portal Documentation

Located in `/docs/portals/`:

#### Single-File Portals

3. **[Admin Portal](./portals/ADMIN_PORTAL.md)** (827 lines) - Admin functionalities, lab management, master data
4. **[Member Portal](./portals/MEMBER_PORTAL.md)** (1,695 lines) - Member features, appointments, claims, wallet toggle
5. **[Doctor Portal](./portals/DOCTOR_PORTAL.md)** (1,067 lines) - Doctor appointments, prescriptions, video consultations
6. **[Operations Portal](./portals/OPERATIONS_PORTAL.md)** (1,651 lines) - OPS workflows, prescription digitization

#### TPA Portal (NEW: Split into 4 files)

7. **[TPA Portal Overview](./portals/TPA_PORTAL_OVERVIEW.md)** (1,207 lines) - Overview, roles, API reference
8. **[TPA Workflows](./portals/TPA_WORKFLOWS.md)** (986 lines) - Claim assignment & review workflows
9. **[TPA Decision Trees](./portals/TPA_DECISION_TREES.md)** (631 lines) - Approval logic, document checks
10. **[TPA Best Practices](./portals/TPA_BEST_PRACTICES.md)** (857 lines) - Operational guidelines, QA, efficiency

**Original:** [TPA_PORTAL.md](./TPA_PORTAL.md) (2,859 lines - kept as backup)

---

## 🗺️ Quick Navigation

### By User Role

**Super Admin / Admin:**
- System configuration → [Admin Portal](./ADMIN_PORTAL.md)
- Database management → [Database Schema](./02_DATA_SCHEMA_AND_CREDENTIALS.md)

**Operations Team:**
- Daily workflows → [Operations Portal](./OPERATIONS_PORTAL.md)
- Doctor/Appointment management → [Operations Portal](./OPERATIONS_PORTAL.md#doctors-management)
- Lab prescription queue → [Operations Portal](./OPERATIONS_PORTAL.md#lab-diagnostics)

**TPA Users:**
- Claims processing → [TPA Portal](./TPA_PORTAL.md)
- Assignment workflows → [TPA Portal](./TPA_PORTAL.md#claim-assignment)

**Members:**
- All member features → [Member Portal](./MEMBER_PORTAL.md)
- Appointments booking → [Member Portal](./MEMBER_PORTAL.md#appointments)
- Claims submission → [Member Portal](./MEMBER_PORTAL.md#claims-reimbursements)
- Lab tests → [Member Portal](./MEMBER_PORTAL.md#lab-diagnostics)

### By Feature

**Appointments & Doctors:**
- Doctor management → [Operations Portal](./OPERATIONS_PORTAL.md#doctors-management)
- Member booking → [Member Portal](./MEMBER_PORTAL.md#appointments)
- API endpoints → [Product Architecture](./01_PRODUCT_ARCHITECTURE.md#appointments)

**Claims & Reimbursements:**
- Member submission → [Member Portal](./MEMBER_PORTAL.md#claims-reimbursements)
- TPA processing → [TPA Portal](./TPA_PORTAL.md)
- Database schema → [Database Schema](./02_DATA_SCHEMA_AND_CREDENTIALS.md#memberclaims)

**Lab Diagnostics:**
- Admin setup → [Admin Portal](./ADMIN_PORTAL.md#lab-diagnostics)
- Member workflow → [Member Portal](./MEMBER_PORTAL.md#lab-diagnostics)
- OPS digitization → [Operations Portal](./OPERATIONS_PORTAL.md#lab-diagnostics)
- Database schema → [Database Schema](./02_DATA_SCHEMA_AND_CREDENTIALS.md#lab-collections)

**Master Data:**
- Configuration → [Admin Portal](./ADMIN_PORTAL.md#master-data)
- Database → [Database Schema](./02_DATA_SCHEMA_AND_CREDENTIALS.md#master-data-collections)

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     OPD Wallet System                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Admin Portal │  │   Member     │  │  Operations  │     │
│  │   (Admin/    │  │   Portal     │  │    Portal    │     │
│  │  Super Admin)│  │  (Members)   │  │  (OPS Team)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │  NestJS API    │                       │
│                    │  (Port 4000)   │                       │
│                    └───────┬────────┘                       │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │    MongoDB     │                       │
│                    │  30 Collections│                       │
│                    └────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Total Collections**: 30
**Total API Endpoints**: 100+
**Total Frontend Pages**: 60+

---

## 🔄 Recent Updates (October 20, 2025)

### Documentation Restructuring (v2.0)
- ✅ **Split 01_PRODUCT_ARCHITECTURE.md** into 4 focused documents (architecture, backend, API, deployment)
- ✅ **Split 02_DATA_SCHEMA_AND_CREDENTIALS.md** into 7 domain-specific schema documents
- ✅ **Split TPA_PORTAL.md** into 4 documents (overview, workflows, decision trees, best practices)
- ✅ **Created README.md** - Comprehensive master index with navigation guide
- ✅ **Updated DOCUMENTATION_INDEX.md** - Updated structure references
- ✅ **Organized portal documents** in `/portals/` directory
- ✅ **Created directory structure** - `/architecture/`, `/database/`, `/portals/`

### Feature Updates (v6.9)
- ✅ **Wallet Payment Toggle** - Members can choose to use wallet for appointments
- ✅ **Route Restructure** - Admin routes moved to `(admin)` Next.js route group
- ✅ **Relationships Master UI** - Full CRUD interface for relationship management
- ✅ **Enhanced Logging** - Comprehensive debugging in auth and middleware

### Previous Major Additions (v6.7-v6.8)
- ✅ **Lab Diagnostics Module** - Complete end-to-end workflow (7 collections, 37 endpoints)
- ✅ **TPA Module** - Claims processing workflow (11 endpoints)
- ✅ **Video Consultations** - WebRTC integration (v6.7)
- ✅ **Payment & Transaction History** - Enhanced member portal (v6.8)

---

## 📝 Contributing to Documentation

When updating documentation:
1. **Find the right document** - Use README.md to locate the appropriate file
2. **Update focused documents** - Update the split files (in `/architecture/`, `/database/`, `/portals/`), NOT the originals
3. **Update cross-references** - If adding new sections, update links in related documents
4. **Update indexes** - Update README.md if adding new documents
5. **Keep originals untouched** - Original large files are kept as backup only

### File Organization
- **Architecture docs:** `/docs/architecture/` (4 files)
- **Database docs:** `/docs/database/` (7 files)
- **Portal docs:** `/docs/portals/` (8 files)
- **Master index:** `/docs/README.md`

---

**For Questions**: Contact development team
**Last Audit**: October 20, 2025
**Documentation Version**: 2.0 (Restructured)

**See [README.md](./README.md) for complete master index and navigation guide.**
