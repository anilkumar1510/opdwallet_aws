# OPD Wallet Product Architecture

**Last Updated**: September 24, 2025
**Current Deployment**: http://51.20.125.246
**Production Status**: Active with Core Features Implemented
**Architecture**: Microservices with Docker Orchestration

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

### Core Technology Stack
- **Backend**: NestJS (Node.js) + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: Next.js 15 (Admin), Next.js 14 (Member)
- **Authentication**: JWT + bcrypt
- **Deployment**: Docker Compose + Nginx Reverse Proxy
- **Infrastructure**: AWS EC2 + GitHub Actions CI/CD

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │  Member Portal  │    │   Nginx Proxy   │
│   (Next.js 15)  │    │  (Next.js 14)  │    │  (Load Balancer)│
│   Port: 3001    │    │   Port: 3002    │    │   Port: 80/443  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────────┐
                    │   NestJS API    │
                    │  (TypeScript)   │
                    │   Port: 4000    │
                    └─────────────────┘
                              │
                    ┌─────────────────┐
                    │    MongoDB      │
                    │  (12 Collections)│
                    │   Port: 27017   │
                    └─────────────────┘
```

---

## 📊 CURRENT IMPLEMENTATION STATUS

### ✅ COMPLETED MODULES

#### 1. **Authentication & User Management**
- **JWT-based Authentication** with refresh tokens
- **Role-based Access Control** (SUPER_ADMIN, MEMBER)
- **Password Security**: bcrypt hashing (12 rounds)
- **Session Management**: HTTP-only cookies with security headers
- **User Profiles**: Complete CRUD with family relationships

#### 2. **Policy Management System**
- **Policy CRUD**: Create, read, update, delete policies
- **Versioned Configurations**: Plan configs with version control
- **Benefits Management**: Category-based benefit configuration
- **Wallet Rules**: Configurable wallet limits and copay settings
- **Assignment System**: User-policy assignment with effective periods

#### 3. **Master Data Management**
- **Service Categories**: Consult, Pharmacy, Labs
- **Service Definitions**: Coverage rules and requirements
- **Relationship Management**: Family relationship definitions
- **Corporate Groups**: CUG management for enterprise clients

#### 4. **API Layer (37 Endpoints)**
```
Authentication (5 endpoints)
├── POST /api/auth/login
├── POST /api/auth/logout
├── GET  /api/auth/me
├── POST /api/auth/refresh
└── POST /api/auth/change-password

Users (8 endpoints)
├── GET    /api/users
├── POST   /api/users
├── GET    /api/users/:id
├── PUT    /api/users/:id
├── DELETE /api/users/:id
├── GET    /api/users/profile
├── PUT    /api/users/profile
└── GET    /api/users/family/:memberId

Policies (7 endpoints)
├── GET    /api/policies
├── POST   /api/policies
├── GET    /api/policies/:id
├── PUT    /api/policies/:id
├── DELETE /api/policies/:id
├── GET    /api/policies/:id/configs
└── POST   /api/policies/:id/configs

Plan Configs (6 endpoints)
├── GET    /api/plan-configs
├── POST   /api/plan-configs
├── GET    /api/plan-configs/:id
├── PUT    /api/plan-configs/:id
├── POST   /api/plan-configs/:id/publish
└── GET    /api/plan-configs/policy/:policyId

Assignments (5 endpoints)
├── GET    /api/assignments
├── POST   /api/assignments
├── GET    /api/assignments/:id
├── PUT    /api/assignments/:id
└── DELETE /api/assignments/:id

Masters (4 endpoints)
├── GET    /api/masters/categories
├── GET    /api/masters/services
├── GET    /api/masters/relationships
└── GET    /api/masters/cugs

