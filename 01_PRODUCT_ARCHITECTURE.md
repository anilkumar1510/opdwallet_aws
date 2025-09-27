# OPD Wallet - Complete Product Architecture

**Last Updated**: September 27, 2025
**Current Deployment**: http://51.20.125.246
**Production Status**: Active - Core Features Operational (70% Complete)
**Architecture Type**: Monolithic Backend with Microservices-Ready Structure
**Documentation Version**: 4.0 (Comprehensive Audit-Based)

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
**Operational Components**: 70%
- ✅ Authentication & Authorization System
- ✅ User Management (Primary + Dependents)
- ✅ Policy Management
- ✅ Assignment System
- ✅ Plan Configuration (Versioned)
- ✅ Master Data Management
- ✅ Audit Logging
- ⚠️ Wallet System (Backend only, no endpoints)
- ❌ Booking System (UI only, no backend)
- ❌ Claims Processing (UI only, no backend)
- ❌ Health Records (UI only, no backend)
- ❌ Reimbursements (UI only, no backend)

---

## 🛠️ TECHNOLOGY STACK

### Backend API
| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.1.6 | Backend framework |
| **Node.js** | 20.x | Runtime environment |
| **TypeScript** | 5.3.3 | Type-safe development |
| **MongoDB** | 7.0 | Primary database |
| **Mongoose** | 8.18.1 | ODM for MongoDB |
| **Passport** | 0.7.0 | Authentication framework |
| **passport-jwt** | 4.0.1 | JWT strategy |
| **passport-local** | 1.0.0 | Local strategy |
| **bcrypt** | 5.1.1 | Password hashing |
| **class-validator** | 0.14.1 | DTO validation |
| **class-transformer** | 0.5.1 | Object transformation |
| **@nestjs/config** | 3.3.0 | Configuration management |
| **@nestjs/swagger** | 8.1.0 | API documentation |
| **helmet** | 8.0.0 | Security headers |
| **express-rate-limit** | 7.7.2 | Rate limiting |
| **aws-sdk** | 2.1714.0 | AWS integration |

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
│  ┌────────────────┐              ┌─────────────────┐            │
│  │ Admin Users    │              │  Member Users   │            │
│  │ (Desktop/Web)  │              │ (Mobile/Web)    │            │
│  └────────┬───────┘              └────────┬────────┘            │
└───────────┼────────────────────────────────┼───────────────────────┘
            │                                │
            └────────────────┬───────────────┘
                             │
