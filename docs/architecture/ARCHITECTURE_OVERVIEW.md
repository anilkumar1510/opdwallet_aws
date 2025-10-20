# OPD Wallet - Architecture Overview

> **Part of Product Architecture Documentation**
> See also: [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md), [API_ENDPOINTS.md](./API_ENDPOINTS.md), [DEPLOYMENT_INFRASTRUCTURE.md](./DEPLOYMENT_INFRASTRUCTURE.md)

**Last Updated**: October 18, 2025
**Current Deployment**: http://51.20.125.246
**Production Status**: Active - Core Features Operational (95% Complete)
**Architecture Type**: Monolithic Backend with Microservices-Ready Structure
**Documentation Version**: 6.8

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [High-Level Architecture](#high-level-architecture)
4. [Component Communication](#component-communication)
5. [Design Patterns](#design-patterns)
6. [Frontend Architecture](#frontend-architecture)
7. [Database Architecture](#database-architecture)
8. [Authentication & Authorization](#authentication--authorization)
9. [Security Architecture](#security-architecture)
10. [Known Issues & Gaps](#known-issues--gaps)

---

## System Overview

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

## Technology Stack

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

## High-Level Architecture

### Architecture Diagram

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

---

## Component Communication

### User Request Flow
```
1. User → Nginx (Port 80/443)
2. Nginx → Route to appropriate service
3. Service → Authenticate with JWT
4. Service → Validate permissions
5. Service → Process business logic
6. Service → Database operations
7. Service → Return response
8. Nginx → Forward to user
```

### Authentication Flow
```
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

## Design Patterns

### 1. Dependency Injection
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

### 2. Guard-Based Authorization
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

### 3. DTO Validation
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

### 4. Schema-First Mongoose Models
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

## Frontend Architecture

### Admin Portal Structure
```
web-admin/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Login page
│   └── admin/                    # Admin routes
│       ├── layout.tsx            # Admin layout with sidebar
│       ├── page.tsx              # Dashboard
│       ├── users/                # User management
│       ├── policies/             # Policy management
│       ├── lab/                  # Lab diagnostics
│       ├── tpa/                  # TPA portal
│       ├── finance/              # Finance portal
│       └── operations/           # Operations portal
├── components/                   # Reusable components
│   └── ui/                       # Radix UI wrappers
├── lib/
│   ├── api.ts                    # Axios API client
│   └── api/                      # API modules
├── hooks/                        # Custom React hooks
├── store/                        # Zustand stores
└── types/                        # TypeScript types
```

### Member Portal Structure
```
web-member/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Login page
│   └── member/                   # Member routes
│       ├── layout.tsx            # Member layout with nav
│       ├── page.tsx              # Dashboard
│       ├── benefits/             # Benefits view
│       ├── wallet/               # Wallet details
│       ├── bookings/             # Appointments
│       ├── claims/               # Claims & reimbursements
│       ├── lab/                  # Lab tests
│       ├── family/               # Family members
│       └── settings/             # User settings
├── components/
│   ├── ui/                       # UI components
│   ├── MemberSwitcher.tsx        # Switch family members
│   ├── BottomTabBar.tsx          # Mobile navigation
│   └── NotificationBell.tsx      # Notifications
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
  - FamilyContext for family members
  - Component-level useState

---

## Database Architecture

### MongoDB Collections Overview

| Collection | Documents | Status | Purpose |
|------------|-----------|--------|---------|
| `appointments` | 0 | Empty | Appointment bookings |
| `doctors` | 6 | Active | Doctor profiles |
| `clinics` | 5 | Active | Clinic locations |
| `doctor_slots` | 18 | Active | Weekly recurring slots |
| `specialty_master` | 9 | Active | Medical specialties |
| `users` | 4 | Active | User profiles |
| `policies` | 1 | Active | Insurance policies |
| `plan_configs` | 1 | Active | Versioned configurations |
| `userPolicyAssignments` | 0 | Empty | User-policy linkage |
| `category_master` | 4 | Active | Service categories |
| `service_master` | 4 | Active | Medical services |
| `relationship_masters` | 5 | Active | Family relationships |
| `cug_master` | 8 | Active | Closed user groups |
| `counters` | 2 | Active | Auto-increment IDs |
| `user_wallets` | 0 | Empty | Wallet balances |
| `wallet_transactions` | 0 | Empty | Transaction history |
| `memberclaims` | 0 | Active | Member claims |
| `lab_tests` | 0 | Active | Lab test master |
| `lab_packages` | 0 | Active | Lab packages |
| `lab_partners` | 0 | Active | Lab partners |
| `lab_prescriptions` | 0 | Active | Lab prescriptions |
| `lab_digitizations` | 0 | Active | Digitized data |
| `lab_orders` | 0 | Active | Lab orders |
| `lab_reports` | 0 | Active | Lab reports |
| `notifications` | 0 | Active | In-app notifications |
| `auditLogs` | 0 | Empty | Audit trail |

**Total Collections**: 30
**Total Documents**: 62
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

doctor_slots ←─ doctorId (doctors.doctorId)
             ←─ clinicId (clinics.clinicId)

memberclaims ←─ userId (users._id)

lab_prescriptions ←─ userId (users._id)
lab_digitizations ←─ prescriptionId (lab_prescriptions._id)
lab_orders ←─ prescriptionId (lab_prescriptions._id)
lab_reports ←─ orderId (lab_orders._id)

notifications ←─ userId (users._id)
```

---

## Authentication & Authorization

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

### Password Security

- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: 12
- **Min Length**: 8 characters
- **Max Length**: 50 characters
- **Storage**: Never stored in plaintext

---

## Security Architecture

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
- **Session Management**:
  - Cookie-based sessions
  - Automatic expiry
  - Logout invalidation

#### 4. Data Security
- **Encryption at Rest**: MongoDB encryption (recommended)
- **Encryption in Transit**: HTTPS (configured)
- **Sensitive Data Handling**:
  - Passwords: bcrypt hashed
  - Tokens: HTTP-only cookies

---

## Known Issues & Gaps

### Critical Issues

#### 1. Missing Backend Implementations
| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Appointments | ✅ Full UI | ✅ Fully implemented | ✅ COMPLETED |
| Doctors Management | ✅ Full UI | ✅ Fully implemented | ✅ COMPLETED |
| Member Claims | ✅ Full UI | ✅ Fully implemented | ✅ COMPLETED |
| Wallet Management | ✅ UI exists | ❌ No endpoints | Service exists |
| Health Records | ✅ Full UI | ❌ No endpoints | Not started |

#### 2. Security Vulnerabilities
- **Hardcoded Credentials**: `admin:admin123` in multiple files
- **Weak JWT Secrets**: Default secrets in production configs
- **No MongoDB Auth**: Production runs without authentication
- **SSL Not Enforced**: HTTPS configured but not mandatory

#### 3. Data Integrity Issues
- **No Soft Deletes**: Hard deletes cause orphaned records
- **No Transactions**: Multi-document operations lack atomicity
- **No Cascading**: Deleting entities doesn't clean up references

#### 4. Audit System Not Functioning
- Audit schema exists
- Service implemented
- No data being written

### Performance Issues

#### 1. N+1 Query Problems
Potential N+1 in assignments loading

#### 2. No Caching Layer
- No Redis for session caching
- No query result caching
- All requests hit database

#### 3. Unoptimized Queries
- Missing compound indexes
- No query profiling/monitoring

---

**Document Maintained By**: Development Team
**Last Audit Date**: October 18, 2025
**Next Review**: Every 2 weeks or after major changes
