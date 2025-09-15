# 01_PRODUCT_ARCHITECTURE.md

## Product Vision

OPD Wallet is a comprehensive healthcare benefits management system designed to streamline outpatient department services, insurance claims processing, and member benefits administration. The platform provides a seamless experience for healthcare members while giving administrators powerful tools to manage policies and assignments.

## User Roles

### 1. SUPER_ADMIN
- Full system access
- User management (create, update, delete)
- Policy management
- System configuration
- Analytics and reporting

### 2. ADMIN
- User management (limited to members)
- Policy assignment
- Claims processing
- Report generation

### 3. MEMBER
- View personal benefits
- Submit claims
- Book appointments
- Manage family members
- Track wallet balance
- View transaction history

## User Flows

### Member Login Flow
1. Member accesses http://localhost:3002
2. Enters credentials (email/password)
3. System validates via JWT authentication
4. Redirects to member dashboard
5. Dashboard shows wallet balance, benefits, and quick actions

### Claim Submission Flow
1. Member clicks "File Claim" from dashboard
2. Selects claim type (OPD/IPD/Pharmacy)
3. Fills claim details and uploads documents
4. Submits for approval
5. Receives claim reference number
6. Tracks status in claims section

### Admin User Management Flow
1. Admin logs into http://localhost:3001
2. Navigates to Users section
3. Creates new member account
4. Assigns policy to member
5. Sets wallet limits and benefits
6. Member receives activation email

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/reset-password` - Reset password

### Policies
- `GET /api/policies` - List all policies
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies` - Create policy
- `PUT /api/policies/:id` - Update policy

### Assignments
- `GET /api/users/:userId/assignments` - Get user assignments
- `POST /api/users/:userId/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `POST /api/assignments/:id/end` - End assignment
- `GET /api/member/assignments` - Get member's own assignments

## UI Map

### Member Portal (http://localhost:3002)
```
/
├── / (Login page)
├── /member (Dashboard)
│   ├── /wallet (Wallet management)
│   ├── /benefits (Benefits overview)
│   │   ├── /opd
│   │   ├── /ipd
│   │   ├── /diagnostics
│   │   ├── /pharmacy
│   │   ├── /dental
│   │   ├── /vision
│   │   ├── /wellness
│   │   └── /mental-health
│   ├── /claims (Claims management)
│   │   ├── /new (Submit claim)
│   │   └── /:id (Claim details)
│   ├── /bookings (Appointments)
│   │   ├── /new (Book appointment)
│   │   └── /:id (Booking details)
│   ├── /family (Family members)
│   │   └── /add (Add member)
│   ├── /records (Medical records)
│   ├── /transactions (Transaction history)
│   ├── /notifications
│   ├── /help (Support)
│   └── /settings (Profile settings)
```

### Admin Portal (http://localhost:3001)
```
/
├── / (Login page)
├── /dashboard (Admin dashboard)
├── /users (User management)
│   ├── /new (Create user)
│   └── /:id (User details)
├── /policies (Policy management)
│   ├── /new (Create policy)
│   └── /:id (Policy details)
├── /assignments (Assignment management)
├── /claims (Claims processing)
├── /reports (Analytics)
└── /settings (System settings)
```

## Tech Stack & Integrations

### Core Technologies
- **Backend**: NestJS 10.x with TypeScript
- **Database**: MongoDB 7.0
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS 3.x
- **Animation**: Framer Motion
- **State Management**: React Context API
- **Authentication**: JWT with HTTP-only cookies

### External Integrations (Planned)
- SMS Gateway (OTP verification)
- Email Service (Notifications)
- Payment Gateway (Wallet top-up)
- Document Storage (S3-compatible)
- Hospital Network APIs

## Environment Configuration

### Development Environment
```
API_URL=http://localhost:4000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/opd_wallet?authSource=admin
JWT_SECRET=dev_jwt_secret_change_in_production
COOKIE_NAME=opd_session
NODE_ENV=development
```

### Production Environment
```
API_URL=https://api.opdwallet.com
MONGODB_URI=mongodb://[PROD_USER]:[PROD_PASS]@[PROD_HOST]:27017/opd_wallet?authSource=admin
JWT_SECRET=[SECURE_RANDOM_STRING]
COOKIE_NAME=opd_session_prod
NODE_ENV=production
```

## Deployment Notes

### Docker Deployment
1. All services run in Docker containers
2. Docker Compose orchestrates the stack
3. Containers auto-restart on failure
4. Volumes persist MongoDB data
5. Network isolation between services

### Port Mapping
- MongoDB: 27017 (internal only in production)
- API Server: 4000
- Admin Portal: 3001
- Member Portal: 3002

### Health Checks
- API: GET /health
- MongoDB: Connection pool monitoring
- Next.js: Built-in health checks

### Scaling Considerations
- API server can be horizontally scaled
- MongoDB replica set for high availability
- CDN for static assets
- Redis for session management (future)
- Load balancer for traffic distribution

### Security Measures
- JWT tokens with expiration
- HTTP-only cookies for token storage
- CORS configuration
- Rate limiting on API endpoints
- Input validation and sanitization
- Role-based access control (RBAC)
- Encrypted passwords with bcrypt
- HTTPS enforcement in production

## Mobile-First Design System

### Design Tokens
```
Colors:
- Brand: #0F766E (Teal)
- Ink: #0F172A (Dark), #64748B (Light)
- Surface: #FFFFFF (Primary), #F8FAFC (Alt)
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444

