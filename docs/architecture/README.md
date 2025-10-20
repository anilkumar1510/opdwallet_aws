# Architecture Documentation

This directory contains the split and organized architecture documentation for the OPD Wallet project.

## Documents

### 1. [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) (~622 lines)
**Purpose**: High-level system architecture and overview

**Contents**:
- System Overview & Features
- Complete Technology Stack
- High-Level Architecture Diagrams
- Component Communication Flow
- Design Patterns Overview
- Frontend Architecture Overview
- Database Architecture Overview
- Authentication & Authorization
- Security Architecture
- Known Issues & Gaps

**Target Audience**: New developers, stakeholders, technical leads

---

### 2. [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) (~1080 lines)
**Purpose**: Detailed backend implementation guide

**Contents**:
- Complete NestJS Module Structure (all 19 modules)
- Backend Design Patterns
  - Dependency Injection
  - Guard-Based Authorization
  - DTO Validation
  - Schema-First Mongoose Models
- Module Descriptions (Core, Healthcare, Claims, Lab, Supporting)
- Authentication Architecture (JWT, Sessions)
- Authorization System (Roles, Permissions)
- Data Validation Patterns
- Error Handling
- File Upload System (Multer configurations)
- Integration Points (Google Maps, Module dependencies)

**Target Audience**: Backend developers, system architects

---

### 3. [API_ENDPOINTS.md](./API_ENDPOINTS.md) (~685 lines)
**Purpose**: Complete API reference documentation

**Contents**:
- 100+ API Endpoints organized by module:
  - Authentication (7 endpoints)
  - User Management (9 endpoints)
  - Policy & Configuration (20+ endpoints)
  - Master Data (30+ endpoints)
  - Healthcare Services (25+ endpoints)
  - Appointments & Consultations (15+ endpoints)
  - Claims & Reimbursements (16+ endpoints)
  - Lab Diagnostics (37 endpoints)
  - TPA Operations (11 endpoints)
  - Payments & Transactions (8 endpoints)
  - Notifications (5 endpoints)
- Request/Response schemas
- Query parameters
- File upload specifications
- API response standards
- HTTP status codes
- Authentication details

**Target Audience**: Frontend developers, API consumers, QA testers

---

### 4. [DEPLOYMENT_INFRASTRUCTURE.md](./DEPLOYMENT_INFRASTRUCTURE.md) (~963 lines)
**Purpose**: Deployment and infrastructure guide

**Contents**:
- 6 Docker Compose Configurations
  - Development
  - Production
  - Simple
  - Secure
  - ECR
  - Secrets
- Container Architecture diagrams
- Nginx Configuration (routing, rate limiting)
- Environment Variables (all configurations)
- Deployment Workflow
  - Manual deployment steps
  - CI/CD pipeline (GitHub Actions)
- Health Monitoring
- Common Commands (development, production, database)
- Troubleshooting Guide
- Security Best Practices
- Backup & Recovery procedures

**Target Audience**: DevOps engineers, system administrators, deployment teams

---

## Document Relationships

```
┌─────────────────────────────────────────────────────┐
│         ARCHITECTURE_OVERVIEW.md                    │
│         (Start here for new team members)           │
└───────────────┬──────────────┬──────────────────────┘
                │              │
        ┌───────▼──────┐   ┌───▼────────────────┐
        │   BACKEND    │   │   DEPLOYMENT       │
        │ ARCHITECTURE │   │ INFRASTRUCTURE     │
        └──────┬───────┘   └────────────────────┘
               │
        ┌──────▼───────┐
        │     API      │
        │  ENDPOINTS   │
        └──────────────┘
```

## Cross-References

Each document includes cross-references to related documents:
- **ARCHITECTURE_OVERVIEW.md** → Links to all other documents
- **BACKEND_ARCHITECTURE.md** → References ARCHITECTURE_OVERVIEW, API_ENDPOINTS
- **API_ENDPOINTS.md** → References ARCHITECTURE_OVERVIEW, BACKEND_ARCHITECTURE
- **DEPLOYMENT_INFRASTRUCTURE.md** → References ARCHITECTURE_OVERVIEW

## How to Use

### For New Developers
1. Start with `ARCHITECTURE_OVERVIEW.md` for system understanding
2. Read `BACKEND_ARCHITECTURE.md` for module details
3. Reference `API_ENDPOINTS.md` for API integration
4. Check `DEPLOYMENT_INFRASTRUCTURE.md` for environment setup

### For Frontend Developers
1. Quick read of `ARCHITECTURE_OVERVIEW.md`
2. Deep dive into `API_ENDPOINTS.md`
3. Reference authentication sections in `BACKEND_ARCHITECTURE.md`

### For Backend Developers
1. Read `BACKEND_ARCHITECTURE.md` thoroughly
2. Reference `API_ENDPOINTS.md` for endpoint contracts
3. Check `ARCHITECTURE_OVERVIEW.md` for system context

### For DevOps/Infrastructure
1. Start with `DEPLOYMENT_INFRASTRUCTURE.md`
2. Reference `ARCHITECTURE_OVERVIEW.md` for system context
3. Check environment variables in all documents

## Original Documentation

The complete, monolithic documentation is available at:
- `/Users/turbo/Projects/opdwallet/docs/01_PRODUCT_ARCHITECTURE.md` (3619 lines)

**Note**: The original file has been preserved as backup. These split documents contain all the same information, just better organized.

## Document Statistics

| Document | Lines | Size | Focus |
|----------|-------|------|-------|
| ARCHITECTURE_OVERVIEW.md | 622 | 24KB | System overview & high-level design |
| BACKEND_ARCHITECTURE.md | 1080 | 29KB | Backend implementation details |
| API_ENDPOINTS.md | 685 | 25KB | Complete API reference |
| DEPLOYMENT_INFRASTRUCTURE.md | 963 | 21KB | Deployment & operations |
| **Total** | **3350** | **99KB** | **Complete documentation** |

## Maintenance

**Last Updated**: October 20, 2025
**Maintained By**: Development Team
**Update Frequency**: After major features or every 2 weeks

### When to Update

- New module added → Update BACKEND_ARCHITECTURE.md + API_ENDPOINTS.md
- API endpoint changes → Update API_ENDPOINTS.md
- Deployment changes → Update DEPLOYMENT_INFRASTRUCTURE.md
- System architecture changes → Update ARCHITECTURE_OVERVIEW.md

---

**Generated from**: `01_PRODUCT_ARCHITECTURE.md`
**Split Date**: October 20, 2025
**Content Verified**: All sections preserved
