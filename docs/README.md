# OPD Wallet - Documentation Index

Welcome to the OPD Wallet documentation! This folder contains comprehensive documentation for the entire platform.

**Last Updated:** January 2025

---

## 📚 Quick Start

New to the project? Start here:

1. **[Project Overview](./PROJECT_OVERVIEW.md)** - Understand what OPD Wallet does and how it works
2. **[Database and Configuration](./DATABASE_AND_CONFIG.md)** - Database schema and configuration
3. **[Manual Deployment](./MANUAL_DEPLOYMENT.md)** - How to deploy the application

---

## 🎯 Portal Documentation

Detailed documentation for each portal:

### User Portals

| Portal | Description | Documentation |
|--------|-------------|---------------|
| **Member Portal** | For patients/employees using health benefits | [MEMBER_PORTAL.md](./MEMBER_PORTAL.md) |
| **Doctor Portal** | For healthcare providers conducting consultations | [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) |
| **Admin Portal** | For platform management and configuration | [ADMIN_PORTAL.md](./ADMIN_PORTAL.md) |

### Staff Portals (Internal)

| Portal | Description | Status |
|--------|-------------|--------|
| **TPA Portal** | For insurance claim processors | Active |
| **Operations Portal** | For operations team managing bookings and services | Active |
| **Finance Portal** | For finance team processing payments | Active |

---

## 🔌 API Documentation

Complete API reference for all portals:

### Consolidated API Reference

- **[API Reference](./API_REFERENCE.md)** - Main API documentation with authentication, common patterns, and links to all portal APIs

### Portal-Specific API Documentation

| Portal | Endpoints | Documentation |
|--------|-----------|---------------|
| **Member Portal** | ~80 endpoints | [LATEST_API_ENDPOINTS_MEMBER.md](./LATEST_API_ENDPOINTS_MEMBER.md) |
| **Admin Portal** | ~90 endpoints | [LATEST_API_ENDPOINTS_ADMIN.md](./LATEST_API_ENDPOINTS_ADMIN.md) |
| **Doctor Portal** | ~25 endpoints | [LATEST_API_ENDPOINTS_DOCTOR.md](./LATEST_API_ENDPOINTS_DOCTOR.md) |
| **TPA Portal** | ~15 endpoints | [LATEST_API_ENDPOINTS_TPA.md](./LATEST_API_ENDPOINTS_TPA.md) |
| **Operations Portal** | ~104 endpoints | [LATEST_API_ENDPOINTS_OPERATIONS.md](./LATEST_API_ENDPOINTS_OPERATIONS.md) |
| **Finance Portal** | ~9 endpoints | [LATEST_API_ENDPOINTS_FINANCE.md](./LATEST_API_ENDPOINTS_FINANCE.md) |

### Specialized API Documentation

- **[Policy Services API](./API_REFERENCE_POLICY_SERVICES.md)** - Policy management API reference

---

## 📄 Frontend Page Documentation

Complete list of all pages in each portal:

| Portal | Documentation |
|--------|---------------|
| **Member Portal** | [LATEST_FRONTEND_PAGES_MEMBER.md](./LATEST_FRONTEND_PAGES_MEMBER.md) |
| **Admin Portal** | [LATEST_FRONTEND_PAGES_ADMIN.md](./LATEST_FRONTEND_PAGES_ADMIN.md) |
| **Doctor Portal** | [LATEST_FRONTEND_PAGES_DOCTOR.md](./LATEST_FRONTEND_PAGES_DOCTOR.md) |
| **TPA Portal** | [LATEST_FRONTEND_PAGES_TPA.md](./LATEST_FRONTEND_PAGES_TPA.md) |
| **Operations Portal** | [LATEST_FRONTEND_PAGES_OPERATIONS.md](./LATEST_FRONTEND_PAGES_OPERATIONS.md) |
| **Finance Portal** | [LATEST_FRONTEND_PAGES_FINANCE.md](./LATEST_FRONTEND_PAGES_FINANCE.md) |

---

## 🧪 Testing Documentation

Guides for testing the platform:

- **[Portal Testing Guide](./PORTAL_TESTING_GUIDE.md)** - Comprehensive testing procedures for all portals
- **[Lab Testing Guide](./LAB_TESTING_GUIDE.md)** - Lab module testing procedures

---

## 📋 Project Management

- **[Changelog](./CHANGELOG.md)** - Version history and release notes

---

## 🛠️ Development Workflow

### Claude Code Integration

This project uses **Claude Code** for AI-assisted development with enforced project rules and best practices.

**Project Rules System:**
- Comprehensive development guidelines in `.claude/project-rules.md`
- Mandatory pre-task and post-task checklists in `.claude/START_CHECKLIST.md`
- Automatic enforcement via SessionStart hook with visual warning banners

**Key Requirements:**
- ✅ **Analysis Before Action** - Thorough analysis with proof validation required before any changes
- ✅ **Documentation Updates** - MANDATORY after every code change (update relevant docs/ files and CHANGELOG.md)
- ✅ **Code Quality** - Robust fixes only, never break project structure
- ✅ **Testing Protocol** - Browser automation for UI changes, check both backend and frontend logs
- ✅ **Task Tracking** - Use PLAN.md for multi-step tasks
- ✅ **New Features** - Review existing APIs and system context before building

