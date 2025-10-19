# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OPD Wallet is a healthcare management platform with three portals (member, admin, doctor) and a NestJS backend API. The system manages insurance policies, appointments, claims, video consultations, and payment processing.

**Architecture**: Monorepo with 4 main services
- `api/` - NestJS backend (REST API)
- `web-member/` - Next.js member portal
- `web-admin/` - Next.js admin portal
- `web-doctor/` - Next.js doctor portal

**Tech Stack**:
- Backend: NestJS, MongoDB, Mongoose, Passport JWT
- Frontend: Next.js 14, React 18, TailwindCSS, React Query
- Infrastructure: Docker, Docker Compose, AWS EC2
- Video: Jitsi Meet integration
- Maps: Google Maps API

## Development Commands

### 🌟 RECOMMENDED: Production-Like Development (New)

**This is the recommended way to develop locally** - it mirrors AWS production exactly:

```bash
# Start production-like development environment
make dev-prod-like      # Nginx reverse proxy + remote AWS dev DB

# View logs
make dev-prod-like-logs              # All logs
make dev-prod-like-logs-api          # API logs only
make dev-prod-like-logs-admin        # Admin portal logs
make dev-prod-like-logs-member       # Member portal logs
make dev-prod-like-logs-nginx        # Nginx logs

# Stop environment
make dev-prod-like-down

# Restart environment
make dev-prod-like-restart
```

**Service URLs (Production-Like Dev):**
- All services: http://localhost (single entry point via nginx)
- Member Portal: http://localhost/
- Admin Portal: http://localhost/admin
- Operations Portal: http://localhost/operations
- TPA Portal: http://localhost/tpa
- Doctor Portal: http://localhost/doctor
- API: http://localhost/api
- Health Check: http://localhost/health

**Features:**
- ✅ Nginx reverse proxy (like AWS production)
- ✅ Path-based routing (no port numbers)
- ✅ Shared remote dev database on AWS (consistent across team)
- ✅ Hot reload still enabled
- ✅ Same URL structure as production

**See DEVELOPMENT_SETUP.md for complete setup guide.**

### Legacy Development (Local MongoDB)

If you need to work with a local database:

```bash
# Start all services with local MongoDB
make up              # Starts local MongoDB, API, and all portals
make down            # Stop all services
make restart         # Restart all services
make logs            # View all logs
make logs-api        # View API logs only
make logs-admin      # View admin portal logs
make logs-member     # View member portal logs
```

**Service URLs (Legacy):**
- Admin Portal: http://localhost:3001
- Member Portal: http://localhost:3002
- Doctor Portal: http://localhost:3003
- API: http://localhost:4000
- API Docs (Swagger): http://localhost:4000/api/docs
- MongoDB: localhost:27017

**Note:** Legacy mode uses direct port access and local MongoDB. Data is not shared across team members.

### Testing & Quality

```bash
# API
cd api
npm test              # Run Jest tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # E2E tests
npm run lint          # ESLint
npm run lint:fix      # Auto-fix linting issues
npm run type-check    # TypeScript check without emit
npm run quality       # Run lint + type-check

# Frontend (member/admin/doctor)
cd web-{portal}
npm run lint          # Next.js lint
npm run lint:fix      # Auto-fix
npm run type-check    # TypeScript check
npm run quality       # Run lint + type-check

# Root level quality checks
npm run quality:api
npm run quality:member
npm run quality:admin
npm run quality:all    # All services
```

### Building

```bash
# API
cd api && npm run build              # Outputs to dist/

# Frontend portals
cd web-{portal} && npm run build     # Next.js production build
cd web-{portal} && npm start         # Serve production build
```

### Database Operations

```bash
# Seed database
cd api
npm run seed          # Basic seed
npm run seed:full     # Full seed with test data
npm run seed:masters  # Master data only

# MongoDB shell access
make mongo-shell      # Via Docker
# Credentials: admin/admin123

# Reset database
make reset-db
```

### Deployment