Health (2 endpoints)
├── GET    /api/health
└── GET    /api/health/db
```

#### 5. **Security Implementation**
- **Rate Limiting**: Express-rate-limit with tiered limits
  - Global: 100 req/15min (production), 1000 req/15min (development)
  - Auth: 50 login attempts/15min (production)
- **Security Headers**: Helmet.js with CSP, HSTS, XSS protection
- **Input Validation**: Class-validator with comprehensive schemas
- **CORS Configuration**: Environment-specific allowed origins

#### 6. **Deployment Infrastructure**
- **6 Docker Compose Configurations**:
  - `docker-compose.yml` (Development)
  - `docker-compose.prod.yml` (Production with Nginx)
  - `docker-compose.simple.yml` (Simple deployment)
  - `docker-compose.secure.yml` (SSL/TLS enabled)
  - `docker-compose.ecr.yml` (AWS ECR images)
  - `docker-compose.secrets.yml` (AWS Secrets Manager)

- **Container Orchestration**:
  - Unique container naming across environments
  - Health checks for all services
  - Volume management for data persistence
  - Network isolation with custom bridge networks

- **CI/CD Pipeline**:
  - GitHub Actions workflows
  - Automated deployment to AWS EC2
  - Container cleanup and conflict prevention
  - Build optimization with caching

---

## 🏛️ DATABASE ARCHITECTURE

### MongoDB Collections (12 Total, 28 Documents)

#### **Core Business Collections** (9 Active)
```javascript
users (3 docs)              // User management & authentication
├── Super Admin (1)
├── Primary Members (1)
└── Dependent Members (1)

policies (1 doc)             // Insurance policy definitions
└── Comprehensive Health Policy

plan_configs (3 docs)       // Versioned policy configurations
├── Version 1 (Draft)
├── Version 2 (Published)
└── Version 3 (Current)

userPolicyAssignments (4 docs) // User-policy relationships
├── Active Assignments (2)
└── Orphaned Records (2) ⚠️

category_master (3 docs)     // Service categories
├── CAT001: Consult
├── CAT002: Pharmacy
└── CAT003: Labs

service_master (4 docs)      // Available medical services
├── CON001: General Physician
├── CON002: Gynecologist
├── CON003: Pharmacy
└── CON004: Labs

relationship_masters (5 docs) // Family relationships
├── REL001: Self
├── REL002: Spouse
├── REL003: Child
├── REL004: Father
└── REL005: Mother

counters (2 docs)           // Auto-increment sequences
├── user: 3 (next: USR-2025-0004)
└── policy: 3 (next: POL-2025-0004)

cug_master (8 docs)         // Corporate user groups
└── Tech Companies: Google, Microsoft, Amazon, Apple, Meta, Netflix, Tesla, IBM
```

#### **Planned Collections** (3 Empty)
```javascript
user_wallets (0 docs)       // Wallet balances (not implemented)
wallet_transactions (0 docs) // Transaction history (not implemented)
auditLogs (0 docs)          // Audit trail (not functioning)
```

### Data Relationships
```
users._id ← userPolicyAssignments.userId ⚠️
users._id ← userPolicyAssignments.createdBy
policies._id ← userPolicyAssignments.policyId
policies._id ← plan_configs.policyId
category_master.categoryId ← service_master.category
relationship_masters.relationshipCode ← users.relationship
users.memberId ← users.primaryMemberId (family tree)
```

---

## 🎨 FRONTEND ARCHITECTURE

### Admin Portal (web-admin)
**Technology**: Next.js 15.5.3 + TypeScript
**UI Framework**: Radix UI + Tailwind CSS
**State Management**: Zustand + TanStack Query

**Features**:
- 🔐 **Authentication**: Login/logout with JWT
- 👥 **User Management**: CRUD operations with family relationships
- 📋 **Policy Management**: Policy creation and configuration
- ⚙️ **Plan Configuration**: Benefits and wallet rules setup
- 📊 **Assignment Management**: User-policy assignments
- 🏢 **Master Data**: Categories, services, relationships, CUGs

**Page Structure**:
```
/admin
├── /dashboard          # Overview and statistics
├── /users              # User management
│   ├── /create        # Add new users
│   └── /[id]/edit     # Edit user details
├── /policies          # Policy management
│   ├── /create        # Create new policies
│   └── /[id]/config   # Configure plan versions
├── /assignments       # User-policy assignments
├── /masters           # Master data management
└── /settings          # System settings
```

### Member Portal (web-member)
**Technology**: Next.js 14.0.4 + TypeScript
**UI Framework**: Headless UI + Tailwind CSS
**State Management**: React Context + SWR

**Features**:
- 🔐 **Authentication**: Member login and profile
- 🏥 **Health Records**: View medical history and documents
- 💳 **Wallet Management**: View balance and transactions (planned)
- 👨‍👩‍👧‍👦 **Family Management**: View covered family members
- 📞 **Support**: Contact and help features

**Page Structure**:
```
/
├── /dashboard          # Member dashboard
├── /profile            # Profile management
├── /health-records     # Medical history
├── /family             # Family member details
├── /wallet             # Wallet and transactions (planned)
└── /support            # Help and contact
```

---

## 🔒 SECURITY ARCHITECTURE

### Authentication Flow
```
1. User Login (email/password)
   ↓