**Configuration Files:**
- `.claude/project-rules.md` - Complete project development guidelines (9 rules)
- `.claude/START_CHECKLIST.md` - Pre/post-task checklists with warning banners
- `.claude/settings.local.json` - User-specific local configuration (not committed)

**For Developers:**
When starting a new Claude Code session, you'll see prominent warning banners and checklists ensuring rules are read and followed.

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend (6 Portals):**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- ShadcN UI Components

**Backend:**
- Node.js + Express
- MongoDB (Database)
- AWS Secrets Manager (Credentials)
- Daily.co (Video Consultations)

**Deployment:**
- AWS EC2 (API Server)
- PM2 (Process Manager)
- Nginx (Reverse Proxy)

### Project Structure

```
opdwallet_aws/
├── api/                    # Backend API server (Node.js + Express)
├── web-member/             # Member Portal (Next.js)
├── web-admin/              # Admin Portal (Next.js)
├── web-doctor/             # Doctor Portal (Next.js)
├── web-tpa/                # TPA Portal (Next.js)
├── web-operations/         # Operations Portal (Next.js)
├── web-finance/            # Finance Portal (Next.js)
└── docs/                   # Documentation (you are here!)
```

### Ports (Development)

| Service | Port | URL |
|---------|------|-----|
| Backend API | 4000 | http://localhost:4000 |
| Member Portal | 3001 | http://localhost:3001 |
| Admin Portal | 3002 | http://localhost:3002 |
| Doctor Portal | 3003 | http://localhost:3003 |
| TPA Portal | 3004 | http://localhost:3004 |
| Operations Portal | 3005 | http://localhost:3005 |
| Finance Portal | 3006 | http://localhost:3006 |

---

## 🔐 User Roles

The platform supports the following user roles:

### External Users (stored in `users` collection)

| Role | Description | Portal Access |
|------|-------------|---------------|
| **MEMBER** | Patients/employees using health benefits | Member Portal |
| **DOCTOR** | Healthcare providers | Doctor Portal |

### Internal Users (stored in `internal_users` collection)

| Role | Description | Portal Access |
|------|-------------|---------------|
| **SUPER_ADMIN** | Platform super administrator | Admin Portal (full access) |
| **ADMIN** | Company/corporate administrator | Admin Portal (company-specific) |
| **TPA_ADMIN** | TPA administrator | TPA Portal (full access) |
| **TPA_USER** | Claim processor | TPA Portal (assigned claims) |
| **FINANCE_USER** | Finance team member | Finance Portal |
| **OPS** | Operations team member | Operations Portal |

---

## 📖 How to Use This Documentation

### For New Developers

1. Start with [Project Overview](./PROJECT_OVERVIEW.md) to understand the business
2. Read [Database and Configuration](./DATABASE_AND_CONFIG.md) for technical setup
3. Review portal-specific documentation based on your work area
4. Use [API Reference](./API_REFERENCE.md) when integrating frontend with backend

### For Frontend Developers

1. Check the relevant portal documentation (e.g., [MEMBER_PORTAL.md](./MEMBER_PORTAL.md))
2. Review [LATEST_FRONTEND_PAGES_*.md](./LATEST_FRONTEND_PAGES_MEMBER.md) for page structure
3. Use [API Reference](./API_REFERENCE.md) for backend integration

### For Backend Developers

1. Review [API Reference](./API_REFERENCE.md) for endpoint specifications
2. Check portal-specific API docs for detailed endpoint requirements
3. Refer to [Database and Configuration](./DATABASE_AND_CONFIG.md) for schema details

### For QA/Testing

1. Use [Portal Testing Guide](./PORTAL_TESTING_GUIDE.md) for comprehensive testing
2. Use [Lab Testing Guide](./LAB_TESTING_GUIDE.md) for lab module testing
3. Reference API documentation for API testing

### For DevOps

1. Review [Manual Deployment](./MANUAL_DEPLOYMENT.md) for deployment procedures
2. Check [Database and Configuration](./DATABASE_AND_CONFIG.md) for environment setup

---

## 🤝 Contributing to Documentation

When updating documentation:

1. **Keep it current** - Update documentation when features change
2. **Be specific** - Include examples, code snippets, and screenshots where helpful
3. **Link related docs** - Cross-reference related documentation
4. **Update this index** - Add new documentation files to this README
5. **Follow the format** - Match the style of existing documentation

---

## 📞 Support

For questions about the documentation:

- **Technical Lead:** Contact your team lead
- **Documentation Issues:** Create an issue in the repository
- **API Questions:** Refer to [API Reference](./API_REFERENCE.md)

---

## 📝 Document Maintenance

**Maintenance Schedule:**
- **Quarterly Review:** Review all documentation every 3 months
- **Release Updates:** Update CHANGELOG.md with every release
- **API Changes:** Update API docs immediately when endpoints change
- **Major Features:** Create or update relevant documentation when adding major features

**Last Documentation Review:** January 2025
**Next Scheduled Review:** April 2025

---

**Happy coding! 🚀**