```bash
# Production deployments (various configs)
make prod-up          # Standard production
make simple-up        # Simple deployment
make secure-up        # With SSL/TLS
make ecr-up           # AWS ECR images
make secrets-up       # AWS Secrets Manager

# AWS EC2 deployment
./deploy-to-aws.sh    # See AWS_DEPLOYMENT_GUIDE.md
```

## Code Architecture

### Backend (NestJS)

**Module Structure**: The API follows NestJS modular architecture with 25+ feature modules in `api/src/modules/`:

Core modules:
- `auth/` - JWT authentication, local strategy, guards
- `users/` - User management across all roles
- `member/` - Member profiles and relationships
- `policies/` - Insurance policy management
- `assignments/` - Member-policy assignments
- `wallet/` - Member wallet and balance tracking

Healthcare modules:
- `appointments/` - Appointment scheduling and management
- `doctors/` - Doctor profiles and availability
- `doctor-slots/` - Time slot management
- `video-consultation/` - Jitsi video integration
- `specialties/` - Medical specialties
- `clinics/` - Clinic management
- `lab/` - Lab test management

Financial modules:
- `payments/` - Payment processing
- `transactions/` - Transaction history
- `finance/` - Financial operations
- `memberclaims/` - Claims processing

Administrative modules:
- `tpa/` - Third-party administrator
- `operations/` - Operations team functions
- `masters/` - Master data (benefits, copay structures)
- `plan-config/` - Plan configuration
- `notifications/` - Notification system
- `audit/` - Audit logging

**Path Aliases** (api/tsconfig.json):
```typescript
@/*           -> src/*
@modules/*    -> src/modules/*
@common/*     -> src/common/*
@config/*     -> src/config/*
```

**Common Utilities** (`api/src/common/`):
- `guards/` - RolesGuard, JwtAuthGuard
- `decorators/` - @Roles(), @CurrentUser(), etc.
- `interceptors/` - Logging, transformation
- `constants/` - UserRole enum, status constants
- `dto/` - Shared DTOs
- `interfaces/` - Shared interfaces
- `cache/` - Redis caching utilities

**Authentication Flow**:
1. Login via `auth/login` (LocalStrategy validates credentials)
2. JWT token issued and set as HTTP-only cookie (`opd_session`)
3. Subsequent requests use JwtStrategy to validate token from cookie
4. RolesGuard enforces role-based access control

**User Roles** (from most to least privileged):
- SUPER_ADMIN
- ADMIN
- TPA_ADMIN, TPA, TPA_USER
- FINANCE_USER
- OPS (Operations)
- DOCTOR
- MEMBER

**Database**: MongoDB with Mongoose ODM
- Connection pooling configured (min: 2, max: 10)
- Lean virtuals plugin enabled
- Auto-indexing disabled in production
- Schemas use timestamps and soft deletes where applicable

**Configuration**: Centralized in `api/src/config/configuration.ts`
- Environment-based config
- AWS Secrets Manager support (see `secrets-manager.ts`)
- Cookie settings, JWT, rate limiting, CORS, etc.

### Frontend (Next.js)

**Structure**: All three portals use Next.js App Router (`app/` directory)

**Member Portal** (`web-member/`):
- Member authentication and dashboard
- Appointment booking flow
- Policy and wallet management
- Video consultation interface
- Payment and transaction history

**Admin Portal** (`web-admin/`):
- Comprehensive admin dashboard
- Policy management and assignments
- Claims processing
- Financial operations
- User management across roles
- Uses Radix UI components, Zustand for state, React Hook Form + Zod

**Doctor Portal** (`web-doctor/`):
- Doctor dashboard and profile
- Appointment management
- Video consultation integration
- Prescription management

**Common Patterns**:
- React Query (@tanstack/react-query) for server state
- Axios for API calls with interceptors
- TailwindCSS for styling
- Framer Motion for animations (member portal)
- Environment variables: `NEXT_PUBLIC_API_URL` for client-side API calls

**API Integration**:
- Client-side: Uses `NEXT_PUBLIC_API_URL` from env
- Server-side: Can use internal Docker network URL
- Authentication: Cookie-based JWT handled automatically