Typography:
- Font: System font stack
- Headers: Bold, responsive sizing
- Body: Regular, 16px base

Spacing:
- Base unit: 4px
- Page padding: 16px (mobile), 32px (desktop)

Breakpoints:
- Mobile: < 768px (sm: 640px)
- Tablet: 768px - 1024px (md: 768px, lg: 1024px)
- Desktop: > 1024px (xl: 1280px, 2xl: 1536px)
```

### Component Architecture
- **Reusable Components**: Card, StatusBadge, LoadingSpinner, ResponsiveWrapper, BottomNavigation
- **Layout System**: Responsive sidebar navigation with mobile support
- **Form Wizards**: Multi-step workflows for complex processes
- **Data Visualization**: Charts and progress indicators
- **Navigation Pattern**:
  - Mobile: Fixed bottom navigation with 4 main tabs (Home, Claims, Bookings, Services)
  - Desktop: Full sidebar navigation with all menu items
  - Hamburger menu on mobile contains additional items (Wallet, Records, Family, etc.)

### Responsive Design Implementation
- **Mobile-First Approach**: All components designed for mobile then enhanced for desktop
- **No Horizontal Scroll**: Content always fits within viewport width
- **Touch Targets**: Minimum 44px height/width for all interactive elements
- **Text Scaling**: Dynamic font sizes using clamp() for optimal readability
- **Grid Layouts**: Adaptive columns (1 → 2 → 3 → 4) based on screen size
- **Table Handling**: Horizontal scroll for tables on mobile with sticky headers
- **Button Groups**: Stack vertically on mobile, horizontal on desktop
- **Content Padding**: 16px mobile, 24px tablet, 32px desktop
- **Image Optimization**: Responsive images with Next.js Image component
- **Overflow Prevention**: Word-wrap and truncation for long text

### Progressive Web App Features
- Offline support with service workers
- Add to home screen capability
- Push notifications
- Background sync
- Responsive images with Next.js Image

## Performance Targets
- Lighthouse score: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)

## Setup & Installation

### Prerequisites
- Docker Desktop (recommended) or Node.js 20+ with MongoDB 7.0+
- Git for version control

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd opdwallet

# Start with Docker
docker-compose up -d

# Wait 30 seconds for services to initialize

# Access portals
open http://localhost:3001  # Admin Portal
open http://localhost:3002  # Member Portal
```

### Test Accounts
#### Member Portal (http://localhost:3002)
- Test Member: member@test.com / Test123!
- Member ID: OPD000001
- UHID: UH000001

#### Admin Portal (http://localhost:3001)
- Admin: admin@test.com / Test123! (to be created)
- Super Admin: superadmin@test.com / Test123! (to be created)

### API Documentation
- Swagger UI: http://localhost:4000/api/docs
- Base URL: http://localhost:4000/api