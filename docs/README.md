# OPD Wallet - Complete Documentation Index

> **Last Updated:** October 20, 2025
> **Documentation Version:** 2.0 (Restructured)

Welcome to the OPD Wallet documentation. This is your central hub for navigating all technical documentation organized by domain and purpose.

---

## 📚 Quick Navigation

| Document Type | Purpose | Target Audience |
|--------------|---------|-----------------|
| [Architecture](#-architecture-documentation) | System design, backend, API | Developers, Architects |
| [Database](#-database-schemas) | All collections, schemas, queries | Backend Developers, DBAs |
| [Portals](#-portal-documentation) | User-facing features by role | Product, Frontend Developers |
| [Original Docs](#-original-comprehensive-documents) | Full un-split documents (backup) | Reference |

---

## 🏗️ Architecture Documentation

**Location:** `/docs/architecture/`

Comprehensive technical architecture split into focused documents:

### 1. [ARCHITECTURE_OVERVIEW.md](./architecture/ARCHITECTURE_OVERVIEW.md) (622 lines)
**Purpose:** High-level system design and technology choices
**Contains:**
- System overview and components
- Technology stack (NestJS, Next.js, MongoDB, Docker, Nginx)
- High-level architecture diagrams
- Component communication patterns
- Design patterns overview
- Frontend architecture
- Authentication & security overview
- Known issues and limitations

**When to use:** Understanding the big picture, onboarding new developers, architecture reviews

---

### 2. [BACKEND_ARCHITECTURE.md](./architecture/BACKEND_ARCHITECTURE.md) (1,080 lines)
**Purpose:** Detailed NestJS backend implementation
**Contains:**
- Complete module structure (19 modules)
- Backend design patterns (Dependency Injection, Guards, DTOs, Schemas)
- All module descriptions with responsibilities
- Authentication/Authorization implementation
- Data validation strategies
- Error handling patterns
- File upload handling
- Integration points (Google Maps, module dependencies)

**When to use:** Backend development, adding new modules, understanding business logic flow

---

### 3. [API_ENDPOINTS.md](./architecture/API_ENDPOINTS.md) (685 lines)
**Purpose:** Complete API reference with 194+ endpoints
**Contains:**
- All endpoints organized by module
- Request/response schemas
- Query parameters and filters
- File upload specifications
- Authentication requirements
- Status codes and error responses
- Examples for complex endpoints

**Modules covered:**
- Authentication (6 endpoints)
- Users Management (9 endpoints)
- Policies & Plan Config (14 endpoints)
- Assignments (8 endpoints)
- Master Data (28 endpoints)
- Healthcare (Doctors, Clinics, Slots, Appointments - 37 endpoints)
- Video Consultations (7 endpoints)
- Payments & Transactions (14 endpoints)
- Member Claims (13 endpoints)
- Lab Diagnostics (37 endpoints)
- TPA Operations (11 endpoints)
- Notifications (9 endpoints)

**When to use:** API integration, frontend development, testing, API documentation

---

### 4. [DEPLOYMENT_INFRASTRUCTURE.md](./architecture/DEPLOYMENT_INFRASTRUCTURE.md) (963 lines)
**Purpose:** Complete deployment and infrastructure guide
**Contains:**
- 6 Docker Compose configurations (Development, Production, Simple, Secure, ECR, Secrets Manager)
- Container architecture
- Nginx configuration and routing
- Environment variables for all environments
- Deployment workflow (Manual & CI/CD)
- Health monitoring and checks
- Common Docker commands
- Comprehensive troubleshooting guide

**When to use:** DevOps, deployment, environment setup, infrastructure changes, debugging

---

## 🗄️ Database Schemas

**Location:** `/docs/database/`

Complete MongoDB database documentation with all 30 collections split by domain:

### 1. [DATABASE_OVERVIEW.md](./database/DATABASE_OVERVIEW.md) (297 lines)
**Purpose:** Database architecture and relationships
**Contains:**
- Database connection information
- Collections summary with document counts
- Relationships & foreign keys
- Data integrity rules
- Indexes & performance guidelines
- Sample queries
- Migration notes

---

### 2. [CORE_SCHEMAS.md](./database/CORE_SCHEMAS.md) (685 lines)
**Collections:** 6 core collections
**Contains:**
- `users` - User authentication, roles, profiles (245 lines)
- `policies` - Insurance policy definitions (88 lines)
- `plan_configs` - Versioned benefit configurations (206 lines)
- `userPolicyAssignments` - Policy-user linkage (74 lines)
- `counters` - Auto-increment sequences (32 lines)
- `auditLogs` - System audit trail with TTL (38 lines)

**When to use:** User management, policy configuration, audit tracking

---

### 3. [MASTER_DATA_SCHEMAS.md](./database/MASTER_DATA_SCHEMAS.md) (550 lines)
**Collections:** 5 master data collections
**Contains:**
- `category_master` - Service categories (91 lines)
- `service_master` - Services with pricing/coverage (113 lines)
- `relationship_masters` - Family relationships (94 lines)
- `cug_master` - Corporate user groups (61 lines)
- `specialty_master` - Medical specialties (33 lines)

**When to use:** Master data management, dropdowns, reference data

---

### 4. [HEALTHCARE_SCHEMAS.md](./database/HEALTHCARE_SCHEMAS.md) (844 lines)
**Collections:** 6 healthcare collections
**Contains:**
- `doctors` - Doctor profiles, clinics, authentication (193 lines)
- `clinics` - Clinic locations, operating hours (85 lines)
- `doctor_prescriptions` - Uploaded prescriptions (78 lines)
- `doctor_slots` - Weekly recurring availability (72 lines)
- `appointments` - Booking system (IN_CLINIC/ONLINE) (181 lines)
- `video_consultations` - WebRTC integration NEW v6.7 (187 lines)

**When to use:** Doctor portal, appointments, video consultations, clinic management

---

### 5. [WALLET_CLAIMS_SCHEMAS.md](./database/WALLET_CLAIMS_SCHEMAS.md) (827 lines)
**Collections:** 5 wallet & claims collections
**Contains:**
- `user_wallets` - Category-wise balance tracking (60 lines)
- `wallet_transactions` - Complete audit trail (58 lines)
- `memberclaims` - TPA integration with workflows (236 lines)
- `payments` - Payment gateway integration (92 lines)
- `transaction_summaries` - Wallet vs self-paid breakdown (133 lines)

**When to use:** Wallet management, claims processing, TPA operations, payments

---

### 6. [LAB_DIAGNOSTICS_SCHEMAS.md](./database/LAB_DIAGNOSTICS_SCHEMAS.md) (730 lines)
**Collections:** 7 lab diagnostics collections
**Contains:**
- `lab_prescriptions` - Prescription upload workflow (93 lines)
- `lab_carts` - Digitized test carts (101 lines)
- `lab_services` - Master test catalog (71 lines)
- `lab_vendors` - Partner laboratories (76 lines)
- `lab_vendor_pricing` - Vendor-specific pricing (53 lines)
- `lab_vendor_slots` - Sample collection scheduling (60 lines)
- `lab_orders` - Complete order lifecycle (213 lines)

**When to use:** Lab diagnostics feature, vendor management, order processing

---

### 7. [NOTIFICATIONS_SCHEMAS.md](./database/NOTIFICATIONS_SCHEMAS.md) (128 lines)
**Collections:** 1 notification collection
**Contains:**
- `notifications` - System notifications with priority levels

**When to use:** Notification system development, alerts

---

## 👥 Portal Documentation

**Location:** `/docs/portals/`

User-facing features organized by user role:

### 1. [ADMIN_PORTAL.md](./portals/ADMIN_PORTAL.md) (827 lines)
**Role:** SUPER_ADMIN, ADMIN
**Route:** `/admin/*`
**Features:**
- Dashboard overview
- Users management (External/Internal tabs)
- Policy management & assignments
- Categories & Services master data
- Relationships master data (NEW v6.8)
- Lab diagnostics admin (Services, Vendors, Pricing, Slots)

**Pages:** 11 main pages documented

---

### 2. [MEMBER_PORTAL.md](./portals/MEMBER_PORTAL.md) (1,695 lines)
**Role:** MEMBER
**Route:** `/member/*`
**Features:**
- Dashboard with wallet balance
- Profile management (NEW v6.6)
- Family context switching
- Appointments (IN_CLINIC & ONLINE)
- **Wallet payment toggle (NEW v6.9)** - Choose to use wallet for appointments
- Video consultations
- Claims & reimbursements
- Lab diagnostics (Upload, Booking, Orders)
- Orders & transaction history (NEW v6.8)
- Payment details (NEW v6.8)

**Pages:** 15+ main pages documented
**Navigation:** Bottom nav (Home, Claims, Bookings, Wallet)

---

### 3. [DOCTOR_PORTAL.md](./portals/DOCTOR_PORTAL.md) (1,067 lines)
**Role:** DOCTOR
**Route:** `/doctorview/*`
**Features:**
- Dashboard with date range picker
- Appointment management
- Appointment details & prescription upload
- Video consultations integration
- **Performance optimizations (v6.8):**
  - React.memo() optimization
  - useCallback hooks
  - ErrorBoundary component
  - Verbose logging removal

**Pages:** 5 main pages documented

---

### 4. [OPERATIONS_PORTAL.md](./portals/OPERATIONS_PORTAL.md) (1,651 lines)
**Role:** OPS
**Route:** `/operations/*`
**Features:**
- Dashboard overview
- Doctors management
- Clinics management
- Appointments overview
- Lab diagnostics:
  - Prescription queue & digitization
  - Lab orders management
  - Sample collection coordination
  - Report upload
- Members management

**Pages:** 8 main pages documented
**Workflows:** Complete end-to-end lab workflow documentation

---

### 5. TPA Portal (Split into 4 Documents)

#### 5a. [TPA_PORTAL_OVERVIEW.md](./portals/TPA_PORTAL_OVERVIEW.md) (1,207 lines)
**Role:** TPA, TPA_ADMIN, TPA_USER
**Route:** `/tpa/*`
**Contains:**
- Overview and access roles
- Claim status flow
- Complete API reference (12 endpoints)
- Database integration
- DTOs and data structures
- Glossary

---

#### 5b. [TPA_WORKFLOWS.md](./portals/TPA_WORKFLOWS.md) (986 lines)
**Contains:**
- Claim assignment workflow (with workload balancing)
- Claim review workflow (3 outcomes: Approve, Reject, Request Documents)
- Analytics dashboard specifications
- Complete workflow diagrams
- SLAs and performance metrics
- Performance monitoring

---

#### 5c. [TPA_DECISION_TREES.md](./portals/TPA_DECISION_TREES.md) (631 lines)
**Contains:**
- Claim approval decision tree
- Document completeness check
- Claim priority assignment
- Common rejection codes
- Approval calculation examples
- Escalation matrix

---

#### 5d. [TPA_BEST_PRACTICES.md](./portals/TPA_BEST_PRACTICES.md) (857 lines)
**Contains:**
- Claim assignment best practices
- Claim review best practices
- Communication guidelines
- Efficiency tips
- Quality assurance
- Fraud detection
- Continuous improvement
- Stress management
- Quick reference checklists

---

## 📋 Original Comprehensive Documents

**Location:** `/docs/` (root)

These are the original large documents kept as backup reference:

### [01_PRODUCT_ARCHITECTURE.md](./01_PRODUCT_ARCHITECTURE.md) (3,619 lines)
Original comprehensive architecture document (now split into 4 files above)

### [02_DATA_SCHEMA_AND_CREDENTIALS.md](./02_DATA_SCHEMA_AND_CREDENTIALS.md) (3,856 lines)
Original comprehensive database document (now split into 7 files above)

### [TPA_PORTAL.md](./TPA_PORTAL.md) (2,859 lines)
Original comprehensive TPA document (now split into 4 files above)

---

## 🔍 How to Find What You Need

### For New Developers:
1. Start with [ARCHITECTURE_OVERVIEW.md](./architecture/ARCHITECTURE_OVERVIEW.md)
2. Read [DATABASE_OVERVIEW.md](./database/DATABASE_OVERVIEW.md)
3. Choose your role-specific portal documentation
4. Reference [API_ENDPOINTS.md](./architecture/API_ENDPOINTS.md) as needed

### For Frontend Developers:
1. Read your portal documentation (Member, Admin, Doctor, Operations, or TPA)
2. Reference [API_ENDPOINTS.md](./architecture/API_ENDPOINTS.md) for integration
3. Check [ARCHITECTURE_OVERVIEW.md](./architecture/ARCHITECTURE_OVERVIEW.md) for frontend architecture

### For Backend Developers:
1. Read [BACKEND_ARCHITECTURE.md](./architecture/BACKEND_ARCHITECTURE.md)
2. Reference specific schema documents in `/database/`
3. Use [API_ENDPOINTS.md](./architecture/API_ENDPOINTS.md) for endpoint specs

### For DevOps/Infrastructure:
1. Read [DEPLOYMENT_INFRASTRUCTURE.md](./architecture/DEPLOYMENT_INFRASTRUCTURE.md)
2. Reference [DATABASE_OVERVIEW.md](./database/DATABASE_OVERVIEW.md) for connection strings

### For Product/Business:
1. Read portal documentation for user features
2. Check [ARCHITECTURE_OVERVIEW.md](./architecture/ARCHITECTURE_OVERVIEW.md) for capabilities
3. Review decision trees and workflows in TPA documentation

---

## 📁 Directory Structure

```
/docs/
├── README.md (this file - master index)
├── DOCUMENTATION_INDEX.md (legacy index)
├── AUDIT_SUMMARY_OCT2025.md (audit history)
│
├── /architecture/ (4 files - 3,350 lines total)
│   ├── ARCHITECTURE_OVERVIEW.md (622 lines)
│   ├── BACKEND_ARCHITECTURE.md (1,080 lines)
│   ├── API_ENDPOINTS.md (685 lines)
│   └── DEPLOYMENT_INFRASTRUCTURE.md (963 lines)
│
├── /database/ (7 files - 4,061 lines total)
│   ├── DATABASE_OVERVIEW.md (297 lines)
│   ├── CORE_SCHEMAS.md (685 lines)
│   ├── MASTER_DATA_SCHEMAS.md (550 lines)
│   ├── HEALTHCARE_SCHEMAS.md (844 lines)
│   ├── WALLET_CLAIMS_SCHEMAS.md (827 lines)
│   ├── LAB_DIAGNOSTICS_SCHEMAS.md (730 lines)
│   └── NOTIFICATIONS_SCHEMAS.md (128 lines)
│
├── /portals/ (8 files - 8,270 lines total)
│   ├── ADMIN_PORTAL.md (827 lines)
│   ├── MEMBER_PORTAL.md (1,695 lines)
│   ├── DOCTOR_PORTAL.md (1,067 lines)
│   ├── OPERATIONS_PORTAL.md (1,651 lines)
│   ├── TPA_PORTAL_OVERVIEW.md (1,207 lines)
│   ├── TPA_WORKFLOWS.md (986 lines)
│   ├── TPA_DECISION_TREES.md (631 lines)
│   └── TPA_BEST_PRACTICES.md (857 lines)
│
└── Originals (kept as backup)
    ├── 01_PRODUCT_ARCHITECTURE.md (3,619 lines)
    ├── 02_DATA_SCHEMA_AND_CREDENTIALS.md (3,856 lines)
    └── TPA_PORTAL.md (2,859 lines)
```

---

## 🔄 Document Maintenance

### Versioning
All documents now include:
- Last Updated date
- Version information
- Cross-references to related documents

### Updates
When updating documentation:
1. Update the specific focused document (not the original)
2. Update cross-references if adding new sections
3. Update this README if adding new documents
4. Keep original backup files unchanged (for reference)

### Finding Information
Use your editor's search across the `/docs/` directory, or:
- **Architecture topics:** Search `/architecture/` folder
- **Database schemas:** Search `/database/` folder
- **User features:** Search `/portals/` folder

---

## 📊 Documentation Statistics

| Category | Files | Total Lines | Average per File |
|----------|-------|-------------|------------------|
| Architecture | 4 | 3,350 | 838 |
| Database | 7 | 4,061 | 580 |
| Portals | 8 | 8,270 | 1,034 |
| **Total** | **19** | **15,681** | **826** |

**Previous state:** 3 files, 10,334 lines, avg 3,445 lines per file
**Improvement:** 6.3x more navigable, 4.2x smaller average file size

---

## 🎯 Key Features Documented

- ✅ All 5 portals (Admin, Member, Doctor, Operations, TPA)
- ✅ 194+ API endpoints across 12 modules
- ✅ 30 MongoDB collections with complete schemas
- ✅ 6 Docker deployment configurations
- ✅ Complete authentication & authorization flows
- ✅ Wallet payment toggle feature (NEW v6.9)
- ✅ Video consultations (v6.7)
- ✅ Payment & transaction history (v6.8)
- ✅ Lab diagnostics end-to-end workflow
- ✅ TPA claim processing workflows

---

## 📞 Documentation Support

For questions or suggestions about documentation:
1. Check this index for the right document
2. Use your editor's search functionality
3. Reference cross-links within documents
4. Contact the development team for clarifications

---

**Documentation Restructured:** October 20, 2025
**Previous Total:** 10,334 lines in 3 files
**Current Total:** 15,681 lines in 19 focused documents
**Improvement:** Better organized, easier to navigate, role-specific content