## Important Development Notes

### Google Maps Integration
The application uses Google Maps API for location search. Key environment variable:
```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
```
See `GOOGLE_MAPS_SETUP.md` and `LOCATION_SEARCH_IMPLEMENTATION_PLAN.md` for details.

### Video Consultations
Uses Jitsi Meet (default: meet.jit.si). Configure via:
```bash
JITSI_DOMAIN=meet.jit.si  # or custom domain
```
Both doctor and member portals include `@jitsi/react-sdk`.

### Environment Variables
Copy `.env.example` to `.env` and configure:
- MongoDB connection string
- JWT secret (MUST change in production)
- API URLs for each portal
- Google Maps API key
- Jitsi domain

### Docker Compose Variants
The project includes multiple docker-compose files for different scenarios:
- `docker-compose.dev.yml` - **[RECOMMENDED]** Production-like development (nginx + remote DB)
- `docker-compose.yml` - Legacy local development (local MongoDB + direct ports)
- `docker-compose.prod.yml` - Production with nginx
- `docker-compose.simple.yml` - Simple production deployment
- `docker-compose.aws.yml` - AWS deployment
- `docker-compose.ecr.yml` - AWS ECR images
- `docker-compose.secrets.yml` - AWS Secrets Manager
- `docker-compose.secure.yml` - SSL/TLS enabled

### Database Seeding
Before running the application for the first time:
```bash
cd api
npm run seed:masters  # Creates required master data
npm run seed          # Optional: adds sample data
```

### Code Quality & SonarQube
SonarQube integration available:
```bash
npm run sonar:start   # Start SonarQube container
npm run quality:all   # Run quality checks on all services
```

### AWS Deployment
The repository is configured for AWS EC2 (t4g.medium - ARM64):
- Single-command deployment via `./deploy-to-aws.sh`
- See `AWS_DEPLOYMENT_GUIDE.md` for complete setup
- Dockerfiles optimized for ARM architecture
- nginx reverse proxy configuration available

### Migration Scripts
Database migration utilities in `api/src/modules/migration/` and `scripts/`:
```bash
make migrate-planv1   # Example: Plan versions v1 migration
```

## Testing Strategy

**API Testing**:
- Unit tests: `*.spec.ts` files alongside modules
- E2E tests: `api/test/*.e2e-spec.ts`
- Jest configuration: `api/test/jest-e2e.json`

**Frontend Testing**:
- ESLint with SonarJS plugin for code quality
- Type safety via TypeScript strict mode

## Key Files to Reference

**Development:**
- `DEVELOPMENT_SETUP.md` - **[START HERE]** Complete development environment setup guide
- `docker-compose.dev.yml` - Production-like development configuration
- `.env.dev` - Development environment variables
- `Makefile` - Quick reference for all Docker commands
- `docker-compose.yml` - Legacy local development setup

**API:**
- `api/src/main.ts` - NestJS bootstrap, middleware, Swagger setup
- `api/src/app.module.ts` - Central module configuration
- `.env.example` - Required environment variables

**Infrastructure:**
- `nginx/nginx.dev.conf` - Nginx config for local development
- `nginx/nginx.conf` - Nginx config for production
- `AWS_DEPLOYMENT_GUIDE.md` - Production deployment guide

**Documentation:**
- `docs/DOCUMENTATION_INDEX.md` - Complete documentation index
- `CODE_QUALITY_GUIDE.md` - Code quality standards

## Common Workflows

### Adding a New API Module
```bash
cd api
npx nest generate module modules/new-module
npx nest generate controller modules/new-module
npx nest generate service modules/new-module
```
Then import the module in `app.module.ts`.

### Adding a New Page to Portal
Create in appropriate `app/` directory:
```typescript
// web-member/app/member/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

### Debugging
- API logs: Check container logs via `make logs-api`
- Frontend: Check browser console and Network tab
- MongoDB: Use `make mongo-shell` to inspect data
- Health check: http://localhost:4000/health
