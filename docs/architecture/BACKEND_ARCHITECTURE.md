# OPD Wallet - Backend Architecture

> **Part of Product Architecture Documentation**
> See [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) for system overview, [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete API reference, [DEPLOYMENT_INFRASTRUCTURE.md](./DEPLOYMENT_INFRASTRUCTURE.md) for deployment details

**Last Updated**: October 18, 2025
**Backend Framework**: NestJS 11.1.6
**Runtime**: Node.js 20.x
**Database**: MongoDB 7.0 with Mongoose 8.18.1

---

## Table of Contents

1. [NestJS Module Structure](#nestjs-module-structure)
2. [Backend Design Patterns](#backend-design-patterns)
3. [Module Descriptions](#module-descriptions)
4. [Authentication Architecture](#authentication-architecture)
5. [Authorization System](#authorization-system)
6. [Data Validation](#data-validation)
7. [Error Handling](#error-handling)
8. [File Upload System](#file-upload-system)
9. [Integration Points](#integration-points)

---

## NestJS Module Structure

### Directory Structure

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
│   ├── specialty-master/         # Medical specialty master module
│   │   ├── specialty-master.module.ts
│   │   ├── specialty-master.controller.ts
│   │   ├── specialty-master.service.ts
│   │   └── schemas/
│   │       └── specialty-master.schema.ts
│   ├── doctors/                  # Doctor management module
│   │   ├── doctors.module.ts
│   │   ├── doctors.controller.ts
│   │   ├── doctors.service.ts
│   │   ├── schemas/
│   │   │   └── doctor.schema.ts
│   │   └── dto/
│   │       └── query-doctors.dto.ts
│   ├── appointments/             # Appointment booking module
│   │   ├── appointments.module.ts
│   │   ├── appointments.controller.ts
│   │   ├── appointments.service.ts
│   │   ├── schemas/
│   │   │   └── appointment.schema.ts
│   │   └── dto/
│   │       └── create-appointment.dto.ts
│   ├── memberclaims/            # Member claims module
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
│   ├── lab/                      # Lab Diagnostics module
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
│   ├── tpa/                      # TPA module
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
│   ├── notifications/            # In-app notifications module
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── schemas/
│   │       └── notification.schema.ts
│   ├── finance/                  # Finance & payment module
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

---

## Backend Design Patterns

### 1. Dependency Injection

NestJS uses dependency injection throughout the application:

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private counterService: CountersService,
    private auditService: AuditService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    // Service methods can access injected dependencies
    const userId = await this.counterService.getNextSequence('userId');
    const user = await this.userModel.create({ ...createUserDto, userId });
    await this.auditService.log('USER_CREATED', user);
    return user;
  }
}
```

**Benefits**:
- Loose coupling between modules
- Easier testing with dependency mocking
- Clear dependency hierarchy
- Automatic lifecycle management

### 2. Guard-Based Authorization

Authorization is handled through guards applied at controller level:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    // Only SUPER_ADMIN and ADMIN can access this endpoint
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPS)
  async findAll() {
    // SUPER_ADMIN, ADMIN, and OPS can view all users
    return this.usersService.findAll();
  }
}
```

**Guard Stack**:
1. **JwtAuthGuard**: Validates JWT token from HTTP-only cookie
2. **RolesGuard**: Checks if user's role matches @Roles() decorator

### 3. DTO Validation

All request bodies are validated using class-validator decorators:

```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  relationship: string;

  @IsString()
  @IsOptional()
  primaryMemberId?: string;
}
```

**Validation Features**:
- Automatic request body validation
- Type coercion and transformation
- Custom validation messages
- Nested object validation

### 4. Schema-First Mongoose Models

Database models are defined using Mongoose schemas with decorators:

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, immutable: true })
  userId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: String, default: 'REL001' })
  relationship: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 });
UserSchema.index({ userId: 1 });
UserSchema.index({ phone: 1 }, { sparse: true });
```

---

## Module Descriptions

### Core Modules

#### 1. Authentication Module (`auth/`)

**Purpose**: Handle user authentication and session management

**Key Components**:
- **JWT Strategy**: Token-based authentication using RS256
- **Local Strategy**: Username/password validation
- **Auth Guards**: Protect routes requiring authentication
- **Auth Service**: Login, logout, token generation

**Features**:
- HTTP-only cookie-based sessions
- 7-day token expiry
- Bcrypt password hashing (12 rounds)
- Role-based access control

#### 2. Users Module (`users/`)

**Purpose**: Manage user profiles and relationships

**Key Features**:
- Primary member and dependent management
- Auto-generated unique user IDs (MEM001, MEM002, etc.)
- Password management (reset, set)
- Relationship tracking
- Family structure support

**Database Schema**: 62 fields including profile, contact, health, and audit data

#### 3. Policies Module (`policies/`)

**Purpose**: Insurance policy management

**Key Features**:
- Versioned policy configurations
- Policy status lifecycle (DRAFT, ACTIVE, SUSPENDED, EXPIRED)
- Policy number generation
- Coverage amount tracking
- Effective date management

#### 4. Assignments Module (`assignments/`)

**Purpose**: Link users to insurance policies

**Key Features**:
- Policy-to-user assignment
- Automatic wallet initialization on assignment
- Relationship-based assignment validation
- Primary member search for dependents
- Effective date tracking
- Assignment deactivation

**Automatic Wallet Initialization**:
When a policy is assigned to a user, the system automatically:
1. Fetches plan configuration for the policy
2. Creates wallet with total annual amount
3. Initializes category-wise balances
4. Links wallet to assignment

#### 5. Plan Config Module (`plan-config/`)

**Purpose**: Versioned benefit configuration per policy

**Key Features**:
- Multi-version support (DRAFT, PUBLISHED, CURRENT)
- Category-wise benefit limits
- Covered relationships configuration
- Service inclusions/exclusions
- Copay and deductible settings

#### 6. Masters Module (`masters/`)

**Purpose**: Centralized master data management

**Sub-Modules**:
- **Category Master**: Service categories (Consultation, Pharmacy, Lab Tests, etc.)
- **Service Master**: Available medical services
- **CUG Master**: Closed User Groups
- **Relationship Master**: Family relationship types

---

### Healthcare Modules

#### 7. Specialty Master Module (`specialty-master/`)

**Purpose**: Medical specialty classification

**Features**:
- 9 medical specialties (Cardiology, Dermatology, Pediatrics, etc.)
- Icon mapping for UI
- Active/inactive status

#### 8. Doctors Module (`doctors/`)

**Purpose**: Doctor profile and availability management

**Key Features**:
- Doctor profiles with qualifications, specializations
- Multiple clinic locations per doctor
- Online/offline consultation availability
- Rating and review tracking
- Language support
- Insurance acceptance
- Registration number tracking

#### 9. Clinics Module (`clinics/`)

**Purpose**: Clinic/hospital location management

**Features**:
- Clinic address with geo-coordinates
- Operating hours by day of week
- Facilities listing
- Active/inactive status
- Google Maps integration

#### 10. Doctor Slots Module (`doctor-slots/`)

**Purpose**: Weekly recurring availability schedule

**Features**:
- Day-wise time slot configuration
- Slot duration and capacity
- Consultation type (IN_CLINIC, ONLINE)
- Slot activation/deactivation
- Date-specific blocking
- Clinic-specific slots

#### 11. Appointments Module (`appointments/`)

**Purpose**: Appointment booking and management

**Booking Types**:
1. **IN_CLINIC**: Physical consultation at clinic
2. **ONLINE**: Telemedicine consultation

**Features**:
- Slot-based booking
- Multi-patient support (self + dependents)
- Payment tracking
- Status workflow (PENDING_CONFIRMATION → CONFIRMED → COMPLETED)
- Prescription linking
- Call preference for online consultations

---

### Claims & Reimbursement Modules

#### 12. Member Claims Module (`memberclaims/`)

**Purpose**: Handle reimbursement and pre-authorization claims

**Claim Types**:
- **REIMBURSEMENT**: Post-treatment claims
- **CASHLESS_PREAUTH**: Pre-authorization requests

**Features**:
- Multi-file document upload (invoices, prescriptions, reports)
- Document categorization
- Status workflow (DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED)
- TPA assignment and review integration
- Document resubmission flow
- Claim cancellation with wallet refund
- Timeline tracking

**File Upload**:
- Max 20 files per claim
- Supported formats: PDF, JPEG, PNG, GIF, WebP
- Max file size: 15MB per file
- User-specific storage: `uploads/claims/{userId}/`

#### 13. TPA Module (`tpa/`)

**Purpose**: Third-party administrator claim processing

**Workflow**:
1. Admin assigns claims to TPA users
2. TPA reviews claim documents
3. TPA approves/rejects/requests resubmission
4. Member uploads additional documents (if needed)
5. Final approval triggers payment processing

**Features**:
- Bulk claim assignment
- Claim review interface
- Approval with amount adjustments
- Rejection with reasons
- Document resubmission requests
- TPA performance analytics

---

### Lab Diagnostics Modules

#### 14. Lab Module (`lab/`)

**Purpose**: Complete lab test workflow management

**Sub-Controllers**:
- **Member Controller**: Prescription upload, order tracking
- **Admin Controller**: Test/package/partner management
- **Operations Controller**: Digitization, order processing

**Workflow**:
1. Member uploads prescription
2. Operations digitizes prescribed tests
3. Admin assigns to lab partner
4. Partner creates order
5. Partner uploads report
6. Member views report

**Features**:
- Lab test master data
- Test packages/panels
- Partner management
- Prescription digitization
- Order lifecycle management
- Report upload and viewing
- Analytics dashboard

**File Storage**:
- Prescriptions: `uploads/lab/prescriptions/{userId}/`
- Reports: `uploads/lab/reports/{orderId}/`

---

### Supporting Modules

#### 15. Wallet Module (`wallet/`)

**Purpose**: Wallet balance and transaction management

**Features**:
- Auto-initialization on policy assignment
- Category-wise balance tracking
- Transaction history
- Balance consumption tracking
- Wallet refunds on claim cancellation

**Current Status**: ⚠️ Service implemented, no controller (internal use only)

#### 16. Notifications Module (`notifications/`)

**Purpose**: In-app notification system

**Notification Types**:
- Claim status updates
- Appointment confirmations
- Lab report availability
- Wallet transactions
- System announcements

**Features**:
- User-specific notifications
- Read/unread tracking
- Mark all as read
- Notification deletion

#### 17. Finance Module (`finance/`)

**Purpose**: Payment processing foundation

**Current Status**: 🔧 Foundation ready, awaiting payment gateway integration

**Features**:
- Payment processing placeholder
- Status tracking
- Links to wallet transactions

#### 18. Audit Module (`audit/`)

**Purpose**: System-wide audit logging

**Current Status**: ⚠️ Implemented but not functioning

**Features (Planned)**:
- Action logging
- User tracking
- Timestamp recording
- TTL-based retention

#### 19. Counters Module (`counters/`)

**Purpose**: Auto-increment ID generation

**Features**:
- Sequence generation for user IDs, claim IDs, etc.
- Thread-safe increment operations
- Custom prefix support

---

## Authentication Architecture

### JWT Token Flow

```typescript
// 1. User Login
POST /api/auth/login
Body: { email: "user@example.com", password: "password123" }

// 2. AuthService validates credentials
- Find user by email
- Compare password hash using bcrypt
- Check user is active

// 3. Generate JWT token
const payload = {
  userId: user._id,
  email: user.email,
  role: user.role
};
const token = this.jwtService.sign(payload, {
  expiresIn: '7d',
  algorithm: 'RS256'
});

// 4. Set HTTP-only cookie
response.cookie('opd_session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// 5. Return user profile
return { user: sanitizedUser, message: 'Login successful' };
```

### Protected Routes

```typescript
// Every protected route uses guards
@Get('/profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User) {
  return user;
}

// JwtAuthGuard automatically:
// 1. Extracts token from cookie
// 2. Validates token signature
// 3. Checks expiry
// 4. Attaches user to request object
```

---

## Authorization System

### Role Hierarchy

```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',  // Full system access
  ADMIN = 'ADMIN',               // Administrative operations
  TPA = 'TPA',                   // Claim processing
  FINANCE_USER = 'FINANCE_USER', // Financial operations
  OPS = 'OPS',                   // Operations management
  MEMBER = 'MEMBER',             // Self-service member
  DOCTOR = 'DOCTOR'              // Doctor portal access
}
```

### Permission Matrix

| Resource | SUPER_ADMIN | ADMIN | TPA | FINANCE_USER | OPS | MEMBER | DOCTOR |
|----------|-------------|-------|-----|--------------|-----|--------|--------|
| Users    | CRUD        | CRUD  | R   | R            | R   | R (self) | - |
| Policies | CRUD        | CRUD  | R   | R            | R   | R (assigned) | - |
| Assignments | CRUD     | CRUD  | R   | R            | R   | R (self) | - |
| Claims   | CRUD        | R     | RU  | CRUD         | R   | CRUD (self) | - |
| Doctors  | CRUD        | CRUD  | -   | -            | CRU | R       | R (self) |
| Appointments | CRUD    | R     | -   | -            | RU  | CRUD (self) | RU (own) |
| Lab      | CRUD        | CRUD  | -   | -            | CRUD | R (self) | - |

---

## Data Validation

### DTO Examples

#### Create User DTO
```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  relationship: string;
}
```

#### Create Appointment DTO
```typescript
export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsEnum(['IN_CLINIC', 'ONLINE'])
  appointmentType: string;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  timeSlot: string;

  @IsNumber()
  consultationFee: number;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsEnum(['VOICE', 'VIDEO', 'BOTH'])
  callPreference?: string;
}
```

---

## Error Handling

### Exception Filters

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

### Custom Exceptions

```typescript
// NotFoundExceptionexception
if (!user) {
  throw new NotFoundException('User not found');
}

