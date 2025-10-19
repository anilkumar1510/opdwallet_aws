# OPD Wallet - Complete Product Architecture

**Last Updated**: October 18, 2025
**Current Deployment**: http://51.20.125.246
**Production Status**: Active - Core Features Operational (95% Complete)
**Architecture Type**: Monolithic Backend with Microservices-Ready Structure
**Documentation Version**: 6.8 (Latest Changes: Payments Module, Transaction Summary, Orders & Payments UI, Doctor Portal Optimizations)

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Database Architecture](#database-architecture)
7. [API Documentation](#api-documentation)
8. [Authentication & Authorization](#authentication--authorization)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Environment Configuration](#environment-configuration)
12. [Integration Points](#integration-points)
13. [Known Issues & Gaps](#known-issues--gaps)
14. [Roadmap](#roadmap)

---

## 📊 SYSTEM OVERVIEW

### Purpose
OPD Wallet is a corporate health benefit management platform designed to manage outpatient department (OPD) insurance policies, user assignments, wallet balances, and health service bookings. It serves as a comprehensive solution for corporate health benefit administration with distinct portals for administrators and members.

### Key Features
- **Policy Management**: Create and manage insurance policies with versioned configurations
- **User Management**: Handle primary members and their dependents with relationship tracking
- **Wallet System**: Category-wise wallet balance management with transaction tracking
- **Benefit Configuration**: Flexible benefit configuration per policy with member-specific overrides
- **Assignment System**: Link users to policies with effective date tracking
- **Master Data**: Centralized management of categories, services, relationships, and CUGs
- **Audit Trail**: Comprehensive audit logging of all system actions
- **Role-Based Access**: Multi-role support (SUPER_ADMIN, ADMIN, TPA, OPS, MEMBER)

### Current Status
**Operational Components**: 95%
- ✅ Authentication & Authorization System
- ✅ User Management (Primary + Dependents) - 4 users
- ✅ Policy Management
- ✅ Assignment System (With automatic wallet initialization)
- ✅ Plan Configuration (Versioned)
- ✅ Master Data Management
- ✅ Specialty Master (9 specialties)
- ✅ Doctors Management (6 doctors with enhanced fields)
- ✅ Clinics Management (5 clinics with operating hours)
- ✅ Doctor Slots (18 weekly recurring slots)
- ✅ Appointments (Slot-based scheduling with IN_CLINIC and ONLINE booking)
- ✅ Member Claims (Unified reimbursement and pre-auth system with file upload)
- ✅ Lab Diagnostics (Complete prescription → digitization → order → report workflow)
- ✅ TPA Module (Claims assignment, review, approval/rejection workflow)
- ✅ Operations Portal (Unified /operations for Doctors, Appointments, Lab)
- ✅ Audit Logging
- ✅ **Wallet System (Auto-initialization on assignment, category-wise balances)** - UPGRADED ✨
- ❌ Health Records (UI only, no backend)

---

## 🛠️ TECHNOLOGY STACK

### Backend API
| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.1.6 | Backend framework |
| **Node.js** | 20.x | Runtime environment |
| **TypeScript** | 5.9.2 | Type-safe development |
| **MongoDB** | 7.0 | Primary database |
| **Mongoose** | 8.18.1 | ODM for MongoDB |
| **Passport** | 0.7.0 | Authentication framework |
| **passport-jwt** | 4.0.1 | JWT strategy |
| **passport-local** | 1.0.0 | Local strategy |
| **bcrypt** | 6.0.0 | Password hashing |
| **class-validator** | 0.14.2 | DTO validation |
| **class-transformer** | 0.5.1 | Object transformation |
| **@nestjs/config** | 4.0.2 | Configuration management |
| **@nestjs/swagger** | 11.2.0 | API documentation |
| **helmet** | 8.1.0 | Security headers |
| **express-rate-limit** | 8.1.0 | Rate limiting |
| **@aws-sdk/client-secrets-manager** | 3.888.0 | AWS Secrets Manager integration |
| **@googlemaps/google-maps-services-js** | 3.4.2 | ✨ Google Maps API client (NEW) |
| **multer** | 1.4.5-lts.1 | File upload middleware (✅ 2 upload directories) |
| **@types/multer** | 2.0.0 | TypeScript types for multer |

### Admin Portal (web-admin)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.3 | React framework (App Router) |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.3.3 | Type safety |
| **TailwindCSS** | 3.4.0 | Styling |
| **Radix UI** | Latest | Component library |
| **TanStack Query** | 5.17.9 | Server state management |
| **Zustand** | 4.4.7 | Client state management |
| **React Hook Form** | 7.48.2 | Form management |
| **Zod** | 3.22.4 | Schema validation |
| **Axios** | 1.6.5 | HTTP client |

### Member Portal (web-member)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.0.4 | React framework (App Router) |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.3.3 | Type safety |
| **TailwindCSS** | 3.4.0 | Styling |
| **Framer Motion** | 12.23.12 | Animations |
| **Axios** | 1.6.5 | HTTP client |
| **Heroicons** | 2.2.0 | Icon library |
| **Sonner** | Latest | Toast notifications (✅ NEW) |

### Doctor Portal (web-doctor)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.3 | React framework (App Router) |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.x | Type safety |
| **TailwindCSS** | 3.4.1 | Styling |
| **Heroicons** | 2.2.0 | Icon library |
| **@jitsi/react-sdk** | 1.4.4 | Video consultation integration |
| **uuid** | 13.0.0 | UUID generation |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | Latest | Containerization |
| **Docker Compose** | Latest | Multi-container orchestration |
| **Nginx** | Alpine | Reverse proxy & load balancer |
| **AWS EC2** | - | Production hosting |
| **GitHub Actions** | - | CI/CD pipeline |

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Admin/Ops Users│  │  TPA Users      │  │  Member Users   │  │
│  │ (Desktop/Web)  │  │  (Desktop/Web)  │  │  (Mobile/Web)   │  │
│  └────────┬───────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼──────────────────┼─────────────────────┼─────────────┘
            │                  │                     │
            └─────────────────┴──────────┬──────────┘
                                         │
┌──────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (NGINX)                         │
│                    Port 80/443 (HTTP/HTTPS)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Route /api/*          → API Backend (Port 4000)        │   │
│  │  Route /admin/*        → Admin Portal (Port 3001) ✨    │   │
│  │  Route /operations/*   → Operations Portal (Port 3001)  │   │
│  │  Route /tpa/*          → TPA Portal (Port 3001) ✨      │   │
│  │  Route /finance/*      → Finance Portal (Port 3001) ✨  │   │
│  │  Route /*              → Member Portal (Port 3002)      │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼─────────┐  ┌───────▼─────────┐  ┌──────▼───────┐
│  Admin Portal   │  │ Member Portal   │  │  NestJS API  │
│  (Next.js 15)   │  │ (Next.js 14)    │  │  (Backend)   │
│  Port: 3001     │  │ Port: 3002      │  │  Port: 4000  │
│                 │  │                 │  │              │
│  - Dashboard    │  │  - Dashboard    │  │  - Auth      │
│  - Users        │  │  - Wallet       │  │  - Users     │
│  - Policies     │  │  - Benefits     │  │  - Policies  │
│  - Lab Services │  │  - Bookings     │  │  - Config    │
│  - Master Data  │  │  - Claims       │  │  - Masters   │
│                 │  │  - Lab Tests    │  │  - Wallet    │
│  SEPARATE:      │  │  - Family       │  │  - Lab       │
│  /tpa ✨        │  │                 │  │  - TPA       │
│  /finance ✨    │  │                 │  │  - Claims    │
│  /operations    │  │                 │  │              │
│                 │  │                 │  │              │
└─────────────────┘  └─────────────────┘  └──────┬───────┘
                                                  │
                                          ┌───────▼───────┐
                                          │   MongoDB     │
                                          │   Port: 27017 │
                                          │               │
                                          │ 26 Collections│
                                          │ - users       │
                                          │ - policies    │
                                          │ - plan_configs│
                                          │ - assignments │
                                          │ - memberclaims│
                                          │ - doctors/apt │
                                          │ - clinics     │
                                          │ - lab_* (8)   │
                                          │ - masters (4) │
                                          │ - wallets     │
                                          │ - audit       │
                                          └───────────────┘
```

### Component Communication Flow

```
User Request Flow:
1. User → Nginx (Port 80/443)
2. Nginx → Route to appropriate service
3. Service → Authenticate with JWT
4. Service → Validate permissions
5. Service → Process business logic
6. Service → Database operations
7. Service → Return response
8. Nginx → Forward to user

Authentication Flow:
1. User submits credentials → API /auth/login
2. API validates credentials (bcrypt)
3. API generates JWT token (7d expiry)
4. API sets HTTP-only secure cookie
5. API returns user profile
6. Frontend stores auth state
7. Subsequent requests include cookie
8. API validates JWT on each request
```

---

## 🔧 BACKEND ARCHITECTURE

### NestJS Module Structure

```
api/src/
├── app.module.ts                 # Root module
├── main.ts                       # Application bootstrap
├── config/
│   └── configuration.ts          # Environment config loader
├── modules/
│   ├── auth/                     # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       └── login.dto.ts
│   ├── users/                    # User management module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── schemas/
│   │   │   └── user.schema.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   ├── policies/                 # Policy management module
│   │   ├── policies.module.ts
│   │   ├── policies.controller.ts
│   │   ├── policies.service.ts
│   │   ├── schemas/
│   │   │   └── policy.schema.ts
│   │   └── dto/
│   │       ├── create-policy.dto.ts
│   │       └── update-policy.dto.ts
│   ├── assignments/              # Assignment module
│   │   ├── assignments.module.ts
│   │   ├── assignments.controller.ts
│   │   ├── assignments.service.ts
│   │   ├── schemas/
│   │   │   └── assignment.schema.ts
│   │   └── dto/
│   │       └── create-assignment.dto.ts
│   ├── plan-config/              # Plan configuration module
│   │   ├── plan-config.module.ts
│   │   ├── plan-config.controller.ts
│   │   ├── plan-config.service.ts
│   │   ├── schemas/
│   │   │   └── plan-config.schema.ts
│   │   └── dto/
│   │       ├── create-plan-config.dto.ts
│   │       └── update-plan-config.dto.ts
│   ├── masters/                  # Master data module
│   │   ├── masters.module.ts
│   │   ├── controllers/
│   │   │   ├── category-master.controller.ts
│   │   │   ├── service-master.controller.ts
│   │   │   ├── cug-master.controller.ts
│   │   │   └── relationship-master.controller.ts
│   │   ├── services/
│   │   │   ├── category-master.service.ts
│   │   │   ├── service-master.service.ts
│   │   │   ├── cug-master.service.ts
│   │   │   └── relationship-master.service.ts
│   │   ├── schemas/
│   │   │   ├── category-master.schema.ts
│   │   │   ├── service-master.schema.ts
│   │   │   ├── cug-master.schema.ts
│   │   │   └── relationship-master.schema.ts
│   │   └── dto/
│   ├── wallet/                   # Wallet management module
│   │   ├── wallet.module.ts
│   │   ├── wallet.service.ts     # ⚠️ No controller exposed
│   │   └── schemas/
│   │       ├── user-wallet.schema.ts
│   │       └── wallet-transaction.schema.ts
│   ├── specialty-master/         # Medical specialty master module (✅ FULLY IMPLEMENTED)
│   │   ├── specialty-master.module.ts
│   │   ├── specialty-master.controller.ts
│   │   ├── specialty-master.service.ts
│   │   └── schemas/
│   │       └── specialty-master.schema.ts
│   ├── doctors/                  # Doctor management module (✅ FULLY IMPLEMENTED)
│   │   ├── doctors.module.ts
│   │   ├── doctors.controller.ts
│   │   ├── doctors.service.ts
│   │   ├── schemas/
│   │   │   └── doctor.schema.ts
│   │   └── dto/
│   │       └── query-doctors.dto.ts
│   ├── appointments/             # Appointment booking module (✅ FULLY IMPLEMENTED)
│   │   ├── appointments.module.ts
│   │   ├── appointments.controller.ts
│   │   ├── appointments.service.ts
│   │   ├── schemas/
│   │   │   └── appointment.schema.ts
│   │   └── dto/
│   │       └── create-appointment.dto.ts
│   ├── memberclaims/            # Member claims module (✅ FULLY IMPLEMENTED)
│   │   ├── memberclaims.module.ts
│   │   ├── memberclaims.controller.ts
│   │   ├── memberclaims.service.ts
│   │   ├── schemas/
│   │   │   └── memberclaim.schema.ts
│   │   ├── dto/
│   │   │   ├── create-claim.dto.ts
│   │   │   └── update-claim.dto.ts
│   │   └── config/
│   │       └── multer.config.ts
│   ├── member/                   # Member portal API module
│   │   ├── member.module.ts
│   │   ├── member.controller.ts
│   │   └── member.service.ts
│   ├── lab/                      # Lab Diagnostics module (✅ FULLY IMPLEMENTED)
│   │   ├── lab.module.ts
│   │   ├── controllers/
│   │   │   ├── lab-member.controller.ts    # Member APIs (6 endpoints)
│   │   │   ├── lab-admin.controller.ts     # Admin APIs (11 endpoints)
│   │   │   └── lab-ops.controller.ts       # Operations APIs (20 endpoints)
│   │   ├── services/
│   │   │   ├── lab.service.ts
│   │   │   ├── lab-admin.service.ts
│   │   │   ├── lab-ops.service.ts
│   │   │   ├── lab-order.service.ts
│   │   │   └── lab-prescription.service.ts
│   │   ├── schemas/
│   │   │   ├── lab-test.schema.ts
│   │   │   ├── lab-package.schema.ts
│   │   │   ├── lab-partner.schema.ts
│   │   │   ├── lab-prescription.schema.ts
│   │   │   ├── lab-order.schema.ts
│   │   │   ├── lab-digitization.schema.ts
│   │   │   └── lab-report.schema.ts
│   │   ├── dto/
│   │   │   ├── create-lab-test.dto.ts
│   │   │   ├── create-lab-package.dto.ts
│   │   │   ├── create-lab-partner.dto.ts
│   │   │   ├── upload-prescription.dto.ts
│   │   │   ├── digitize-prescription.dto.ts
│   │   │   ├── create-lab-order.dto.ts
│   │   │   ├── update-order-status.dto.ts
│   │   │   └── upload-report.dto.ts
│   │   └── config/
│   │       └── multer-lab.config.ts
│   ├── tpa/                      # TPA (Third Party Administrator) module (✅ FULLY IMPLEMENTED)
│   │   ├── tpa.module.ts
│   │   ├── tpa.controller.ts     # TPA APIs (11 endpoints)
│   │   ├── tpa.service.ts
│   │   └── dto/
│   │       ├── assign-claims.dto.ts
│   │       ├── review-claim.dto.ts
│   │       ├── approve-claim.dto.ts
│   │       ├── reject-claim.dto.ts
│   │       ├── request-resubmission.dto.ts
│   │       └── tpa-analytics.dto.ts
│   ├── notifications/            # In-app notifications module (✅ FULLY IMPLEMENTED)
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── schemas/
│   │       └── notification.schema.ts
│   ├── finance/                  # Finance & payment module (🔧 FOUNDATION READY)
│   │   ├── finance.module.ts
│   │   ├── finance.controller.ts
│   │   ├── finance.service.ts
│   │   └── dto/
│   │       └── process-payment.dto.ts
│   ├── audit/                    # Audit logging module
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts
│   │   └── schemas/
│   │       └── audit-log.schema.ts
│   ├── counters/                 # Counter service module
│   │   ├── counters.module.ts
│   │   ├── counters.service.ts
│   │   └── schemas/
│   │       └── counter.schema.ts
│   ├── migration/                # Data migration module
│   │   ├── migration.module.ts
│   │   ├── migration.controller.ts
│   │   └── migration.service.ts
│   └── health/                   # Health check module
│       ├── health.module.ts
│       └── health.controller.ts
├── common/
│   ├── interceptors/
│   │   └── performance.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── decorators/
│       └── current-user.decorator.ts
└── types/
    └── enums.ts                  # Shared enums
```

### Key Design Patterns

#### 1. Dependency Injection
NestJS uses dependency injection throughout:
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private counterService: CountersService,
    private auditService: AuditService,
  ) {}
}
```

#### 2. Guard-Based Authorization
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    // Only SUPER_ADMIN and ADMIN can access
  }
}
```

#### 3. DTO Validation
```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @IsEnum(RelationshipType)
  relationship: RelationshipType;
}
```

#### 4. Schema-First Mongoose Models
```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, immutable: true })
  userId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

---

## 🎨 FRONTEND ARCHITECTURE

### Admin Portal (web-admin) Structure

```
web-admin/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Login page
│   └── admin/                    # Admin routes
│       ├── layout.tsx            # Admin layout with sidebar
│       ├── page.tsx              # Dashboard
│       ├── users/
│       │   ├── page.tsx          # User list
│       │   ├── new/
│       │   │   └── page.tsx      # Create user
│       │   └── [id]/
│       │       └── page.tsx      # Edit user
│       ├── policies/
│       │   ├── page.tsx          # Policy list
│       │   ├── new/
│       │   │   └── page.tsx      # Create policy
│       │   └── [id]/
│       │       ├── page.tsx      # View/Edit policy
│       │       └── plan-config/
│       │           ├── page.tsx  # Plan config list
│       │           └── [version]/
│       │               └── page.tsx  # Edit config version
│       ├── services/
│       │   └── page.tsx          # Service management
│       ├── categories/
│       │   └── page.tsx          # Category management
│       ├── lab/                  # Lab Diagnostics Management (✅ NEW)
│       │   ├── tests/
│       │   │   ├── page.tsx      # Lab tests list
│       │   │   └── new/
│       │   │       └── page.tsx  # Create lab test
│       │   ├── packages/
│       │   │   ├── page.tsx      # Lab packages list
│       │   │   └── new/
│       │   │       └── page.tsx  # Create lab package
│       │   └── partners/
│       │       ├── page.tsx      # Lab partners list
│       │       └── new/
│       │           └── page.tsx  # Create lab partner
│       ├── tpa/                  # TPA Portal (✅ NEW)
│       │   ├── page.tsx          # TPA dashboard
│       │   ├── claims/
│       │   │   ├── page.tsx      # Assigned claims list
│       │   │   └── [claimId]/
│       │   │       └── page.tsx  # Review claim
│       │   ├── assign/
│       │   │   └── page.tsx      # Bulk claim assignment
│       │   └── analytics/
│       │       └── page.tsx      # TPA performance analytics
│       ├── finance/              # Finance Portal (✅ NEW - Foundation)
│       │   ├── page.tsx          # Finance dashboard
│       │   ├── payments/
│       │   │   └── page.tsx      # Payment processing
│       │   └── reports/
│       │       └── page.tsx      # Financial reports
│       └── operations/           # Operations Portal (✅ Unified Structure)
│           ├── page.tsx          # Operations dashboard
│           ├── doctors/
│           │   ├── page.tsx      # Doctors management
│           │   └── new/
│           │       └── page.tsx  # Add doctor
│           ├── appointments/
│           │   └── page.tsx      # Appointments management
│           └── lab/
│               ├── prescriptions/
│               │   ├── page.tsx  # Prescriptions queue
│               │   └── [prescriptionId]/
│               │       └── page.tsx  # Digitize prescription
│               ├── orders/
│               │   ├── page.tsx  # Lab orders list
│               │   └── [orderId]/
│               │       └── page.tsx  # Order details & report upload
│               └── analytics/
│                   └── page.tsx  # Lab operations analytics
├── components/                   # Reusable components
│   ├── ui/                       # Radix UI wrappers
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── PolicyTable.tsx
│   ├── PolicyFilters.tsx
│   └── ...
├── lib/
│   ├── api.ts                    # Axios API client
│   ├── api/                      # API modules
│   │   ├── users.ts
│   │   ├── policies.ts
│   │   ├── assignments.ts
│   │   └── ...
│   └── utils.ts                  # Utility functions
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useUsers.ts
│   └── usePolicies.ts
├── store/                        # Zustand stores
│   └── authStore.ts
└── types/                        # TypeScript types
    └── index.ts
```

### Member Portal (web-member) Structure

```
web-member/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Login page
│   └── member/                   # Member routes
│       ├── layout.tsx            # Member layout with nav
│       ├── page.tsx              # Dashboard
│       ├── benefits/
│       │   └── page.tsx          # View benefits
│       ├── wallet/
│       │   └── page.tsx          # Wallet details
│       ├── transactions/
│       │   └── page.tsx          # Transaction history
│       ├── bookings/
│       │   ├── page.tsx          # Booking list
│       │   └── new/
│       │       └── page.tsx      # Create booking (⚠️ No backend)
│       ├── claims/
│       │   ├── page.tsx          # Claims & reimbursements list (✅ Backend ready)
│       │   ├── new/
│       │   │   └── page.tsx      # File claim/reimbursement (✅ Backend ready)
│       │   └── [claimId]/
│       │       └── page.tsx      # View claim & resubmit documents (✅ Enhanced)
│       ├── lab/                  # Lab Tests (✅ NEW - 7 pages)
│       │   ├── page.tsx          # Lab tests home
│       │   ├── prescriptions/
│       │   │   ├── page.tsx      # Prescriptions list
│       │   │   ├── upload/
│       │   │   │   └── page.tsx  # Upload prescription
│       │   │   └── [prescriptionId]/
│       │   │       └── page.tsx  # Prescription tracking
│       │   ├── orders/
│       │   │   ├── page.tsx      # Lab orders list
│       │   │   └── [orderId]/
│       │   │       └── page.tsx  # Order tracking & report
│       │   └── reports/
│       │       └── page.tsx      # All lab reports
│       ├── family/
│       │   ├── page.tsx          # Family members
│       │   └── add/
│       │       └── page.tsx      # Add family member
│       ├── health-records/
│       │   └── page.tsx          # Health records (⚠️ No backend)
│       ├── services/
│       │   └── page.tsx          # Browse services
│       └── settings/
│           └── page.tsx          # User settings
├── components/
│   ├── ui/                       # UI components
│   ├── MemberSwitcher.tsx        # Switch family members
│   ├── MemberWalletCard.tsx      # Wallet display
│   ├── BottomTabBar.tsx          # Mobile navigation (✅ Enhanced with Lab Tests)
│   ├── Sidebar.tsx               # Desktop sidebar
│   ├── NotificationBell.tsx      # Notifications indicator (✅ NEW)
│   └── ResponsiveLayout.tsx      # Responsive wrapper
├── contexts/
│   └── FamilyContext.tsx         # Family members state (⚠️ Uses mock data)
├── lib/
│   └── api.ts                    # API client
└── types/
    └── index.ts
```

### State Management Strategy

#### Admin Portal
- **Server State**: TanStack Query (React Query)
  - Caching of API responses
  - Automatic refetching
  - Optimistic updates
  - Query invalidation

- **Client State**: Zustand
  - Authentication state
  - UI preferences
  - Global modals

- **Form State**: React Hook Form
  - Form validation with Zod
  - Error handling
  - Submission state

#### Member Portal
- **Server State**: Direct API calls with useEffect
  - No caching layer
  - Manual state management

- **Client State**: React Context
  - FamilyContext for family members (⚠️ Currently using mock data)
  - Component-level useState

---

## 💾 DATABASE ARCHITECTURE

### MongoDB Collections Overview

| Collection | Documents | Status | Purpose |
|------------|-----------|--------|---------|
| `appointments` | 0 | Empty | Appointment bookings (reset for slot-based architecture) |
| `doctors` | 6 | Active | Doctor profiles with enhanced fields (phone, email, registration) |
| `clinics` | 5 | Active | Clinic/hospital locations with operating hours |
| `doctor_slots` | 18 | Active | Weekly recurring time slots for doctor availability |
| `specialty_master` | 9 | Active | Medical specialties for doctor categorization |
| `users` | 4 | Active | User profiles (primary + dependents + OPS user) |
| `policies` | 1 | Active | Insurance policy definitions |
| `plan_configs` | 1 | Active | Versioned policy configurations |
| `userPolicyAssignments` | 0 | Empty | User-policy linkage |
| `category_master` | 4 | Active | Service category definitions |
| `service_master` | 4 | Active | Medical service definitions |
| `relationship_masters` | 5 | Active | Family relationship types |
| `cug_master` | 8 | Active | Closed user groups |
| `counters` | 2 | Active | Auto-increment ID generation |
| `user_wallets` | 0 | Empty | Wallet balance tracking (⚠️ Not implemented) |
| `wallet_transactions` | 0 | Empty | Transaction history (⚠️ Not implemented) |
| `memberclaims` | 0 | Active | Member claim submissions (✅ Backend ready) |
| `lab_tests` | 0 | Active | Lab test master data (✅ NEW) |
| `lab_packages` | 0 | Active | Lab test packages/panels (✅ NEW) |
| `lab_partners` | 0 | Active | Lab partner/vendor information (✅ NEW) |
| `lab_prescriptions` | 0 | Active | Uploaded lab prescriptions (✅ NEW) |
| `lab_digitizations` | 0 | Active | Digitized prescription data (✅ NEW) |
| `lab_orders` | 0 | Active | Lab test orders (✅ NEW) |
| `lab_reports` | 0 | Active | Lab test reports (✅ NEW) |
| `notifications` | 0 | Active | In-app notifications (✅ NEW) |
| `auditLogs` | 0 | Empty | Audit trail (⚠️ Not functioning) |

**Total Collections**: 30
**Total Documents**: 62 (includes 6 doctors + 5 clinics + 18 slots + 9 specialties)
**Database Size**: ~850KB

### Data Relationships

```
users (1) ←──── (N) userPolicyAssignments ────→ (1) policies
  ↓                                                     ↓
  │                                                     │
  ↓                                                     ↓
users (dependents)                              plan_configs (N)
  ↓                                                     ↓
  │                                                     │
  ↓                                                     ↓
relationship_masters                           service_master
                                                        ↓
                                                        │
                                                        ↓
                                                 category_master

user_wallets ←─ userId (users._id)
wallet_transactions ←─ userWalletId (user_wallets._id)

appointments ←─ userId (users._id)
             ←─ doctorId (doctors.doctorId)
             ←─ slotId (doctor_slots._id)

doctors ←─ specialtyId (specialty_master.specialtyId)

clinics ←─ Standalone clinic/hospital locations

doctor_slots ←─ doctorId (doctors.doctorId)
             ←─ clinicId (clinics.clinicId)

memberclaims ←─ userId (users._id)
             ←─ Enhanced with TPA workflow

lab_prescriptions ←─ userId (users._id)
                  ←─ patientId (users._id for dependents)

lab_digitizations ←─ prescriptionId (lab_prescriptions._id)

lab_orders ←─ prescriptionId (lab_prescriptions._id)
           ←─ userId (users._id)
           ←─ partnerId (lab_partners._id)

lab_reports ←─ orderId (lab_orders._id)

notifications ←─ userId (users._id)
```

### Indexing Strategy

#### Performance Indexes
- `users`: email(1), phone(1), uhid(1), memberId(1), userId(1)
- `policies`: policyNumber(1), status(1) + effectiveFrom(1)
- `userPolicyAssignments`: userId(1) + isActive(1), policyId(1) + isActive(1)
- `plan_configs`: policyId(1) + version(1) [compound unique]
- `category_master`: categoryId(1), code(1), isActive(1) + displayOrder(1)
- `service_master`: code(1), category(1) + isActive(1)
- `user_wallets`: userId(1) + policyAssignmentId(1) [compound unique]
- `wallet_transactions`: userId(1) + createdAt(-1), transactionId(1)

#### Unique Constraints
- `users`: userId, email, phone, uhid, memberId, employeeId (sparse)
- `policies`: policyNumber
- `userPolicyAssignments`: assignmentId
- `plan_configs`: policyId + version (compound)
- `category_master`: categoryId, code
- `service_master`: code
- `cug_master`: cugId, code
- `relationship_masters`: relationshipCode
- `wallet_transactions`: transactionId

---

## 📡 API DOCUMENTATION

### Complete Endpoint Inventory

#### Authentication Endpoints (`/api/auth`)
```
POST   /api/auth/login              # Login with email/password
POST   /api/auth/logout             # Logout and clear session
GET    /api/auth/me                 # Get current user profile
```

#### User Management (`/api/users`)
```
POST   /api/users                   # Create new user
GET    /api/users                   # List all users (paginated)
GET    /api/users/:id               # Get user by ID
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user
POST   /api/users/:id/reset-password    # Reset password
POST   /api/users/:id/set-password      # Set password
GET    /api/users/:id/dependents        # Get user with dependents
GET    /api/users/:id/assignments       # Get user's assignments
```

#### Policy Management (`/api/policies`)
```
POST   /api/policies                # Create new policy
GET    /api/policies                # List all policies (paginated)
GET    /api/policies/:id            # Get policy by ID
PUT    /api/policies/:id            # Update policy
DELETE /api/policies/:id            # Delete policy (if not assigned)
```

#### Policy Assignments (`/api/assignments`) ✨ ENHANCED (v6.5)
```
POST   /api/assignments             # Assign policy to user (with relationship & validation)
GET    /api/assignments             # List all assignments
GET    /api/assignments/policy/:policyId    # Get assignments for policy
GET    /api/assignments/search-primary-members  # Search primary members (NEW)
DELETE /api/assignments/:assignmentId       # Deactivate assignment
DELETE /api/assignments/user/:userId/policy/:policyId  # Unassign
```

**New Features (v6.5)**:
- **Relationship-Based Assignments**: Assign dependents with relationship validation
- **Plan Config Validation**: Validates relationshipId against coveredRelationships in plan config
- **Primary Member Search**: Real-time autocomplete search for primary members within policy
- **User Document Sync**: Automatically syncs relationship data to user documents
- **Enhanced Validation**: Prevents invalid assignments (e.g., dependent without primary member)

**Request Body Example**:
```json
{
  "userId": "673ae8da20a0e1d0e8f27c01",
  "policyId": "6743ae1820a0e1d0e8f27d15",
  "relationshipId": "REL002",
  "primaryMemberId": "MEM001",
  "effectiveFrom": "2025-01-01",
  "effectiveTo": "2025-12-31"
}
```

**Search Primary Members**:
```
GET /api/assignments/search-primary-members?policyId={id}&search={term}
Response: Array of users with SELF/REL001 relationship in the policy
```

#### Plan Configuration (`/api/policies/:policyId/config`)
```
POST   /:policyId/config            # Create new plan config
GET    /:policyId/config            # Get config (current/specific)
GET    /:policyId/config/all        # Get all configs for policy
PUT    /:policyId/config/:version   # Update config (DRAFT only)
POST   /:policyId/config/:version/publish   # Publish config
POST   /:policyId/config/:version/set-current  # Set as current
DELETE /:policyId/config/:version   # Delete config
```

#### Category Master (`/api/categories`)
```
POST   /api/categories              # Create category
GET    /api/categories              # List categories
GET    /api/categories/ids          # Get all category IDs
GET    /api/categories/:id          # Get category by ID
PUT    /api/categories/:id          # Update category
DELETE /api/categories/:id          # Delete category
PUT    /api/categories/:id/toggle-active  # Toggle active status
```

#### Service Master (`/api/services`)
```
POST   /api/services/types          # Create service type
GET    /api/services/types          # List service types
GET    /api/services/types/codes    # Get all service codes
GET    /api/services/types/:id      # Get service type by ID
PUT    /api/services/types/:id      # Update service type
DELETE /api/services/types/:id      # Delete service type
PUT    /api/services/types/:id/toggle-active  # Toggle active
GET    /api/services/categories/:category  # Get by category
```

#### CUG Master (`/api/cugs`)
```
POST   /api/cugs                    # Create CUG
GET    /api/cugs                    # List CUGs
GET    /api/cugs/active             # List active CUGs
GET    /api/cugs/:id                # Get CUG by ID
PUT    /api/cugs/:id                # Update CUG
PATCH  /api/cugs/:id/toggle-active # Toggle active status
DELETE /api/cugs/:id                # Delete CUG
POST   /api/cugs/seed               # Seed default CUGs
```

#### Relationship Master (`/api/relationships`) - ✅ FULLY IMPLEMENTED ✨ ENHANCED (v6.8)
```
GET    /api/relationships           # Get active relationships
GET    /api/relationships/all       # Get all (including inactive)
GET    /api/relationships/:id       # Get specific relationship
POST   /api/relationships           # Create new relationship
PUT    /api/relationships/:id       # Update relationship
DELETE /api/relationships/:id       # Delete relationship (SUPER_ADMIN only)
PATCH  /api/relationships/:id/toggle-active  # Toggle active status
```

**Admin UI**: `/admin/masters` - Full CRUD interface with modal-based forms, search, and active status toggle

**Relationship Schema**:
- `relationshipCode`: Unique identifier (e.g., REL001)
- `relationshipName`: Internal name (e.g., "SPOUSE")
- `displayName`: User-facing label (e.g., "Spouse")
- `description`: Optional detailed description
- `isActive`: Whether relationship is available for selection
- `sortOrder`: Display sequence in UI dropdowns
- Audit fields: createdBy, updatedBy, createdAt, updatedAt

#### Specialty Master (`/api/specialties`)
```
GET    /api/specialties             # List all specialties
GET    /api/specialties/:specialtyId # Get specialty by ID
```

#### Doctors Management (`/api/doctors`) - ✅ FULLY IMPLEMENTED
```
GET    /api/doctors                 # List all doctors with filters
GET    /api/doctors/:doctorId       # Get doctor by ID with clinic details
POST   /api/doctors                 # Create new doctor
PUT    /api/doctors/:doctorId       # Update doctor details
PATCH  /api/doctors/:doctorId/activate    # Activate doctor
PATCH  /api/doctors/:doctorId/deactivate  # Deactivate doctor

Query Parameters for GET /api/doctors:
- specialtyId: Filter by specialty ID
- city: Filter by clinic city
- availableOnline: Filter online consultation doctors (boolean)
- availableOffline: Filter in-clinic consultation doctors (boolean)

Doctor Schema Includes:
- Profile: name, qualifications, specializations, experience, rating
- Contact: phone, email, registrationNumber
- Languages: Array of languages spoken
- Clinics: Array of clinic locations with address, fees, and coordinates
- Availability: Online/offline flags, time slots, booking settings
- Insurance: Cashless availability, accepted insurance providers
```

#### Clinics Management (`/api/clinics`) - ✅ FULLY IMPLEMENTED ✨ ENHANCED (v6.7)
```
GET    /api/clinics                 # List all clinics with enhanced query
GET    /api/clinics/:clinicId       # Get clinic details by ID
POST   /api/clinics                 # Create new clinic
PUT    /api/clinics/:clinicId       # Update clinic details
PATCH  /api/clinics/:clinicId/activate    # Activate clinic
PATCH  /api/clinics/:clinicId/deactivate  # Deactivate clinic
DELETE /api/clinics/:clinicId       # Delete clinic
```

**Query Parameters ✨ NEW (v6.7)**:
- `city`: Filter by city name
- `state`: Filter by state name
- `search`: Search in clinic name, address, city
- `isActive`: Filter by active status (true/false)
- `page`: Pagination page number
- `limit`: Items per page

```
Clinic Schema Includes:
- Basic Info: clinicId, name, address, city, state, pincode
- Contact: phone, email
- Location: Geo-coordinates (latitude, longitude)
- Operating Hours: By day of week with open/close times
- Facilities: Array of available services/facilities
- Status: isActive flag

Operating Hours Structure:
{
  "Monday": { "open": "09:00", "close": "18:00", "isClosed": false },
  "Tuesday": { "open": "09:00", "close": "18:00", "isClosed": false },
  ...
}
```

#### Doctor Slots Management (`/api/doctor-slots`) - ✅ FULLY IMPLEMENTED
```
GET    /api/doctor-slots            # List all slots with filters
GET    /api/doctor-slots/doctor/:doctorId  # Get all slots for a doctor
GET    /api/doctor-slots/clinic/:clinicId  # Get all slots for a clinic
GET    /api/doctor-slots/doctor/:doctorId/day/:dayOfWeek  # Get doctor slots for specific day
GET    /api/doctor-slots/:slotId    # Get slot by ID
GET    /api/doctor-slots/:slotId/generate/:date  # Generate specific date slot from template
POST   /api/doctor-slots            # Create new slot
PUT    /api/doctor-slots/:slotId    # Update slot
PATCH  /api/doctor-slots/:slotId/activate  # Activate slot
PATCH  /api/doctor-slots/:slotId/deactivate  # Deactivate slot
PATCH  /api/doctor-slots/:slotId/block-date  # Block slot for specific date
PATCH  /api/doctor-slots/:slotId/unblock-date  # Unblock slot for specific date
DELETE /api/doctor-slots/:slotId    # Delete slot

Query Parameters:
- doctorId: Filter by doctor ID
- clinicId: Filter by clinic ID
- dayOfWeek: Filter by day (Monday, Tuesday, etc.)
- consultationType: Filter by type (IN_CLINIC, ONLINE, BOTH)
- isActive: Filter by active status

Doctor Slot Schema:
- slotId: Unique slot identifier
- doctorId: Links to doctors collection
- clinicId: Links to clinics collection
- dayOfWeek: Day name (MONDAY, TUESDAY, etc. - uppercase enum)
- startTime/endTime: Time range (e.g., "09:00" to "13:00")
- slotDuration: Duration in minutes (required field)
- consultationFee: Fee for this specific slot (required field)
- consultationType: IN_CLINIC or ONLINE (enum - BOTH removed in actual implementation)
- maxAppointments: Maximum appointments per slot (default: 20)
- isActive: Slot availability flag (default: true)
- validFrom/validUntil: Optional validity period for slot
- blockedDates: Array of date strings for blocked dates

Slot-Based Scheduling Benefits:
- Weekly recurring schedules for consistent availability
- Clinic-specific slots for multi-location doctors
- Flexible consultation types per slot
- Easy schedule management and updates
```

#### Appointments (`/api/appointments`) - ✅ FULLY IMPLEMENTED (Slot-Based)
```
POST   /api/appointments            # Create appointment booking (IN_CLINIC or ONLINE)
GET    /api/appointments            # Get all appointments
GET    /api/appointments/user/:userId  # Get user's appointments (with optional type filter)
GET    /api/appointments/user/:userId/ongoing  # Get ongoing appointments
GET    /api/appointments/:appointmentId  # Get appointment details by ID
PATCH  /api/appointments/:appointmentId/confirm  # Confirm appointment
PATCH  /api/appointments/:appointmentId/cancel   # Cancel appointment

Query Parameters for GET /api/appointments/user/:userId:
- type: Filter by appointment type (IN_CLINIC or ONLINE)

Appointment Types:
- IN_CLINIC: Requires clinicId, clinicName, clinicAddress, appointmentDate, timeSlot
  Flow: Specialty → Doctor → Clinic → Patient → Time Slot → Confirmation
- ONLINE: Optional clinic details, requires contactNumber, callPreference (VOICE/VIDEO/BOTH)
  Flow: Specialty → Doctor → Patient → Contact → Immediate/Scheduled → Confirmation

Appointment Status Flow:
- PENDING_CONFIRMATION: Initial state after booking
- CONFIRMED: Appointment confirmed by clinic/doctor
- COMPLETED: Appointment completed successfully
- CANCELLED: Appointment cancelled by user or clinic

Payment Status:
- PENDING: Payment not yet processed
- PAID: Payment completed
- FREE: No payment required (covered by insurance)

Call Preferences (ONLINE appointments only):
- VOICE: Voice call consultation
- VIDEO: Video call consultation
- BOTH: Either voice or video (doctor's choice)

Appointment Schema Includes:
- appointmentId: Unique identifier (APT-YYYYMMDD-XXXX format)
- appointmentNumber: Human-readable number
- Patient details: userId, patientName, patientId (for dependents)
- Doctor details: doctorId, doctorName, specialty
- Clinic details: clinicId, clinicName, clinicAddress (for IN_CLINIC)
- Slot reference: slotId (links to doctor_slots collection)
- Timing: appointmentDate, timeSlot
- Payment: consultationFee, paymentStatus, amountPaid, coveredByInsurance
- Online-specific: contactNumber, callPreference
- Status tracking: status, requestedAt, confirmedAt
- Prescription tracking: prescriptionId, hasPrescription (links to doctor_prescriptions)

Slot-Based Booking:
- Appointments link to doctor_slots via slotId
- Ensures booking within doctor's available schedule
- Supports weekly recurring availability patterns
- Enables real-time slot availability checking
```

#### Doctor Portal - Appointments (`/api/doctor/appointments`) - ✅ IMPLEMENTED
```
GET    /api/doctor/appointments/counts              # Get appointment counts by date
GET    /api/doctor/appointments/today               # Get today's appointments
GET    /api/doctor/appointments/date/:date          # Get appointments for specific date
GET    /api/doctor/appointments/upcoming            # Get upcoming appointments (paginated)
GET    /api/doctor/appointments/:appointmentId      # Get specific appointment details
PATCH  /api/doctor/appointments/:appointmentId/complete   # Mark appointment as completed
PATCH  /api/doctor/appointments/:appointmentId/confirm    # Confirm pending appointment

Query Parameters:
- limit: Results per page (upcoming endpoint)
- status: Filter by appointment status (PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED)
- date: Specific date (YYYY-MM-DD format)

Response includes:
- Appointment details with patient information
- Prescription status (hasPrescription flag)
- Prescription ID if already uploaded

Access Control:
- Requires DOCTOR role authentication
- Doctors can only view/modify their own appointments
- Protected by JwtAuthGuard + RolesGuard
```

#### Doctor Portal - Prescriptions (`/api/doctor/prescriptions`) - ✅ IMPLEMENTED
```
POST   /api/doctor/prescriptions/upload                # Upload prescription for appointment
GET    /api/doctor/prescriptions                       # List doctor's uploaded prescriptions
GET    /api/doctor/prescriptions/:prescriptionId       # Get prescription details
DELETE /api/doctor/prescriptions/:prescriptionId       # Delete prescription

File Upload Configuration:
- Allowed types: PDF, JPEG, PNG
- Max file size: 10MB
- Storage: /uploads/doctors/{doctorId}/
- File naming: prescription_{timestamp}.{ext}

Upload Request (multipart/form-data):
- file: Prescription file (required)
- appointmentId: Appointment reference (required)
- diagnosis: Medical diagnosis (optional)
- notes: Additional notes (optional)

Prescription Schema:
- prescriptionId: Unique identifier (auto-generated)
- appointmentId: Links to appointments._id (unique - one prescription per appointment)
- doctorId, doctorName: Doctor details
- userId, patientName: Patient details
- fileName, filePath, fileSize: File metadata
- uploadDate: Timestamp of upload
- diagnosis, notes: Optional clinical information
- isActive: Status flag

Prescription Workflow:
1. Doctor completes appointment
2. Doctor uploads prescription via portal
3. System creates prescription record
4. System updates appointment.prescriptionId and appointment.hasPrescription
5. Patient can view/download prescription from member portal
6. Prescription accessible at /uploads/doctors/{path}

Access Control:
- Doctors can only upload prescriptions for their own appointments
- Patients can view prescriptions for their appointments
- Admin/Operations can view all prescriptions
```

#### Video Consultations (`/api/video-consultations`) - ✅ NEW (v6.7)
```
POST   /api/video-consultations/start              # Start video consultation (Doctor only)
POST   /api/video-consultations/join               # Join video consultation (Member only)
POST   /api/video-consultations/:id/end            # End consultation (Doctor only)
GET    /api/video-consultations/:id/status         # Get consultation status
GET    /api/video-consultations/doctor/history     # Get doctor's consultation history
GET    /api/video-consultations/patient/history    # Get patient's consultation history
```

**Features**:
- **WebRTC Integration**: Real-time video/audio consultations
- **Role-Based Access**: Doctors can start/end, members can join
- **Status Tracking**: WAITING, IN_PROGRESS, COMPLETED, CANCELLED
- **History Management**: Paginated consultation history for both doctors and patients
- **Appointment Integration**: Linked to existing appointments via appointmentId

**Start Consultation (POST /start)**:
```json
Request: { "appointmentId": "APT-20250112-ABC123" }
Response: {
  "consultationId": "VC-20250112-XYZ789",
  "status": "IN_PROGRESS",
  "startTime": "2025-01-12T10:00:00Z",
  "appointmentDetails": {...}
}
```

**Join Consultation (POST /join)**:
```json
Request: { "appointmentId": "APT-20250112-ABC123" }
Response: {
  "consultationId": "VC-20250112-XYZ789",
  "status": "IN_PROGRESS",
  "doctor": {...},
  "patient": {...}
}
```

**End Consultation (POST /:id/end)**:
```json
Request: {
  "duration": 900,  // seconds
  "notes": "Patient complains of headache...",
  "prescription": "Medicine details...",
  "followUpRequired": true,
  "followUpDate": "2025-01-19"
}
Response: {
  "consultationId": "VC-20250112-XYZ789",
  "status": "COMPLETED",
  "duration": 900,
  "endTime": "2025-01-12T10:15:00Z"
}
```

**Video Consultation Schema**:
- consultationId: Unique identifier (VC-YYYYMMDD-XXXXX format)
- appointmentId: Reference to appointment
- doctorId, patientId: Participant references
- status: WAITING, IN_PROGRESS, COMPLETED, CANCELLED
- startTime, endTime: Timestamps
- duration: Consultation duration in seconds
- notes, prescription: Doctor's consultation notes
- followUpRequired, followUpDate: Follow-up tracking

**Access Control**:
- Only assigned doctor can start/end consultation
- Only appointment patient can join consultation
- History endpoints filtered by user role

#### Payments (`/api/payments`) - ✅ NEW (v6.8)
```
GET    /api/payments/:paymentId           # Get payment details by ID
GET    /api/payments                      # Get user payment history (filtered)
GET    /api/payments/summary/stats        # Get payment summary statistics
POST   /api/payments/:paymentId/mark-paid # Mark payment as paid (dummy gateway)
POST   /api/payments/:paymentId/cancel    # Cancel a payment
```

**Features**:
- **Payment Tracking**: Track all user payments for services (appointments, claims, lab orders)
- **Payment Types**: COPAY, OUT_OF_POCKET, FULL_PAYMENT, PARTIAL_PAYMENT, TOP_UP
- **Payment Status**: PENDING, COMPLETED, FAILED, CANCELLED
- **Service Types**: APPOINTMENT, CLAIM, LAB_ORDER, PHARMACY, WALLET_TOPUP
- **Dummy Gateway**: Currently uses mock payment processing, ready for real gateway integration

**Query Parameters (GET /api/payments)**:
- status: Filter by payment status
- serviceType: Filter by service type (APPOINTMENT, CLAIM, etc.)
- limit: Number of records to return (default: 20)
- skip: Number of records to skip for pagination

**Request Body (POST mark-paid)**:
- Automatically captures userId from auth token
- Marks payment as COMPLETED
- Sets paidAt timestamp

**Response Example**:
```json
{
  "paymentId": "PAY-20250116-0001",
  "userId": "507f1f77bcf86cd799439011",
  "amount": 200,
  "paymentType": "COPAY",
  "status": "COMPLETED",
  "serviceType": "APPOINTMENT",
  "serviceId": "507f1f77bcf86cd799439012",
  "serviceReferenceId": "APT-20250116-0001",
  "description": "Copay for Dr. Sharma consultation",
  "paymentMethod": "DUMMY_GATEWAY",
  "paidAt": "2025-01-16T10:30:00Z"
}
```

**Access Control**:
- All endpoints require MEMBER role
- Users can only view/manage their own payments

#### Transaction Summary (`/api/transactions`) - ✅ NEW (v6.8)
```
GET    /api/transactions                  # Get user transaction history (filtered)
GET    /api/transactions/summary          # Get transaction summary statistics
GET    /api/transactions/:transactionId   # Get transaction details by ID
```

**Features**:
- **Unified Transaction View**: Combines wallet + payment data in single view
- **Payment Breakdown**: Shows how much was paid via wallet vs. out-of-pocket
- **Service Linking**: Links to appointments, claims, lab orders
- **Status Tracking**: PENDING_PAYMENT, COMPLETED, FAILED, REFUNDED, CANCELLED
- **Payment Methods**: WALLET_ONLY, COPAY, OUT_OF_POCKET, PARTIAL, FULL_PAYMENT

**Query Parameters (GET /api/transactions)**:
- serviceType: Filter by service (APPOINTMENT, CLAIM, LAB_ORDER, PHARMACY)
- paymentMethod: Filter by payment method
- status: Filter by transaction status
- dateFrom: Start date filter (YYYY-MM-DD)
- dateTo: End date filter (YYYY-MM-DD)
- limit: Number of records (default: 20)
- skip: Pagination offset

**Transaction Summary Response**:
```json
{
  "totalTransactions": 45,
  "totalSpent": 25000,
  "totalFromWallet": 20000,
  "totalSelfPaid": 5000,
  "totalCopay": 5000,
  "byServiceType": {
    "APPOINTMENT": { "count": 20, "amount": 15000 },
    "LAB_ORDER": { "count": 15, "amount": 8000 },
    "CLAIM": { "count": 10, "amount": 2000 }
  },
  "byPaymentMethod": {
    "WALLET_ONLY": 30,
    "COPAY": 10,
    "OUT_OF_POCKET": 5
  }
}
```

**Transaction Detail Response**:
```json
{
  "transactionId": "TXN-20250116-0001",
  "userId": "507f1f77bcf86cd799439011",
  "serviceType": "APPOINTMENT",
  "serviceName": "Dr. Sharma - General Consultation",
  "serviceDate": "2025-01-16T10:00:00Z",
  "totalAmount": 1000,
  "walletAmount": 800,
  "selfPaidAmount": 200,
  "copayAmount": 200,
  "paymentMethod": "COPAY",
  "categoryCode": "CAT001",
  "categoryName": "Consultation",
  "status": "COMPLETED",
  "paymentId": "PAY-20250116-0001"
}
```

**Key Features**:
- **Payment Breakdown**: Clearly shows wallet deduction vs. out-of-pocket payment
- **Copay Integration**: Automatically calculates copay based on plan configuration
- **Category Tracking**: Links to wallet category for proper wallet balance management
- **Service References**: Direct links to appointment/claim/order details

**Access Control**:
- All endpoints require MEMBER role
- Users can only view their own transactions

#### Member Portal API (`/api/member`) ✨ ENHANCED (v6.6)
```
GET    /api/member/profile          # Get member profile with family
GET    /api/member/family           # Get family members
PATCH  /api/member/profile          # Update member profile (email/mobile) ✨ NEW
```

**New Features (v6.6)**:
- **Profile Update**: Members can update their email and mobile number
- **Enhanced Dependent Fetching**: Now uses assignment-based logic for accurate relationship tracking
- **Validation**:
  - Email: Valid email format required
  - Mobile: 10-digit Indian mobile number (starts with 6-9)

**Request Body (PATCH /api/member/profile)**:
```json
{
  "email": "newemail@example.com",  // optional
  "mobile": "9876543210"             // optional
}
```

#### Member Claims (`/api/member/claims`) - ✅ FULLY IMPLEMENTED
```
POST   /api/member/claims                      # Create new claim with file uploads
POST   /api/member/claims/:claimId/submit      # Submit claim for processing
GET    /api/member/claims                      # List user's claims (with pagination)
GET    /api/member/claims/summary              # Get user's claims summary
GET    /api/member/claims/:claimId/timeline    # Get claim timeline/history ✨ NEW
GET    /api/member/claims/:claimId/tpa-notes   # Get TPA notes for member ✨ NEW
GET    /api/member/claims/:id                  # Get claim by MongoDB ID
GET    /api/member/claims/claim/:claimId       # Get claim by claimId
PATCH  /api/member/claims/:id                  # Update claim details
PATCH  /api/member/claims/:claimId/cancel      # Cancel claim ✨ NEW
POST   /api/member/claims/:claimId/documents   # Add documents to claim
POST   /api/member/claims/:claimId/resubmit-documents  # Resubmit documents ✨ NEW
DELETE /api/member/claims/:claimId/documents/:documentId  # Remove document
DELETE /api/member/claims/:id                  # Delete claim
GET    /api/member/claims/files/:userId/:filename  # Download claim file

File Upload Configuration ✨ ENHANCED:
- Allowed types: JPEG, PNG, GIF, WebP, PDF
- Max file size: 15MB per file
- Storage: Local filesystem (uploads/claims/{userId}/)
- Document types: INVOICE, PRESCRIPTION, REPORT, DISCHARGE_SUMMARY, OTHER

Multi-Field File Upload ✨ NEW:
- Uses FileFieldsInterceptor for categorized uploads
- Three separate upload fields:
  1. prescriptionFiles: Max 5 files (auto-tagged as PRESCRIPTION)
  2. billFiles: Max 5 files (auto-tagged as INVOICE)
  3. documents: Max 10 files (auto-detection based on filename)
- Total max files: 20 across all fields
- Automatic document type assignment based on field
- Smart document type detection for generic uploads

Enhanced File Security ✨ UPDATED:
- File access uses findClaimByFileName() to validate claim ownership
- Extracts actual file path from claim document record
- Handles both Docker container paths (/app/) and local paths
- Role-based access: MEMBER (owner/submitter only), ADMIN, TPA, OPS (full access)
- Path resolution: Converts Docker paths to local paths automatically
- Validates file exists on disk before serving

Claim Types:
- REIMBURSEMENT: Post-treatment claim submission
- CASHLESS_PREAUTH: Pre-authorization for cashless treatment

Dependent Claim Management ✨ NEW:
- Primary members can file claims for dependents
- Request Body: { userId: "dependent_userId", ...otherFields }
- userId: Claim owner (who receives reimbursement)
- createdBy: Logged-in user who submitted claim (auto-tracked)
- Wallet operations use claim owner's userId
- File access allowed for both submitter and claim owner
- canManageClaim() checks: self or dependent relationship

Claim Cancellation ✨ NEW:
- Endpoint: PATCH /api/member/claims/:claimId/cancel
- Request Body: { reason?: string }
- Cancellable statuses: DRAFT, SUBMITTED, UNASSIGNED, ASSIGNED, UNDER_REVIEW, DOCUMENTS_REQUIRED, RESUBMISSION_REQUIRED
- Non-cancellable: APPROVED, PARTIALLY_APPROVED, REJECTED, CANCELLED, PAYMENT_*
- Auto wallet refund if claim was debited
- Status logged in statusHistory array

Claim Status Flow:
DRAFT → SUBMITTED → UNASSIGNED → ASSIGNED → UNDER_REVIEW → DOCUMENTS_REQUIRED (optional)
                                                           ↓
                                      APPROVED/PARTIALLY_APPROVED/REJECTED
                                                           ↓
                                      PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_COMPLETED
                                      ↓ (any cancellable status)
                                  CANCELLED ✨ (with wallet refund)
```

#### Lab Diagnostics - Member APIs (`/api/lab/member`) - ✅ FULLY IMPLEMENTED
```
POST   /api/lab/member/prescriptions                    # Upload lab prescription
GET    /api/lab/member/prescriptions                    # List user's prescriptions
GET    /api/lab/member/prescriptions/:prescriptionId    # Get prescription details
GET    /api/lab/member/orders                           # List user's lab orders
GET    /api/lab/member/orders/:orderId                  # Get order details
GET    /api/lab/member/reports/:orderId                 # Get lab report

Prescription Upload:
- File types: JPEG, PNG, PDF
- Max file size: 10MB
- Storage: uploads/lab/prescriptions/{userId}/

Prescription Flow (Member → Operations → Admin → Partner → Member):
1. Member uploads prescription → PENDING status
2. Operations digitizes tests → DIGITIZED status
3. Admin assigns to partner → ASSIGNED status
4. Partner creates order → ORDER_CREATED status
5. Partner uploads report → COMPLETED status
```

#### Lab Diagnostics - Admin APIs (`/api/lab/admin`) - ✅ FULLY IMPLEMENTED
```
# Lab Test Master Management
POST   /api/lab/admin/tests                  # Create lab test
GET    /api/lab/admin/tests                  # List all lab tests
GET    /api/lab/admin/tests/:testId          # Get test details
PUT    /api/lab/admin/tests/:testId          # Update lab test
DELETE /api/lab/admin/tests/:testId          # Delete lab test

# Lab Package Management
POST   /api/lab/admin/packages               # Create lab package
GET    /api/lab/admin/packages               # List all packages
GET    /api/lab/admin/packages/:packageId    # Get package details
PUT    /api/lab/admin/packages/:packageId    # Update package
DELETE /api/lab/admin/packages/:packageId    # Delete package

# Lab Partner Management
POST   /api/lab/admin/partners               # Create lab partner
GET    /api/lab/admin/partners               # List all partners
GET    /api/lab/admin/partners/:partnerId    # Get partner details
PUT    /api/lab/admin/partners/:partnerId    # Update partner
PATCH  /api/lab/admin/partners/:partnerId/activate    # Activate partner
PATCH  /api/lab/admin/partners/:partnerId/deactivate  # Deactivate partner

Lab Test Schema:
- testId, testName, testCode
- category (Pathology, Radiology, etc.)
- description, sampleType, turnaroundTime
- price, isActive

Lab Package Schema:
- packageId, packageName, packageCode
- tests[] (array of testIds)
- description, price, isActive

Lab Partner Schema:
- partnerId, partnerName, contactPerson
- email, phone, address
- serviceAreas[], isActive
```

#### Lab Diagnostics - Operations APIs (`/api/lab/ops`) - ✅ FULLY IMPLEMENTED
```
# Prescription Queue Management
GET    /api/lab/ops/prescriptions/queue      # Get pending prescriptions queue
GET    /api/lab/ops/prescriptions/:prescriptionId  # Get prescription for digitization
POST   /api/lab/ops/prescriptions/:prescriptionId/digitize  # Digitize prescription tests

# Order Management
GET    /api/lab/ops/orders                   # List all orders with filters
GET    /api/lab/ops/orders/:orderId          # Get order details
POST   /api/lab/ops/orders                   # Create order from prescription
PUT    /api/lab/ops/orders/:orderId          # Update order details
PATCH  /api/lab/ops/orders/:orderId/assign-partner  # Assign order to partner
PATCH  /api/lab/ops/orders/:orderId/confirm        # Confirm order
PATCH  /api/lab/ops/orders/:orderId/collect-sample # Mark sample collected
PATCH  /api/lab/ops/orders/:orderId/processing     # Mark as processing
PATCH  /api/lab/ops/orders/:orderId/cancel         # Cancel order

# Report Management
POST   /api/lab/ops/orders/:orderId/report          # Upload lab report
GET    /api/lab/ops/reports                         # List all reports
GET    /api/lab/ops/reports/:reportId               # Get report details
PUT    /api/lab/ops/reports/:reportId               # Update report
GET    /api/lab/ops/reports/download/:reportId      # Download report file

# Analytics
GET    /api/lab/ops/analytics/prescriptions-stats   # Prescription statistics
GET    /api/lab/ops/analytics/orders-stats          # Order statistics
GET    /api/lab/ops/analytics/partner-performance   # Partner performance
GET    /api/lab/ops/analytics/revenue               # Revenue analytics
GET    /api/lab/ops/analytics/turnaround-time       # TAT analysis

Order Status Flow:
PENDING → PARTNER_ASSIGNED → CONFIRMED → SAMPLE_COLLECTED →
PROCESSING → REPORT_UPLOADED → COMPLETED
         ↓
     CANCELLED

Report Upload:
- File types: PDF, JPEG, PNG
- Max file size: 15MB
- Storage: uploads/lab/reports/{orderId}/
```

#### TPA APIs (`/api/tpa`) - ✅ FULLY IMPLEMENTED
```
# Claim Assignment
POST   /api/tpa/claims/assign                # Assign claims to TPA user
GET    /api/tpa/claims/assigned              # Get assigned claims
GET    /api/tpa/claims/assigned/:claimId     # Get assigned claim details

# Claim Review
PATCH  /api/tpa/claims/:claimId/review       # Start reviewing claim
PATCH  /api/tpa/claims/:claimId/approve      # Approve claim
PATCH  /api/tpa/claims/:claimId/partial-approve  # Partially approve claim
PATCH  /api/tpa/claims/:claimId/reject       # Reject claim
PATCH  /api/tpa/claims/:claimId/request-resubmission  # Request document resubmission

# Analytics
GET    /api/tpa/analytics/summary            # TPA dashboard summary
GET    /api/tpa/analytics/claims-by-status   # Claims breakdown by status
GET    /api/tpa/analytics/reviewer-performance  # Individual TPA performance

TPA Workflow:
1. Admin assigns claims to TPA users (bulk assignment)
2. TPA reviews claim documents
3. TPA approves/rejects or requests resubmission
4. If resubmission: Member uploads new docs → Loop back to step 2
5. Final approval triggers payment processing

TPA Role Features:
- Can only access assigned claims
- Cannot create or delete claims
- Can add review comments and internal notes
- Track approval/rejection reasons
```

#### Notifications APIs (`/api/notifications`) - ✅ FULLY IMPLEMENTED
```
GET    /api/notifications                    # Get user's notifications
GET    /api/notifications/unread             # Get unread notifications count
PATCH  /api/notifications/:notificationId/read  # Mark notification as read
PATCH  /api/notifications/mark-all-read      # Mark all as read
DELETE /api/notifications/:notificationId    # Delete notification

Notification Types:
- CLAIM_SUBMITTED: Claim submitted successfully
- CLAIM_APPROVED: Claim approved
- CLAIM_REJECTED: Claim rejected
- CLAIM_RESUBMISSION_REQUIRED: Documents need resubmission
- APPOINTMENT_CONFIRMED: Appointment confirmed
- APPOINTMENT_CANCELLED: Appointment cancelled
- LAB_ORDER_CREATED: Lab order created
- LAB_REPORT_READY: Lab report available
- WALLET_CREDITED: Wallet balance credited
- SYSTEM_ANNOUNCEMENT: System-wide announcements

Notification Schema:
- userId: Recipient
- type: Notification type enum
- title, message: Content
- isRead: Read status
- metadata: Additional data (claimId, orderId, etc.)
- createdAt: Timestamp
```

#### Finance APIs (`/api/finance`) - 🔧 FOUNDATION READY
```
POST   /api/finance/process-payment          # Process claim payment (foundation)

Payment Processing (Foundation):
- Integrated with claim approval workflow
- Tracks payment status (PENDING, PROCESSING, COMPLETED, FAILED)
- Links to wallet transactions for future implementation
- Placeholder for payment gateway integration

Note: Full payment processing, gateway integration, and wallet
deduction features are planned for future phases.
```

#### Migration/Admin Utilities (`/api/migration`, `/api/admin`)
```
POST   /api/migration/spouse-coverage  # Migrate spouse coverage data
POST   /api/admin/migrate-invalid-services  # Migrate/fix invalid service data
```

#### Health Check (`/api/health`)
```
GET    /api/health                  # Basic health check
```

### Missing Endpoints (UI exists, no backend)
```
❌ /api/wallet/*                    # Wallet operations (schema ready, service exists)
❌ /api/health-records/*            # Health records management (not started)
```

### Recently Completed Endpoints (Version 6.0 - October 5, 2025)
```
✅ /api/lab/member/*                # Lab Diagnostics - Member APIs (6 endpoints)
   - Prescription upload and tracking
   - Lab order viewing
   - Report access

✅ /api/lab/admin/*                 # Lab Diagnostics - Admin APIs (11 endpoints)
   - Lab test master management
   - Lab package management
   - Lab partner management

✅ /api/lab/ops/*                   # Lab Diagnostics - Operations APIs (20 endpoints)
   - Prescription queue and digitization
   - Order lifecycle management
   - Report upload and management
   - Comprehensive analytics dashboard

✅ /api/tpa/*                       # TPA Module (11 endpoints)
   - Claim assignment workflow
   - Claim review and approval/rejection
   - Resubmission request flow
   - TPA analytics and performance tracking

✅ /api/notifications/*             # Notifications Module (5 endpoints)
   - In-app notifications
   - Unread count and marking
   - Notification management

✅ /api/finance/*                   # Finance Module (1 endpoint - foundation)
   - Payment processing foundation

Total New Endpoints: 54
Total System Endpoints: 100+ (across all modules)
```

---

## 📅 APPOINTMENT BOOKING FLOW

### Overview
The appointment booking system supports two types of appointments: **IN_CLINIC** (physical consultations) and **ONLINE** (telemedicine consultations). Both flows are fully implemented with end-to-end functionality.

### IN_CLINIC Appointment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    IN_CLINIC BOOKING FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. SPECIALTY SELECTION (/member/appointments/specialties)
   └─> User selects medical specialty from 9 available options
       API: GET /api/specialties/active
       └─> Returns list of active specialties with icons and names

2. DOCTOR SELECTION (/member/appointments/doctors?specialtyId=X)
   └─> User browses doctors filtered by selected specialty
       API: GET /api/doctors?specialtyId=X&availableOffline=true
       └─> Returns doctors with:
           - Profile (name, qualifications, experience, rating)
           - Clinic locations with addresses and fees
           - Distance from user (if location provided)
           - Insurance acceptance

3. CLINIC SELECTION (Embedded in doctor card)
   └─> User selects specific clinic location from doctor's clinics
       - Displays clinic name, address, consultation fee
       - Shows distance if coordinates available

4. PATIENT SELECTION (/member/appointments/select-patient)
   └─> User selects patient (self or dependent)
       API: GET /api/auth/me (includes relationships)
       └─> Returns user profile with family members

5. TIME SLOT SELECTION (/member/appointments/select-slot)
   └─> User selects date and available time slot
       API: GET /api/doctors/:doctorId/slots?date=YYYY-MM-DD
       └─> Returns available slots for selected doctor/clinic

6. CONFIRMATION (/member/appointments/confirm)
   └─> User reviews all details and confirms booking
       ✨ NEW (v6.9): Displays wallet balance and payment toggle
       API: POST /api/appointments
       Request Body: {
         doctorId, doctorName, specialty,
         clinicId, clinicName, clinicAddress,
         patientName, patientId,
         appointmentType: 'IN_CLINIC',
         appointmentDate, timeSlot,
         consultationFee,
         useWallet: true/false  // ✨ NEW: Toggle wallet payment (default: true)
       }
       └─> Creates appointment with PENDING_CONFIRMATION status
       └─> Calculates copay and wallet debit based on useWallet flag
       └─> Returns appointmentId, appointmentNumber, payment details

7. SUCCESS
   └─> Displays appointment confirmation with:
       - Appointment ID (APT-YYYYMMDD-XXXX)
       - Doctor and clinic details
       - Date and time
       - Payment information
```

### ONLINE Consultation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   ONLINE CONSULTATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. SPECIALTY SELECTION (/member/online-consult/specialties)
   └─> User selects medical specialty
       API: GET /api/specialties/active
       └─> Returns list of active specialties

2. DOCTOR SELECTION (/member/online-consult/doctors?specialtyId=X)
   └─> User browses online consultation doctors
       API: GET /api/doctors?specialtyId=X&availableOnline=true
       └─> Returns doctors with online consultation availability
           - Shows "Available now" or "Available in X mins" status
           - Displays online consultation fee
           - Shows rating and experience

3. CONFIRMATION (/member/online-consult/confirm)
   └─> Single-page confirmation with all details:

   A. PATIENT SELECTION
      └─> Select self or dependent (embedded)

   B. CONTACT NUMBER
      └─> Enter phone number for doctor callback
          - Pre-filled with user's registered number

   C. CALL PREFERENCE
      └─> Select consultation mode:
          - VOICE: Audio call only
          - VIDEO: Video call only
          - BOTH: Either audio or video (doctor decides)

   D. TIMING SELECTION
      └─> Choose consultation timing:
          - CONSULT NOW: Immediate consultation
            └─> appointmentDate: Today's date
            └─> timeSlot: "Immediate"

          - SCHEDULE LATER: Select future date/time
            └─> Opens slot selection modal
            └─> API: GET /api/doctors/:doctorId/slots
            └─> User picks date and time slot

   E. BOOKING CONFIRMATION
      API: POST /api/appointments
      Request Body: {
        doctorId, doctorName, specialty,
        patientName, patientId,
        appointmentType: 'ONLINE',
        appointmentDate, timeSlot,
        contactNumber, callPreference,
        consultationFee,
        useWallet: true/false,  // ✨ NEW (v6.9): Toggle wallet payment
        clinicId: '', clinicName: '', clinicAddress: ''
      }
      └─> Creates ONLINE appointment with PENDING_CONFIRMATION
      └─> Calculates copay and wallet debit based on useWallet flag
      └─> Doctor will call on provided contactNumber

4. SUCCESS
   └─> Redirects to appointments list (/member/appointments)
   └─> Shows appointment in "Upcoming" or "Ongoing" section
```

### Appointment Data Model

```typescript
interface Appointment {
  // Identifiers
  appointmentId: string;           // APT-20250928-0001
  appointmentNumber: string;       // Human-readable number

  // User & Patient
  userId: ObjectId;                // Reference to users collection
  patientName: string;             // Patient's full name
  patientId: string;               // SELF or relationship ID

  // Doctor & Specialty
  doctorId: string;                // Reference to doctors collection
  doctorName: string;              // Doctor's full name
  specialty: string;               // Medical specialty

  // Clinic Details (optional for ONLINE)
  clinicId?: string;               // Clinic identifier
  clinicName?: string;             // Clinic name
  clinicAddress?: string;          // Full clinic address

  // Appointment Details
  appointmentType: 'IN_CLINIC' | 'ONLINE';
  appointmentDate: string;         // YYYY-MM-DD format
  timeSlot: string;                // "10:00 AM - 10:30 AM" or "Immediate"

  // Payment
  consultationFee: number;         // Fee in INR
  paymentStatus: 'PENDING' | 'PAID' | 'FREE';
  amountPaid: number;              // Amount paid by user
  coveredByInsurance: boolean;     // Insurance coverage flag

  // Status Tracking
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  requestedAt: Date;               // Booking request timestamp
  confirmedAt?: Date;              // Confirmation timestamp

  // Online Consultation Specific
  contactNumber?: string;          // Phone for callback (ONLINE only)
  callPreference?: 'VOICE' | 'VIDEO' | 'BOTH';  // Call type (ONLINE only)
}
```

### Frontend Pages Structure

#### IN_CLINIC Appointment Pages
- `/member/appointments` - Appointments list (all appointments)
- `/member/appointments/specialties` - Specialty selection
- `/member/appointments/doctors?specialtyId=X` - Doctor selection
- `/member/appointments/select-patient?...` - Patient selection
- `/member/appointments/select-slot?...` - Time slot selection
- `/member/appointments/confirm?...` - Final confirmation

#### ONLINE Consultation Pages
- `/member/online-consult` - Online consultation entry (redirects to specialties)
- `/member/online-consult/specialties` - Specialty selection
- `/member/online-consult/doctors?specialtyId=X` - Online doctor selection
- `/member/online-consult/confirm?...` - All-in-one confirmation page

### Key Features

#### For IN_CLINIC Appointments
- ✅ Multi-step booking wizard (6 steps)
- ✅ Specialty-based doctor filtering
- ✅ Multiple clinic locations per doctor
- ✅ Real-time slot availability
- ✅ Distance calculation from user location
- ✅ Clinic address and directions
- ✅ Insurance and cashless support indication
- ✅ Booking confirmation with appointment ID

#### For ONLINE Consultations
- ✅ Simplified 3-step flow
- ✅ "Available now" status indicator
- ✅ Immediate or scheduled consultation
- ✅ Call preference selection (Voice/Video/Both)
- ✅ Contact number for callback
- ✅ Single-page confirmation flow
- ✅ Quick booking experience

#### Common Features
- ✅ Family member selection (self + dependents)
- ✅ Doctor ratings and reviews display
- ✅ Consultation fee display
- ✅ Insurance coverage indication
- ✅ Appointment history tracking
- ✅ Appointment status tracking
- ✅ Responsive design for mobile/desktop

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Authentication Flow

```
1. User Login Request
   ↓
   POST /api/auth/login
   Body: { email, password }
   ↓
2. Auth Service Validates
   - Find user by email
   - Compare password with bcrypt (12 rounds)
   - Check user status (ACTIVE)
   ↓
3. Generate JWT Token
   - Algorithm: RS256
   - Expiry: 7 days
   - Payload: { userId, email, role }
   ↓
4. Set HTTP-Only Cookie
   - Name: opd_session
   - Secure: true (production)
   - SameSite: Lax
   - Max-Age: 7 days
   ↓
5. Return User Profile
   { user: { ...profile }, message: 'success' }
```

### Doctor Authentication Flow

```
1. Doctor Login Request
   ↓
   POST /api/auth/doctor/login
   Body: { email, password }
   ↓
2. Doctor Auth Service Validates
   - Find doctor by email (unique)
   - Verify doctor.isActive = true
   - Compare password with bcrypt (10 rounds)
   - Check password field exists
   ↓
3. Generate Doctor JWT Token
   - Algorithm: RS256
   - Expiry: 8 hours
   - Payload: { doctorId, email, name, role: 'DOCTOR' }
   ↓
4. Set HTTP-Only Cookie
   - Name: doctor_session
   - Secure: true (production)
   - SameSite: strict
   - Max-Age: 8 hours
   ↓
5. Update lastLogin Timestamp
   - doctor.lastLogin = new Date()
   ↓
6. Return Doctor Profile
   { doctor: { doctorId, name, email, specialty, ... }, message: 'Login successful' }
```

**Doctor Authentication Endpoints:**
- `POST /api/auth/doctor/login` - Doctor login
- `POST /api/auth/doctor/logout` - Doctor logout
- `GET /api/auth/doctor/profile` - Get doctor profile (requires DOCTOR role)
- `PATCH /api/auth/doctor/profile` - Update doctor profile (requires DOCTOR role)

**Doctor-Specific Features:**
- Separate authentication system from regular users
- Password managed in `doctors.password` field (bcrypt hashed)
- Email must be unique across all doctors
- Role automatically set to 'DOCTOR' on authentication
- Access to doctor portal for appointment management and prescription uploads

### Authorization Levels

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | Full System | All operations, user management, system config |
| **ADMIN** | Administrative | Policy management, user management, assignments |
| **TPA** | Third Party | View users, view policies, view assignments |
| **FINANCE_USER** | Finance | Financial operations, claims processing |
| **OPS** | Operations | View users, view policies, manage doctors/appointments |
| **MEMBER** | Self-Service | Profile, wallet, bookings, claims, family |
| **DOCTOR** | Doctor Portal | View appointments, upload prescriptions, manage profile |

### Route Protection

#### Guard Stack
```typescript
1. JwtAuthGuard
   - Validates JWT token from cookie
   - Extracts user payload
   - Attaches user to request object

2. RolesGuard
   - Checks user role against @Roles() decorator
   - Allows access if role matches
   - Returns 403 Forbidden if not authorized
```

#### Example Protected Route
```typescript
@Controller('policies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoliciesController {

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TPA, UserRole.OPS)
  findAll() {
    // Accessible by: SUPER_ADMIN, ADMIN, TPA, OPS
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create() {
    // Accessible by: SUPER_ADMIN, ADMIN only
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove() {
    // Accessible by: SUPER_ADMIN only
  }
}
```

### Password Security

- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: 12
- **Min Length**: 8 characters
- **Max Length**: 50 characters
- **Complexity**: No enforcement (recommended: add requirements)
- **Storage**: Never stored in plaintext
- **Reset**: Admin-initiated or self-service (not yet implemented)

---

## 🛡️ SECURITY ARCHITECTURE

### Security Layers

#### 1. Network Security
- **Nginx Reverse Proxy**: Hides internal service ports
- **Rate Limiting**:
  - API: 10 req/sec (burst: 20)
  - App: 30 req/sec (burst: 50)
- **CORS Configuration**: Whitelist-based origin control
- **Firewall**: EC2 security groups

#### 2. Application Security
- **Helmet.js**: Security headers
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
- **Input Validation**: class-validator on all DTOs
- **Output Sanitization**: Mongoose schema validation
- **SQL Injection Prevention**: N/A (NoSQL with Mongoose)
- **XSS Prevention**: React auto-escaping + CSP headers

#### 3. Authentication Security
- **JWT Tokens**:
  - Signed with RS256
  - Short-lived (7 days)
  - HTTP-only cookies
  - Secure flag in production
- **Password Policies**:
  - Bcrypt hashing (12 rounds)
  - No plaintext storage
  - Secure password reset flow (planned)
- **Session Management**:
  - Cookie-based sessions
  - Automatic expiry
  - Logout invalidation

#### 4. Data Security
- **Encryption at Rest**: MongoDB encryption (recommended, not configured)
- **Encryption in Transit**: HTTPS (configured but not enforced)
- **Sensitive Data Handling**:
  - Passwords: bcrypt hashed
  - Tokens: HTTP-only cookies
  - PII: No additional encryption (⚠️ Risk)

#### 5. API Security
- **Rate Limiting**: Per-IP throttling
- **Request Validation**: DTO validation
- **Error Handling**: Generic error messages (no stack traces in prod)
- **Logging**: Audit trail (⚠️ Not functioning)

### Security Configuration

#### Development Environment
```typescript
{
  jwt: { expiresIn: '7d' },
  bcrypt: { rounds: 12 },
  rateLimit: {
    global: 1000/15min,
    auth: 50/15min
  },
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true
  },
  cookies: {
    secure: false,
    sameSite: 'lax'
  }
}
```

#### Production Environment
```typescript
{
  jwt: { expiresIn: '7d' },
  bcrypt: { rounds: 12 },
  rateLimit: {
    global: 100/15min,
    auth: 50/15min
  },
  cors: {
    origin: [process.env.ALLOWED_ORIGINS],
    credentials: true
  },
  cookies: {
    secure: true,
    sameSite: 'strict'
  },
  https: {
    enabled: true  // ⚠️ Configured but not enforced
  }
}
```

### Known Security Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Hardcoded credentials in code | 🔴 CRITICAL | Identified |
| Weak JWT secrets in production | 🔴 CRITICAL | Identified |
| MongoDB without authentication | 🔴 CRITICAL | Identified |
| SSL/TLS not enforced | 🔴 CRITICAL | Configured |
| Insecure cookie config (dev) | 🟡 HIGH | By design |
| Sensitive data in logs | 🟡 HIGH | Identified |
| No audit logging | 🟡 HIGH | Not functioning |
| No rate limit on some endpoints | 🟡 MEDIUM | Partial |

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Docker Compose Configurations

#### 1. Development (`docker-compose.yml`)
```yaml
Services:
- mongodb (Port: 27017 exposed)
- api (Port: 4000 exposed)
- web-admin (Port: 3001 exposed)
- web-member (Port: 3002 exposed)

Container Names:
- opd-mongo-dev
- opd-api-dev
- opd-web-admin-dev
- opd-web-member-dev

Purpose: Local development with direct port access
```

#### 2. Production (`docker-compose.prod.yml`)
```yaml
Services:
- nginx (Port: 80, 443 exposed)
- mongodb (Internal only)
- api (Internal only, via nginx)
- web-admin (Internal only, via nginx /admin)
- web-member (Internal only, via nginx /)

Container Names:
- opd-nginx-prod
- opd-mongo-prod
- opd-api-prod
- opd-web-admin-prod
- opd-web-member-prod

Purpose: Production deployment with reverse proxy
```

#### 3. Simple (`docker-compose.simple.yml`)
```yaml
Services:
- nginx (Port: 80 exposed)
- mongodb (Internal)
- api (Internal)
- web-admin (Internal)
- web-member (Internal)

Container Names:
- opd-nginx-simple
- opd-mongodb-simple
- opd-api-simple
- opd-web-admin-simple
- opd-web-member-simple

Purpose: Simplified production deployment
```

#### 4. Secure (`docker-compose.secure.yml`)
```yaml
Services:
- nginx (Port: 443 with SSL)
- mongodb (Auth enabled, localhost only)
- api (Internal)
- web-admin (Internal)
- web-member (Internal)

Purpose: Security-hardened deployment with SSL/TLS
```

#### 5. ECR (`docker-compose.ecr.yml`)
```yaml
Services:
- Uses AWS ECR images
- nginx (Port: 80, 443)
- All services internal

Purpose: AWS ECR-based deployment
```

#### 6. Secrets (`docker-compose.secrets.yml`)
```yaml
Services:
- AWS Secrets Manager integration
- All secrets from AWS SSM
- nginx (Port: 80, 443)

Purpose: Production with AWS Secrets Manager
```

### Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Host                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         opd-network (bridge)                   │    │
│  │                                                 │    │
│  │  ┌──────────────┐    ┌──────────────┐         │    │
│  │  │ nginx:alpine │───→│  api:4000    │         │    │
│  │  │  Port 80/443 │    │  (NestJS)    │         │    │
│  │  │              │    └──────┬───────┘         │    │
│  │  │              │           │                  │    │
│  │  │              │───→┌──────▼───────┐         │    │
│  │  │              │   │ web-admin:3000│         │    │
│  │  │              │   └───────────────┘         │    │
│  │  │              │           │                  │    │
│  │  │              │───→┌──────▼───────┐         │    │
│  │  │              │   │web-member:3000│         │    │
│  │  │              │   └───────────────┘         │    │
│  │  └──────────────┘           │                  │    │
│  │                       ┌──────▼───────┐         │    │
│  │                       │mongodb:27017 │         │    │
│  │                       │ (Persistent) │         │    │
│  │                       └──────────────┘         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Volumes:                                               │
│  - mongodb_data (persistent)                            │
│  - nginx_logs (persistent)                              │
└─────────────────────────────────────────────────────────┘
```

### Nginx Routing Configuration

```nginx
# Upstream Definitions
upstream api_backend {
    server api:4000;
}

upstream admin_backend {
    server web-admin:3000;  # ⚠️ Note: was 3001 in some configs
}

upstream member_backend {
    server web-member:3000;  # ⚠️ Note: was 3002 in some configs
}

# Routing Rules
location /api {
    proxy_pass http://api_backend;
    rate_limit 10r/s;
}

location /admin {
    proxy_pass http://admin_backend/admin;
    rate_limit 30r/s;
}

location / {
    proxy_pass http://member_backend;
    rate_limit 30r/s;
}
```

### Deployment Workflow

#### Manual Deployment
```bash
# 1. SSH to EC2 instance
ssh -i keypair.pem ubuntu@51.20.125.246

# 2. Navigate to project
cd ~/opdwallet

# 3. Pull latest code
git pull origin main

# 4. Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

#### CI/CD Pipeline (GitHub Actions)
```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Docker
      - Build images
      - Push to registry (optional)
      - SSH to EC2
      - Pull latest code
      - Run deployment script
      - Health check
      - Notify (optional)
```

### Health Monitoring

#### Application Health Check
```bash
# API Health
curl http://51.20.125.246/api/health
# Response: { "status": "ok" }

# Container Status
docker ps
```

#### Service Monitoring
- **Uptime**: Manual check
- **Logs**: Docker logs
- **Metrics**: Not implemented
- **Alerts**: Not implemented
- **APM**: Not implemented

---

## ⚙️ ENVIRONMENT CONFIGURATION

### Backend Environment Variables

#### Core Configuration
```bash
# Node Environment
NODE_ENV=development|production

# Server Configuration
PORT=4000
API_PORT=4001

# Database
MONGODB_URI=mongodb://localhost:27017/opd_wallet
DB_QUERY_TIMEOUT=5000
DB_POOL_SIZE=10
```

#### Authentication
```bash
# JWT Configuration
JWT_SECRET=<secure_random_string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<secure_random_string>
JWT_REFRESH_EXPIRY=30d

# Password Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=86400000  # 24h in ms
```

#### Session Management
```bash
# Cookie Configuration
COOKIE_NAME=opd_session
COOKIE_MAX_AGE=604800000  # 7 days in ms
COOKIE_SECURE=false  # true in production
COOKIE_SAMESITE=lax  # strict in production
COOKIE_DOMAIN=  # Set domain in production
COOKIE_HTTPONLY=true
```

#### Security
```bash
# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 min
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_API=1000
```

#### Monitoring & Logging
```bash
# Audit Logging
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=730

# Monitoring
MONITORING_ENABLED=true
```

#### AWS Integration
```bash
# AWS Configuration
USE_SECRETS_MANAGER=false
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=<access_key>
AWS_SECRET_ACCESS_KEY=<secret_key>
```

### Frontend Environment Variables

#### Admin Portal
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Environment
NODE_ENV=development|production
```

#### Member Portal
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Environment
NODE_ENV=development|production
```

### Configuration Loading Strategy

#### Backend (NestJS)
```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  // ... more config
});

// Usage in services
@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
  ) {}

  getJwtSecret() {
    return this.configService.get<string>('jwt.secret');
  }
}
```

#### Frontend (Next.js)
```typescript
// Environment variables accessed directly
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Or via constants
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
};
```

---

## 🔗 INTEGRATION POINTS

### Current Integrations

#### 1. Frontend ↔ Backend API
```typescript
// Admin Portal → Backend
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // Send cookies
});

// Auto-attach JWT cookie
api.interceptors.request.use((config) => {
  // Cookie automatically sent by browser
  return config;
});

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

#### 2. Backend ↔ MongoDB
```typescript
// Mongoose connection
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### 3. Module ↔ Module (Backend)
```typescript
// Service injection across modules
@Module({
  imports: [
    UsersModule,      // Import UsersModule
    CountersModule,   // Import CountersModule
  ],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}

// Usage in PoliciesService
@Injectable()
export class PoliciesService {
  constructor(
    private usersService: UsersService,        // Injected from UsersModule
    private counterService: CountersService,   // Injected from CountersModule
  ) {}
}
```

#### 4. Google Maps API ✨ NEW (v6.5)
```typescript
// Location Service with Google Maps
import { Client } from '@googlemaps/google-maps-services-js';

@Injectable()
export class LocationService {
  private readonly googleMapsClient: Client;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.googleMapsClient = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
  }

  // Reverse Geocode: Convert coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    const response = await this.googleMapsClient.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: this.apiKey,
      },
    });
    return this.parseGoogleGeocodeResult(response.data.results[0]);
  }

  // Forward Geocode: Convert address to coordinates
  async forwardGeocode(query: string): Promise<GeocodingResult> {
    const response = await this.googleMapsClient.geocode({
      params: {
        address: query,
        key: this.apiKey,
        region: 'in',
        components: { country: 'IN' },
      },
    });
    return this.parseGoogleGeocodeResult(response.data.results[0]);
  }

  // Search Cities by Name
  async searchCities(query: string): Promise<CityResult[]> {
    const response = await this.googleMapsClient.placeAutocomplete({
      params: {
        input: query,
        key: this.apiKey,
        types: '(cities)',
        components: ['country:in'],
      },
    });
    return this.parseCityResults(response.data.predictions);
  }
}
```

**Features**:
- **Reverse Geocoding**: Convert lat/lng to pincode, city, state
- **Forward Geocoding**: Convert city/address to coordinates
- **City Autocomplete**: Google Places-style city search
- **India-Biased**: Prioritizes Indian locations
- **Caching Layer**: In-memory cache for repeated lookups
- **Fallback Support**: Graceful degradation if API key missing

**API Endpoints**:
```
GET /api/location/reverse?lat={latitude}&lng={longitude}
GET /api/location/forward?query={address}
GET /api/location/cities?query={city_name}
```

**Environment Setup**:
```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Planned Integrations (Not Implemented)

#### 1. Payment Gateway
- **Purpose**: Wallet top-ups, premium payments
- **Providers**: Razorpay, Stripe, PayU
- **Status**: ❌ Not implemented

#### 2. SMS/Email Service
- **Purpose**: OTP verification, notifications
- **Providers**: Twilio, SendGrid, AWS SES
- **Status**: ❌ Not implemented

#### 3. Document Storage
- **Purpose**: Health records, prescription uploads
- **Providers**: AWS S3, Cloudinary
- **Status**: ❌ Not implemented (using local file storage)

#### 4. Healthcare Provider APIs
- **Purpose**: Real-time service booking, availability
- **Providers**: Hospital APIs, Lab APIs
- **Status**: ❌ Not implemented

#### 5. Insurance APIs
- **Purpose**: Claims processing, policy validation
- **Providers**: Insurance company APIs
- **Status**: ❌ Not implemented

---

## ⚠️ KNOWN ISSUES & GAPS

### Critical Issues

#### 1. Missing Backend Implementations
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Appointments | ✅ Full UI | ✅ Fully implemented | ✅ COMPLETED |
| Doctors Management | ✅ Full UI | ✅ Fully implemented | ✅ COMPLETED |
| Member Claims/Reimbursements | ✅ Full UI | ✅ Fully implemented | ✅ COMPLETED (Unified) |
| Wallet Management | ✅ UI exists | ❌ No endpoints | Service exists |
| Health Records | ✅ Full UI | ❌ No endpoints | Not started |

#### 2. Security Vulnerabilities
- **Hardcoded Credentials**: `admin:admin123` in multiple files
- **Weak JWT Secrets**: Default secrets in production configs
- **No MongoDB Auth**: Production runs without authentication
- **SSL Not Enforced**: HTTPS configured but not mandatory
- **Sensitive Logs**: Debug logs contain passwords and tokens

#### 3. Data Integrity Issues
- **No Soft Deletes**: Hard deletes cause orphaned records
- **No Transactions**: Multi-document operations lack atomicity
- **No Cascading**: Deleting entities doesn't clean up references
- **Mock Data in Frontend**: FamilyContext uses fake data

#### 4. Audit System Not Functioning
- Audit schema exists
- Service implemented
- No data being written
- TTL index configured but unused

### Performance Issues

#### 1. N+1 Query Problems
```typescript
// ⚠️ Potential N+1 in assignments
const assignments = await this.findAll();
for (const assignment of assignments) {
  const user = await this.usersService.findOne(assignment.userId);
  const policy = await this.policiesService.findOne(assignment.policyId);
}
// Should use: populate() or aggregation
```

#### 2. No Caching Layer
- No Redis for session caching
- No query result caching
- All requests hit database
- Frontend has no cache (member portal)

#### 3. Unoptimized Queries
- Missing compound indexes on frequent queries
- No query profiling/monitoring
- No slow query logging

### Code Quality Issues

#### 1. Inconsistent Error Handling
```typescript
// Some controllers
throw new HttpException('User not found', HttpStatus.NOT_FOUND);

// Other controllers
throw new NotFoundException('User not found');

// Some services
return null;

// Others
throw new Error('User not found');
```

#### 2. Excessive Logging
- 355+ console.log statements in production code
- Sensitive data in logs (passwords, tokens)
- No structured logging
- No log rotation

#### 3. Type Safety Issues
```typescript
// ⚠️ Using 'any' in DTOs
benefits?: {
  [key: string]: any;  // Should be properly typed
};

// ⚠️ Untyped return values
async someMethod(): Promise<any> {
  // Should have proper return type
}
```

### Configuration Issues

#### 1. Port Inconsistencies
- Development: API=4000, Admin=3001, Member=3002
- Production (Nginx): Admin=3000, Member=3000
- Simple Deployment: Fixed to use 3000 for frontends
- Dockerfiles EXPOSE 3000 for frontends

#### 2. Environment-Specific Configs
- Some configs hardcoded in code
- .env.example doesn't match all required vars
- No .env validation on startup
- Missing production environment variables

#### 3. Docker Container Naming
- Recently fixed to have unique suffixes
- Old deployments may have conflicts
- Cleanup script added but may not be used

---

## 🗺️ ROADMAP

### Phase 1: Critical Fixes (Weeks 1-2)
**Priority**: 🔴 CRITICAL

1. **Security Hardening**
   - [ ] Remove all hardcoded credentials
   - [ ] Generate strong JWT secrets for all environments
   - [ ] Enable MongoDB authentication in production
   - [ ] Remove sensitive data from logs
   - [ ] Enforce HTTPS in production

2. **Complete Wallet Implementation**
   - [ ] Create wallet controller with endpoints
   - [ ] Implement transaction endpoints
   - [ ] Connect frontend wallet UI to backend
   - [ ] Add wallet balance calculation
   - [ ] Implement wallet transaction history

3. **Fix Audit Logging**
   - [ ] Debug why audit logs aren't being written
   - [ ] Verify interceptor is triggered
   - [ ] Test audit log creation
   - [ ] Validate TTL index is working

### Phase 2: Feature Completion (Weeks 3-6)
**Priority**: 🟡 HIGH

1. **Appointment System** ✅ COMPLETED
   - [x] Design appointment schema (IN_CLINIC & ONLINE)
   - [x] Create appointment booking endpoints
   - [x] Implement appointment service with status tracking
   - [x] Connect frontend appointment UI (both flows)
   - [x] Add doctor management with specialties
   - [x] Implement slot availability system
   - [x] Add call preference for online consultations
   - [x] Integrate with user relationships for dependent booking

2. **Claims Processing** ✅ COMPLETED (October 3, 2025)
   - [x] Design claims schema
   - [x] Create claims endpoints (11 endpoints)
   - [x] Implement claims workflow
   - [x] Connect frontend claims UI
   - [x] Add claims status tracking
   - [x] Unified with reimbursements functionality

3. **Health Records**
   - [ ] Design health records schema
   - [ ] Create health records endpoints
   - [ ] Implement document upload (S3)
   - [ ] Connect frontend health records UI
   - [ ] Add record viewing and download


### Phase 3: Quality Improvements (Weeks 7-10)
**Priority**: 🟢 MEDIUM

1. **Code Quality**
   - [ ] Remove all console.log statements
   - [ ] Implement structured logging (Winston/Pino)
   - [ ] Add proper error handling
   - [ ] Remove 'any' types
   - [ ] Add JSDoc comments

2. **Data Integrity**
   - [ ] Implement soft deletes
   - [ ] Add MongoDB transactions
   - [ ] Implement cascading deletes
   - [ ] Add foreign key validation
   - [ ] Create data consistency scripts

3. **Testing**
   - [ ] Unit tests for all services
   - [ ] Integration tests for all endpoints
   - [ ] E2E tests for critical flows
   - [ ] Load testing
   - [ ] Security testing

### Phase 4: Optimization & Scale (Weeks 11-14)
**Priority**: 🔵 LOW

1. **Performance**
   - [ ] Add Redis caching layer
   - [ ] Optimize database queries
   - [ ] Add database query profiling
   - [ ] Implement CDN for static assets
   - [ ] Add load balancing

2. **Monitoring**
   - [ ] Implement APM (New Relic/DataDog)
   - [ ] Add error tracking (Sentry)
   - [ ] Set up log aggregation (ELK/Splunk)
   - [ ] Create monitoring dashboards
   - [ ] Set up alerting

3. **Documentation**
   - [ ] Complete API documentation (Swagger)
   - [ ] Add developer onboarding guide
   - [ ] Create deployment runbooks
   - [ ] Document troubleshooting procedures
   - [ ] Add architecture diagrams

---

## 📝 APPENDIX

### A. Key Files Reference

#### Backend
- `/api/src/main.ts` - Application bootstrap
- `/api/src/app.module.ts` - Root module
- `/api/src/config/configuration.ts` - Configuration loader
- `/api/src/modules/*/schemas/*.schema.ts` - Mongoose schemas
- `/api/src/modules/*/*.service.ts` - Business logic
- `/api/src/modules/*/*.controller.ts` - API endpoints

#### Frontend
- `/web-admin/app/admin/page.tsx` - Admin dashboard
- `/web-member/app/member/page.tsx` - Member dashboard
- `/web-admin/lib/api.ts` - API client (admin)
- `/web-member/lib/api.ts` - API client (member)

#### Infrastructure
- `/docker-compose.*.yml` - Docker configurations
- `/nginx/nginx.conf` - Nginx configuration
- `/.github/workflows/*.yml` - CI/CD pipelines
- `/scripts/*.sh` - Deployment scripts

### B. Common Commands

#### Development
```bash
# Start development environment
make up

# View logs
make logs
make logs-api
make logs-admin

# Access MongoDB shell
make mongo-shell

# Reset database
make reset-db
```

#### Production
```bash
# Deploy production
make prod-up

# View production logs
make prod-logs

# Check status
make prod-status

# Stop production
make prod-down
```

#### Database
```bash
# Access MongoDB
docker exec -it opd-mongo-dev mongosh -u admin -p admin123

# Backup database
mongodump --uri="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" --out=/backup

# Restore database
mongorestore --uri="mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin" /backup
```

### C. Default Credentials

#### Development
```
Super Admin:
- Email: admin@opdwallet.com
- Password: Admin@123

MongoDB:
- Username: admin
- Password: admin123
```

#### Production
⚠️ **CHANGE ALL DEFAULT CREDENTIALS IMMEDIATELY**

### D. Useful Links

- **Production**: http://51.20.125.246
- **API Docs**: http://51.20.125.246/api-docs (dev only)
- **GitHub**: https://github.com/anilkumar1510/opdwallet
- **Admin Portal**: http://51.20.125.246/admin
- **Member Portal**: http://51.20.125.246

---

**Document Maintained By**: Development Team
**Last Audit Date**: October 3, 2025
**Next Review**: Every 2 weeks or after major changes
**Version History**: See git commits for detailed changes

---

## RECENT UPDATES (Version 5.3 - October 3, 2025 Evening)

### Major Feature Addition: Member Claims Module

#### 1. NEW MODULE: Member Claims (Reimbursement System)
**Status**: ✅ Fully implemented, collection created
**Location**: `api/src/modules/memberclaims/`
**Purpose**: Handle member reimbursement claims and cashless pre-authorization

**Files Created** (7 new files):
```
api/src/modules/memberclaims/
├── schemas/memberclaim.schema.ts       # Complete schema with 40+ fields
├── memberclaims.controller.ts          # 11 API endpoints
├── memberclaims.service.ts             # Business logic for claims
├── memberclaims.module.ts              # Module registration
├── dto/create-claim.dto.ts             # Validation for creation
├── dto/update-claim.dto.ts             # Validation for updates
└── config/multer.config.ts             # File upload configuration
```

**Modified Files**:
```
api/src/app.module.ts                   # Added MemberClaimsModule
api/package.json                        # Added @types/multer@^2.0.0
```

**Database Collection**:
- Collection name: `memberclaims`
- Document count: 0 (newly created, empty)
- Indexes: 6 indexes for optimized queries
- Status: Ready for production use

**API Endpoints** (11 total):
```
POST   /api/member/claims                      # Create claim + upload files
POST   /api/member/claims/:claimId/submit      # Submit for processing
GET    /api/member/claims                      # List with pagination
GET    /api/member/claims/summary              # User summary stats
GET    /api/member/claims/:id                  # Get by MongoDB ID
GET    /api/member/claims/claim/:claimId       # Get by claimId
PATCH  /api/member/claims/:id                  # Update claim
POST   /api/member/claims/:claimId/documents   # Add documents
DELETE /api/member/claims/:claimId/documents/:documentId  # Remove doc
DELETE /api/member/claims/:id                  # Delete claim
GET    /api/member/claims/files/:userId/:filename  # Download file
```

**Key Features**:
- Multi-file upload support (up to 10 files, 15MB each)
- Supported formats: JPEG, PNG, GIF, WebP, PDF
- Document categorization: INVOICE, PRESCRIPTION, REPORT, DISCHARGE_SUMMARY, OTHER
- User-specific file storage: `/uploads/claims/{userId}/`
- Claim types: REIMBURSEMENT, CASHLESS_PREAUTH
- Status workflow: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
- Complete claim lifecycle management
- Document metadata tracking (filename, size, type, upload date)

**Schema Highlights**:
```typescript
export class MemberClaim {
  claimId: string;                    // Unique claim ID
  userId: ObjectId;                   // User reference
  claimType: 'REIMBURSEMENT' | 'CASHLESS_PREAUTH';
  status: ClaimStatus;                // Workflow status
  claimAmount: number;                // Requested amount
  approvedAmount?: number;            // Approved amount
  documents: Array<{                  // Uploaded documents
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    uploadedAt: Date;
    documentType: DocumentType;
  }>;
  // ... 40+ total fields
}
```

#### 2. Relationship Data Model Fix
**Status**: ✅ Completed and tested
**Purpose**: Fix relationship dropdown to use database codes instead of enums

**Backend Changes**:
```
api/src/modules/users/dto/create-user.dto.ts
  - Changed: @IsEnum(RelationshipType) → @IsString()
  - Updated: relationship field from enum to string

api/src/modules/users/dto/update-user.dto.ts
  - Changed: @IsEnum(RelationshipType) → @IsString()

api/src/modules/users/schemas/user.schema.ts
  - Changed: enum: RelationshipType → removed enum constraint
  - Updated: default: RelationshipType.SELF → default: 'REL001'
  - Updated: primaryMemberId required condition to use 'REL001'

api/src/modules/users/users.service.ts
  - Updated: All RelationshipType.SELF → 'REL001' (5 locations)
  - Lines: 54, 70, 189, 270, 285
```

**Frontend Changes**:
```
web-admin/app/admin/users/[id]/page.tsx
  - Added: Dynamic relationship dropdown from API
  - Added: Display name lookup for relationship codes
  - Fixed: primaryMemberId field visibility condition
  - Added: Comprehensive console debugging
  - Updated: Relationship display to show human-readable names
```

**Database Migration**:
```javascript
// Migrated 1 user from old enum to new code system
db.users.updateMany(
  { relationship: 'SELF' },
  { $set: { relationship: 'REL001' }}
)
// Result: 1 document updated (Operations User)
```

**Impact**:
- Admin portal can now edit user relationships without errors
- Relationship codes properly synchronized between frontend and backend
- Database uses standardized relationship codes (REL001, REL002, etc.)
- All validation now accepts relationship codes instead of enum values

#### 3. Frontend Enhancements
**Location**: web-member portal
**Status**: Multiple UI improvements

**Modified Files**:
```
web-member/app/member/claims/new/page.tsx
  - Enhanced: Document upload UI with category separation
  - Added: Separate sections for invoice, prescription, other docs
  - Improved: File preview and management
  - Updated: October 3, 15:11

web-member/app/member/appointments/select-slot/page.tsx
  - Minor routing adjustments
  - Updated: October 3, 15:33

web-member/app/member/online-consult/confirm/page.tsx
  - Added: Conditional slotId handling
  - Logic: slotId only sent for LATER appointments, not NOW
  - Code: slotId: timeChoice === 'LATER' ? selectedSlotId : ''
  - Updated: October 3, 15:33
```

**User Experience Improvements**:
- Better file upload categorization in claims
- Clearer appointment booking flow
- Proper slot selection for online consultations

#### 4. Technology Stack Updates
**Added Dependencies**:
```json
{
  "multer": "1.4.5-lts.1",
  "@types/multer": "2.0.0"
}
```

### Database Statistics Update
- Total collections: 17 → 18 (added `memberclaims`)
- Total documents: 62 (unchanged, memberclaims empty)
- New collection indexes: 6 indexes on memberclaims

### Files Modified in Last 3 Hours
**Total**: 28 files changed
- Backend (API): 10 files (7 new, 3 modified)
- Frontend (web-member): 3 files
- Frontend (web-admin): 1 file
- Documentation: Updated

---

## RECENT UPDATES (Version 6.2 - October 4, 2025 Night)

### Automatic Wallet Initialization System

**Status**: ✅ COMPLETED
**Impact**: MAJOR FEATURE - Wallets now auto-created on policy assignment

#### Changes Made

1. **AssignmentsModule Integration**
   - File: `src/modules/assignments/assignments.module.ts`
   - Added: `WalletModule` import (line 6, 14)
   - Added: `PlanConfigModule` import (line 7, 15)
   - Purpose: Enable wallet creation during policy assignment

2. **AssignmentsService Enhancements**
   - File: `src/modules/assignments/assignments.service.ts`
   - Injected: `WalletService` and `PlanConfigService` (lines 6-7, 14-15)
   - Added: Wallet initialization after assignment save (lines 83-103)
     - Fetches plan_configs for assigned policy
     - Calls `initializeWalletFromPolicy()` with assignment details
     - Error handling ensures assignment succeeds even if wallet fails
   - Added: Wallet deletion in `removeAssignment()` (lines 166-171)
   - Added: Wallet deletion in `unassignPolicyFromUser()` (lines 202-207)

3. **WalletModule Enhancement**
   - File: `src/modules/wallet/wallet.module.ts`
   - Added: `MastersModule` import (line 6, 14)
   - Purpose: Access CategoryMaster for category name lookup

4. **WalletService New Methods**
   - File: `src/modules/wallet/wallet.service.ts`
   - Injected: `CategoryMaster` model (line 6, 13)
   - **New Method**: `initializeWalletFromPolicy()` (lines 144-234)
     - Input: userId, policyAssignmentId, planConfig, effectiveFrom, effectiveTo
     - Logic:
       1. Checks if wallet already exists (prevents duplicates)
       2. Extracts total amount from planConfig.wallet.totalAnnualAmount
       3. Gets category codes from planConfig.benefits (CAT001, CAT002, etc.)
       4. Fetches category names from category_master collection
       5. Builds categoryBalances array with allocated/current/consumed
       6. Calculates policyYear from effective dates
       7. Creates and saves wallet document
     - Returns: Created wallet or existing wallet if duplicate
   - **New Method**: `deleteWalletByAssignment()` (lines 236-247)
     - Input: policyAssignmentId
     - Logic: Deletes all wallets linked to assignment
     - Returns: Deletion result with count

5. **Member Dashboard Integration**
   - File: `src/modules/member/member.service.ts:54-55`
   - Fixed: Assignment map building to handle populated userId objects
   - Changed: `assignment.userId.toString()` → extract _id from populated object
   - Result: OPD e-card now displays policy number and validity correctly

#### Data Flow

**Assignment Creation**:
```
1. Admin assigns policy via admin portal
   ↓
2. AssignmentsService.createAssignment()
   ↓
3. Save assignment to userPolicyAssignments ✅
   ↓
4. Fetch plan_configs for policy ✅
   ↓
5. WalletService.initializeWalletFromPolicy() ✅
   ↓
6. Create wallet in user_wallets collection ✅
   - totalBalance: { allocated: 4000, current: 4000, consumed: 0 }
   - categoryBalances: [{ categoryCode: 'CAT001', categoryName: 'Consult', allocated: 2000, current: 2000, consumed: 0 }]
   - policyYear: "2025-2025"
   - effectiveFrom/To: from assignment
```

**Assignment Deletion**:
```
1. Admin removes assignment
   ↓
2. AssignmentsService.removeAssignment()
   ↓
3. WalletService.deleteWalletByAssignment() ✅
   ↓
4. Delete wallet from user_wallets ✅
   ↓
5. Delete assignment from userPolicyAssignments ✅
```

#### Benefits

1. **Automatic Wallet Creation**: No manual intervention required
2. **Data Consistency**: Wallets always match policy configurations
3. **Category-wise Balances**: Each benefit category gets proper allocation
4. **Proper Cleanup**: Wallets deleted when assignments removed
5. **Frontend Ready**: Member dashboard now shows real balances
6. **OPD E-Card**: Displays policy number and validity dates correctly

#### Testing Status

✅ Implementation complete
🟡 Awaiting user testing (assign policy to MEM003)

---

## RECENT UPDATES (Version 6.1 - October 4, 2025 Evening)

### Policy Assignment Dates Made Mandatory

**Status**: ✅ COMPLETED
**Impact**: BREAKING CHANGE - Wallet initialization prerequisite

#### Changes Made

1. **Backend Schema Updates**
   - File: `src/modules/assignments/schemas/assignment.schema.ts`
   - Changed: `effectiveTo?: Date` → `effectiveTo: Date` (now required)
   - Changed: Removed `default: Date.now` from `effectiveFrom` (must be explicit)

2. **DTO Validation Updates**
   - File: `src/modules/assignments/dto/create-assignment.dto.ts`
   - Changed: Both `effectiveFrom` and `effectiveTo` from `@IsOptional()` to `@IsNotEmpty()`
   - Changed: Type signatures from optional to required

3. **Service Layer Validation**
   - File: `src/modules/assignments/assignments.service.ts`
   - Added: Validation to ensure both dates are provided
   - Added: Validation that `effectiveTo > effectiveFrom`
   - Updated: Assignment creation to use explicit dates (no defaults)

4. **Admin Frontend Updates**
   - File: `web-admin/app/admin/users/[id]/page.tsx`
   - Added: Two new date input fields in "Assign Policy" modal
     - Effective From (required, type="date")
     - Effective To (required, type="date", min=effectiveFrom)
   - Added: Frontend validation before API call
   - Added: Dates sent as ISO strings in payload
   - Updated: Assign button disabled unless both dates provided

#### Rationale

**Critical for Wallet Initialization**:
- Wallet needs `effectiveFrom` to determine coverage start date
- Wallet needs `effectiveTo` to determine coverage end date and validity
- OPD e-card displays "Valid Till" field based on `effectiveTo`
- Policy year calculation depends on these dates
- Without explicit dates, wallet cannot be properly initialized

**Previous Behavior** (BROKEN):
```typescript
effectiveFrom: effectiveFrom || new Date()  // Defaulted to now
effectiveTo?: Date                           // Optional, often missing
```

**New Behavior** (CORRECT):
```typescript
effectiveFrom: Date   // REQUIRED - Explicit date from admin
effectiveTo: Date     // REQUIRED - Explicit date from admin
// Validation: effectiveTo must be > effectiveFrom
```

#### Migration Impact

**Existing Assignments**: No impact (grandfathered)
**New Assignments**: Admin portal now enforces both dates before submission

**Next Steps**: This change is a prerequisite for Phase 1 of wallet implementation (automatic wallet creation on policy assignment).

---

## RECENT CHANGES (Version 6.0 - October 5, 2025)

### Major Additions

#### 1. Lab Diagnostics Module (Complete Workflow)
**Location**: `/api/src/modules/lab/`

**Architecture**:
- 7 MongoDB schemas (tests, packages, partners, prescriptions, digitizations, orders, reports)
- 8 DTOs for request/response handling
- 5 services (lab.service, lab-admin.service, lab-ops.service, lab-order.service, lab-prescription.service)
- 3 controllers: Member (6 endpoints), Admin (11 endpoints), Operations (20 endpoints)
- **Total: 37 API endpoints**

**Workflow**: Member uploads prescription → Operations digitizes tests → Admin assigns to partner → Partner creates order → Partner uploads report → Member views report

**File Storage**:
- Prescription uploads: `uploads/lab/prescriptions/{userId}/`
- Report uploads: `uploads/lab/reports/{orderId}/`
- Max file size: 10MB (prescriptions), 15MB (reports)

**Frontend Pages**:
- Admin Portal: 5 pages (Lab Tests, Packages, Partners management)
- Member Portal: 7 pages (Upload, Track, View Reports)
- Operations Portal: Prescriptions Queue, Order Management, Analytics

---

#### 2. TPA Module (Claims Processing)
**Location**: `/api/src/modules/tpa/`

**Architecture**:
- Enhanced memberclaims schema with TPA assignment and review fields
- 6 DTOs for claim assignment, review, approval, rejection, and resubmission
- 1 service (tpa.service)
- 1 controller with **11 API endpoints**

**Workflow**:
1. Admin assigns claims to TPA users (bulk assignment)
2. TPA reviews claim documents and supporting materials
3. TPA approves, partially approves, rejects, or requests resubmission
4. If resubmission: Member uploads new documents → Loop back to review
5. Final approval triggers payment processing via Finance module

**Frontend Pages**:
- Admin Portal: 5 pages (TPA Dashboard, Claims Assignment, Review, Analytics)
- Features: Claim assignment queue, document review, approval/rejection with reasons, performance tracking

---

#### 3. Notifications Module (In-App Notifications)
**Location**: `/api/src/modules/notifications/`

**Architecture**:
- 1 MongoDB schema (notifications)
- 1 service (notifications.service)
- 1 controller with **5 API endpoints**

**Notification Types**:
- CLAIM_SUBMITTED, CLAIM_APPROVED, CLAIM_REJECTED, CLAIM_RESUBMISSION_REQUIRED
- APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED
- LAB_ORDER_CREATED, LAB_REPORT_READY
- WALLET_CREDITED, SYSTEM_ANNOUNCEMENT

**Frontend Components**:
- NotificationBell component with unread count indicator
- Real-time notification updates
- Mark as read/unread functionality
- Integrated with Sonner for toast notifications

---

#### 4. Finance Module (Payment Foundation)
**Location**: `/api/src/modules/finance/`

**Architecture**:
- 1 DTO (process-payment.dto)
- 1 service (finance.service)
- 1 controller with **1 API endpoint** (foundation)

**Features**:
- Payment processing foundation integrated with claim approval workflow
- Payment status tracking (PENDING, PROCESSING, COMPLETED, FAILED)
- Links to wallet transactions for future implementation
- Placeholder for payment gateway integration

**Frontend Pages**:
- Admin Portal: 3 pages (Finance Dashboard, Payment Processing, Reports)

---

#### 5. Operations Portal (Unified Structure)
**Location**: `/web-admin/app/admin/operations/`

**Unified Structure**:
- Previously scattered operations features now centralized at `/operations`
- Consolidated Doctors, Appointments, and Lab management
- Consistent navigation and user experience

**Features**:
- Doctors Management: Create, update, activate/deactivate doctors
- Appointments Management: View, confirm, cancel appointments
- Lab Prescriptions Queue: Digitize pending prescriptions
- Lab Orders Management: Create, track, and update orders
- Analytics Dashboard: Real-time statistics and performance metrics

---

### Database Changes

**New Collections**: 9
- `lab_tests` - Lab test master data
- `lab_packages` - Lab test packages/panels
- `lab_partners` - Lab partner/vendor information
- `lab_prescriptions` - Uploaded lab prescriptions
- `lab_digitizations` - Digitized prescription data
- `lab_orders` - Lab test orders
- `lab_reports` - Lab test reports
- `notifications` - In-app notifications
- (Enhanced: `memberclaims` with TPA fields)

**Total Collections**: 18 → 30
**Total Documents**: 62 (unchanged from base data)

---

### API Endpoints Summary

**New Endpoints by Module**:
- Lab Diagnostics: 37 endpoints (6 Member + 11 Admin + 20 Operations)
- TPA: 11 endpoints
- Notifications: 5 endpoints
- Finance: 1 endpoint (foundation)

**Total New Endpoints**: 54
**Total System Endpoints**: 100+ (across all modules)

**Enhanced Endpoints**:
- Member Claims: Enhanced with TPA integration and document resubmission flow
- Member Claims: 13 endpoints (previously 11)

---

### Frontend Changes

**Admin Portal** (`/web-admin`):
- Added Lab Management section (5 pages)
- Added TPA Portal section (5 pages)
- Added Finance Portal section (3 pages)
- Enhanced Operations Portal with unified structure
- Updated navigation with new modules

**Member Portal** (`/web-member`):
- Added Lab Tests section (7 pages)
- Enhanced Claims section with resubmission flow (3 pages total)
- Added NotificationBell component
- Updated BottomTabBar navigation with Lab Tests tab
- Integrated Sonner for toast notifications

**Operations Portal** (`/web-admin/operations`):
- Unified structure at `/operations` route
- Lab Prescriptions Queue and Digitization
- Lab Orders Management with report upload
- Comprehensive Analytics Dashboard

**Total New Pages**: 18+ pages across all portals

---

### Technology Stack Updates

**Backend**:
- Multer file upload middleware (already in use, now with 2 upload directories)
- Enhanced middleware for route protection and role-based access

**Frontend**:
- Sonner: Toast notification library (Member Portal)
- Enhanced Radix UI components
- Improved form handling with React Hook Form

---

### System Statistics

**Before Version 6.0**:
- Modules: 15
- Collections: 18
- API Endpoints: ~50
- Frontend Pages: ~30

**After Version 6.0**:
- Modules: 19 (+4)
- Collections: 27 (+9)
- API Endpoints: 100+ (+54)
- Frontend Pages: ~48 (+18)
- Completion Status: 95%

---

### Next Steps

**Immediate Priorities**:
1. ❌ Wallet API implementation (schema exists, service exists, no controller)
2. ❌ Health Records module (UI exists, no backend)
3. 🔧 Finance module expansion (payment gateway integration)
4. 🔧 Full wallet deduction on claim approval
5. 🔧 Enhanced analytics across all modules

**Future Enhancements**:
- Real-time notifications via WebSocket/SSE
- Advanced reporting and analytics
- Mobile app development
- Third-party integrations (payment gateways, lab partners)

---

### Breaking Changes
None. All changes are additive and backward compatible.

---

### Migration Notes
- No database migrations required for existing data
- New collections will be created automatically on first use
- Existing claims will work with TPA module (TPA fields are optional)
- File upload directories are created automatically by multer configuration