┌──────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (NGINX)                         │
│                    Port 80/443 (HTTP/HTTPS)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Route /api/*      → API Backend (Port 4000)            │   │
│  │  Route /admin/*    → Admin Portal (Port 3001)           │   │
│  │  Route /*          → Member Portal (Port 3002)          │   │
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
│  - Config       │  │  - Bookings     │  │  - Config    │
│  - Services     │  │  - Claims       │  │  - Masters   │
│  - Categories   │  │  - Family       │  │  - Wallet    │
└─────────────────┘  └─────────────────┘  └──────┬───────┘
                                                  │
                                          ┌───────▼───────┐
                                          │   MongoDB     │
                                          │   Port: 27017 │
                                          │               │
                                          │ 12 Collections│
                                          │ - users       │
                                          │ - policies    │
                                          │ - plan_configs│
                                          │ - assignments │
                                          │ - wallets     │
                                          │ - transactions│
                                          │ - masters     │
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
│   ├── member/                   # Member portal API module
│   │   ├── member.module.ts
│   │   ├── member.controller.ts
│   │   └── member.service.ts
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
│       └── categories/
│           └── page.tsx          # Category management
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
│       │   ├── page.tsx          # Claims list (⚠️ No backend)
│       │   └── new/
│       │       └── page.tsx      # File claim (⚠️ No backend)
│       ├── family/
│       │   ├── page.tsx          # Family members
│       │   └── add/
│       │       └── page.tsx      # Add family member
│       ├── health-records/
│       │   └── page.tsx          # Health records (⚠️ No backend)
│       ├── services/
│       │   └── page.tsx          # Browse services
│       ├── reimbursements/
│       │   └── page.tsx          # Reimbursements (⚠️ No backend)
│       └── settings/
│           └── page.tsx          # User settings
├── components/
│   ├── ui/                       # UI components
│   ├── MemberSwitcher.tsx        # Switch family members
│   ├── MemberWalletCard.tsx      # Wallet display
│   ├── BottomTabBar.tsx          # Mobile navigation
│   ├── Sidebar.tsx               # Desktop sidebar
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
| `users` | 3 | Active | User profiles (primary + dependents) |
| `policies` | 1 | Active | Insurance policy definitions |
| `plan_configs` | 3 | Active | Versioned policy configurations |
| `userPolicyAssignments` | 4 | Active | User-policy linkage |
| `category_master` | 3 | Active | Service category definitions |
| `service_master` | 4 | Active | Medical service definitions |
| `relationship_masters` | 5 | Active | Family relationship types |
| `cug_master` | 8 | Active | Closed user groups |
| `counters` | 2 | Active | Auto-increment ID generation |
| `user_wallets` | 0 | Empty | Wallet balance tracking (⚠️ Not implemented) |
| `wallet_transactions` | 0 | Empty | Transaction history (⚠️ Not implemented) |
| `auditLogs` | 0 | Empty | Audit trail (⚠️ Not functioning) |

**Total Collections**: 12
**Total Documents**: 28
**Database Size**: ~500KB

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

#### Policy Assignments (`/api/assignments`)
```
POST   /api/assignments             # Assign policy to user
GET    /api/assignments             # List all assignments
GET    /api/assignments/policy/:policyId    # Get assignments for policy
DELETE /api/assignments/:assignmentId       # Deactivate assignment
DELETE /api/assignments/user/:userId/policy/:policyId  # Unassign
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

#### Relationship Master (`/api/relationships`)
```
GET    /api/relationships           # Get all active relationships
```

#### Member Portal API (`/api/member`)
```
GET    /api/member/profile          # Get member profile with family
GET    /api/member/family           # Get family members
```

#### Health Check (`/api/health`)
```
GET    /api/health                  # Basic health check
```

### Missing Endpoints (UI exists, no backend)
```
❌ /api/wallet/*                    # Wallet operations
❌ /api/bookings/*                  # Service bookings
❌ /api/claims/*                    # Claims processing
❌ /api/health-records/*            # Health records
❌ /api/reimbursements/*            # Reimbursement requests
```

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

### Authorization Levels

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **SUPER_ADMIN** | Full System | All operations, user management, system config |
| **ADMIN** | Administrative | Policy management, user management, assignments |
| **TPA** | Third Party | View users, view policies, view assignments |
| **OPS** | Operations | View users, view policies |
| **MEMBER** | Self-Service | Profile, wallet, bookings, claims, family |

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
- **Status**: ❌ Not implemented

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
| Wallet Management | ✅ UI exists | ❌ No endpoints | Service exists |
| Bookings | ✅ Full UI | ❌ No endpoints | Not started |
| Claims | ✅ Full UI | ❌ No endpoints | Not started |
| Health Records | ✅ Full UI | ❌ No endpoints | Not started |
| Reimbursements | ✅ Full UI | ❌ No endpoints | Not started |

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

1. **Booking System**
   - [ ] Design booking schema
   - [ ] Create booking endpoints
   - [ ] Implement booking service
   - [ ] Connect frontend booking UI
   - [ ] Add service provider integration

2. **Claims Processing**
   - [ ] Design claims schema
   - [ ] Create claims endpoints
   - [ ] Implement claims workflow
   - [ ] Connect frontend claims UI
   - [ ] Add claims status tracking

3. **Health Records**
   - [ ] Design health records schema
   - [ ] Create health records endpoints
   - [ ] Implement document upload (S3)
   - [ ] Connect frontend health records UI
   - [ ] Add record viewing and download

4. **Reimbursements**
   - [ ] Design reimbursement schema
   - [ ] Create reimbursement endpoints
   - [ ] Implement reimbursement workflow
   - [ ] Connect frontend reimbursement UI
   - [ ] Add approval workflow

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
**Last Audit Date**: September 27, 2025
**Next Review**: Every 2 weeks or after major changes
**Version History**: See git commits for detailed changes