// BadRequestException
if (invalidData) {
  throw new BadRequestException('Invalid request data');
}

// UnauthorizedException
if (!isAuthorized) {
  throw new UnauthorizedException('Access denied');
}

// ForbiddenException
if (!hasPermission) {
  throw new ForbiddenException('Insufficient permissions');
}
```

---

## File Upload System

### Multer Configuration

#### Claims Upload
```typescript
export const claimsMulterConfig: MulterModuleOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const userId = req.user.userId;
      const uploadPath = `./uploads/claims/${userId}`;
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `claim-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 20
  }
};
```

#### Lab Prescriptions Upload
```typescript
export const labMulterConfig: MulterModuleOptions = {
  storage: diskStorage({
    destination: './uploads/lab/prescriptions',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `prescription-${uniqueSuffix}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
};
```

### File Access Control

```typescript
@Get('files/:userId/:filename')
@UseGuards(JwtAuthGuard, RolesGuard)
async getFile(
  @Param('userId') userId: string,
  @Param('filename') filename: string,
  @CurrentUser() user: User,
  @Res() res: Response
) {
  // Verify user can access file
  if (user.userId !== userId && !['ADMIN', 'TPA', 'OPS'].includes(user.role)) {
    throw new ForbiddenException('Access denied');
  }

  const filePath = path.join('./uploads/claims', userId, filename);

  if (!fs.existsSync(filePath)) {
    throw new NotFoundException('File not found');
  }

  res.sendFile(filePath, { root: '.' });
}
```

---

## Integration Points

### Module Dependencies

```typescript
// AssignmentsModule depends on:
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assignment.name, schema: AssignmentSchema }]),
    UsersModule,        // For user validation
    PoliciesModule,     // For policy validation
    WalletModule,       // For wallet initialization
    PlanConfigModule,   // For benefit configuration
    CountersModule,     // For assignment ID generation
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
```

### Service Injection

```typescript
@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
    private usersService: UsersService,
    private policiesService: PoliciesService,
    private walletService: WalletService,
    private planConfigService: PlanConfigService,
    private counterService: CountersService,
  ) {}

  async createAssignment(dto: CreateAssignmentDto) {
    // Use injected services
    const user = await this.usersService.findOne(dto.userId);
    const policy = await this.policiesService.findOne(dto.policyId);
    const assignmentId = await this.counterService.getNextSequence('assignmentId');

    // Create assignment
    const assignment = await this.assignmentModel.create({
      ...dto,
      assignmentId
    });

    // Initialize wallet
    const planConfig = await this.planConfigService.getCurrentConfig(dto.policyId);
    await this.walletService.initializeWalletFromPolicy(
      dto.userId,
      assignment._id,
      planConfig,
      dto.effectiveFrom,
      dto.effectiveTo
    );

    return assignment;
  }
}
```

### Google Maps Integration

```typescript
import { Client } from '@googlemaps/google-maps-services-js';

@Injectable()
export class LocationService {
  private readonly googleMapsClient: Client;

  constructor(private configService: ConfigService) {
    this.googleMapsClient = new Client({});
  }

  async reverseGeocode(lat: number, lng: number) {
    const response = await this.googleMapsClient.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: this.configService.get('GOOGLE_MAPS_API_KEY'),
      },
    });

    return this.parseGoogleResult(response.data.results[0]);
  }

  async searchCities(query: string) {
    const response = await this.googleMapsClient.placeAutocomplete({
      params: {
        input: query,
        key: this.configService.get('GOOGLE_MAPS_API_KEY'),
        types: '(cities)',
        components: ['country:in'],
      },
    });

    return response.data.predictions;
  }
}
```

---

**Document Maintained By**: Development Team
**Last Updated**: October 18, 2025
**Version**: 6.8