2. Server validates credentials
   ↓
3. Generate JWT access token (7d expiry)
   ↓
4. Generate refresh token (30d expiry)
   ↓
5. Set HTTP-only secure cookies
   ↓
6. Return user profile data
```

### Authorization Levels
```javascript
SUPER_ADMIN
├── Full system access
├── User management
├── Policy configuration
├── System settings
└── Master data management

MEMBER
├── Profile management
├── Health records access
├── Family member view
└── Wallet transactions (planned)
```

### Security Measures
- **Password Hashing**: bcrypt with 12 rounds
- **JWT Security**: RS256 signing, secure storage
- **Session Management**: HTTP-only cookies with SameSite protection
- **Rate Limiting**: Tiered limits for different endpoint types
- **Input Validation**: Comprehensive validation with sanitization
- **CORS**: Environment-specific origin controls
- **Security Headers**: CSP, HSTS, XSS protection via Helmet.js

---

## 📡 API DESIGN PATTERNS

### RESTful Architecture
- **Resource-based URLs**: `/api/users`, `/api/policies`
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Proper HTTP status code usage
- **Error Handling**: Consistent error response format

### Response Patterns
```javascript
// Success Response
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { /* validation errors */ }
  }
}

// Paginated Response
{
  "success": true,
  "data": [ /* array of resources */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Middleware Stack
```
1. CORS Handler
2. Rate Limiting
3. Security Headers (Helmet)
4. Body Parsing
5. Authentication (JWT)
6. Authorization (Role-based)
7. Input Validation
8. Request Logging
9. Route Handler
10. Error Handling
11. Response Formatting
```

---

## 🐳 DEPLOYMENT ARCHITECTURE

### Environment Configurations

#### **Development** (`docker-compose.yml`)
```yaml
Services:
- api: Direct port 4000:4000
- web-admin: Direct port 3001:3000
- web-member: Direct port 3002:3000
- mongo: Direct port 27017:27017
- Container names: *-dev suffix
```

#### **Production** (`docker-compose.prod.yml`)
```yaml
Services:
- nginx: Reverse proxy (80:80, 443:443)
- api: Internal port 4000 (no external access)
- web-admin: Internal port 3000 (via nginx /admin)
- web-member: Internal port 3000 (via nginx /)
- mongodb: Internal port 27017 (no external access)
- Container names: *-prod suffix
```

#### **Simple Deployment** (`docker-compose.simple.yml`)
```yaml
Services:
- nginx: Load balancer (80:80)
- api: Direct port 4000:4000
- web-admin: Direct port 3001:3001
- web-member: Direct port 3002:3002
- mongodb: Internal MongoDB
- Container names: *-simple suffix
```

### Container Strategy
- **Unique Naming**: Environment-specific suffixes prevent conflicts
- **Health Checks**: All services have health monitoring
- **Resource Limits**: Production containers have resource constraints
- **Volume Management**: Persistent data storage with named volumes
- **Network Isolation**: Custom bridge networks for security

---

## ⚠️ KNOWN ISSUES & TECHNICAL DEBT

### **Critical Security Issues** 🚨
1. **Hardcoded Credentials**: MongoDB credentials `admin:admin123` in source code
2. **Weak JWT Secrets**: Development secrets used in production
3. **No Production Auth**: MongoDB runs without authentication in production
4. **SSL/TLS Missing**: HTTPS configuration commented out

### **Data Integrity Issues** ⚠️
1. **Orphaned Records**: 2 policy assignments reference deleted policies
2. **Type Inconsistency**: userPolicyAssignments.userId uses ObjectId vs string
3. **Missing Audit Trail**: Audit logging configured but not functioning
4. **Incomplete Wallet System**: Wallet collections created but not implemented

### **Performance & Maintenance Issues** 🔧
1. **Excessive Logging**: 355 console.log statements in production code
2. **Version Inconsistency**: Admin portal (Next.js 15) vs Member portal (Next.js 14)
3. **High Throttle Limits**: 50,000 requests/minute may allow DoS
4. **No Structured Logging**: Console logging instead of proper log framework

---

## 🛠️ DEVELOPMENT WORKFLOW

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/anilkumar1510/opdwallet.git
cd opdwallet

# Start development environment
make up

# Access services
Admin Portal: http://localhost:3001
Member Portal: http://localhost:3002
API: http://localhost:4000
MongoDB: localhost:27017
```

### Deployment Commands
```bash
# Production deployment
make prod-up

# Simple deployment
docker-compose -f docker-compose.simple.yml up -d

# Container cleanup
./scripts/cleanup-containers.sh

# Check deployment status
make status
```

### Database Management
```bash
# Access MongoDB shell
make mongo-shell

# Reset database
make reset-db

# Run migrations
make migrate-planv1
```

---

## 📈 SCALABILITY CONSIDERATIONS

### Current Limitations
- **Single Database**: MongoDB without clustering
- **No Caching Layer**: Direct database queries without Redis
- **Monolithic Frontend**: Single-page applications instead of micro-frontends
- **Manual Scaling**: No auto-scaling capabilities

### Planned Improvements
- **Database Clustering**: MongoDB replica sets for high availability
- **Caching Strategy**: Redis for session management and query caching
- **API Gateway**: Rate limiting and request routing optimization
- **CDN Integration**: Static asset optimization and global distribution
- **Monitoring**: Application performance monitoring and alerting

---

## 🔄 INTEGRATION POINTS

### External Service Integration (Planned)
- **Payment Gateway**: For wallet top-ups and premium features
- **SMS/Email Service**: For notifications and OTP verification
- **Document Management**: For health record storage and retrieval
- **Healthcare Providers**: For real-time service booking
- **Insurance APIs**: For claims processing and policy validation

### Internal Integration Points
```
Authentication Service ←→ All Modules
├── User Management ←→ Policy Assignments
├── Policy Management ←→ Plan Configurations
├── Master Data ←→ Service Definitions
└── Wallet System ←→ Transaction Processing (planned)
```

---

## 📋 MAINTENANCE & OPERATIONS

### Monitoring & Health Checks
- **Application Health**: `/api/health` endpoint
- **Database Health**: `/api/health/db` endpoint
- **Container Health**: Docker health checks for all services
- **Log Management**: Centralized logging with rotation

### Backup & Recovery
- **Database Backups**: MongoDB dump scripts (planned)
- **Code Repository**: Git with GitHub for version control
- **Environment Configuration**: Docker Compose version control
- **Documentation**: Comprehensive system documentation

### Security Auditing
- **Dependency Scanning**: Regular npm audit for vulnerabilities
- **Code Analysis**: ESLint and TypeScript for code quality
- **Security Headers**: Regular security header validation
- **Access Logging**: Request logging for security monitoring

---

**Architecture Version**: 3.0
**Last System Audit**: September 24, 2025
**Next Architecture Review**: Quarterly
**Critical Security Review**: IMMEDIATE - Multiple vulnerabilities identified