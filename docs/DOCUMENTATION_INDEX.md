# OPD Wallet - Documentation Index

**Last Updated**: October 5, 2025  
**Version**: 1.0

---

## 📚 Documentation Structure

This documentation is organized in a **portal-centric approach** for better clarity and maintainability.

### High-Level Documentation

1. **[Product Architecture](./01_PRODUCT_ARCHITECTURE.md)** - System overview, tech stack, deployment
2. **[Database Schema](./02_DATA_SCHEMA_AND_CREDENTIALS.md)** - Database collections, relationships, credentials

### Portal-Specific Documentation

3. **[Admin Portal](./ADMIN_PORTAL.md)** ✅ - Admin functionalities, lab management, master data
4. **[Member Portal](./MEMBER_PORTAL.md)** ✅ - Member features, appointments, claims, lab tests
5. **[Operations Portal](./OPERATIONS_PORTAL.md)** ✅ - OPS team workflows, prescription digitization, order management
6. **[TPA Portal](./TPA_PORTAL.md)** ✅ - TPA claim assignment, review, approval workflows

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
│                    │  26 Collections│                       │
│                    └────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Total Collections**: 26  
**Total API Endpoints**: 100+  
**Total Frontend Pages**: 60+

---

## 🔄 Recent Updates (October 5, 2025)

### Major Additions
- ✅ **Lab Diagnostics Module** - Complete end-to-end workflow (8 new collections, 37 endpoints)
- ✅ **TPA Module** - Claims processing workflow (11 endpoints)
- ✅ **Operations Portal** - Unified portal at `/operations`
- ✅ **Member Claims Enhancements** - TPA integration

### Documentation Updates
- ✅ Created portal-specific documentation structure
- ✅ Created ADMIN_PORTAL.md (19 KB, 550+ lines)
- ✅ Created MEMBER_PORTAL.md (21 KB, 957 lines)
- ✅ Created OPERATIONS_PORTAL.md (64 KB, 1,500 lines)
- ✅ Created TPA_PORTAL.md (97 KB, 2,969 lines)
- ⏳ Updating high-level architecture document
- ⏳ Updating database schema with 8 new lab collections

---

## 📝 Contributing to Documentation

When updating documentation:
1. Update the relevant portal-specific document
2. Update high-level docs if architecture changes
3. Update this index if new sections are added
4. Keep cross-references up to date

---

**For Questions**: Contact development team  
**Last Audit**: October 5, 2025
